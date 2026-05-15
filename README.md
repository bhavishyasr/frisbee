# Personal Intelligence Machine- PIM

A little buddy that learns *you* from your own words. Local-only. No server, no account, no telemetry. Your data lives in your browser's IndexedDB and nowhere else.

## What it does

Every day you drop a message about how things went. Over time, a tiny logistic-regression model (4 hand-tuned semantic clusters: drift / align / excuse / energy) learns to predict whether your week was a "yes week" or a "no week" — and you try to beat it.

## Run it

Requires **Bun** (or Node 20+ with npm — swap commands accordingly).

```bash
bun install
bun dev
```

Open http://localhost:5173

## Build

```bash
bun run build      # production build
bun run preview    # serve the build locally
```
## Alternatively

```bash
bunx wrangler dev
```

## Stack

- TanStack Start (file-based routing in `src/routes/`)
- Vite 7 + React 19
- Tailwind CSS v4 (tokens in `src/styles.css`)
- IndexedDB via `idb` (vault layer in `src/lib/yours/vault.ts`)
- Pure-TS engine in `src/lib/yours/` — no external ML deps

## Where things live

```
src/
  routes/             # / week / mirror / lab / me
  components/         # DeviceShell, Mascot, DeviceNav
  lib/yours/
    tokenize.ts       # apostrophe-preserving tokenizer
    features.ts       # blended-IDF, 4-cluster scoring
    model.ts          # logistic regression w/ L2
    scientist.ts      # word-delta hypothesis surfacing
    vault.ts          # IndexedDB persistence
    engine.ts         # orchestration
    vocab.json        # hand-tuned clusters + bg_df
```

## Notes for self-hosting

- No environment variables required.
- The Cloudflare Vite plugin is configured but not required — `bun dev` and `bun preview` both run on plain Node. Deploy anywhere that serves a Vite SSR build.
- Wipe local data anytime from `/me`.
