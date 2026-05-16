import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeviceShell } from "@/components/DeviceShell";
import { DeviceNav } from "@/components/DeviceNav";
import { extractFeatures } from "@/lib/frisbee/features";
import { predict, sigmoid, bce, ETA, LAMBDA } from "@/lib/frisbee/model";
import { getCorpus, getModel, allMessages, allWeeks } from "@/lib/frisbee/vault";
import type { ModelState } from "@/lib/frisbee/types";
import type { PersonalCorpus } from "@/lib/frisbee/features";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Lab — Yours" },
      { name: "description", content: "The math, live. Five panels you can poke." },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  const [text, setText] = useState("bro I literally said I'd study and then just scrolled tiktok for 4 hours");
  const [model, setModel] = useState<ModelState | null>(null);
  const [corpus, setCorpus] = useState<PersonalCorpus>({ N: 0, df: {} });
  const [imbalance, setImbalance] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setModel(await getModel());
      setCorpus(await getCorpus());
      const weeks = (await allWeeks()).filter((w) => w.truth !== undefined);
      const msgs = await allMessages();
      void msgs;
      if (weeks.length >= 2) {
        const ones = weeks.filter((w) => w.truth === 1).length;
        const zeros = weeks.length - ones;
        if (ones === 0 || zeros === 0) {
          setImbalance(`Class imbalance: every labeled week is y=${ones === 0 ? 0 : 1}. Model can't learn what "off" looks like.`);
        }
      }
    })();
  }, []);

  if (!model) return <main className="min-h-screen p-8 font-mono">loading the lab...</main>;

  const x = extractFeatures(text, corpus);
  let z = model.b;
  for (let i = 0; i < 4; i++) z += model.w[i] * x[i];
  const p = sigmoid(z);
  const lossY1 = bce(p, 1);
  const lossY0 = bce(p, 0);

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <h1 className="sr-only">Yours — Lab</h1>
      <DeviceShell label="BIP-01 // LAB" status="WHITEBOARD">
        <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/70 mb-2">
          poke a sample message
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full bg-screen-ink/5 rounded-lg p-3 font-mono text-sm text-screen-ink resize-none border border-screen-ink/10 focus:outline-none focus:border-screen-ink/30"
        />

        {imbalance && (
          <div className="mt-4 rounded-lg bg-rose-300/40 border border-rose-400 p-3 font-mono text-xs text-screen-ink">
            ⚠ {imbalance}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Panel title="1 · Feature vector  x ∈ ℝ⁴" formula="score_c = (1/|c|) · Σ TF(w)·IDF(w)">
            <div className="grid grid-cols-4 gap-2 font-mono text-xs">
              {(["drift", "align", "excuse", "energy"] as const).map((c, i) => (
                <div key={c} className="bg-screen-ink/5 rounded p-2 text-center">
                  <div className="uppercase text-[9px] text-screen-ink/60">{c}</div>
                  <div className="font-bold text-base mt-1">{x[i].toFixed(4)}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="2 · Blended IDF" formula="log( (N_bg + N_p + 1) / (df_bg + df_p + 1) )">
            <div className="font-mono text-xs text-screen-ink/80">
              N_bg = 5000 · N_personal = {corpus.N} · personal vocabulary size = {Object.keys(corpus.df).length}
            </div>
          </Panel>

          <Panel title="3 · Prediction  p = σ(w·x + b)" formula={`b = ${model.b.toFixed(3)} · w = [${model.w.map((v) => v.toFixed(2)).join(", ")}]`}>
            <div className="font-mono text-xs">
              z = {z.toFixed(4)} → p ={" "}
              <span className="font-bold text-base text-screen-ink">{p.toFixed(4)}</span>{" "}
              ({(p * 100).toFixed(0)}%)
            </div>
          </Panel>

          <Panel title="4 · BCE loss" formula="L = -[y·log(p) + (1-y)·log(1-p)]">
            <div className="font-mono text-xs grid grid-cols-2 gap-2">
              <div>if y=1 → L = <span className="font-bold">{lossY1.toFixed(4)}</span></div>
              <div>if y=0 → L = <span className="font-bold">{lossY0.toFixed(4)}</span></div>
            </div>
          </Panel>

          <Panel title="5 · Weight update" formula={`η=${ETA} · λ=${LAMBDA} · L2 on w only, NOT b`}>
            <div className="font-mono text-[11px] text-screen-ink/80 leading-relaxed">
              w ← w − η(p−y)x − ηλw <br />
              b ← b − η(p−y) <span className="text-action-shadow font-bold">[bias = your personal base rate, never regularized]</span>
            </div>
            <div className="mt-2 font-mono text-[10px] text-screen-ink/60">
              total updates so far: {model.updates}
            </div>
          </Panel>
        </div>
      </DeviceShell>

      <DeviceNav />
    </main>
  );
}

function Panel({ title, formula, children }: { title: string; formula: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/70 rounded-xl p-4 border border-screen-ink/10">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="font-display font-bold text-sm text-screen-ink">{title}</h3>
      </div>
      <p className="font-mono text-[10px] text-screen-ink/60 mb-3">{formula}</p>
      {children}
    </div>
  );
}
