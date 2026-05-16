# Functional Realtime Intelligence for Spotting Blissful Everyday Actions 

FRISBEE

a personal logistic regression model (x ∈ ℝ⁴ cluster-weighted TF-IDF, blended IDF, λ=0.01 L2 on w only, η=0.1) trained on one individual's daily free-form messages predicts that individual's weekly behavioral alignment more accurately than their own blinded self-prediction, measured by MAE over a held-out four-week test period.

# Core

The core insight that's genuinely true: there's a gap between who you imagine yourself to be and who actually shows up. That's real. Teenagers feel this acutely. They talk about it with friends.

The ML question: can a model learn YOUR specific drift patterns from your own words/behavior better than you predict yourself?

The teen identity gap is real. "I know who I want to be vs who shows up" — that's the core.

The "why did I do that again" is real. That's not productivity framing - that's identity framing.
What would actually help a teenager understand their own patterns? Not a tracker. Not a dashboard.

"I said I'd study and didn't." That's self-knowledge failure. The question is: what tool could actually help with that, so we crafted FRISBEE.

Over time the model learns YOUR specific optimism bias. Not anyone else's. Yours. The specific gap between what morning-you promises and what evening-you delivers. And it learns to predict that gap before you even make the promise.
That's the ML. Personal optimism bias modeling. Individual-level. Never been done cleanly.


## What it does

Every day you drop a message about how things went. Over time, a tiny logistic-regression model (4 handcrafted semantic clusters: drift / align / excuse / energy) learns to predict whether your week was a "yes week" or a "no week" and you try to beat it.

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
curl -fsSL https://bun.sh/install | bash
```
```bash
source ~/.bashrc
```
```bash
bun --version
```
```bash
bun run build
```
```bash
bunx wrangler dev
```

## Stack

- TanStack Start (file-based routing in `src/routes/`)
- Vite 7 + React 19
- Tailwind CSS v4 (tokens in `src/styles.css`)
- IndexedDB via `idb` (vault layer in `src/lib/frisbee/vault.ts`)
- Pure-TS engine in `src/lib/frisbee/` — no external ML deps

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
