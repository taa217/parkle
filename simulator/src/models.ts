export interface SensorConfig {
  sensorId: string;
  zoneId: string;
  capacity: number;
}

export interface ZoneStatusPayload {
  sensorId: string;
  zoneId: string;
  status: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNKNOWN';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  availableCount: number;
  lastUpdated: string;
}

export interface HeartbeatPayload {
  sensorId: string;
  zoneId: string;
  type: string;
}

export type SimulatorMode = 'normal' | 'rush_hour' | 'flaky' | 'offline';

export interface EnvConfig {
  baseUrl: string;
  sensorKey: string;
  heartbeatIntervalSec: number;
  updateIntervalSec: number;
  jitterMs: number;
  mode: SimulatorMode;
  durationSec: number;
}
