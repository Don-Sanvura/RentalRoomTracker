# Rental Room Tracker: Frontend

A clean, fast dashboard for landlords who rent out individual rooms. See which rooms are free, who owes rent, and who is about to leave, all on one screen.

> **Backend:** [backend](../backend). The API this app talks to.

## The problem

Landlords who rent out *rooms* (not whole flats) have a different job from landlords with one tenant per property. They juggle many small tenancies at once, and most of them manage it with a notebook, WhatsApp messages, or a spreadsheet that only they understand. That leads to the same handful of problems:

- **Money slips through.** Rent is part-paid, paid late, or forgotten. Nobody has a single number for "how much am I actually owed right now?"
- **Vacancies are invisible.** A room can sit empty for weeks because nobody noticed the tenant left.
- **Move-outs come as a surprise.** A tenant gives notice verbally, it is never written down, and the room is empty with no replacement lined up.
- **Records are scattered.** Deposits, room condition, and who lives where are spread across chats, paper, and memory, and hard to export when you need them.

## How this app solves it

Rental Room Tracker keeps one live record per room and turns it into answers:

| Question | Where the app answers it |
|---|---|
| How many rooms are free? | **Available** card and filter. A room with 0 occupants is automatically "available". |
| Who owes me money, and how much? | **Money owed** card, red "Owes …" status on the room, and the **Owing** filter. |
| What rent should I be collecting? | **Monthly rent expected** card, summed from occupied rooms. |
| Who is leaving and when? | Amber "Leaving 12 Jul (5d)" status and the **Notice given** filter. |
| Can I get this into Excel? | **Export CSV** button. |

Everything is searchable, sortable, and editable in two clicks. Numbers are validated before they are saved, so the data stays trustworthy.

## What makes it unique

- **Built for rooms, not properties.** Most property software assumes one lease per building. Here the unit is the *room*, with its own rent, deposit, condition, occupants, and notice.
- **Derived status, not manual status.** Availability comes from occupants, and arrears and notices bubble up to the top of each row. Nothing has to be kept in sync by hand.
- **Landlord-first simplicity.** No tenant accounts, no onboarding, no learning curve. Open it, add rooms, and the dashboard is useful straight away.
- **Honest about your money.** Arrears are totalled and surfaced, not buried in a table.
- **Safe exports.** CSV downloads are protected against spreadsheet formula injection.
- **Accessible and responsive.** Keyboard navigable, screen-reader labelled, light and dark mode, and the table turns into cards on a phone.

## Who it is for

- **Small private landlords** renting out spare rooms or a few rooms in a house.
- **House-share and boarding-house owners** with many rooms and a changing set of tenants.
- **Student accommodation operators**, from a single landlord to small agencies.
- **Backyard-room and informal rental owners**, who currently run everything from a notebook or chat app.
- **Caretakers and property managers** who look after rooms on an owner's behalf.

It is not aimed (yet) at large property-management firms who need accounting, tenant portals, and lease automation.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | **React 18** + **TypeScript** | Typed components and a shared data model with the API |
| Build | **Vite 5** | Instant dev server, small production bundle (~50 kB gzipped JS) |
| Styling | Hand-written **CSS** with design tokens | No UI-kit dependency, automatic dark mode, easy to re-theme |
| Dialogs | Native **`<dialog>`** | Built-in focus trapping and Escape handling |
| Testing | **Vitest** | Unit tests for validation and date logic |
| API | REST/JSON to the [backend](../backend) | Express + Zod + TypeScript |

Only two runtime dependencies (`react`, `react-dom`).

## How it was built

The project started as a Windows Forms desktop app (C#, a `DataGridView`, and a local `rooms.json`). It was rebuilt as a web app split into two repos so it can be used from any device:

1. **Kept the domain rules.** Room fields, "0 occupants = available", and arrears/notice highlighting carried over unchanged.
2. **Split frontend and backend.** The UI no longer touches storage; it talks to a small REST API.
3. **Moved validation to both sides.** `src/validate.ts` gives instant feedback in the form, and the backend re-validates everything with Zod. Server-side field errors are displayed under the matching input.
4. **Redesigned the UX.**
   - Summary cards instead of a single text line.
   - Search, filter chips with live counts, and sortable columns. (The old grid disabled sorting because it would desync from the data list. Here, sorting is safe because rows are keyed by ID.)
   - A modal form with inline errors instead of message boxes.
   - A delete confirmation dialog, toasts, loading skeletons, and friendly empty states.
5. **Tested the logic.** Validation rules and date/notice calculations have unit tests.

```
src/
  App.tsx               page state: loading, filters, sorting, dialogs
  api.ts                typed fetch client + ApiError (carries field errors)
  validate.ts           form draft -> typed payload, or per-field errors
  format.ts             money/date helpers (local-date safe)
  types.ts              shared domain types
  components/
    RoomTable.tsx       sortable table, status pills, mobile card layout
    RoomForm.tsx        add/edit dialog with inline validation
    ConfirmDialog.tsx   delete confirmation
  styles.css            tokens, light/dark themes, responsive rules
```

## Running it locally

You need **Node 20+**. Start the [backend](../backend) first (it listens on port 4000), then:

```bash
npm install
npm run dev        # http://localhost:5173, /api is proxied to localhost:4000
```

Other scripts:

```bash
npm test           # unit tests
npm run build      # type-check + production bundle in dist/
npm run preview    # serve the production build
```

### Configuration

Copy `.env.example` to `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | *(empty)* | Backend origin in production. Empty in dev, where the Vite proxy is used. |
| `VITE_CURRENCY` | `USD` | ISO currency code used for display (`ZAR`, `GBP`, `EUR`, …). |

When deploying, host `dist/` on any static host and set the backend's `CORS_ORIGIN` to the site's URL.

## Roadmap

Not built yet, but planned: payment history per room, tenant details, rent-due reminders, and user accounts so more than one landlord can use the same deployment.

## License

MIT
