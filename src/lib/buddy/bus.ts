// The nervous system. Tiny pub/sub. No dependencies.
// Every meaningful moment in the app fires an event here.
// Mascot, sounds, haptics, copy — they all subscribe. None of them know about each other.

export type BuddyEvent =
  | { type: "message:dropped"; text: string; isFirstEver: boolean }
  | { type: "message:cleared" }
  | { type: "week:committed"; userPredicted: 0 | 1; modelPredicted: number }
  | { type: "duel:user-predicted"; pick: 0 | 1 }
  | { type: "duel:reveal"; truth: 0 | 1; userCorrect: boolean; modelCorrect: boolean }
  | { type: "duel:user-beats-model"; modelConfidence: number }
  | { type: "duel:model-beats-user"; modelConfidence: number }
  | { type: "mascot:long-pressed" }
  | { type: "mascot:tapped" }
  | { type: "vault:wiped" }
  | { type: "hypothesis:confident"; word: string }
  | { type: "nav:visited"; route: string }
  | { type: "boot" };

export type BuddyEventType = BuddyEvent["type"];
type Handler = (e: BuddyEvent) => void;

const subs = new Map<BuddyEventType | "*", Set<Handler>>();

export function on(type: BuddyEventType | "*", fn: Handler): () => void {
  let set = subs.get(type);
  if (!set) {
    set = new Set();
    subs.set(type, set);
  }
  set.add(fn);
  return () => set!.delete(fn);
}

export function emit(event: BuddyEvent): void {
  const direct = subs.get(event.type);
  if (direct) for (const fn of direct) fn(event);
  const wild = subs.get("*");
  if (wild) for (const fn of wild) fn(event);
}
