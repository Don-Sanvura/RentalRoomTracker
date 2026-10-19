import path from 'node:path';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  dataFile: path.resolve(process.env.DATA_FILE ?? './data/rooms.json'),
};
