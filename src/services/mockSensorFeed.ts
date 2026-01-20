
import { MOCK_ZONES } from '../lib/data';

// This simulates external sensors sending data to the backend
// It does NOT update the frontend store directly anymore.

let intervalId: any = null;

// In a real app, this key would be hidden or proxied. 
// For this dev-tool, we'll hardcode the one we set in .env or just use the one we know.
// We'll try to read it or just default to the one we know the server uses.
const SENSOR_KEY = "secret-sensor-key";

export const startMockSensorFeed = () => {
    if (intervalId) return;

    console.log("[MockSensor] Starting simulation...");

    intervalId = setInterval(async () => {
        // Pick a random zone
        const randomZone = MOCK_ZONES[Math.floor(Math.random() * MOCK_ZONES.length)];

        // Random Status
        const statuses = ['AVAILABLE', 'LIMITED', 'FULL'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Random Confidence
        const confidences = ['HIGH', 'MEDIUM', 'LOW'];
        const confidence = confidences[Math.floor(Math.random() * confidences.length)];

        // Random Available Count
        const availableCount = Math.floor(Math.random() * 20);

        try {
            // Use window location to determine host if running in browser
            const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
            const url = `http://${host}:3000/api/sensors/zone-status`;

            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-sensor-key': SENSOR_KEY
                },
                body: JSON.stringify({
                    zoneId: randomZone.id,
                    status,
                    confidence,
                    availableCount,
                    lastUpdated: new Date().toISOString()
                })
            });
            console.log(`[MockSensor] Sent update for ${randomZone.name}: ${status}`);
        } catch (err) {
            console.error("[MockSensor] Failed to send update", err);
        }

    }, 3000); // Send an update every 3 seconds
};

export const stopMockSensorFeed = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log("[MockSensor] Stopped.");
    }
};
