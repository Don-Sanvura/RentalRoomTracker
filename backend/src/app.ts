import cors from 'cors';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { HttpError } from './errors.js';
import { roomInputSchema, statusOf } from './room.js';
import { roomsToCsv } from './services/csv.js';
import { summarise } from './services/summary.js';
import type { RoomStore } from './store/roomStore.js';

type Async = (...args: Parameters<RequestHandler>) => Promise<unknown>;
const wrap =
  (fn: Async): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

const param = (v: unknown): string => (typeof v === 'string' ? v : '');

export function createApp(store: RoomStore, corsOrigins: string[] = []) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, exposedHeaders: ['Content-Disposition'] }));
  app.use(express.json({ limit: '50kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/summary', wrap(async (_req, res) => res.json(summarise(await store.list()))));

  app.get('/api/rooms/export.csv', wrap(async (_req, res) => {
    const date = new Date().toISOString().slice(0, 10);
    res.type('text/csv').attachment(`rental-room-data-${date}.csv`).send(roomsToCsv(await store.list()));
  }));

  app.get('/api/rooms', wrap(async (req, res) => {
    const q = param(req.query.q).trim().toLowerCase();
    const status = param(req.query.status);
    const owingOnly = req.query.owing === 'true';
    const rooms = (await store.list())
      .filter((r) => !q || r.roomNumber.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q))
      .filter((r) => !status || statusOf(r) === status)
      .filter((r) => !owingOnly || r.moneyOwed > 0)
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
    res.json(rooms);
  }));

  app.get('/api/rooms/:id', wrap(async (req, res) => {
    const room = await store.get(param(req.params.id));
    if (!room) throw new HttpError(404, 'Room not found');
    res.json(room);
  }));

  app.post('/api/rooms', wrap(async (req, res) => {
    res.status(201).json(await store.create(roomInputSchema.parse(req.body)));
  }));

  app.put('/api/rooms/:id', wrap(async (req, res) => {
    res.json(await store.update(param(req.params.id), roomInputSchema.parse(req.body)));
  }));

  app.delete('/api/rooms/:id', wrap(async (req, res) => {
    if (!(await store.remove(param(req.params.id)))) throw new HttpError(404, 'Room not found');
    res.status(204).end();
  }));

  app.use((_req, _res, next) => next(new HttpError(404, 'Not found')));

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      const fields = Object.fromEntries(err.issues.map((i) => [i.path.join('.') || '_', i.message]));
      res.status(400).json({ error: 'Validation failed', fields });
    } else if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
    } else if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Invalid JSON' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  app.use(onError);

  return app;
}
