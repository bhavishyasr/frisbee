## Two layers, very different jobs

**Layer 1: the math is steel.** Boring, deterministic, byte-for-byte aligned to `collect.py`. Pure functions, no side effects, no surprises. This is the truth-teller.

**Layer 2: the system around it is alive.** Event bus, named moments, a mascot brain that subscribes to the math, copy that reads like a friend. Whimsy lives here. Math never knows it exists.

Clean seam between them = we can swap the shell without breaking the brain, and tune the brain without lying about the numbers.

---

## Steel math (alignment pass)

Single PR-sized pass through `src/lib/yours/`:

- **`tokenize.ts`** — keep apostrophes inside words (`didn't`, `let's` stay one token). Strip surrounding punctuation only. Lowercase. Match `collect.py` regex exactly.
- **`features.ts`** —
  - `BG_N = 500`, `bg_df` read from `vocab.bg_df`, **missing word → df = 1** (not 0). This was the silent bug.
  - IDF formula: `log((N+1)/(df+1)) + 1`, blended `idf_blend = (n_personal * idf_personal + BG_N * idf_bg) / (n_personal + BG_N)`.
  - Cluster lookup: top-level keys (`drift|align|excuse|energy`), skip `_comment`, dedupe within cluster, allow multi-cluster membership.
  - Output `x ∈ ℝ⁴` identical to Python for the same input. We'll add a parity test.
- **`model.ts`** — unchanged math, just confirm `η=0.1, λ=0.01`, z-clip `[-500,500]`, p-clip `[1e-7, 1-1e-7]`.
- **Parity test** — 6-8 hand-picked sentences with expected `x` from running `collect.py`. Vitest. Fails loud if the web port drifts from the Python truth.

Delete `bgCorpus.json`. Replace `vocab.json` with the new file you sent.

---

## Whimsical systems architecture

The fun part. Three subsystems, all decoupled from math.

### 1. Event bus — the nervous system
Tiny pub/sub (`src/lib/buddy/bus.ts`, ~30 lines, no dep). Every meaningful thing emits a named event:

```text
message:dropped         week:committed       model:beaten-by-user
mascot:long-pressed     vault:wiped          hypothesis:confident
duel:user-predicted     duel:reveal          first-ever-message
```

Mascot, sounds, copy, haptics all *subscribe*. None of them poll, none of them know about each other. Adding a new reaction = one subscriber file.

### 2. Mascot brain — the character
`src/lib/buddy/brain.ts`. A tiny state machine: `mood`, `energy`, `last_seen`, `current_thought`. Reacts to bus events, picks a line from a voice lexicon, sets a mood for N seconds, decays back to idle. Deterministic given event + RNG seed (so we can test it).

Lines live in `voice.ts` — categorized, not random soup. Friend-tone, dry, never therapy-speak.

### 3. The duel — the game loop
The math becomes a **bet**. On `/week`:
1. You predict your own week (yes/no). Locked in, no take-backs.
2. Mascot bets too — shows confidence as a stack of chips, not a percentage bar.
3. Reveal: 800ms beat of silence, then verdict. Mascot reacts based on who won.
4. Score stored locally: `you_correct / model_correct / both / neither`. That's the only number on `/me`. No streak, no XP — just "you 7, buddy 4." Smack talk in the speech bubble.

Cold start fix: **first message ever** triggers a hardcoded character response (mascot reads it, picks the loudest cluster word, says something about it). No "need more data." The bus event `first-ever-message` has its own subscriber that handles this.

---

## Cool stuff that earns its place

Strict rule: each lib must do something we genuinely can't fake well in 50 lines. Otherwise it's bloat.

- **motion** (Framer Motion) — for the duel reveal beat, mascot mood transitions, chip-stack physics. Worth it. Already lightweight.
- **use-sound** + 3 tiny WAVs — tick (press), chirp (commit), kachow (model upset). One toggle on `/me`, off by default. ~5KB total.
- **canvas-confetti** — fires once, only when you beat the model on a high-confidence prediction. Earned, not sprinkled.
- **zustand** — replace any prop-drilling for buddy state. The bus + a tiny store keeps subscribers clean.

Things we're **not** adding: charts, animation libraries beyond Motion, drag-n-drop, fancy editors, AI SDK (no LLM in the loop — the friend is the math + voice lexicon, that's the whole point).

---

## Build order (each step independently shippable)

1. **Steel pass** — tokenize/features/vocab alignment + parity test. Engine output verified vs Python.
2. **Bus + brain + voice lexicon** — wire mascot to events. No visual changes yet, but mascot reacts to clicks.
3. **Duel loop on `/week`** — predict-vs-model, chip stack, reveal beat, score storage.
4. **Cold-start moment** — first-ever-message subscriber + hardcoded character response.
5. **Polish pass** — Motion transitions, optional sound toggle, confetti on earned wins.

I'll do 1 and 2 in the first batch (they're the foundation), then 3, then 4–5 together.

---

## Files touched (rough)

```text
src/lib/yours/{tokenize,features,model}.ts   # steel pass
src/lib/yours/vocab.json                      # replace
src/lib/yours/__tests__/parity.test.ts        # new
src/lib/yours/bgCorpus.json                   # delete
src/lib/buddy/{bus,brain,voice,store}.ts      # new
src/components/Mascot.tsx                     # subscribe to brain
src/routes/week.tsx                           # duel loop
src/routes/index.tsx                          # cold-start hook
src/routes/me.tsx                             # score line, sound toggle
package.json                                  # + motion, use-sound, canvas-confetti, zustand, vitest
```

Say go and I start with the steel pass + bus/brain in one batch.