
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { db } from './db';
import { users, userProfiles, zoneStatus, zones, issues, parkingEvents, zoneOverrides, overrideEvents, sensors, sensorEvents } from './db/schema';
import { eq, sql, lt, and, desc } from 'drizzle-orm';
import { SSEManager } from './lib/sse';
import * as dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
const sseManager = new SSEManager();

// Helper: Get Full Snapshot
async function getZonesSnapshot(limitZoneId?: string) {
    const results = await db.select({
        id: zones.id,
        name: zones.name,
        lat: zones.lat,
        lng: zones.lng,
        capacity: zones.capacity,
        status: zoneStatus.status,
        confidence: zoneStatus.confidence,
        availableCount: zoneStatus.availableCount,
        lastUpdated: zoneStatus.lastUpdated,
        // Override fields
        forcedStatus: zoneOverrides.forcedStatus,
        forcedAvailableCount: zoneOverrides.forcedAvailableCount,
        expiresAt: zoneOverrides.expiresAt,
        reason: zoneOverrides.reason,
        overrideUpdatedAt: zoneOverrides.updatedAt,
    })
        .from(zones)
        .leftJoin(zoneStatus, eq(zones.id, zoneStatus.zoneId))
        .leftJoin(zoneOverrides, eq(zones.id, zoneOverrides.zoneId))
        .where(limitZoneId ? eq(zones.id, limitZoneId) : undefined);

    return results.map(z => {
        const overrideActive = !!z.overrideUpdatedAt;
        const effectiveStatus = z.forcedStatus ?? z.status ?? 'UNKNOWN'; // Default to UNKNOWN if both null
        const effectiveAvailableCount = z.forcedAvailableCount ?? z.availableCount;
        const effectiveLastUpdated = z.overrideUpdatedAt ?? z.lastUpdated;

        return {
            ...z,
            effectiveStatus,
            effectiveAvailableCount,
            effectiveLastUpdated,
            overrideActive
        };
    });
}

// Environment checks
const REQUIRED_ENV = ['DATABASE_URL', 'SENSOR_API_KEY', 'CLIENT_ORIGIN'];
for (const env of REQUIRED_ENV) {
    if (!process.env[env]) {
        console.error(`Missing required environment variable: ${env}`);
        process.exit(1);
    }
}

// CORS
fastify.register(cors, {
    // Allow all origins in development/local usage to support network IP access
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
});

// Middleware for User Auth (simplified)
const authenticate = async (request: any, reply: any) => {
    const userId = request.headers['x-user-id'];
    if (!userId) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
    }
    // In a real app we'd verify the ID exists in DB, here we trust it for simplicity or do a quick check
    // For "session" security we should actually verify it. 
    try {
        const user = await db.query.users.findFirst({ where: eq(users.id, userId as string) });
        if (!user) {
            reply.status(401).send({ error: 'Invalid User ID' });
            return;
        }
        request.user = user;
    } catch (e) {
        reply.status(500).send({ error: 'Auth check failed' });
    }
};

// --- ROUTES ---

// 1. Session
fastify.post('/api/session', async (req, reply) => {
    const schema = z.object({ email: z.string().email() });
    const body = schema.safeParse(req.body);

    if (!body.success) {
        return reply.status(400).send(body.error);
    }

    const { email } = body.data;

    // Upsert user
    let user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!user) {
        [user] = await db.insert(users).values({ email }).returning();
    }

    return { userId: user.id };
});

