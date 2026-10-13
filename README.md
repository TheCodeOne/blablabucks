# blablabucks

Live at: [blablabucks.dimi.cool](https://blablabucks.dimi.cool)

A live **Taxameter** for meetings: shows exactly how much money the current meeting is burning in real time, with interactive buzzword reactions and live participant sync.

## Features

- **Dynamic Roles:** Create, edit, and delete custom roles (e.g., Manager, Dev, PO) with customizable hourly rates and icons.
- **Dynamic Adjustments:** Quick Settings panel with `+`/`-` to change the headcount live. The burn rate adjusts from that exact second onwards.
- **Team Presets:** Save frequent attendee combinations (e.g. "Daily Standup", "Management Sync") to load them with one click.
- **Real-Time Room Sync:** Instant bidirectional sync powered by Cloudflare Durable Objects and WebSockets.
- **Buzzword Bingo:** Participants can add, delete (host-only), and tap speaker buzzwords.
  - **Tally Counter:** Aggregated counter with a 5-second deduplication/cooldown window.
  - **Reaction Bubbles:** Unthrottled floating bubbles that rise with gentle horizontal drift displaying `"<Word>" · <Persona>`.
- **Participant Identity & Presence:** Funny corporate personas (e.g., "Sleepy Stakeholder", "Agile Llama") with editable badges and live attendee presence count.
- **Host Controls:** Host can toggle Buzzwords on/off before sharing or live during the meeting.
- **Time Travel:** Back-fill elapsed minutes if you forgot to start the app at the beginning of the meeting.
- **Bulletproof State:** Survives tab switches, throttled background tabs, and browser reloads. Cost is calculated deterministically from absolute timestamps.

Domain terminology and technical decisions are documented in [GLOSSARY.md](./GLOSSARY.md) and [CODING_STANDARDS.md](./CODING_STANDARDS.md).

## Development

```sh
npm install
npm run dev     # Starts Vite + Miniflare/workerd on http://localhost:5173
npm run lint    # oxlint
npm test        # vitest
npm run build   # tsc + vite build (client + worker)
```

**Stack:** React 19 + Vite, Tailwind CSS v4, Base UI, Motion, Lucide Icons, and Cloudflare Workers (Static Assets + Durable Objects).

## Deployment

blablabucks is compatible with the Cloudflare **Free Tier** using SQLite-backed Durable Objects (`new_sqlite_classes`). No paid subscription or external database is required.

### Option 1: Direct CLI Deploy (Zero Secrets Required)

Log in once to Wrangler and deploy directly from your machine:

```sh
npx wrangler login   # Only needed once
npm run deploy       # Runs build + wrangler deploy
```

### Option 2: Cloudflare Dashboard Git Integration (Zero Secrets)

Connect the repository directly inside Cloudflare (identical to `beat`):

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Compute (Workers & Pages)** -> **Create application** -> **Workers**.
2. Click **Connect to Git** and select this repository.
3. Build command: `npm run build`
4. Deploy! Cloudflare automatically handles the build, worker, and Durable Objects on every push to `main` without any tokens or secrets.

### Attaching Custom Domain (`blablabucks.dimi.cool`)

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **blablabucks**.
3. Go to **Settings** -> **Domains & Routes**.
4. Click **Add** -> **Custom Domain**.
5. Enter `blablabucks.dimi.cool` and confirm. Cloudflare will automatically configure the DNS and SSL certificate.
   _(Note: If `blablabucks.dimi.cool` was previously mapped to a Cloudflare Pages project, remove the custom domain from the Pages project first.)_
