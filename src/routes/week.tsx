import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { DeviceShell } from "@/components/DeviceShell";
import { DeviceNav } from "@/components/DeviceNav";
import { Mascot } from "@/components/Mascot";
import { weekStartOf, trainOnWeek } from "@/lib/yours/engine";
import { getWeek, messagesForWeek, putWeek } from "@/lib/yours/vault";
import type { MessageRow, WeekRow } from "@/lib/yours/types";
import { emit } from "@/lib/buddy/bus";
import { useBuddy } from "@/lib/buddy/brain";
import { VOICE, pick } from "@/lib/buddy/voice";

export const Route = createFileRoute("/week")({
  head: () => ({
    meta: [
      { title: "Week — Yours" },
      { name: "description", content: "You vs the buddy. Predict your week before the model unmasks." },
    ],
  }),
  component: WeekPage,
});

type Stage = "loading" | "self-predict" | "suspense" | "reveal" | "truth" | "done";

function WeekPage() {
  const ws = weekStartOf(Date.now());
  const [stage, setStage] = useState<Stage>("loading");
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [week, setWeek] = useState<WeekRow | null>(null);
  const [meanP, setMeanP] = useState(0);
  const say = useBuddy((s) => s.say);

  useEffect(() => { void load(); }, []);

  async function load() {
    const m = await messagesForWeek(ws);
    const w = await getWeek(ws);
    const avg = m.length > 0 ? m.reduce((s, x) => s + x.p, 0) / m.length : 0;
    setMsgs(m);
    setWeek(w ?? null);
    setMeanP(avg);
    if (!w) {
      setStage("self-predict");
      if (m.length > 0) say(pick(VOICE.duel.challenge), "smug", 3500);
    }
    else if (w.truth === undefined) setStage("truth");
    else setStage("done");
  }

  async function commitSelf(y: 0 | 1) {
    const w: WeekRow = {
      weekStart: ws,
      selfPrediction: y,
      selfPredictionTs: Date.now(),
      modelPrediction: meanP,
      modelRounded: meanP >= 0.5 ? 1 : 0,
      revealed: true,
    };
    await putWeek(w);
    setWeek(w);
    emit({ type: "duel:user-predicted", pick: y });
    setStage("suspense");
    setTimeout(() => setStage("reveal"), 1100);
  }

  async function commitTruth(y: 0 | 1) {
    if (!week) return;
    const updated: WeekRow = { ...week, truth: y };
    await putWeek(updated);
    await trainOnWeek(updated);
    setWeek(updated);
    const userCorrect = updated.selfPrediction === y;
    const modelCorrect = updated.modelRounded === y;
    emit({ type: "duel:reveal", truth: y, userCorrect, modelCorrect });
    if (userCorrect && !modelCorrect && Math.abs(updated.modelPrediction - 0.5) > 0.2) {
      // earned win — high-confidence model was wrong, you were right
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    }
    setStage("done");
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <h1 className="sr-only">Yours — Week</h1>
      <DeviceShell label="BIP-01 // DUEL" status={stage === "suspense" ? "REVEALING" : "SYNCING"}>
        {stage === "loading" && <p className="font-mono text-screen-ink">loading...</p>}

        {msgs.length === 0 && stage !== "loading" && (
          <div className="text-center py-8">
            <Mascot size={96} className="mx-auto mb-6" />
            <p className="font-mono text-screen-ink">no messages this week. nothing to bet on yet.</p>
            <Link to="/" className="mt-4 inline-block press-key bg-action text-screen-ink rounded-xl px-5 py-3 font-display font-black tracking-wider shadow-[0_5px_0_var(--color-action-shadow)]">
              go drop one
            </Link>
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage === "self-predict" && msgs.length > 0 && (
            <motion.div
              key="self-predict"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-start gap-4 mb-6">
                <Mascot size={84} />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70">you vs me</p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-screen-ink leading-tight mt-1">
                    was this week <em className="not-italic text-action-shadow">you</em>?
                  </h2>
                  <p className="mt-3 text-sm text-screen-ink/80">
                    answer first. I'll show my guess after. {msgs.length} message{msgs.length === 1 ? "" : "s"} on file. winner gets bragging rights.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
                <button
                  onClick={() => void commitSelf(1)}
                  className="press-key bg-emerald-300 text-screen-ink rounded-2xl py-6 font-display font-black text-2xl tracking-wider shadow-[0_5px_0_oklch(0.45_0.12_145)]"
                >
                  YES
                </button>
                <button
                  onClick={() => void commitSelf(0)}
                  className="press-key bg-rose-300 text-screen-ink rounded-2xl py-6 font-display font-black text-2xl tracking-wider shadow-[0_5px_0_oklch(0.5_0.18_25)]"
                >
                  NOT REALLY
                </button>
              </div>
            </motion.div>
          )}

          {stage === "suspense" && (
            <motion.div
              key="suspense"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Mascot mood="thinking" size={96} className="mx-auto mb-6" />
              <p className="font-mono text-screen-ink/70 tracking-widest">{pick(VOICE.duel.reveal_pause)}</p>
            </motion.div>
          )}

          {stage === "reveal" && week && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
              <Reveal week={week} onContinue={() => setStage("truth")} />
            </motion.div>
          )}

          {stage === "truth" && week && (
            <motion.div
              key="truth"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-2">
                final call (this is what I learn from)
              </p>
              <h2 className="font-display text-xl font-bold text-screen-ink mb-4">
                end of the week — was it actually a "you" week?
              </h2>
              <p className="text-sm text-screen-ink/70 mb-6">
                be honest, even if you guessed wrong above. this is the truth I train on.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => void commitTruth(1)} className="press-key bg-emerald-300 text-screen-ink rounded-xl py-4 font-display font-black tracking-wider shadow-[0_5px_0_oklch(0.45_0.12_145)]">
                  YES, IT WAS
                </button>
                <button onClick={() => void commitTruth(0)} className="press-key bg-rose-300 text-screen-ink rounded-xl py-4 font-display font-black tracking-wider shadow-[0_5px_0_oklch(0.5_0.18_25)]">
                  NO, IT WASN'T
                </button>
              </div>
            </motion.div>
          )}

          {stage === "done" && week && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DoneCard week={week} />
            </motion.div>
          )}
        </AnimatePresence>
      </DeviceShell>

      <DeviceNav />
    </main>
  );
}