// 2. SSE Stream
fastify.get('/api/stream/zones', async (req, reply) => {
    try {
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        // Manual CORS for SSE
        const requestOrigin = req.headers.origin || '*';
        reply.raw.setHeader('Access-Control-Allow-Origin', requestOrigin);
        reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');

        const id = sseManager.addConnection(reply);

        // Initial Snapshot
        const zones = await getZonesSnapshot();
        sseManager.sendToClient(reply, 'snapshot', { zones });

        // Keep connection open
        return new Promise(() => { });
    } catch (err) {
        console.error('[SSE] Error initiating stream:', err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
});

// 2.5 Public Snapshot (Moved from protected)
fastify.get('/api/zones/snapshot', async (req, reply) => {
    return await getZonesSnapshot();
});

// 3. Sensor Heartbeat
fastify.post('/api/sensors/heartbeat', async (req, reply) => {
    const key = req.headers['x-sensor-key'];
    if (key !== process.env.SENSOR_API_KEY) {
        return reply.status(403).send({ error: 'Forbidden' });
    }

    const schema = z.object({
        sensorId: z.string(),
        type: z.enum(['UNITV', 'UNITV2', 'OTHER']).optional(),
        zoneId: z.string().optional().nullable(),
        description: z.string().optional(),
    });

    const body = schema.safeParse(req.body);
    if (!body.success) return reply.status(400).send(body.error);

    const { sensorId, type, zoneId, description } = body.data;
    const ip = req.ip;

    await db.insert(sensors).values({
        id: sensorId,
        type: type ?? 'OTHER',
        zoneId: zoneId,
        description: description,
        lastHeartbeat: new Date(),
        lastSeenIp: ip,
        status: 'HEALTHY'
    }).onConflictDoUpdate({
        target: sensors.id,
        set: {
            lastHeartbeat: new Date(),
            lastSeenIp: ip,
            status: 'HEALTHY',
            ...(type ? { type } : {}),
            ...(zoneId !== undefined ? { zoneId } : {}),
            ...(description ? { description } : {}),
        }
    });

    await db.insert(sensorEvents).values({
        sensorId,
        eventType: 'HEARTBEAT',
    });

    return { success: true };
});

// 4. Mock Sensor Ingest (Updated)
fastify.post('/api/sensors/zone-status', async (req, reply) => {
    const key = req.headers['x-sensor-key'];
    if (key !== process.env.SENSOR_API_KEY) {
        return reply.status(403).send({ error: 'Forbidden' });
    }

    const schema = z.object({
        sensorId: z.string(),
        zoneId: z.string(),
        status: z.enum(['AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN']),
        confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
        availableCount: z.number().optional().nullable(),
        lastUpdated: z.string().optional(), // ISO string
    });

    const body = schema.safeParse(req.body);
    if (!body.success) return reply.status(400).send(body.error);

    const { sensorId, zoneId, status, confidence, availableCount, lastUpdated } = body.data;

    // Update Sensor State too
    const ip = req.ip;
    await db.insert(sensors).values({
        id: sensorId,
        type: 'OTHER', // Default, assumes specific heartbeat sets type
        zoneId: zoneId,
        lastHeartbeat: new Date(),
        lastSeenIp: ip,
        status: 'HEALTHY'
    }).onConflictDoUpdate({
        target: sensors.id,
        set: {
            lastHeartbeat: new Date(),
            lastSeenIp: ip,
            status: 'HEALTHY',
            zoneId: zoneId // Update binding if changed
        }
    });

    // Update Zone Status
    await db.insert(zoneStatus).values({
        zoneId,
        status,
        confidence,
        availableCount,
        lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date(),
    }).onConflictDoUpdate({
        target: zoneStatus.zoneId,
        set: {
            status,
            confidence,
            availableCount,
            lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date(),
        }
    });

    // Broadcast Update
    const [updatedZone] = await getZonesSnapshot(zoneId);
    if (updatedZone) {
        sseManager.broadcast('zone_patch', updatedZone);
    }

    return { success: true };
});

// Protected Routes
fastify.register(async (app) => {
    app.addHook('preHandler', authenticate);

    // GET /api/me
    app.get('/api/me', async (req: any, reply) => {
        const userId = req.headers['x-user-id'];

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, userId),
        });

        return { ...user, profile };
    });

    // PUT /api/me/profile
    app.put('/api/me/profile', async (req: any, reply) => {
        const userId = req.headers['x-user-id'];
        const schema = z.object({
            role: z.enum(['STUDENT', 'STAFF', 'VISITOR', 'ADMIN']).optional(),
            primaryZoneId: z.string().optional().nullable(),
            plate: z.string().optional().nullable(),
            preference: z.enum(['FASTEST_WALK', 'CLOSEST_DRIVE']).optional(),
        });

        const body = schema.safeParse(req.body);
        if (!body.success) return reply.status(400).send(body.error);

        await db.insert(userProfiles).values({
            userId,
            ...body.data,
            updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: userProfiles.userId,
            set: {
                ...body.data,
                updatedAt: new Date(),
            }
        });

        return { success: true };
    });

    // POST /api/issues
    app.post('/api/issues', async (req: any, reply) => {
        const userId = req.headers['x-user-id'];
        const schema = z.object({
            zoneId: z.string(),
            type: z.enum(['MARKED_AVAILABLE_BUT_FULL', 'BLOCKED', 'WRONG_RECOMMENDATION', 'OTHER']),
            note: z.string().max(200).optional(),
        });

        const body = schema.safeParse(req.body);
        if (!body.success) return reply.status(400).send(body.error);

        await db.insert(issues).values({
            userId,
            ...body.data,
            status: 'OPEN',
        });

        return { success: true };
    });

    // POST /api/parking-events
    app.post('/api/parking-events', async (req: any, reply) => {
        const userId = req.headers['x-user-id'];
        const schema = z.object({
            zoneId: z.string(),
            plate: z.string().optional(),
        });

        const body = schema.safeParse(req.body);
        if (!body.success) return reply.status(400).send(body.error);

        await db.insert(parkingEvents).values({
            userId,
            ...body.data,
        });

        return { success: true };
    });

    // End of public/user protected routes, continuing with Admin routes...

    // --- ADMIN ROUTES ---

    // Admin Auth Middleware
    const adminAuthenticate = async (req: any, reply: any) => {
        // First run standard auth to get 'req.user'
        await authenticate(req, reply);
        if (reply.sent) return;

        // Check Role
        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, req.user.id),
        });

        if (!profile || profile.role !== 'ADMIN') {
            reply.status(403).send({ error: 'Forsake all hope, ye who enter here (Not Admin)' });
            return;
        }
    };

    // GET /api/admin/overview - Detailed Zone Status + Stale Level + Overrides
    app.get('/api/admin/overview', { preHandler: adminAuthenticate }, async (req, reply) => {
        const zonesData = await db.select({
            id: zones.id,
            name: zones.name,
            capacity: zones.capacity,
            status: zoneStatus.status,
            confidence: zoneStatus.confidence,
            availableCount: zoneStatus.availableCount,
            lastUpdated: zoneStatus.lastUpdated,
            // Override fields
            forcedStatus: zoneOverrides.forcedStatus,
            forcedAvailableCount: zoneOverrides.forcedAvailableCount,
            expiresAt: zoneOverrides.expiresAt,
            reason: zoneOverrides.reason,
            overrideUpdatedAt: zoneOverrides.updatedAt,
        })
            .from(zones)
            .leftJoin(zoneStatus, eq(zones.id, zoneStatus.zoneId))
            .leftJoin(zoneOverrides, eq(zones.id, zoneOverrides.zoneId));

        const now = Date.now();
        const enriched = zonesData.map(z => {
            // Use effective last updated for staleness check? 
            // Actually, sensor health is about the *sensor* update, so we should use `z.lastUpdated` for staleness.
            // But we display "effective" status.

            const diffMs = z.lastUpdated ? (now - new Date(z.lastUpdated).getTime()) : null;
            let staleLevel = 'OFFLINE';

            if (diffMs !== null) {
                if (diffMs < 30 * 1000) staleLevel = 'HEALTHY';
                else if (diffMs < 120 * 1000) staleLevel = 'WARNING';
            }

            const overrideActive = !!z.overrideUpdatedAt;
            const effectiveStatus = z.forcedStatus ?? z.status ?? 'UNKNOWN';
            const effectiveAvailableCount = z.forcedAvailableCount ?? z.availableCount;

            return {
                ...z,
                staleLevel,
                overrideActive,
                effectiveStatus,
                effectiveAvailableCount
            };
        });

        return enriched;
    });

    // GET /api/admin/issues - List with Reporter Info
    app.get('/api/admin/issues', { preHandler: adminAuthenticate }, async (req: any, reply) => {
        const { status } = req.query as { status?: string };
        const whereClause = status ? eq(issues.status, status as any) : undefined;

        const results = await db.select({
            id: issues.id,
            type: issues.type,
            note: issues.note,
            status: issues.status,
            createdAt: issues.createdAt,
            zoneId: issues.zoneId,
            reporterEmail: users.email,
        })
            .from(issues)
            .leftJoin(users, eq(issues.userId, users.id))
            .where(whereClause);

        return results;
    });

    // PATCH /api/admin/issues/:id - Resolve Issue
    app.patch('/api/admin/issues/:id', { preHandler: adminAuthenticate }, async (req: any, reply) => {
        const { id } = req.params;
        const schema = z.object({ status: z.enum(['RESOLVED']) }); // Only allow resolving for now
        const body = schema.safeParse(req.body);

        if (!body.success) return reply.status(400).send(body.error);

        await db.update(issues)
            .set({
                status: 'RESOLVED',
                resolvedAt: new Date()
            })
            .where(eq(issues.id, id));

        return { success: true };
    });

    // GET /api/admin/sensors
    app.get('/api/admin/sensors', { preHandler: adminAuthenticate }, async (req, reply) => {
        const results = await db.select({
            id: sensors.id,
            type: sensors.type,
            zoneId: sensors.zoneId,
            description: sensors.description,
            lastHeartbeat: sensors.lastHeartbeat,
            lastSeenIp: sensors.lastSeenIp,
            // We can also join zones to get zone name
            zoneName: zones.name,
        })
            .from(sensors)
            .leftJoin(zones, eq(sensors.zoneId, zones.id));

        const now = Date.now();
        return results.map(s => {
            const diffMs = s.lastHeartbeat ? (now - new Date(s.lastHeartbeat).getTime()) : null;
            let status = 'OFFLINE';
            if (diffMs !== null) {
                if (diffMs < 30 * 1000) status = 'HEALTHY';
                else if (diffMs < 120 * 1000) status = 'WARNING';
            }
            return { ...s, health: status };
        });
    });

    // PATCH /api/admin/zones/:zoneId/override
    app.patch('/api/admin/zones/:zoneId/override', { preHandler: adminAuthenticate }, async (req: any, reply) => {
        const { zoneId } = req.params as { zoneId: string };
        const userId = req.headers['x-user-id'] as string;

        const schema = z.object({
            forcedStatus: z.enum(['AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN']).nullable().optional(),
            forcedAvailableCount: z.number().nullable().optional(),
            reason: z.string(),
            expiresAt: z.string().nullable().optional(), // ISO string or null
        });

        const body = schema.safeParse(req.body);
        if (!body.success) return reply.status(400).send(body.error);

        const { forcedStatus, forcedAvailableCount, reason, expiresAt } = body.data;

        // Current state for audit
        const existing = await db.query.zoneOverrides.findFirst({ where: eq(zoneOverrides.zoneId, zoneId) });

        // Check if clearing
        const isClearing = forcedStatus === null && forcedAvailableCount === null;

        await db.transaction(async (tx) => {
            if (isClearing) {
                if (existing) {
                    await tx.delete(zoneOverrides).where(eq(zoneOverrides.zoneId, zoneId));
                    await tx.insert(overrideEvents).values({
                        zoneId,
                        action: 'CLEAR',
                        beforeStatus: existing.forcedStatus,
                        beforeAvailableCount: existing.forcedAvailableCount,
                        beforeExpiresAt: existing.expiresAt,
                        afterStatus: null,
                        afterAvailableCount: null,
                        afterExpiresAt: null,
                        reason,
                        performedBy: userId,
                    });
                }
            } else {
                // Upsert
                await tx.insert(zoneOverrides).values({
                    zoneId,
                    forcedStatus: forcedStatus ?? null,
                    forcedAvailableCount: forcedAvailableCount ?? null,
                    reason,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    updatedBy: userId,
                    updatedAt: new Date(),
                }).onConflictDoUpdate({
                    target: zoneOverrides.zoneId,
                    set: {
                        forcedStatus: forcedStatus ?? null,
                        forcedAvailableCount: forcedAvailableCount ?? null,
                        reason,
                        expiresAt: expiresAt ? new Date(expiresAt) : null,
                        updatedBy: userId,
                        updatedAt: new Date(),
                    }
                });

                await tx.insert(overrideEvents).values({
                    zoneId,
                    action: existing ? 'UPDATE' : 'SET',
                    beforeStatus: existing?.forcedStatus || null,
                    beforeAvailableCount: existing?.forcedAvailableCount || null,
                    beforeExpiresAt: existing?.expiresAt || null,
                    afterStatus: forcedStatus ?? null,
                    afterAvailableCount: forcedAvailableCount ?? null,
                    afterExpiresAt: expiresAt ? new Date(expiresAt) : null,
                    reason,
                    performedBy: userId,
                });
            }
        });

        // Broadcast Update
        const [updatedZone] = await getZonesSnapshot(zoneId);
        if (updatedZone) {
            sseManager.broadcast('zone_patch', updatedZone);
        }

        return { success: true };
    });

    // GET /api/admin/zones/:zoneId/override-events
    app.get('/api/admin/zones/:zoneId/override-events', { preHandler: adminAuthenticate }, async (req: any, reply) => {
        const { zoneId } = req.params as { zoneId: string };
        const { limit } = req.query as { limit?: string };
        const limitNum = limit ? parseInt(limit) : 50;

        const events = await db.select({
            id: overrideEvents.id,
            action: overrideEvents.action,
            beforeStatus: overrideEvents.beforeStatus,
            beforeAvailableCount: overrideEvents.beforeAvailableCount,
            afterStatus: overrideEvents.afterStatus,
            afterAvailableCount: overrideEvents.afterAvailableCount,
            reason: overrideEvents.reason,
            createdAt: overrideEvents.createdAt,
            performedByEmail: users.email,
        })
            .from(overrideEvents)
            .leftJoin(users, eq(overrideEvents.performedBy, users.id))
            .where(eq(overrideEvents.zoneId, zoneId))
            .orderBy(desc(overrideEvents.createdAt))
            .limit(limitNum);

        return events;
    });

});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// Cleanup Job for Expired Overrides
setInterval(async () => {
    try {
        const now = new Date();
        const expired = await db.select().from(zoneOverrides).where(lt(zoneOverrides.expiresAt, now));

        for (const override of expired) {
            await db.transaction(async (tx) => {
                await tx.delete(zoneOverrides).where(eq(zoneOverrides.zoneId, override.zoneId));
                await tx.insert(overrideEvents).values({
                    zoneId: override.zoneId,
                    action: 'EXPIRE',
                    beforeStatus: override.forcedStatus,
                    beforeAvailableCount: override.forcedAvailableCount,
                    beforeExpiresAt: override.expiresAt,
                    afterStatus: null,
                    afterAvailableCount: null,
                    afterExpiresAt: null,
                    reason: 'Auto-expired by system',
                    createdAt: new Date(),
                });
            });
            console.log(`[Cleanup] Expired override for zone ${override.zoneId}`);

            // Broadcast Update
            const [updatedZone] = await getZonesSnapshot(override.zoneId);
            if (updatedZone) {
                sseManager.broadcast('zone_patch', updatedZone);
            }
        }
    } catch (e) {
        console.error('[Cleanup] Error removing expired overrides:', e);
    }
}, 60000); // Run every 60s

start();
