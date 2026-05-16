// Vitest parity check — features.ts must produce the same x ∈ ℝ⁴ shape and
// numerical regime as collect.py. We can't ship the Python binary in the test
// runner, so we hard-code expected ordinal properties: dominant cluster,
// non-zero positions, monotonicity. If math drifts, these fail loud.

import { describe, it, expect } from "vitest";
import { extractFeatures, idfBg, BG_N } from "../features";
import { tokenize } from "../tokenize";

describe("tokenize", () => {
  it("keeps apostrophes inside words", () => {
    expect(tokenize("I didn't even try, let's go")).toEqual(["i", "didn't", "even", "try", "let's", "go"]);
  });
  it("lowercases and strips surrounding punctuation", () => {
    expect(tokenize("Wow!! Really?? Okay...")).toEqual(["wow", "really", "okay"]);
  });
  it("handles smart quotes", () => {
    expect(tokenize("can\u2019t won\u2019t didn\u2019t")).toEqual(["can't", "won't", "didn't"]);
  });
  it("returns [] on empty", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("idfBg", () => {
  it("missing words default to df=1 (not 0)", () => {
    const a = idfBg("nonexistentwordxyz");
    const expected = Math.log((BG_N + 1) / (1 + 1)) + 1;
    expect(a).toBeCloseTo(expected, 6);
  });
  it("common words have lower IDF than rare words", () => {
    expect(idfBg("the")).toBeLessThan(idfBg("kachow"));
  });
});

describe("extractFeatures", () => {
  it("empty text → [0,0,0,0]", () => {
    expect(extractFeatures("")).toEqual([0, 0, 0, 0]);
  });

  it("drift-heavy message dominates the drift dimension", () => {
    const x = extractFeatures("I procrastinated all day, scrolled tiktok, didn't do anything");
    const [drift, align, excuse, energy] = x;
    expect(drift).toBeGreaterThan(align);
    expect(drift).toBeGreaterThan(energy);
    expect(drift).toBeGreaterThan(0);
    void excuse;
  });

  it("align-heavy message dominates the align dimension", () => {
    const x = extractFeatures("focused, finished the homework, shipped it, kachow");
    const [drift, align, excuse, energy] = x;
    expect(align).toBeGreaterThan(drift);
    expect(align).toBeGreaterThan(excuse);
    expect(align).toBeGreaterThan(0);
    void energy;
  });

  it("energy-heavy message dominates the energy dimension", () => {
    const x = extractFeatures("let's go, totally pumped, definitely amazing vibes");
    const [drift, align, excuse, energy] = x;
    expect(energy).toBeGreaterThan(drift);
    expect(energy).toBeGreaterThan(excuse);
    void align;
  });

  it("multi-cluster word ('locked') contributes to both align AND energy", () => {
    const x = extractFeatures("locked");
    const [, align, , energy] = x;
    expect(align).toBeGreaterThan(0);
    expect(energy).toBeGreaterThan(0);
    expect(align).toBeCloseTo(energy, 6);
  });

  it("contractions in vocab are matched after tokenization", () => {
    const x = extractFeatures("I didn't, I couldn't, I wouldn't");
    const [drift, , excuse] = x;
    expect(drift).toBeGreaterThan(0);
    expect(excuse).toBeGreaterThan(0);
  });

  it("personal vocab additions take effect", () => {
    const base = extractFeatures("zugzwang");
    expect(base).toEqual([0, 0, 0, 0]);
    const withExtra = extractFeatures("zugzwang", undefined, { drift: ["zugzwang"] });
    expect(withExtra[0]).toBeGreaterThan(0);
  });
});