function Reveal({ week, onContinue }: { week: WeekRow; onContinue: () => void }) {
  const youSaid = week.selfPrediction === 1 ? "YES" : "NOT REALLY";
  const modelSays = week.modelRounded === 1 ? "YES" : "NOT REALLY";
  const agree = week.selfPrediction === week.modelRounded;
  return (
    <div className="text-center">
      <Mascot size={96} className="mx-auto mb-6" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-2">
        unmasked
      </p>
      <div className="grid grid-cols-2 gap-4 my-6">
        <motion.div className="bg-screen-ink/5 rounded-xl p-4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-screen-ink/60">YOU SAID</p>
          <p className="font-display text-2xl font-black text-screen-ink mt-2">{youSaid}</p>
        </motion.div>
        <motion.div className="bg-action/40 rounded-xl p-4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-action-shadow">BUDDY SAID</p>
          <p className="font-display text-2xl font-black text-screen-ink mt-2">{modelSays}</p>
          <p className="text-[10px] font-mono text-screen-ink/60 mt-1">
            confidence: {(Math.max(week.modelPrediction, 1 - week.modelPrediction) * 100).toFixed(0)}%
          </p>
        </motion.div>
      </div>
      <p className="font-display text-lg text-screen-ink">
        {agree ? "we're on the same page. the truth decides." : "split. the truth decides who's right."}
      </p>
      <button
        onClick={onContinue}
        className="mt-6 press-key bg-action text-screen-ink rounded-xl px-6 py-3 font-display font-black tracking-wider shadow-[0_5px_0_var(--color-action-shadow)]"
      >
        DROP THE TRUTH →
      </button>
    </div>
  );
}

function DoneCard({ week }: { week: WeekRow }) {
  const youRight = week.selfPrediction === week.truth;
  const modelRight = week.modelRounded === week.truth;
  const headline =
    youRight && !modelRight ? "you took me." :
    !youRight && modelRight ? "I called it." :
    youRight && modelRight ? "we both nailed it." :
    "we both whiffed.";
  return (
    <div className="text-center">
      <Mascot size={96} className="mx-auto mb-6" />
      <p className="font-display text-2xl font-black text-screen-ink mb-2">{headline}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-4">
        week locked. I learned from it.
      </p>
      <div className="grid grid-cols-3 gap-2 text-screen-ink">
        <Stat label="YOU" right={youRight} />
        <Stat label="BUDDY" right={modelRight} />
        <Stat label="TRUTH" value={week.truth === 1 ? "YES" : "NO"} />
      </div>
      <Link to="/mirror" className="mt-6 inline-block press-key bg-action text-screen-ink rounded-xl px-6 py-3 font-display font-black tracking-wider shadow-[0_5px_0_var(--color-action-shadow)]">
        SEE THE MIRROR
      </Link>
    </div>
  );
}

function Stat({ label, right, value }: { label: string; right?: boolean; value?: string }) {
  return (
    <div className="bg-screen-ink/5 rounded-xl p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-screen-ink/60">{label}</p>
      <p className="font-display text-xl font-black mt-1">
        {value ?? (right ? "✓" : "✗")}
      </p>
    </div>
  );
}
