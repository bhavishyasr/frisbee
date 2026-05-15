import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeviceShell } from "@/components/DeviceShell";
import { DeviceNav } from "@/components/DeviceNav";
import { Mascot } from "@/components/Mascot";
import { weekStartOf, trainOnWeek } from "@/lib/yours/engine";
import { getWeek, messagesForWeek, putWeek } from "@/lib/yours/vault";
import type { MessageRow, WeekRow } from "@/lib/yours/types";

export const Route = createFileRoute("/week")({
  head: () => ({
    meta: [
      { title: "Week — Yours" },
      { name: "description", content: "Commit your truth before the model unmasks. The integrity gate." },
    ],
  }),
  component: WeekPage,
});

type Stage = "loading" | "self-predict" | "reveal" | "truth" | "done";

function WeekPage() {
  const ws = weekStartOf(Date.now());
  const [stage, setStage] = useState<Stage>("loading");
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [week, setWeek] = useState<WeekRow | null>(null);
  const [meanP, setMeanP] = useState(0);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const m = await messagesForWeek(ws);
    const w = await getWeek(ws);
    const avg = m.length > 0 ? m.reduce((s, x) => s + x.p, 0) / m.length : 0;
    setMsgs(m);
    setWeek(w ?? null);
    setMeanP(avg);
    if (!w) setStage("self-predict");
    else if (!w.revealed) setStage("self-predict"); // shouldn't normally hit
    else if (w.truth === undefined) setStage("truth");
    else setStage("done");
  }

  async function commitSelf(y: 0 | 1) {
    // CRITICAL: write self-prediction BEFORE we ever show p.
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
    setStage("reveal");
  }

  async function commitTruth(y: 0 | 1) {
    if (!week) return;
    const updated: WeekRow = { ...week, truth: y };
    await putWeek(updated);
    await trainOnWeek(updated);
    setWeek(updated);
    setStage("done");
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <h1 className="sr-only">Yours — Week</h1>
      <DeviceShell label="BIP-01 // WEEK" status="SYNCING">
        {stage === "loading" && <p className="font-mono text-screen-ink">loading...</p>}

        {msgs.length === 0 && stage !== "loading" && (
          <div className="text-center py-8">
            <Mascot mood="thinking" size={96} className="mx-auto mb-6" />
            <p className="font-mono text-screen-ink">No messages this week yet.</p>
            <Link to="/" className="mt-4 inline-block press-key bg-action text-screen-ink rounded-xl px-5 py-3 font-display font-black tracking-wider shadow-[0_5px_0_var(--color-action-shadow)]">
              GO WRITE ONE
            </Link>
          </div>
        )}

        {stage === "self-predict" && msgs.length > 0 && (
          <div>
            <div className="flex items-start gap-4 mb-6">
              <Mascot mood="thinking" size={84} />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70">Integrity gate</p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-screen-ink leading-tight mt-1">
                  Did this week feel like <em className="not-italic text-action-shadow">you</em>?
                </h2>
                <p className="mt-3 text-sm text-screen-ink/80">
                  Answer first. The model's guess stays sealed until you commit. {msgs.length} message{msgs.length === 1 ? "" : "s"} on file.
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
          </div>
        )}

        {stage === "reveal" && week && (
          <Reveal week={week} onContinue={() => setStage("truth")} />
        )}

        {stage === "truth" && week && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-2">
              Final truth (for training)
            </p>
            <h2 className="font-display text-xl font-bold text-screen-ink mb-4">
              Looking back at the whole week — was it actually a "you" week?
            </h2>
            <p className="text-sm text-screen-ink/70 mb-6">
              This is the label the model trains on. Be honest, even if you guessed wrong above.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => void commitTruth(1)} className="press-key bg-emerald-300 text-screen-ink rounded-xl py-4 font-display font-black tracking-wider shadow-[0_5px_0_oklch(0.45_0.12_145)]">
                YES, IT WAS
              </button>
              <button onClick={() => void commitTruth(0)} className="press-key bg-rose-300 text-screen-ink rounded-xl py-4 font-display font-black tracking-wider shadow-[0_5px_0_oklch(0.5_0.18_25)]">
                NO, IT WASN'T
              </button>
            </div>
          </div>
        )}

        {stage === "done" && week && (
          <DoneCard week={week} />
        )}
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
      <Mascot mood={agree ? "kachow" : "sheepish"} size={96} className="mx-auto mb-6" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-2">
        Unmasked
      </p>
      <div className="grid grid-cols-2 gap-4 my-6">
        <div className="bg-screen-ink/5 rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-screen-ink/60">YOU SAID</p>
          <p className="font-display text-2xl font-black text-screen-ink mt-2">{youSaid}</p>
        </div>
        <div className="bg-action/40 rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-action-shadow">MODEL SAID</p>
          <p className="font-display text-2xl font-black text-screen-ink mt-2">{modelSays}</p>
          <p className="text-[10px] font-mono text-screen-ink/60 mt-1">
            p = {(week.modelPrediction * 100).toFixed(0)}%
          </p>
        </div>
      </div>
      <p className="font-display text-lg text-screen-ink">
        {agree ? "you and the model are reading the same week." : "you and the model see this week differently."}
      </p>
      <button
        onClick={onContinue}
        className="mt-6 press-key bg-action text-screen-ink rounded-xl px-6 py-3 font-display font-black tracking-wider shadow-[0_5px_0_var(--color-action-shadow)]"
      >
        CONTINUE →
      </button>
    </div>
  );
}

function DoneCard({ week }: { week: WeekRow }) {
  const youRight = week.selfPrediction === week.truth;
  const modelRight = week.modelRounded === week.truth;
  return (
    <div className="text-center">
      <Mascot mood={modelRight ? "kachow" : "sheepish"} size={96} className="mx-auto mb-6" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-3">
        Week locked. Model trained.
      </p>
      <div className="grid grid-cols-3 gap-2 text-screen-ink">
        <Stat label="YOU" right={youRight} />
        <Stat label="MODEL" right={modelRight} />
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
