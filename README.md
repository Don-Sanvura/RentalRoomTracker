# Rental Room Tracker

A web app for landlords who rent out individual rooms. See which rooms are free, who owes rent, and who is about to leave, all on one screen.

| Folder | What it is |
|---|---|
| [`frontend/`](frontend) | React + TypeScript dashboard (Vite) |
| [`backend/`](backend) | Express + TypeScript REST API with validation and CSV export |

## The problem

Landlords who rent out *rooms* (not whole flats) manage many small tenancies at once, and most do it with a notebook, WhatsApp messages, or a spreadsheet only they understand. That leads to:

- **Money slips through.** Rent is part-paid, paid late, or forgotten, and nobody has one number for "how much am I owed right now?"
- **Vacancies are invisible.** A room can sit empty for weeks because nobody noticed the tenant left.
- **Move-outs are a surprise.** Notice is given verbally, never written down, and no replacement is lined up.
- **Records are scattered.** Deposits, room condition and who lives where are spread across chats, paper and memory.

## How this app solves it

One live record per room, turned into answers:

| Question | Where the app answers it |
|---|---|
| How many rooms are free? | **Available** card and filter. 0 occupants means available, automatically. |
| Who owes me, and how much? | **Money owed** card, red "Owes …" status, **Owing** filter. |
| What rent should I be collecting? | **Monthly rent expected** card, summed from occupied rooms. |
| Who is leaving and when? | Amber "Leaving 12 Jul (5d)" status and **Notice given** filter. |
| Can I get this into Excel? | **Export CSV** button. |

## What makes it unique

- **Built for rooms, not properties.** The unit is the room, with its own rent, deposit, condition, occupants and notice.
- **Derived status, not manual status.** Availability, arrears and notices are computed, so nothing has to be kept in sync by hand.
- **Landlord-first simplicity.** No tenant accounts or onboarding. Add rooms and the dashboard is useful immediately.
- **Trustworthy data.** Every write is validated on both client and server, and exports are protected against spreadsheet formula injection.
- **Accessible and responsive.** Keyboard navigable, screen-reader labelled, light and dark mode, and the table becomes cards on a phone.

## Target market

- **Small private landlords** renting spare rooms or a few rooms in a house.
- **House-share and boarding-house owners** with changing tenants.
- **Student accommodation operators**, from single landlords to small agencies.
- **Backyard-room and informal rental owners** who run everything from a notebook or chat app.
- **Caretakers and property managers** looking after rooms for an owner.

Not aimed (yet) at large property-management firms that need accounting, tenant portals and lease automation.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, hand-written CSS with design tokens, native `<dialog>` |
| Backend | Node 20+, Express 4, TypeScript (strict), Zod, Helmet, CORS allow-list |
| Persistence | JSON file via an atomic-write `RoomStore` interface (swappable for a database) |
| Testing | Vitest (frontend logic), Vitest + Supertest (API) |

## How it was built

The project began as a C# Windows Forms desktop app with a local `rooms.json`. It was rebuilt as a web app so it works from any device:

1. **Kept the domain rules** (room fields, 0 occupants = available, arrears and notice highlighting).
2. **Split frontend and backend.** The UI no longer touches storage; it talks to a REST API.
3. **Validated on both sides.** The form gives instant feedback; the API re-validates with Zod and returns per-field errors that the form shows next to the right input.
4. **Redesigned the UX** with summary cards, search, filter chips with live counts, sortable columns, a modal form with inline errors, a delete confirmation, toasts, loading skeletons and empty states.
5. **Tested the logic**: 11 API tests and 6 frontend unit tests.

## Quick start

Needs **Node 20+**. In two terminals:

```bash
cd backend  && npm install && npm run dev   # API on http://localhost:4000
cd frontend && npm install && npm run dev   # app on http://localhost:5173
```

See each folder's README for configuration, scripts and the API reference.

## Roadmap

Planned, not built: user accounts and authentication, payment history per room, tenant details, rent-due reminders, and a database-backed store.

Application preview 
<img width="1233" height="560" alt="image" src="https://github.com/user-attachments/assets/7fe02fd8-f815-46dd-a036-71d56cb6f1b3" />
<img width="1294" height="620" alt="image" src="https://github.com/user-attachments/assets/86d3cdab-1bb0-415c-81d2-8cdfd239bca3" />
<img width="1084" height="282" alt="image" src="https://github.com/user-attachments/assets/c64ba61c-b184-46f3-ba6a-ad736a9db722" />


## License

MIT
