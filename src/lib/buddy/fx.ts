// Tiny FX layer — Web Audio bleeps + haptics. Zero assets, zero deps.
// Subscribes to the bus. Silent until first user gesture (browser autoplay rules).

import { on } from "./bus";

let ctx: AudioContext | null = null;
let muted = false;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function unlock() {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
}

export function setMuted(v: boolean) { muted = v; }
export function isMuted() { return muted; }

function blip(freq: number, durMs = 90, type: OscillatorType = "square", gain = 0.06) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g).connect(c.destination);
  const now = c.currentTime;
  g.gain.linearRampToValueAtTime(gain, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
  osc.start(now);
  osc.stop(now + durMs / 1000 + 0.02);
}

function chord(freqs: number[], stagger = 40, type: OscillatorType = "triangle") {
  freqs.forEach((f, i) => setTimeout(() => blip(f, 160, type, 0.05), i * stagger));
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(pattern); } catch { /* noop */ }
  }
}

let wired = false;
export function wireFx(): () => void {
  if (wired || typeof window === "undefined") return () => undefined;
  wired = true;

  const onGesture = () => unlock();
  window.addEventListener("pointerdown", onGesture, { once: false });
  window.addEventListener("keydown", onGesture, { once: false });

  const offs: Array<() => void> = [];

  offs.push(on("message:dropped", () => {
    chord([520, 660, 880], 55, "triangle");
    vibrate(12);
  }));
  offs.push(on("mascot:tapped", () => { blip(720, 70, "square", 0.05); vibrate(8); }));
  offs.push(on("mascot:long-pressed", () => { chord([440, 660], 70, "sine"); vibrate([10, 40, 20]); }));
  offs.push(on("duel:user-predicted", () => { blip(420, 80, "square", 0.05); vibrate(10); }));
  offs.push(on("duel:reveal", (e) => {
    if (e.type !== "duel:reveal") return;
    if (e.userCorrect && !e.modelCorrect) chord([660, 880, 1100, 1320], 70, "triangle");
    else if (!e.userCorrect && e.modelCorrect) chord([520, 415, 330], 80, "sawtooth");
    else if (e.userCorrect && e.modelCorrect) chord([660, 880], 60, "triangle");
    else blip(220, 200, "sine", 0.06);
    vibrate([20, 30, 20]);
  }));
  offs.push(on("hypothesis:confident", () => { chord([880, 1175, 1568], 60, "sine"); }));
  offs.push(on("nav:visited", () => { blip(880, 40, "square", 0.035); }));
  offs.push(on("vault:wiped", () => { chord([330, 247, 196], 90, "sawtooth"); vibrate([30, 40, 30]); }));

  return () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
    for (const off of offs) off();
    wired = false;
  };
}
