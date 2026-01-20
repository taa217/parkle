
import { db } from '../src/db';
import { zones } from '../src/db/schema';

async function check() {
    try {
        const allZones = await db.select().from(zones);
        console.log(`Zone count: ${allZones.length}`);
        if (allZones.length > 0) {
            console.log('Sample zone:', allZones[0]);
        }
    } catch (e) {
        console.error('Error querying zones:', e);
    }
    process.exit(0);
}

check();
