import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeviceShell } from "@/components/DeviceShell";
import { DeviceNav } from "@/components/DeviceNav";
import { Mascot } from "@/components/Mascot";
import {
  allHypotheses,
  allMessages,
  allVocab,
  allWeeks,
  exportAll,
  putHypothesis,
  deleteHypothesis,
  wipeAll,
  addVocab,
} from "@/lib/frisbee/vault";
import { confidence, wordDeltas } from "@/lib/frisbee/scientist";
import type { Hypothesis, MessageRow, VocabAddition, WeekRow } from "@/lib/frisbee/types";
import { emit } from "@/lib/buddy/bus";
import { useMemo } from "react";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Me — FRISBEE" },
      { name: "description", content: "Vocabulary evolution, hypothesis confidence, export and wipe." },
    ],
  }),
  component: MePage,
});

function MePage() {
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [vocab, setVocab] = useState<VocabAddition[]>([]);
  const [hyps, setHyps] = useState<Hypothesis[]>([]);
  const [candidates, setCandidates] = useState<{ word: string; delta: number }[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [m, w, v, h] = await Promise.all([allMessages(), allWeeks(), allVocab(), allHypotheses()]);
    setMsgs(m);
    setWeeks(w);
    setVocab(v);
    setHyps(h);
    const c = wordDeltas(m, w, 6).map((c) => ({ word: c.word, delta: c.delta }));
    setCandidates(c);
  }

  async function onExport() {
    const json = await exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frisbee-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onWipe() {
    if (!confirm("wipe ALL local data? can't undo.")) return;
    await wipeAll();
    emit({ type: "vault:wiped" });
    await load();
  }

  const score = useMemo(() => {
    let you = 0, buddy = 0, both = 0, neither = 0;
    for (const w of weeks) {
      if (w.truth === undefined) continue;
      const yr = w.selfPrediction === w.truth;
      const mr = w.modelRounded === w.truth;
      if (yr && mr) both++;
      else if (yr) you++;
      else if (mr) buddy++;
      else neither++;
    }
    return { you, buddy, both, neither };
  }, [weeks]);

  async function acceptCandidate(word: string, direction: "align" | "drift") {
    await addVocab({ word, cluster: direction, addedAt: Date.now() });
    const h: Hypothesis = {
      id: `${word}-${Date.now()}`,
      word,
      direction,
      n: 1,
      k: 1,
      createdAt: Date.now(),
    };
    await putHypothesis(h);
    await load();
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <h1 className="sr-only">FRISBEE — Me</h1>
      <DeviceShell label="BIP-01 // ME" status="VAULT">
        <div className="flex items-center gap-4 mb-5">
          <Mascot size={72} />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70">your vault</p>
            <p className="font-display text-lg font-bold text-screen-ink">
              {msgs.length} messages · {weeks.filter((w) => w.truth !== undefined).length} labeled weeks
            </p>
          </div>
        </div>

        <div className="bg-screen-ink/5 rounded-xl p-4 mb-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-2">the running tally</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <ScoreCell label="you" n={score.you} accent />
            <ScoreCell label="buddy" n={score.buddy} />
            <ScoreCell label="both" n={score.both} />
            <ScoreCell label="neither" n={score.neither} />
          </div>
          {score.you === 0 && score.buddy === 0 && score.both === 0 && score.neither === 0 && (
            <p className="font-mono text-xs text-screen-ink/60 mt-3 text-center">no duels yet. settle one on /week.</p>
          )}
        </div>

        <Section title="Vocabulary candidates">
          {candidates.length === 0 ? (
            <p className="font-mono text-xs text-screen-ink/60">Need at least one y=0 and one y=1 week before patterns emerge.</p>
          ) : (
            <ul className="space-y-2">
              {candidates.map((c) => (
                <li key={c.word} className="flex items-center justify-between bg-screen-ink/5 rounded-lg p-3">
                  <div>
                    <span className="font-mono font-bold text-screen-ink">"{c.word}"</span>
                    <span className="ml-2 font-mono text-[10px] text-screen-ink/60">
                      Δ = {c.delta > 0 ? "+" : ""}{c.delta.toFixed(3)} → mostly on {c.delta > 0 ? "good" : "off"} weeks
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void acceptCandidate(c.word, c.delta > 0 ? "align" : "drift")}
                      className="press-key bg-action text-screen-ink rounded-md px-3 py-1.5 font-mono text-xs font-bold shadow-[0_3px_0_var(--color-action-shadow)]"
                    >
                      yes, that's me
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Personal vocab (${vocab.length})`}>
          {vocab.length === 0 ? (
            <p className="font-mono text-xs text-screen-ink/60">Empty. Accept candidates above to grow your private vocabulary.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {vocab.map((v, i) => (
                <span
                  key={i}
                  className={`font-mono text-xs px-2 py-1 rounded ${v.cluster === "align" ? "bg-emerald-200" : "bg-rose-200"} text-screen-ink`}
                >
                  {v.word} · {v.cluster}
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title={`Hypotheses (${hyps.length})`}>
          {hyps.length === 0 ? (
            <p className="font-mono text-xs text-screen-ink/60">No hypotheses yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {hyps.map((h) => (
                <li key={h.id} className="flex items-center justify-between font-mono text-xs">
                  <span>"{h.word}" → {h.direction}</span>
                  <span className="text-screen-ink/60">
                    {h.k}/{h.n} ({(confidence(h) * 100).toFixed(0)}%)
                  </span>
                  <button
                    onClick={async () => { await deleteHypothesis(h.id); await load(); }}
                    className="text-rose-700 underline"
                  >
                    drop
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => void onExport()} className="press-key bg-white text-screen-ink rounded-xl py-3 font-display font-bold tracking-wider shadow-[0_5px_0_var(--color-device-shadow)]">
            EXPORT JSON
          </button>
          <button onClick={() => void onWipe()} className="press-key bg-rose-300 text-screen-ink rounded-xl py-3 font-display font-bold tracking-wider shadow-[0_5px_0_oklch(0.5_0.18_25)]">
            WIPE VAULT
          </button>
        </div>
      </DeviceShell>

      <DeviceNav />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-2">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function ScoreCell({ label, n, accent }: { label: string; n: number; accent?: boolean }) {
  return (
    <div className={accent ? "bg-action/40 rounded-lg py-2" : "bg-white/40 rounded-lg py-2"}>
      <p className="font-display text-2xl font-black text-screen-ink leading-none">{n}</p>
      <p className="font-mono text-[9px] uppercase tracking-widest text-screen-ink/70 mt-1">{label}</p>
    </div>
  );
}
