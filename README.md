# blablabucks

A live **Taxameter** for meetings: shows how much money the current meeting is burning, in real time.

- Five Categories (Internal/External/NearShoring Dev, Internal/External Non-Dev) with hourly Rates set in the Settings Modal
- Quick Settings with `+`/`-` to change Headcount live; the Burn Rate adjusts from that second on
- Back-fill minutes if you start the app late
- Survives tab switches and reloads: cost is derived from absolute timestamps and everything is persisted in `localStorage`

Domain terms are defined in [GLOSSARY.md](./GLOSSARY.md).

## Develop

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # Session State logic
npm run build
```

Stack: React + Vite, Tailwind CSS v4, shadcn/ui (Base UI), Motion, dayjs.
