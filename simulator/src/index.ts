import { config, getSensors } from './config';
import { Simulator } from './simulator';

const sensorConfigs = getSensors();
const sim = new Simulator(sensorConfigs);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nStopping simulator...');
  sim.stop();
  process.exit(0);
});

sim.start();
