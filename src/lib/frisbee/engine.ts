// Orchestrator: glues features → model → vault. UI calls these.

import { extractFeatures, type PersonalCorpus } from "./features";
import { predict, step } from "./model";
import { tokenize } from "./tokenize";
import {
  addMessage,
  allMessages,
  getCorpus,
  getModel,
  putCorpus,
  putModel,
} from "./vault";
import type { FeatureVector, MessageRow, ModelState, WeekRow } from "./types";

// Monday 00:00 local for a given timestamp.
export function weekStartOf(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=sun .. 6=sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to monday
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

export interface SubmitResult {
  msg: MessageRow;
  x: FeatureVector;
  p: number;
  model: ModelState;
}

// Submit a daily message: tokenize → x → predict (no training, no truth yet).
// Update personal corpus with this document's word set.
export async function submitMessage(text: string): Promise<SubmitResult> {
  const [model, corpus] = await Promise.all([getModel(), getCorpus()]);
  const x = extractFeatures(text, corpus);
  const p = predict(model, x);
  const ts = Date.now();
  const row: MessageRow = {
    ts,
    text,
    x,
    p,
    weekStart: weekStartOf(ts),
  };
  const id = await addMessage(row);
  // Update personal df: each unique token in this doc increments df by 1
  const newCorpus: PersonalCorpus = {
    N: corpus.N + 1,
    df: { ...corpus.df },
  };
  const seen = new Set(tokenize(text));
  for (const w of seen) {
    newCorpus.df[w] = (newCorpus.df[w] ?? 0) + 1;
  }
  await putCorpus(newCorpus);
  return { msg: { ...row, id }, x, p, model };
}

// Train the model on a confirmed weekly truth. One step per message in that week.
export async function trainOnWeek(week: WeekRow): Promise<ModelState> {
  if (week.truth === undefined) throw new Error("Cannot train: no truth");
  const msgs = (await allMessages()).filter((m) => m.weekStart === week.weekStart);
  let model = await getModel();
  for (const m of msgs) {
    model = step(model, m.x, week.truth);
  }
  await putModel(model);
  return model;
}
