// Cluster-weighted TF-IDF feature extractor.
// Produces x ∈ ℝ⁴ in cluster order: [drift, align, excuse, energy].
//
// Math (verbatim from spec):
//   TF(w)   = count(w) / total_words
//   IDF(w)  = log( (N_bg + N_p + 1) / (df_bg(w) + df_p(w) + 1) )
//   score_c = (1 / |cluster_c|) * Σ TF(w) * IDF(w)   for w ∈ msg ∩ cluster_c
//
// Empty message → [0,0,0,0] (honest base rate).
// Empty cluster → 0 (theoretical only; clusters are non-empty in vocab.json).

import vocab from "./vocab.json";
import bgCorpus from "./bgCorpus.json";
import { tokenize } from "./tokenize";
import { CLUSTERS, type Cluster, type FeatureVector } from "./types";

export interface PersonalCorpus {
  N: number; // personal doc count
  df: Record<string, number>; // personal document frequency
}

export const EMPTY_PERSONAL: PersonalCorpus = { N: 0, df: {} };

const BG_N = bgCorpus.N;
const BG_DF = bgCorpus.df as Record<string, number>;

// Build cluster lookup: word -> cluster
type ClusterMap = Map<string, Cluster>;
const CLUSTER_LOOKUP: ClusterMap = (() => {
  const m = new Map<string, Cluster>();
  for (const c of CLUSTERS) {
    for (const w of (vocab.clusters as Record<Cluster, string[]>)[c]) {
      m.set(w.toLowerCase(), c);
    }
  }
  return m;
})();

const CLUSTER_SIZES: Record<Cluster, number> = (() => {
  const out = {} as Record<Cluster, number>;
  for (const c of CLUSTERS) {
    out[c] = (vocab.clusters as Record<Cluster, string[]>)[c].length;
  }
  return out;
})();

export function idf(word: string, personal: PersonalCorpus): number {
  const dfBg = BG_DF[word] ?? 0;
  const dfP = personal.df[word] ?? 0;
  return Math.log((BG_N + personal.N + 1) / (dfBg + dfP + 1));
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

  // Resolve cluster per token, including any personal additions
  const lookup = new Map(CLUSTER_LOOKUP);
  for (const c of CLUSTERS) {
    for (const w of extraClusterWords[c] ?? []) lookup.set(w.toLowerCase(), c);
  }

  const scores: Record<Cluster, number> = { drift: 0, align: 0, excuse: 0, energy: 0 };
  const sizes = { ...CLUSTER_SIZES };
  for (const c of CLUSTERS) {
    sizes[c] += (extraClusterWords[c]?.length ?? 0);
  }

  for (const [word, n] of counts) {
    const cluster = lookup.get(word);
    if (!cluster) continue;
    const tf = n / total;
    const w = tf * idf(word, personal);
    scores[cluster] += w;
  }

  return CLUSTERS.map((c) => (sizes[c] > 0 ? scores[c] / sizes[c] : 0)) as FeatureVector;
}
