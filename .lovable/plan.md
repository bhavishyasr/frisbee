## Rename: Yours → FRISBEE

FRISBEE = Functional Realtime Intelligence for Spotting Blissful Everyday Actions.

### 1. User-visible strings (titles, meta, headings)
- `src/routes/__root.tsx` — title, author, og:title → "FRISBEE — your local personal intelligence"
- `src/routes/index.tsx` — title "Today — FRISBEE", sr-only h1
- `src/routes/week.tsx` — title "Week — FRISBEE", sr-only h1
- `src/routes/mirror.tsx` — title "Mirror — FRISBEE", sr-only h1, the visible `YOURS` chip badge → `FRISBEE`
- `src/routes/lab.tsx` — title "Lab — FRISBEE", sr-only h1
- `src/routes/me.tsx` — title "Me — FRISBEE", sr-only h1, export filename `frisbee-vault-YYYY-MM-DD.json`

### 2. Package / project metadata
- `package.json` → `"name": "frisbee"`
- `README.md` — already says FRISBEE at top; sweep any stray "Yours" wording and update the `src/lib/yours/` path reference in the "Where things live" section to `src/lib/frisbee/`

### 3. Folder + import rename (internal)
Rename `src/lib/yours/` → `src/lib/frisbee/` and update every `@/lib/yours/...` import across:
- `src/routes/{index,week,mirror,lab,me}.tsx`
- `src/lib/buddy/brain.ts`
- `src/lib/yours/__tests__/parity.test.ts` (relative imports stay)

Internal comments referencing "Yours" in `vocab.json`, `vault.ts`, `styles.css` updated to "FRISBEE".

### 4. IndexedDB name
`vault.ts` `DB_NAME = "yours-vault"` → `"frisbee-vault"`.

⚠️ This wipes any existing local data on first load after the change (acceptable — no users in production yet; if you'd rather preserve it, say so and I'll keep the old DB name).

### 5. Verify
- `rg -i "yours"` across `src/` returns zero hits (except possibly the word "yourself" in voice lexicon, which stays).
- Run `bun run build` — typecheck must pass (catches any missed import path).
- Run `bunx vitest run` — parity tests still green.
- Load `/` in the preview — title bar reads "Today — FRISBEE", mascot still reacts on first message.

### Open question
Confirm the IndexedDB rename (wipes local vault) — or keep `yours-vault` to preserve any existing data.
