import axios from 'axios';
import { config } from './config';
import { calculateOccupancy, determineStatus } from './math';
import { HeartbeatPayload, SensorConfig, ZoneStatusPayload } from './models';

// Retry wrapper
async function fetchWithRetry(url: string, payload: any, retries = 3): Promise<void> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      await axios.post(url, payload, {
        headers: { 'x-sensor-key': config.sensorKey },
        timeout: 5000,
      });
      return;
    } catch (err: any) {
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      const delay = [200, 500, 1000][attempt - 1] || 1000;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

class Sensor {
  private occupiedCount: number;
  private isOffline: boolean = false;
  private hbTimeout: NodeJS.Timeout | null = null;
  private updateTimeout: NodeJS.Timeout | null = null;

  constructor(public cfg: SensorConfig) {
    // Initial occupancy random
    this.occupiedCount = Math.floor(Math.random() * (cfg.capacity * 0.5));
  }

  public setOffline() {
    this.isOffline = true;
    if (this.hbTimeout) clearTimeout(this.hbTimeout);
    if (this.updateTimeout) clearTimeout(this.updateTimeout);
    console.log(`[OFFLINE] ${this.cfg.sensorId} stopped sending`);
  }

  public start() {
    this.scheduleHeartbeat();
    this.scheduleUpdate();
  }

  public stop() {
    if (this.hbTimeout) clearTimeout(this.hbTimeout);
    if (this.updateTimeout) clearTimeout(this.updateTimeout);
  }

  private getJitter() {
    return Math.floor(Math.random() * config.jitterMs);
  }

  private scheduleHeartbeat() {
    if (this.isOffline) return;
    const delay = config.heartbeatIntervalSec * 1000 + this.getJitter();
    this.hbTimeout = setTimeout(async () => {
      await this.sendHeartbeat();
      this.scheduleHeartbeat();
    }, delay);
  }

  private scheduleUpdate() {
    if (this.isOffline) return;
    const delay = config.updateIntervalSec * 1000 + this.getJitter();
    this.updateTimeout = setTimeout(async () => {
      await this.sendUpdate();
      this.scheduleUpdate();
    }, delay);
  }

  private async sendHeartbeat() {
    const payload: HeartbeatPayload = {
      sensorId: this.cfg.sensorId,
      zoneId: this.cfg.zoneId,
      type: 'UNITV2',
    };
    try {
      await fetchWithRetry(`${config.baseUrl}/api/sensors/heartbeat`, payload);
      console.log(`[HB] ${this.cfg.sensorId} -> OK`);
    } catch (err: any) {
      console.error(`[HB-ERR] ${this.cfg.sensorId} ${err.message}`);
    }
  }

  private async sendUpdate() {
    // Flaky mode might skip update
    if (config.mode === 'flaky' && Math.random() < 0.2) {
      // Skip
      return;
    }

    this.occupiedCount = calculateOccupancy(this.occupiedCount, this.cfg.capacity, config.mode);
    const { status, confidence } = determineStatus(this.occupiedCount, this.cfg.capacity, config.mode);
    const available = Math.max(0, this.cfg.capacity - this.occupiedCount);

    const payload: ZoneStatusPayload = {
      sensorId: this.cfg.sensorId,
      zoneId: this.cfg.zoneId,
      status,
      confidence,
      availableCount: available,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await fetchWithRetry(`${config.baseUrl}/api/sensors/zone-status`, payload);
      console.log(
        `[UPD] ${this.cfg.zoneId} avail=${available}/${this.cfg.capacity} status=${status} conf=${confidence}`
      );
    } catch (err: any) {
      console.error(`[UPD-ERR] ${this.cfg.sensorId} ${err.message}`);
    }
  }
}

export class Simulator {
  private sensors: Sensor[] = [];

  constructor(configs: SensorConfig[]) {
    this.sensors = configs.map((c) => new Sensor(c));
  }

  public start() {
    console.log(`Starting Simulator in ${config.mode} mode...`);
    console.log(`Target: ${config.baseUrl}`);
    
    this.sensors.forEach((s) => s.start());

    // Offline mode logic
    if (config.mode === 'offline') {
      const target = this.sensors[Math.floor(Math.random() * this.sensors.length)];
      setTimeout(() => {
        target.setOffline();
      }, 30000);
    }

    // Duration logic
    if (config.durationSec > 0) {
      setTimeout(() => {
        console.log('Duration reached. Stopping...');
        this.stop();
        process.exit(0);
      }, config.durationSec * 1000);
    }
  }

  public stop() {
    this.sensors.forEach((s) => s.stop());
  }
}
