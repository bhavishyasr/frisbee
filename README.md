# FRISBEE

**F**unctional **R**ealtime **I**ntelligence for **S**potting **B**lissful **E**veryday **E**veryone-knows-it-but-doesn't-say-it.

> A tiny logistic-regression model — `x ∈ ℝ⁴` cluster-weighted TF-IDF with blended IDF, L2 (λ=0.01) on `w` only, η=0.1 — trained on a single person's daily free-form messages predicts that person's weekly behavioral alignment more accurately than their own blinded self-prediction, measured by MAE over a held-out four-week test window.

That's the claim. The rest of this README is why anyone should care, and how to run it.

---

## The thing it's actually about

There is a gap between who you imagine yourself to be and who actually shows up. Teenagers feel this acutely — they talk about it constantly, in their own words, without ever calling it that. *"I said I'd study and didn't."* *"Why did I do that again."* That's not a productivity problem. That's an identity problem.

FRISBEE is the smallest possible tool that takes that gap seriously.

Every day you drop one message about how things went — whatever you want, however you want to say it. Over time, a tiny model (four hand-built semantic clusters: **drift / align / excuse / energy**) learns *your specific* optimism bias — the gap between what morning-you promises and what evening-you delivers. At the end of the week it predicts whether you had a "yes week" or a "no week." Then you predict yourself, blindly, before seeing it. Then the truth lands. Then you train one step.

The game is: **beat your own model**. Most weeks you won't. That's the point.

Personal optimism-bias modeling at the individual level. Nothing leaves your device.

---

## Run it

Requires **Bun** (or Node 20+ with npm — swap commands accordingly).

```bash
bun install
bun dev
```

Open http://localhost:5173.

```bash
bun run build      # production build
bun run preview    # serve the build locally
```

### Alternatively

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

---

## The math, briefly

Four clusters, hand-tuned: `drift`, `align`, `excuse`, `energy`. Multi-cluster membership is allowed (e.g. *locked* lives in both `align` and `energy`). Tokenization preserves apostrophes — *didn't* and *let's* are signal, not noise.

For each message:

```
TF(w)        = count(w) / total_words
IDF_p(w)     = log( (N_p  + 1) / (df_p(w)  + 1) ) + 1
IDF_bg(w)    = log( (N_bg + 1) / (df_bg(w) + 1) ) + 1     (df_bg default = 1)
IDF_blend(w) = (N_p · IDF_p + N_bg · IDF_bg) / (N_p + N_bg)
score_c      = Σ TF(w) · IDF_blend(w)   for w ∈ msg ∩ cluster_c
```

Then logistic regression on `x ∈ ℝ⁴`:

```
p = σ(w · x + b)
L = BCE(p, y) + (λ/2)‖w‖²        (L2 on w only — never on b)
w ← w − η · ((p − y) · x + λ · w)
b ← b − η · (p − y)
```

`η = 0.1`, `λ = 0.01`. `z` clipped to `[-500, 500]`, `p` clipped to `[1e-7, 1−1e-7]`. The constants are fixed by hand — with ~4–8 weekly labels per user, cross-validation is fiction.

The Python reference (`collect.py`) and the TypeScript engine produce byte-identical features. A parity test enforces it.

---

## Stack

- TanStack Start (file-based routing in `src/routes/`)
- Vite 7 + React 19
- Tailwind CSS v4 (tokens in `src/styles.css`)
- IndexedDB via `idb` (vault in `src/lib/frisbee/vault.ts`)
- Pure-TS engine in `src/lib/frisbee/` — zero external ML deps

## Where things live

```
src/
  routes/             # / · /week · /mirror · /lab · /me
  components/         # DeviceShell, Mascot, DeviceNav, SparkleBurst
  lib/frisbee/
    tokenize.ts       # apostrophe-preserving tokenizer
    features.ts       # blended-IDF, 4-cluster scoring
    model.ts          # logistic regression w/ L2 on w only
    scientist.ts      # word-delta hypothesis surfacing
    vault.ts          # IndexedDB persistence
    engine.ts         # orchestration
    vocab.json        # hand-tuned clusters + background df
  lib/buddy/          # mascot brain, event bus, FX layer (audio + haptics)
```

## The five rooms

- **`/`** — Today. Drop a message. See live cluster bars and a confidence pill.
- **`/week`** — Commit your self-prediction *before* the model reveals its own.
- **`/mirror`** — Word-delta hypotheses the engine has noticed about you.
- **`/lab`** — Seven-step visual walkthrough of the math. Built for a high-schooler.
- **`/me`** — Export everything. Wipe everything. Your data, your call.

## Notes for self-hosting

- No environment variables required.
- The Cloudflare Vite plugin is configured but optional — `bun dev` and `bun preview` both run on plain Node. Deploy anywhere that serves a Vite SSR build.
- Wipe local data anytime from `/me`. There is no server to call.

---

*FRISBEE is local-only, opinionated, and small on purpose. If it helps you notice yourself a little more honestly, it worked.*
