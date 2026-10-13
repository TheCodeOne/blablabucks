# Spec: Live Buzzword Bingo & Real-Time Room Sync

## Overview

A real-time collaborative feature for shared meetings. Each participant in a shared Room can add buzzwords that a speaker repeatedly says (e.g. "like", "basically", "synergy"). Participants can tap words as they hear them:

- **Instant Reaction Bubbles:** Every tap spawns a floating reaction bubble containing the word and the tapper's name, floating from the bottom of every participant's screen.
- **Tally Counter:** An aggregated count per buzzword (e.g., `like: 14`) displayed in a reusable chip bar, with a 5-second deduplication/cooldown window so that multiple taps during the window only increment the count once.
- **Real-Time Taxameter Sync:** Migrates the shared session from a static KV snapshot to a live WebSocket connection backed by Cloudflare Durable Objects. Host changes (headcount, pause, resume) propagate to all connected viewers in real time.

---

## Decisions & Behavior

### 1. Architecture & Platform

- **Single Worker with Static Assets:** Migrate from Cloudflare Pages to a unified Worker deployment (`assets.directory: ./dist`, SPA routing fallback) using `wrangler.jsonc`.
- **Durable Object (`RoomDO`):** One Durable Object instance per room ID (the slug, e.g. `delayed-agile-checkin`).
- **WebSocket Hibernation:** Uses Cloudflare's WebSocket Hibernation API (`ctx.acceptWebSocket()`) to stay well within free tier limits.
- **Local-First Dev:** Runs locally using `@cloudflare/vite-plugin` (or Miniflare/Wrangler proxy) inside `npm run dev` with real WebSockets and DO support.

### 2. Room Lifecycle & Authority

- **Room Creation:** Clicking "Share link" triggers room creation on the server and generates a random slug + secret **Host Token**.
- **Host Role:** The host token is stored in the host's `localStorage`. When connecting via WebSocket, the host authenticates with this token. Only the host can:
  - Push meeting controls (headcount, pause, resume, reset).
  - Delete buzzwords.
  - Toggle Buzzword Bingo on/off for the room.
- **Room Expiration:** 24-hour inactivity timeout handled inside the Durable Object. No manual hard reset required.
- **Toggleable Feature:** Host can share with or without Buzzwords enabled, and can toggle it during the meeting. When disabled, the buzzword bar hides for all viewers.

### 3. Buzzwords & Tally Mechanics

- **Adding Words:** Anyone (host or viewer) can add buzzwords.
- **Word Constraints:** Up to 32 characters, trimmed, case-insensitive uniqueness check (`Like` == `like`). No hard limit on the total number of words.
- **Tally Deduplication (5-second window):**
  - First tap increments the word tally by +1 and starts a 5-second window.
  - Subsequent taps on that word within 5 seconds do **not** increase the tally count.
- **Reaction Bubbles (Instant & Unthrottled):**
  - Every single tap instantly broadcasts a reaction event to all connected clients in the room.
  - A bubble floats up from the bottom of the screen: `"<Word>" · <Name>`.
  - Floating layer has `pointer-events-none` so it never interferes with clicking.

### 4. Participant Identity & Presence

- **Names:** Participants can choose their own display name. If skipped, they are auto-assigned a funny default (e.g. "Sleepy Stakeholder", "Agile Llama"). Stored in `localStorage`.
- **Presence:** A subtle presence indicator shows who is currently connected to the live session.

---

## Phased Implementation Plan

1. **Phase 1: Worker + Durable Object Room Infra & Real-Time Sync**
   - Setup `wrangler.jsonc` and Worker with SPA assets.
   - Implement `RoomDO` with WebSocket Hibernation.
   - Sync Taxameter session (status, headcount, categories, timestamps) live from host to viewers.
2. **Phase 2: Buzzword State & Tally Counter**
   - `BuzzwordBar` component (self-contained, reusable).
   - Add and delete buzzwords (host-only delete).
   - Real-time tally sync with 5-second deduplication window.
3. **Phase 3: Floating Reaction Bubbles, Identity & Presence**
   - Floating bubble animation layer (Motion/CSS).
   - Participant name modal/input with funny defaults.
   - Presence indicator in header/footer.
   - Host toggle for Buzzword Bingo feature.
4. **Phase 4: CI/CD & Cloudflare Deployment**
   - GitHub Actions workflow (`wrangler deploy` on push to `main` with lint + test pre-checks).
