
import { db } from './db';
import { zones, zoneStatus, users, sensors, parkingEvents, issues, zoneOverrides } from './db/schema';
import { eq } from 'drizzle-orm';

// Real-world approximate locations for UZ campus parking
const INITIAL_ZONES = [
    {
        id: 'main-admin-parking',
        name: 'Main Administration Car Park',
        lat: -17.7840,
        lng: 31.0530,
        capacity: 50
    },
    {
        id: 'great-hall-parking',
        name: 'Great Hall Parking',
        lat: -17.7830,
        lng: 31.0535,
        capacity: 80
    },
    {
        id: 'library-staff-parking',
        name: 'Library Staff Parking',
        lat: -17.7820,
        lng: 31.0525,
        capacity: 40
    },
    {
        id: 'engineering-faculty-parking',
        name: 'Engineering Faculty Parking',
        lat: -17.7850,
        lng: 31.0510,
        capacity: 100
    },
    {
        id: 'science-lecture-theatre-parking',
        name: 'Science Lecture Theatre Parking',
        lat: -17.7810,
        lng: 31.0540,
        capacity: 60
    },
    {
        id: 'students-union-parking',
        name: 'Students Union Parking',
        lat: -17.7860,
        lng: 31.0520,
        capacity: 120
    },
    {
        id: 'health-sciences-parking',
        name: 'Health Sciences Parking',
        lat: -17.7790,
        lng: 31.0480,
        capacity: 70
    }
];

async function seed() {
    console.log('Seeding zones...');

    // Clean up bad data
    try {
        console.log('Cleaning up old data...');
        // Order matters due to foreign keys
        await db.delete(parkingEvents);
        await db.delete(issues);
        await db.delete(zoneOverrides);
        await db.delete(zoneStatus);
        await db.delete(sensors); // Sensors reference zones
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
            zoneId: 'library-staff-parking',
            description: 'Main entrance camera',
            status: 'HEALTHY',
            lastHeartbeat: new Date(),
        },
        {
            id: 'sensor-admin-gate',
            type: 'OTHER',
            zoneId: 'main-admin-parking',
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
