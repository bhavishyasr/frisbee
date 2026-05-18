# Changelog

## v1.0.0 — Audit-Ready Build (2026-05-18)

First shippable cut of FRISBEE. Engine math is locked, UI is alive, everything runs local.

### Engine
- 4-cluster TF-IDF (`drift / align / excuse / energy`) → logistic regression (`η=0.1`, `λ=0.01` on `w` only).
- Apostrophe-preserving tokenizer (`didn't`, `let's` are signal).
- Blended IDF (personal + background, `bg_df` default = 1) — byte-identical to Python `collect.py`.
- Multi-cluster word membership + within-cluster dedupe.
- 13/13 parity tests green.

### Rooms
- **`/`** — Today: drop a message, live cluster bars, confidence pill, recent strip with cluster-colored dots, sparkle burst on FEED IT.
- **`/week`** — Self-prediction committed before model reveal; one gradient step per message on truth.
- **`/mirror`** — Scientist surfaces word-delta hypotheses about you.
- **`/lab`** — 7-step visual walkthrough of the math (colored tokens → score bars → weight lens → vote stacking → sigmoid → loss → learning rule). Built for a high-schooler.
- **`/me`** — Export everything as JSON. Wipe everything. Local-only.

### Personality
- Mascot brain (mood, thoughts, long-press reactions).
- FX layer: Web Audio bleeps, chord stings, haptics, 🔊/🔇 mute toggle.
- Event bus wires interactions across rooms (`message:dropped`, `mascot:tapped`, `duel:reveal`, `nav:visited`, `hypothesis:confident`, `vault:wiped`).

### Plumbing
- TanStack Start v1, Vite 7, React 19, Tailwind v4.
- IndexedDB vault (`frisbee-vault`) via `idb` — nothing leaves the device.
- Responsive across 320 / 375 / 1366.
- Zero env vars, zero external ML deps.

### Docs
- README rewritten: academic where it counts, real where it matters, `alternatively`-bash block preserved.

— Over and out. 🥏
