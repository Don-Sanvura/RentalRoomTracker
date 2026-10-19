# Rental Room Tracker: Backend (API)

REST API for Rental Room Tracker, a tool that helps landlords who rent out individual rooms keep track of occupancy, rent owed, deposits, and move-out notices.

> **Frontend repo:** [frontend](../frontend). The React dashboard that uses this API.

## The problem

Landlords renting out *rooms* manage many small tenancies at once, usually in a notebook, chat app, or private spreadsheet. Rent goes part-paid or forgotten, empty rooms go unnoticed, move-out notices are never written down, and nobody has one reliable figure for "what am I owed?"

## How this API solves it

It is the single source of truth for every room, and it computes the answers a landlord actually needs:

- **Derived availability.** A room with 0 occupants is *available*; no one has to flip a flag.
- **Arrears and income summary.** `GET /api/summary` returns the total owed, rooms in arrears, occupancy rate, expected monthly rent, deposits held, and notices given.
- **Trustworthy data.** Every write is validated (Zod): non-negative money, whole-number occupants, a leaving date required exactly when notice is given, and unique room numbers (case-insensitive).
- **Spreadsheet-ready export.** `GET /api/rooms/export.csv`, hardened against CSV formula injection.

## What makes it unique

- Modelled around the **room** as the unit, not the property or lease.
- Business rules live in one place (`src/room.ts`), so the API and its clients cannot drift apart.
- **Crash-safe persistence** with no database to install: writes are serialised and saved with write-temp-then-rename, and a failed save rolls back the in-memory change.
- The storage sits behind a small `RoomStore` interface, so swapping the JSON file for SQLite or Postgres touches one file.

## Who it is for

Small landlords, house-share and boarding-house owners, student accommodation operators, backyard-room owners, and caretakers who manage rooms for someone else.

## Tech stack

| Concern | Choice |
|---|---|
| Runtime / language | **Node.js 20+**, **TypeScript** (strict) |
| HTTP | **Express 4** |
| Validation | **Zod** |
| Security | **Helmet**, explicit **CORS** allow-list, 50 kB body limit |
| Persistence | JSON file via an atomic-write `RoomStore` |
| Tests | **Vitest** + **Supertest** (11 API tests) |

## How it was built

This began as a C# Windows Forms app that kept its rooms in a local `rooms.json`, with validation scattered across form code. It was rebuilt as a standalone API:

1. The `Room` model and its rules were ported, then tightened (stable UUIDs instead of a counter, `createdAt`/`updatedAt`, a notes field, cross-field notice validation).
2. Validation moved to the server boundary, so any client gets the same guarantees. Errors come back as `{ error, fields }`.
3. The app is built by a `createApp(store)` factory, so tests run the full HTTP stack against an in-memory store.

```
src/
  server.ts           process entry: wires config + store + graceful shutdown
  app.ts              routes, middleware, error handling
  room.ts             Zod schema, types, derived status
  store/roomStore.ts  RoomStore interface + atomic JSON implementation
  services/           summary.ts (totals), csv.ts (export)
tests/api.test.ts
```

## Running it

```bash
npm install
cp .env.example .env     # optional; defaults work
npm run dev              # http://localhost:4000
```

```bash
npm test                 # run the test suite
npm run build && npm start
```

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Port to listen on |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed browser origins |
| `DATA_FILE` | `./data/rooms.json` | Where rooms are stored |

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/rooms` | List rooms. Optional `q` (search), `status=available\|occupied`, `owing=true`. Sorted naturally (`2` before `10`). |
| GET | `/api/rooms/:id` | One room |
| POST | `/api/rooms` | Create. Returns `201` |
| PUT | `/api/rooms/:id` | Replace a room's details |
| DELETE | `/api/rooms/:id` | Delete. Returns `204` |
| GET | `/api/summary` | Dashboard totals |
| GET | `/api/rooms/export.csv` | CSV download |

Errors: `400` validation (`{ "error": "Validation failed", "fields": { "rentPerMonth": "Must be 0 or more" } }`), `404` not found, `409` duplicate room number.

**Room body**

```json
{
  "roomNumber": "101",
  "condition": "Good",
  "costPerRoom": 5000,
  "depositMade": 1200,
  "rentPerMonth": 1200,
  "moneyOwed": 0,
  "occupants": 1,
  "noticeGiven": true,
  "noticeDate": "2026-12-01",
  "notes": "Needs a new window latch"
}
```

`condition` is one of `Excellent`, `Good`, `Fair`, `Poor`, `Needs Repair`. Only `roomNumber`, `costPerRoom`, and `rentPerMonth` are required.

## Limitations and roadmap

There is no authentication yet, so run it on a trusted network or behind a reverse proxy with auth. The JSON store suits a single landlord on one server. Planned next: user accounts, a database-backed store, payment history, and rent-due reminders.

## License

MIT
