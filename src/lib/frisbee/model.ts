// Logistic regression: 7 params (w ∈ ℝ⁴, b ∈ ℝ).
// Numerical stability: clip z to [-500, 500], p to [1e-7, 1-1e-7].
// L2 regularization on w only — NEVER on b (bias = personal base rate = signal).

import type { FeatureVector, ModelState } from "./types";

export const ETA = 0.1; // learning rate
export const LAMBDA = 0.01; // L2 strength (fixed; cross-validation impossible w/ ~4-8 labels)

const Z_CLIP = 500;
const P_EPS = 1e-7;

export function freshModel(): ModelState {
  return {
    w: [0, 0, 0, 0],
    b: 0,
    updates: 0,
    updatedAt: Date.now(),
  };
}

export function sigmoid(z: number): number {
  const zc = Math.max(-Z_CLIP, Math.min(Z_CLIP, z));
  return 1 / (1 + Math.exp(-zc));
}

export function predict(model: ModelState, x: FeatureVector): number {
  let z = model.b;
  for (let i = 0; i < 4; i++) z += model.w[i] * x[i];
  return sigmoid(z);
}

export function bce(p: number, y: 0 | 1): number {
  const pc = Math.max(P_EPS, Math.min(1 - P_EPS, p));
  return -(y * Math.log(pc) + (1 - y) * Math.log(1 - pc));
}

// One gradient step. y is the truth label.
export function step(model: ModelState, x: FeatureVector, y: 0 | 1): ModelState {
  const p = predict(model, x);
  const err = p - y;
  const w: [number, number, number, number] = [
    model.w[0] - ETA * err * x[0] - ETA * LAMBDA * model.w[0],
    model.w[1] - ETA * err * x[1] - ETA * LAMBDA * model.w[1],
    model.w[2] - ETA * err * x[2] - ETA * LAMBDA * model.w[2],
    model.w[3] - ETA * err * x[3] - ETA * LAMBDA * model.w[3],
  ];
  const b = model.b - ETA * err; // NO L2 on bias
  return { w, b, updates: model.updates + 1, updatedAt: Date.now() };
}
