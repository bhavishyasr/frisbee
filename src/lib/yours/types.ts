export type Cluster = "drift" | "align" | "excuse" | "energy";
export const CLUSTERS: Cluster[] = ["drift", "align", "excuse", "energy"];

export type FeatureVector = [number, number, number, number]; // x ∈ ℝ⁴

export interface MessageRow {
  id?: number;
  ts: number; // ms epoch
  text: string;
  x: FeatureVector;
  p: number; // model prediction at submit time (no truth yet)
  weekStart: number; // ms epoch, monday 00:00 local
}

export interface WeekRow {
  weekStart: number; // primary key
  selfPrediction: 0 | 1; // committed BEFORE model reveal
  selfPredictionTs: number;
  modelPrediction: number; // p averaged over week's messages, locked at commit
  modelRounded: 0 | 1;
  truth?: 0 | 1; // optional, end-of-week label
  revealed: boolean;
}

export interface ModelState {
  w: [number, number, number, number];
  b: number;
  updates: number; // count of gradient steps
  updatedAt: number;
}

export interface VocabAddition {
  word: string;
  cluster: Cluster;
  addedAt: number;
}

export interface Hypothesis {
  id: string;
  word: string;
  direction: "align" | "drift"; // shows up more on y=1 or y=0
  n: number; // n_H
  k: number; // k_H
  createdAt: number;
}
