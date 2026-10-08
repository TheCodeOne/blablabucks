# Coding Standards

These rules define the design, aesthetic, and technical decisions for **blablabucks**. The reviewer agent should enforce these on every change.

## 1. Aesthetic & UI ("Anti-AI-Slop")

- **Minimalism:** Use clean, sharp borders (`border-border`, `bg-card`). Do not use heavy drop shadows, rounded bubbles, or generic AI-generated styles (so called "AI Slop").
- **Dark Theme:** The app relies on a moody, dark color palette with ember/orange accents for important elements.
- **Typography:**
  - Use monospace fonts (`font-mono`) for all numbers, rates, and timestamps (e.g., `120 €/h`, `01:23:45`).
  - Use tabular numerals (`tabular-nums`) to prevent layout shifts during animations.
  - Keep labels short (e.g., "Int. Dev" instead of "Internal Developer") to prevent truncation. Use uppercase or small-caps for small subheadings (e.g. `uppercase tracking-wider text-xs`).
- **Icons:** Use `lucide-react` exclusively. No emojis in the UI unless strictly for a humorous effect in a very specific place.

## 2. Technical Decisions

- **Local State First:** We use `usePersistentState` to store all session data in `localStorage`. The app must work flawlessly after a page reload.
- **Cloudflare KV for Sharing:** Shared links use Cloudflare Pages Functions (`functions/api/share/index.ts`). Do not build a complex backend database.
- **Component Styling:** Use Tailwind CSS combined with `cn()` utility (`clsx` + `tailwind-merge`) for dynamic classes.
- **Animations:** Use `motion/react` (Framer Motion) for fluid transitions (like the Taxameter cost ticking up or panels expanding). Keep animations snappy (e.g. `type: 'spring', stiffness: 400`).

## 3. Judgement Calls

- Keep the domain language (`GLOSSARY.md`) clean. If you introduce a new concept (like "Team Presets"), ensure it doesn't break the existing terminology (e.g. it only saves Headcounts, not Rates).
