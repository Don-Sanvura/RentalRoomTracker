import { createApp } from './app.js';
import { config } from './config.js';
import { JsonRoomStore } from './store/roomStore.js';

const app = createApp(new JsonRoomStore(config.dataFile), config.corsOrigins);
const server = app.listen(config.port, () => {
  console.log(`Rental Room Tracker API listening on http://localhost:${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
