import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { csvCell } from '../src/services/csv.js';
import { JsonRoomStore } from '../src/store/roomStore.js';

const valid = { roomNumber: '101', costPerRoom: 5000, rentPerMonth: 1200, occupants: 1 };
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(new JsonRoomStore(null));
});

describe('rooms API', () => {
  it('creates a room and applies defaults', async () => {
    const res = await request(app).post('/api/rooms').send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ roomNumber: '101', condition: 'Good', moneyOwed: 0, noticeGiven: false });
    expect(res.body.id).toBeTruthy();
  });

  it('rejects invalid input with field errors', async () => {
    const res = await request(app).post('/api/rooms').send({ ...valid, rentPerMonth: -5, roomNumber: ' ' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields)).toEqual(expect.arrayContaining(['rentPerMonth', 'roomNumber']));
  });

  it('requires a notice date when notice is given', async () => {
    const res = await request(app).post('/api/rooms').send({ ...valid, noticeGiven: true });
    expect(res.status).toBe(400);
    expect(res.body.fields.noticeDate).toBeTruthy();
  });

  it('rejects duplicate room numbers case-insensitively', async () => {
    await request(app).post('/api/rooms').send({ ...valid, roomNumber: 'A1' });
    const res = await request(app).post('/api/rooms').send({ ...valid, roomNumber: 'a1' });
    expect(res.status).toBe(409);
  });

  it('updates and deletes, returning 404 for unknown ids', async () => {
    const { body } = await request(app).post('/api/rooms').send(valid);
    const put = await request(app).put(`/api/rooms/${body.id}`).send({ ...valid, moneyOwed: 300 });
    expect(put.body.moneyOwed).toBe(300);
    expect((await request(app).delete(`/api/rooms/${body.id}`)).status).toBe(204);
    expect((await request(app).delete(`/api/rooms/${body.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/rooms/${body.id}`)).status).toBe(404);
  });

  it('filters by status, owing and search text', async () => {
    await request(app).post('/api/rooms').send({ ...valid, roomNumber: '1', occupants: 0 });
    await request(app).post('/api/rooms').send({ ...valid, roomNumber: '2', moneyOwed: 50 });
    expect((await request(app).get('/api/rooms?status=available')).body).toHaveLength(1);
    expect((await request(app).get('/api/rooms?owing=true')).body).toHaveLength(1);
    expect((await request(app).get('/api/rooms?q=2')).body[0].roomNumber).toBe('2');
  });

  it('sorts room numbers naturally', async () => {
    for (const n of ['10', '2', '1']) await request(app).post('/api/rooms').send({ ...valid, roomNumber: n });
    const res = await request(app).get('/api/rooms');
    expect(res.body.map((r: { roomNumber: string }) => r.roomNumber)).toEqual(['1', '2', '10']);
  });

  it('computes the summary', async () => {
    await request(app).post('/api/rooms').send({ ...valid, roomNumber: '1', occupants: 0 });
    await request(app).post('/api/rooms').send({ ...valid, roomNumber: '2', moneyOwed: 100.5, depositMade: 500 });
    const { body } = await request(app).get('/api/summary');
    expect(body).toMatchObject({
      totalRooms: 2, available: 1, occupied: 1, roomsWithArrears: 1,
      totalOwed: 100.5, expectedMonthlyRent: 1200, totalDeposits: 500, occupancyRate: 50,
    });
  });

  it('exports CSV with a download header', async () => {
    await request(app).post('/api/rooms').send({ ...valid, notes: 'say "hi", ok' });
    const res = await request(app).get('/api/rooms/export.csv');
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.text).toContain('"say ""hi"", ok"');
  });
});

describe('csvCell', () => {
  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
  });
  it('leaves numbers alone', () => {
    expect(csvCell(-5)).toBe('-5');
  });
});
