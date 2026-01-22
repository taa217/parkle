import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { EnvConfig, SensorConfig, SimulatorMode } from './models';

// Load .env from various locations
// 1. simulator/.env
dotenv.config(); 
// 2. root .env
dotenv.config({ path: path.join(__dirname, '../../.env') }); 
// 3. server/.env (where the backend key likely is)
dotenv.config({ path: path.join(__dirname, '../../server/.env') });

// Mapped to real zones in server/src/seed.ts
const DEFAULT_SENSORS: SensorConfig[] = [
  { sensorId: 'unitv2-library-01', zoneId: 'library-staff-parking', capacity: 40 },
  { sensorId: 'unitv2-admin-01', zoneId: 'main-admin-parking', capacity: 50 },
  { sensorId: 'unitv2-eng-01', zoneId: 'engineering-faculty-parking', capacity: 100 },
  { sensorId: 'unitv2-sci-01', zoneId: 'science-lecture-theatre-parking', capacity: 60 },
  { sensorId: 'unitv2-union-01', zoneId: 'students-union-parking', capacity: 120 },
];

export const config: EnvConfig = {
  baseUrl: process.env.SIM_BASE_URL || 'http://localhost:3000',
  // SENSOR_API_KEY is likely the var name in server/.env, SIM_SENSOR_KEY might be used in simulator specific env
  sensorKey: process.env.SIM_SENSOR_KEY || process.env.SENSOR_API_KEY || 'default-key',
  heartbeatIntervalSec: parseInt(process.env.SIM_INTERVAL_HEARTBEAT_SEC || '10', 10),
  updateIntervalSec: parseInt(process.env.SIM_INTERVAL_UPDATE_SEC || '5', 10),
  jitterMs: parseInt(process.env.SIM_JITTER_MS || '1200', 10),
  mode: (process.env.SIM_MODE as SimulatorMode) || 'normal',
  durationSec: parseInt(process.env.SIM_DURATION_SEC || '0', 10),
};

export function getSensors(): SensorConfig[] {
  const customPath = path.join(process.cwd(), 'sensors.json');
  if (fs.existsSync(customPath)) {
    try {
      const data = fs.readFileSync(customPath, 'utf-8');
      return JSON.parse(data) as SensorConfig[];
    } catch (err) {
      console.warn('Failed to parse sensors.json, using defaults.', err);
    }
  }
  return DEFAULT_SENSORS;
}
