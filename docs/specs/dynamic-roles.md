# Spec: Dynamic Roles

## Overview

Currently, the app has hardcoded roles (Manager, Int Dev, etc.). We want to make this fully dynamic so users can add, rename, and delete roles.

## Decisions

1. **Full CRUD:** Users can create, update, and delete roles in the Settings Modal.
2. **Icon Selection:** Each role has an icon chosen from a predefined set (e.g., Code, User, Briefcase).
3. **Defaults:** The app starts with 4 defaults: Manager, Dev, PO, Scrum Master.
4. **Migration:** We bump local storage keys to `v2` for a clean break. No auto-migration of `v1` data.
5. **Team Presets:** Deleting a role doesn't break saved teams; missing IDs are just gracefully ignored when a team is loaded.

## Architecture Updates

- **Domain:** `CategoryId` becomes `string`. `Category` gains an `icon` field and holds the user's `rate` (no separate `Rates` record needed anymore).
- **State (`use-meeting.ts`):**
  - `categories` state (array of `Category`) replaces `rates`.
  - `headcounts` remains `Record<string, number>`.
- **Settings Modal:** Replaced the simple rate list with a list of roles, an "Add Role" button, and inputs for label, rate, and icon selector.
- **Shared State:** Cloudflare links now share `{ c: categories, h: headcounts, s: session }`.
