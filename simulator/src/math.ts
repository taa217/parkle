import { SensorConfig, SimulatorMode, ZoneStatusPayload } from './models';

export function calculateOccupancy(
  currentOccupied: number,
  capacity: number,
  mode: SimulatorMode
): number {
  let change = 0;
  
  // Random small fluctuation
  const rand = Math.random();

  if (mode === 'rush_hour') {
    // Tends to increase: 0..+5
    // 70% chance to add cars, 20% no change, 10% leave
    if (rand < 0.7) {
      change = Math.floor(Math.random() * 6); // 0 to 5
    } else if (rand > 0.9) {
      change = -1 * Math.floor(Math.random() * 2); // 0 to -1
    }
  } else {
    // Normal: -2..+2
    // 40% add, 40% remove, 20% no change
    if (rand < 0.4) {
      change = Math.floor(Math.random() * 3); // 0 to 2
    } else if (rand > 0.6) {
      change = -1 * Math.floor(Math.random() * 3); // 0 to -2
    }
  }

  let newOccupied = currentOccupied + change;
  // Clamp
  if (newOccupied < 0) newOccupied = 0;
  if (newOccupied > capacity) newOccupied = capacity;

  return newOccupied;
}

export function determineStatus(
  occupied: number,
  capacity: number,
  mode: SimulatorMode
): { status: ZoneStatusPayload['status']; confidence: ZoneStatusPayload['confidence'] } {
  const available = Math.max(0, capacity - occupied);
  let status: ZoneStatusPayload['status'] = 'AVAILABLE';
  let confidence: ZoneStatusPayload['confidence'] = 'HIGH';

  if (available === 0) {
    status = 'FULL';
  } else if (available <= 5) {
    status = 'LIMITED';
  } else {
    status = 'AVAILABLE';
  }

  // Confidence and flaky mode
  if (mode === 'flaky') {
    const r = Math.random();
    if (r < 0.2) {
      status = 'UNKNOWN';
      confidence = 'LOW';
    } else if (r < 0.5) {
      confidence = 'MEDIUM';
    } else {
      confidence = 'LOW';
    }
  } else if (mode === 'rush_hour') {
     // Occasionally medium confidence in rush hour
     if (Math.random() < 0.1) confidence = 'MEDIUM';
  }

  return { status, confidence };
}
