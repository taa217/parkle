
import { pgTable, text, uuid, timestamp, integer, doublePrecision, pgEnum, varchar } from 'drizzle-orm/pg-core';

// Enums
export const roleEnum = pgEnum('role', ['STUDENT', 'STAFF', 'VISITOR', 'ADMIN']);
export const preferenceEnum = pgEnum('preference', ['FASTEST_WALK', 'CLOSEST_DRIVE']);
export const statusEnum = pgEnum('zone_status_status', ['AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN']);
export const confidenceEnum = pgEnum('confidence', ['HIGH', 'MEDIUM', 'LOW']);
export const issueTypeEnum = pgEnum('issue_type', ['MARKED_AVAILABLE_BUT_FULL', 'BLOCKED', 'WRONG_RECOMMENDATION', 'OTHER']);
export const issueStatusEnum = pgEnum('issue_status', ['OPEN', 'RESOLVED']);

// Schema
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProfiles = pgTable('user_profiles', {
    userId: uuid('user_id').primaryKey().references(() => users.id),
    role: roleEnum('role').notNull().default('STUDENT'),
    primaryZoneId: text('primary_zone_id'),
    plate: text('plate'),
    preference: preferenceEnum('preference').notNull().default('FASTEST_WALK'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const zones = pgTable('zones', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    capacity: integer('capacity'),
});

export const zoneStatus = pgTable('zone_status', {
    zoneId: text('zone_id').primaryKey().references(() => zones.id),
    status: statusEnum('status').notNull().default('UNKNOWN'),
    confidence: confidenceEnum('confidence').notNull().default('LOW'),
    availableCount: integer('available_count'),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const issues = pgTable('issues', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    zoneId: text('zone_id').notNull().references(() => zones.id),
    type: issueTypeEnum('type').notNull(),
    note: varchar('note', { length: 200 }),
    status: issueStatusEnum('status').notNull().default('OPEN'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
});

export const parkingEvents = pgTable('parking_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    zoneId: text('zone_id').notNull().references(() => zones.id),
    plate: text('plate'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const zoneOverrideStatusEnum = pgEnum('zone_override_status', ['AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN']);
export const overrideEventActionEnum = pgEnum('override_event_action', ['SET', 'UPDATE', 'CLEAR', 'EXPIRE']);

export const zoneOverrides = pgTable('zone_overrides', {
    zoneId: text('zone_id').primaryKey().references(() => zones.id),
    forcedStatus: zoneOverrideStatusEnum('forced_status'),
    forcedAvailableCount: integer('forced_available_count'),
    reason: text('reason').notNull(),
    expiresAt: timestamp('expires_at'),
    updatedBy: uuid('updated_by').notNull().references(() => users.id),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const overrideEvents = pgTable('override_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    zoneId: text('zone_id').notNull().references(() => zones.id),
    action: overrideEventActionEnum('action').notNull(),
    beforeStatus: zoneOverrideStatusEnum('before_status'),
    beforeAvailableCount: integer('before_available_count'),
    beforeExpiresAt: timestamp('before_expires_at'),
    afterStatus: zoneOverrideStatusEnum('after_status'),
    afterAvailableCount: integer('after_available_count'),
    afterExpiresAt: timestamp('after_expires_at'),
    reason: text('reason'),
    performedBy: uuid('performed_by').references(() => users.id), // Nullable for system jobs
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sensorTypeEnum = pgEnum('sensor_type', ['UNITV', 'UNITV2', 'OTHER']);
export const sensorStatusEnum = pgEnum('sensor_status', ['HEALTHY', 'WARNING', 'OFFLINE']);
export const sensorEventTypeEnum = pgEnum('sensor_event_type', ['HEARTBEAT', 'STATUS_UPDATE']);

export const sensors = pgTable('sensors', {
    id: text('id').primaryKey(), // e.g. "unitv2-lot-library-01"
    type: sensorTypeEnum('type').notNull().default('OTHER'),
    zoneId: text('zone_id').references(() => zones.id),
    description: text('description'),
    lastHeartbeat: timestamp('last_heartbeat'),
    lastSeenIp: text('last_seen_ip'),
    status: sensorStatusEnum('status').notNull().default('OFFLINE'), // stored status for quick access, though often derived
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sensorEvents = pgTable('sensor_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    sensorId: text('sensor_id').notNull().references(() => sensors.id),
    eventType: sensorEventTypeEnum('event_type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
