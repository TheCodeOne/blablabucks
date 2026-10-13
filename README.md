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

## Deployment & CI/CD

Deployment is automated via GitHub Actions on every push to `main` (`.github/workflows/deploy.yml`).

### Required GitHub Secrets

Go to **GitHub Repository -> Settings -> Secrets and variables -> Actions** and add:

1. `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Account:Workers Scripts:Edit`, `Account:Workers KV Storage:Edit`, and `Account:Durable Objects:Edit` (or the default "Edit Cloudflare Workers" template).
2. `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found on your Cloudflare dashboard overview or URL).

### Attaching Custom Domain (`blablabucks.dimi.cool`)

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **blablabucks**.
3. Go to **Settings** -> **Domains & Routes**.
4. Click **Add** -> **Custom Domain**.
5. Enter `blablabucks.dimi.cool` and confirm. Cloudflare will automatically configure the DNS and SSL certificate.
   _(Note: If `blablabucks.dimi.cool` was previously mapped to a Cloudflare Pages project, remove the custom domain from the Pages project first.)_
