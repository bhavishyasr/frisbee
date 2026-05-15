## Yours — Web Port

A faithful browser port of the Python spec. Math runs in TypeScript, every byte stays in IndexedDB, no network calls except loading the static app.

The soul is unchanged: one daily message, one honest weekly y, one true thing surfaced. Lightning McQueen energy, Jony Ive ALIVE, 2010s skeuomorphism, gamification (you vs your model). KACHOW.

---

### What I'll build

**1. The Brain (pure TS, zero deps)** — `src/lib/yours/`
- `vocab.json` — 4 clusters (drift / align / excuse / energy), ~200 hand-curated teen-voice words. Curated, not scraped.
- `bgCorpus.json` — Brown-style top ~5000 word document-frequency table, shipped static (~50KB).
- `tokenize.ts` — lowercase, strip punctuation, split, no stopword removal (we want "actually", "literally", "bro").
- `features.ts` — TF, blended IDF `log((N_bg + N_p + 1)/(df_bg + df_p + 1))`, cluster-mean score → `x ∈ ℝ⁴`. Empty message → `[0,0,0,0]`.
- `model.ts` — `z = w·x + b` clipped to [-500, 500], `p = σ(z)`, BCE with `p` clipped to [1e-7, 1-1e-7], update `w ← w − η(p−y)x − ηλw`, `b ← b − η(p−y)`. **L2 on w only.** η=0.1, λ=0.01.
- `scientist.ts` — top-k TF-IDF mean delta between y=1 and y=0 days → hypothesis candidates. Bernoulli `k_H/n_H`. Surface ≥0.75 & n_H≥14, discard <0.25. Vocab evolution: weekly word-delta → "Does 'actually' mostly show up on good weeks for you?" one-tap yes/no.
- `vault.ts` — IndexedDB wrapper (via `idb`): stores raw messages, x vectors, weekly labels, self-predictions, vocab additions, hypothesis state, model weights. One file. Export/wipe buttons.

**2. The Surfaces (TanStack routes)**
- `/` — Today. The big input. One free-form box. Submit → instant response (first message included, cold start solved).
- `/week` — End-of-week ritual. Hard UI lock: self-prediction (did this feel like me? y/n) is captured BEFORE model's prediction is revealed. Both stored, then the reveal. This is the ISEF integrity gate.
- `/mirror` — The one true thing. Current insight surfaced by the Scientist. Screenshot-worthy card. Not a dashboard.
- `/lab` — Live math whiteboard. Five panels (feature vector, blended IDF, prediction, loss, weight update) wired to your real data. Tweakable. The teaching artifact.
- `/me` — Vocab evolution prompts, hypothesis confidence list, export/wipe vault.

**3. The Feel**
Before I touch components I'll generate 3 design directions inside the locked vibe (whimsical, alive, 2010s skeuomorphic-ish, friend-built, screenshot-worthy) and let you pick one. No cold corporate dashboards. No generic productivity slop. Personality baked in, not decorated on.

**4. ISEF integrity (non-negotiable in code)**
- Self-prediction is committed to IndexedDB before the model output is ever computed for display.
- MAE measured on rounded p (= 1 − accuracy).
- Honest limitation surfaced in `/lab`: class imbalance warning when all weeks are y=1 or y=0.

---

### Explicit non-goals (rejected list, locked)
No ActivityWatch, Screen Time, calendar sync, planned-vs-actual, VADER, miniLM/fastText, diary metaphor, population models, accounts, cloud, server, API keys. No "collecting data..." screen. No Lovable Cloud — this whole thing is browser-local.

### Honest tradeoff vs Python original
"Local" means *this browser profile on this device*. Clearing site data wipes the vault. Mitigation: an Export button writes a JSON file you can re-import. Not as durable as `~/yours.sqlite` on your laptop, but the math, the soul, and the ISEF claim survive intact.

---

### Build order
1. Generate 3 design directions → you pick one.
2. Brain (`src/lib/yours/*`) + unit tests for IDF, σ, weight update, scientist deltas. Math has to be checkable by hand — Feynman rule.
3. Vault (IndexedDB).
4. Today screen wired end-to-end (message → x → p → store).
5. Week screen with the hard UI lock.
6. Mirror + Scientist surfacing.
7. Lab whiteboard.
8. Me / vocab evolution / export.

I'll stop after step 1 (design pick) for your sign-off, then run 2→8 without circling.

KACHOW.