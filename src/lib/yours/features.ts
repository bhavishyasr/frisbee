// Cluster-weighted TF-IDF feature extractor.
// Produces x ∈ ℝ⁴ in cluster order: [drift, align, excuse, energy].
//
// Math (mirrors collect.py byte-for-byte):
//   TF(w)        = count(w) / total_words
//   IDF_p(w)     = log( (N_p + 1) / (df_p(w) + 1) ) + 1
//   IDF_bg(w)    = log( (N_bg + 1) / (df_bg(w) + 1) ) + 1   ; df_bg default = 1 (NOT 0)
//   IDF_blend(w) = (n_p * IDF_p + N_bg * IDF_bg) / (n_p + N_bg)
//   score_c      = Σ TF(w) * IDF_blend(w)   for w ∈ msg ∩ cluster_c
//
// Multi-cluster words (e.g. "locked" ∈ {align, energy}) contribute to every
// cluster they belong to. Within-cluster duplicates are deduped on load.

import vocab from "./vocab.json";
import { tokenize } from "./tokenize";
import { CLUSTERS, type Cluster, type FeatureVector } from "./types";

export interface PersonalCorpus {
  N: number; // personal doc count
  df: Record<string, number>; // personal document frequency
}

export const EMPTY_PERSONAL: PersonalCorpus = { N: 0, df: {} };

export const BG_N = 500;
const BG_DF = (vocab as Record<string, unknown>).bg_df as Record<string, number>;

// word -> Set<Cluster> (multi-cluster membership allowed)
const CLUSTER_LOOKUP: Map<string, Set<Cluster>> = (() => {
  const m = new Map<string, Set<Cluster>>();
  for (const c of CLUSTERS) {
    const words = (vocab as unknown as Record<Cluster, string[]>)[c];
    if (!Array.isArray(words)) continue;
    const seen = new Set<string>();
    for (const raw of words) {
      const w = raw.toLowerCase();
      if (seen.has(w)) continue; // dedupe within cluster
      seen.add(w);
      const set = m.get(w) ?? new Set<Cluster>();
      set.add(c);
      m.set(w, set);
    }
  }
  return m;
})();

export function idfPersonal(word: string, personal: PersonalCorpus): number {
  const df = personal.df[word] ?? 0;
  return Math.log((personal.N + 1) / (df + 1)) + 1;
}

export function idfBg(word: string): number {
  const df = BG_DF[word] ?? 1; // missing = 1, not 0 (matches collect.py)
  return Math.log((BG_N + 1) / (df + 1)) + 1;
}

export function idfBlend(word: string, personal: PersonalCorpus): number {
  const np = personal.N;
  const ip = idfPersonal(word, personal);
  const ib = idfBg(word);
  const denom = np + BG_N;
  if (denom === 0) return ib;
  return (np * ip + BG_N * ib) / denom;
}

export function extractFeatures(
  text: string,
  personal: PersonalCorpus = EMPTY_PERSONAL,
  extraClusterWords: Partial<Record<Cluster, string[]>> = {},
): FeatureVector {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [0, 0, 0, 0];

  const total = tokens.length;
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);

  // Layer personal additions on top of the base lookup
  const lookup = new Map(CLUSTER_LOOKUP);
  for (const c of CLUSTERS) {
    for (const raw of extraClusterWords[c] ?? []) {
      const w = raw.toLowerCase();
      const set = lookup.get(w) ?? new Set<Cluster>();
      set.add(c);
      lookup.set(w, set);
    }
  }

  const scores: Record<Cluster, number> = { drift: 0, align: 0, excuse: 0, energy: 0 };
  for (const [word, n] of counts) {
    const clusters = lookup.get(word);
    if (!clusters) continue;
    const tf = n / total;
    const w = tf * idfBlend(word, personal);
    for (const c of clusters) scores[c] += w;
  }

  return CLUSTERS.map((c) => scores[c]) as FeatureVector;
}
