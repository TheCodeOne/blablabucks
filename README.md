# blablabucks

Live at: [blablabucks.dimi.cool](https://blablabucks.dimi.cool)

A live **Taxameter** for meetings: shows exactly how much money the current meeting is burning, in real time.

## Features

- **Six Roles:** (Manager, Int. Dev, Ext. Dev, Nearshore, Int. Non-Dev, Ext. Non-Dev) with customizable hourly rates.
- **Dynamic Adjustments:** Quick Settings panel with `+`/`-` to change the headcount live. The burn rate adjusts from that exact second onwards.
- **Team Presets:** Save frequent attendee combinations (e.g. "Daily Standup", "Management Sync") to load them with one click.
- **Live Share Links:** Generate a funny, memorable link (e.g., `toxic-deepdive-blocked`) to share a read-only Viewer Mode with meeting participants. Uses Cloudflare KV for sync.
- **Time Travel:** Back-fill elapsed minutes if you forgot to start the app at the beginning of the meeting.
- **Bulletproof State:** Survives tab switches, throttled background tabs, and browser reloads. The cost is calculated deterministically from absolute timestamps and persisted in `localStorage`.

Domain terminology and technical decisions are documented in [GLOSSARY.md](./GLOSSARY.md) and [CODING_STANDARDS.md](./CODING_STANDARDS.md).

## Develop

```sh
npm install
npm run dev     # http://localhost:5173
npm run lint    # oxlint
npm run build   # tsc + vite build
```

**Stack:** React + Vite, Tailwind CSS v4, shadcn/ui (Base UI), Motion, Lucide Icons, and Cloudflare Pages (Functions + KV).
