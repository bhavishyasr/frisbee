// The Scientist: surfaces hypotheses about which words show up disproportionately
// on y=1 vs y=0 weeks. Bernoulli confidence k_H/n_H.
//
// Surface  ≥ 0.75 confidence AND n_H ≥ 14
// Discard  < 0.25 confidence with sufficient n_H

import type { Hypothesis, MessageRow, WeekRow } from "./types";
import { tokenize } from "./tokenize";

export const SURFACE_CONF = 0.75;
export const SURFACE_N = 14;
export const DISCARD_CONF = 0.25;
export const DISCARD_N = 14;

export interface WordCandidate {
  word: string;
  meanY1: number; // mean tf on y=1 messages
  meanY0: number;
  delta: number; // meanY1 - meanY0
  count: number;
}

// Compare per-word tf between messages in weeks labeled y=1 vs y=0.
// Returns top-k candidates by absolute delta.
export function wordDeltas(
  messages: MessageRow[],
  weeks: WeekRow[],
  topK = 10,
): WordCandidate[] {
  const weekTruth = new Map<number, 0 | 1>();
  for (const w of weeks) {
    if (w.truth === 0 || w.truth === 1) weekTruth.set(w.weekStart, w.truth);
  }
  if (weekTruth.size === 0) return [];

  // sum tf per word per label, plus count of messages per label
  const sumY1 = new Map<string, number>();
  const sumY0 = new Map<string, number>();
  let nY1 = 0;
  let nY0 = 0;

  for (const m of messages) {
    const y = weekTruth.get(m.weekStart);
    if (y === undefined) continue;
    const tokens = tokenize(m.text);
    if (tokens.length === 0) continue;
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
    const total = tokens.length;
    const target = y === 1 ? sumY1 : sumY0;
    for (const [w, c] of counts) target.set(w, (target.get(w) ?? 0) + c / total);
    if (y === 1) nY1++; else nY0++;
  }
  if (nY1 === 0 || nY0 === 0) return [];

  const allWords = new Set<string>([...sumY1.keys(), ...sumY0.keys()]);
  const candidates: WordCandidate[] = [];
  for (const w of allWords) {
    const meanY1 = (sumY1.get(w) ?? 0) / nY1;
    const meanY0 = (sumY0.get(w) ?? 0) / nY0;
    const delta = meanY1 - meanY0;
    const count = (sumY1.get(w) ?? 0) + (sumY0.get(w) ?? 0);
    if (count < 0.05) continue; // ignore vanishingly rare
    candidates.push({ word: w, meanY1, meanY0, delta, count });
  }
  candidates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return candidates.slice(0, topK);
}

export function confidence(h: Hypothesis): number {
  return h.n === 0 ? 0 : h.k / h.n;
}

export function shouldSurface(h: Hypothesis): boolean {
  return h.n >= SURFACE_N && confidence(h) >= SURFACE_CONF;
}

export function shouldDiscard(h: Hypothesis): boolean {
  return h.n >= DISCARD_N && confidence(h) < DISCARD_CONF;
}
