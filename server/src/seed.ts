
import { db } from './db';
import { zones, zoneStatus, users, sensors } from './db/schema';
import { eq } from 'drizzle-orm';

const INITIAL_ZONES = [
    {
        id: 'library-lot',
        name: 'Library Lot',
        lat: -17.7815,
        lng: 31.0520,
        capacity: 50
    },
    {
        id: 'admin-lot',
        name: 'Admin Lot',
        lat: -17.7825,
        lng: 31.0530,
        capacity: 30
    },
    {
        id: 'eng-lot',
        name: 'Engineering Lot',
        lat: -17.7835,
        lng: 31.0510,
        capacity: 100
    },
    {
        id: 'cs-lot',
        name: 'CS Lot',
        lat: -17.7840,
        lng: 31.0540,
        capacity: 40
    },
    {
        id: 'sports-lot',
        name: 'Sports Lot',
        lat: -17.7850,
        lng: 31.0500,
        capacity: 200
    },
];

async function seed() {
    console.log('Seeding zones...');

    // Clean up bad data (optional, but good for this fix)
    try {
        await db.delete(zoneStatus);
        await db.delete(zones);
    } catch (e) {
        console.log('Clean up skipped or failed', e);
    }

    for (const zone of INITIAL_ZONES) {
        await db.insert(zones).values(zone).onConflictDoUpdate({
            target: zones.id,
            set: zone
        });

        // Initialize status if not exists
        await db.insert(zoneStatus).values({
            zoneId: zone.id,
            status: 'UNKNOWN',
            confidence: 'LOW',
            availableCount: null,
        }).onConflictDoNothing();
    }

    console.log('Seeding sensors...');
    const INITIAL_SENSORS: (typeof sensors.$inferInsert)[] = [
        {
            id: 'unitv2-lot-library-01',
            type: 'UNITV2',
            zoneId: 'library-lot',
            description: 'Main entrance camera',
            status: 'HEALTHY',
            lastHeartbeat: new Date(),
        },
        {
            id: 'sensor-admin-gate',
            type: 'OTHER',
            zoneId: 'admin-lot',
            description: 'Gate sensor',
            status: 'WARNING', // Just to have variety
            lastHeartbeat: new Date(Date.now() - 1000 * 60), // 1 min ago
        }
    ];

    for (const sensor of INITIAL_SENSORS) {
        await db.insert(sensors).values(sensor).onConflictDoUpdate({
            target: sensors.id,
            set: sensor
        });
    }

    console.log('Seeding complete.');
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
