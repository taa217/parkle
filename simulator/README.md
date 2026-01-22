# Parking Sensor Simulator

A CLI tool to simulate multiple parking sensors (UnitV2) sending data to the UZ Parking backend.

## Setup

1.  **Install Dependencies:**
    ```bash
    cd simulator
    npm install
    ```

2.  **Configuration:**
    The simulator attempts to load environment variables from:
    - `simulator/.env`
    - `../.env` (Project Root)
    - `../server/.env` (Backend Server)

    **Crucially**, it needs `SENSOR_API_KEY` (from the server) or `SIM_SENSOR_KEY` to be set to the valid key accepted by the backend.

    **Default Env Vars:**
    ```env
    SIM_BASE_URL=http://localhost:3000
    SIM_SENSOR_KEY=YOUR_SENSOR_API_KEY  # Must match server's SENSOR_API_KEY
    SIM_INTERVAL_HEARTBEAT_SEC=10
    SIM_INTERVAL_UPDATE_SEC=5
    SIM_JITTER_MS=1200
    SIM_MODE=normal   # normal | rush_hour | flaky | offline
    SIM_DURATION_SEC=0  # 0 = run forever
    ```

    Optionally, create `sensors.json` in the `simulator` folder to override default sensors:
    ```json
    [
      { "sensorId": "custom-1", "zoneId": "main-admin-parking", "capacity": 50 }
    ]
    ```

## Usage

Run the simulator:

```bash
# From simulator directory
npm run sim

# Or from project root (if configured)
npm run sim
```

## Default Zones
The simulator is pre-configured with these zones (matching `server/src/seed.ts`):
- `library-staff-parking` (40)
- `main-admin-parking` (50)
- `engineering-faculty-parking` (100)
- `science-lecture-theatre-parking` (60)
- `students-union-parking` (120)

## Troubleshooting
- **403 Forbidden**: Your `SIM_SENSOR_KEY` or `SENSOR_API_KEY` does not match the one expected by the server. Check `server/.env`.
