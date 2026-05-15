// The mascot brain. A tiny state machine.
// Subscribes to the bus, sets mood + thought, decays back to idle.
// Zustand-backed so any component can read current state with a hook.

import { create } from "zustand";
import { on, type BuddyEvent } from "./bus";
import { VOICE, pick, timeOfDayGreeting } from "./voice";
import type { Cluster } from "@/lib/yours/types";

export type Mood = "neutral" | "proud" | "sheepish" | "kachow" | "thinking" | "smug" | "sleepy" | "curious";

interface BuddyState {
  mood: Mood;
  thought: string;
  thoughtVisible: boolean;
  score: { you: number; buddy: number; both: number; neither: number };
  bumpScore: (k: keyof BuddyState["score"]) => void;
  say: (text: string, mood?: Mood, ttlMs?: number) => void;
  setMood: (m: Mood, ttlMs?: number) => void;
}

let decayTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useBuddy = create<BuddyState>((set) => ({
  mood: "neutral",
  thought: "",
  thoughtVisible: false,
  score: { you: 0, buddy: 0, both: 0, neither: 0 },
  bumpScore: (k) => set((s) => ({ score: { ...s.score, [k]: s.score[k] + 1 } })),
  setMood: (m, ttlMs = 4000) => {
    set({ mood: m });
    if (decayTimer) clearTimeout(decayTimer);
    decayTimer = setTimeout(() => set({ mood: "neutral" }), ttlMs);
  },
  say: (text, mood, ttlMs = 4500) => {
    set({ thought: text, thoughtVisible: true });
    if (mood) {
      set({ mood });
      if (decayTimer) clearTimeout(decayTimer);
      decayTimer = setTimeout(() => set({ mood: "neutral" }), ttlMs + 1500);
    }
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => set((s) => ({ ...s, thoughtVisible: false })), ttlMs);
  },
}));

// Pick the dominant cluster from a feature vector for cold-start reaction.
export function dominantCluster(x: [number, number, number, number]): Cluster | "neutral" {
  const order: Cluster[] = ["drift", "align", "excuse", "energy"];
  let max = 0;
  let pickIdx = -1;
  for (let i = 0; i < 4; i++) {
    if (x[i] > max) { max = x[i]; pickIdx = i; }
  }
  if (pickIdx === -1 || max < 1e-3) return "neutral";
  return order[pickIdx];
}

// Wire the brain to the bus. Idempotent (returns disposer).
let wired = false;
export function wireBuddy(): () => void {
  if (wired) return () => undefined;
  wired = true;
  const offs: Array<() => void> = [];

  offs.push(on("boot", () => {
    useBuddy.getState().say(timeOfDayGreeting(), "curious", 3500);
  }));

  offs.push(on("mascot:long-pressed", () => {
    useBuddy.getState().say(pick(VOICE.long_press), "curious", 2500);
  }));

  offs.push(on("mascot:tapped", () => {
    useBuddy.getState().setMood("curious", 1200);
  }));

  offs.push(on("vault:wiped", () => {
    useBuddy.getState().say(pick(VOICE.vault_wiped), "sheepish", 4000);
  }));

  offs.push(on("hypothesis:confident", (e) => {
    if (e.type !== "hypothesis:confident") return;
    const tmpl = pick(VOICE.hypothesis);
    useBuddy.getState().say(tmpl.replace("{w}", e.word), "smug", 6000);
  }));

  offs.push(on("duel:user-predicted", (e) => {
    if (e.type !== "duel:user-predicted") return;
    const line = e.pick === 1 ? pick(VOICE.duel.user_picks_yes) : pick(VOICE.duel.user_picks_no);
    useBuddy.getState().say(line, "thinking", 2500);
  }));

  offs.push(on("duel:reveal", (e) => {
    if (e.type !== "duel:reveal") return;
    let mood: Mood = "neutral";
    let line = "";
    let scoreBucket: keyof BuddyState["score"] = "neither";
    if (e.userCorrect && e.modelCorrect) { mood = "proud"; line = pick(VOICE.duel.both_right); scoreBucket = "both"; }
    else if (e.userCorrect && !e.modelCorrect) { mood = "sheepish"; line = pick(VOICE.duel.user_wins); scoreBucket = "you"; }
    else if (!e.userCorrect && e.modelCorrect) { mood = "smug"; line = pick(VOICE.duel.model_wins); scoreBucket = "buddy"; }
    else { mood = "curious"; line = pick(VOICE.duel.both_wrong); scoreBucket = "neither"; }
    useBuddy.getState().bumpScore(scoreBucket);
    useBuddy.getState().say(line, mood, 5500);
  }));

  return () => { for (const off of offs) off(); wired = false; };
}

// Helper for the cold-start moment.
export function reactToFirstMessage(x: [number, number, number, number]): void {
  const c = dominantCluster(x);
  const lines = c === "neutral" ? VOICE.first_ever_message.neutral : VOICE.first_ever_message[c];
  const line = pick(lines);
  const mood: Mood = c === "energy" || c === "align" ? "proud" : c === "drift" ? "thinking" : c === "excuse" ? "smug" : "curious";
  useBuddy.getState().say(line, mood, 6500);
}

// Helper for ongoing message reactions (non-first).
export function reactToMessage(x: [number, number, number, number]): void {
  const c = dominantCluster(x);
  const bucket = c === "neutral" ? VOICE.message_acknowledged.flat : VOICE.message_acknowledged[c];
  const mood: Mood = c === "energy" ? "kachow" : c === "align" ? "proud" : c === "drift" ? "sheepish" : c === "excuse" ? "thinking" : "neutral";
  useBuddy.getState().say(pick(bucket), mood, 4000);
}
