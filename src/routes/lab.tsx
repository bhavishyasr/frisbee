import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { DeviceShell } from "@/components/DeviceShell";
import { DeviceNav } from "@/components/DeviceNav";
import { annotateTokens, extractFeatures } from "@/lib/frisbee/features";
import { sigmoid, bce, ETA, LAMBDA } from "@/lib/frisbee/model";
import { getCorpus, getModel, allWeeks } from "@/lib/frisbee/vault";
import type { ModelState, Cluster } from "@/lib/frisbee/types";
import { CLUSTERS } from "@/lib/frisbee/types";
import type { PersonalCorpus } from "@/lib/frisbee/features";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Lab — FRISBEE" },
      { name: "description", content: "The math, visual. Watch the model think one step at a time." },
    ],
  }),
  component: LabPage,
});

const SAMPLES = [
  "bro I literally said I'd study and then just scrolled tiktok for 4 hours",
  "locked in. gym. journaled. shipped the thing I promised myself.",
  "I mean I tried? kinda. it's complicated.",
  "back to back deep work blocks. felt unstoppable today.",
];

const CLUSTER_COLOR: Record<Cluster, string> = {
  drift: "oklch(0.7 0.16 25)",
  align: "oklch(0.72 0.16 145)",
  excuse: "oklch(0.72 0.13 75)",
  energy: "oklch(0.7 0.18 295)",
};

const CLUSTER_TAG: Record<Cluster, string> = {
  drift: "fell off",
  align: "showed up",
  excuse: "soft-pedal",
  energy: "fired up",
};

function LabPage() {
  const [text, setText] = useState(SAMPLES[0]);
  const [model, setModel] = useState<ModelState | null>(null);
  const [corpus, setCorpus] = useState<PersonalCorpus>({ N: 0, df: {} });
  const [imbalance, setImbalance] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setModel(await getModel());
      setCorpus(await getCorpus());
      const weeks = (await allWeeks()).filter((w) => w.truth !== undefined);
      if (weeks.length >= 2) {
        const ones = weeks.filter((w) => w.truth === 1).length;
        const zeros = weeks.length - ones;
        if (ones === 0 || zeros === 0) {
          setImbalance(`Every labeled week so far is ${ones === 0 ? "off" : "good"}. The model can't learn what the other side looks like yet.`);
        }
      }
    })();
  }, []);

  const annotated = useMemo(() => annotateTokens(text), [text]);
  const x = useMemo(() => extractFeatures(text, corpus), [text, corpus]);

  if (!model) {
    return (
      <main className="min-h-screen p-8 font-mono text-sm text-muted-foreground">
        booting the lab...
      </main>
    );
  }

  let z = model.b;
  for (let i = 0; i < 4; i++) z += model.w[i] * x[i];
  const p = sigmoid(z);
  const lossY1 = bce(p, 1);
  const lossY0 = bce(p, 0);
  const contribs = CLUSTERS.map((c, i) => ({ c, v: model.w[i] * x[i], w: model.w[i], x: x[i] }));
  const maxAbsContrib = Math.max(0.01, ...contribs.map((d) => Math.abs(d.v)));

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <h1 className="sr-only">FRISBEE — Lab</h1>
      <DeviceShell wide label="BIP-01 // LAB" status="WHITEBOARD">

        <p className="font-display font-bold text-screen-ink text-lg leading-snug">
          How the model thinks, one step at a time.
        </p>
        <p className="mt-1 font-mono text-[11px] text-screen-ink/70 leading-relaxed">
          Type anything below. Watch every step update live.
          No GPUs. No cloud. Just words → numbers → a guess.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {SAMPLES.map((s, i) => (
            <button
              key={i}
              onClick={() => setText(s)}
              className="press-key bg-white text-screen-ink rounded-md px-2 py-1 font-mono text-[10px] shadow-[0_3px_0_var(--color-device-shadow)] hover:bg-screen"
            >
              sample {i + 1}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="mt-3 w-full bg-screen-ink/5 rounded-lg p-3 font-mono text-sm text-screen-ink resize-none border border-screen-ink/10 focus:outline-none focus:border-screen-ink/30"
        />

        {imbalance && (
          <div className="mt-4 rounded-lg bg-rose-300/40 border border-rose-400 p-3 font-mono text-xs text-screen-ink">
            heads up — {imbalance}
          </div>
        )}

        {/* Cluster color legend */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {CLUSTERS.map((c) => (
            <div key={c} className="flex items-center gap-1.5 font-mono text-[10px] text-screen-ink/70">
              <span className="size-3 rounded-sm shrink-0" style={{ background: CLUSTER_COLOR[c] }} />
              <span className="uppercase font-bold">{c}</span>
              <span className="text-screen-ink/40 hidden sm:inline">· {CLUSTER_TAG[c]}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 lg:space-y-0 lg:[column-count:2] lg:[column-gap:0.75rem] [&>*]:break-inside-avoid lg:[&>*]:mb-3">
          {/* STEP 1 — Tokens colored by cluster */}
          <Panel
            n={1}
            title="Break it into words"
            blurb="Every word that lives in one of the four clusters lights up in that color. Gray words don't move the needle."
          >
            <div className="flex flex-wrap gap-1.5">
              {annotated.length === 0 && (
                <span className="font-mono text-xs text-screen-ink/50">(type something above)</span>
              )}
              {annotated.map((t, i) => {
                if (t.clusters.length === 0) {
                  return (
                    <span key={i} className="font-mono text-xs px-1.5 py-0.5 rounded text-screen-ink/40 bg-screen-ink/5">
                      {t.token}
                    </span>
                  );
                }
                // gradient if multi-cluster
                const bg = t.clusters.length === 1
                  ? CLUSTER_COLOR[t.clusters[0]]
                  : `linear-gradient(90deg, ${t.clusters.map((c) => CLUSTER_COLOR[c]).join(", ")})`;
                return (
                  <motion.span
                    key={i}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.012 }}
                    title={t.clusters.join(" + ")}
                    className="font-mono text-xs font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ background: bg }}
                  >
                    {t.token}
                  </motion.span>
                );
              })}
            </div>
            <p className="mt-3 font-mono text-[10px] text-screen-ink/50">
              {annotated.filter((t) => t.clusters.length > 0).length} of {annotated.length} words matched a cluster
            </p>
          </Panel>

          {/* STEP 2 — Cluster scores */}
          <Panel
            n={2}
            title="Add the colors up"
            blurb="Each cluster gets a score = sum of its words, weighted by how rare each word is (rare words count more)."
            formula="score_c = Σ TF(word) · IDF(word)"
          >
            <div className="space-y-2">
              {CLUSTERS.map((c, i) => {
                const max = Math.max(0.01, ...x);
                const pct = (x[i] / max) * 100;
                return (
                  <div key={c}>
                    <div className="flex justify-between font-mono text-[10px] text-screen-ink/70">
                      <span className="uppercase font-bold">{c}</span>
                      <span className="tabular-nums">{x[i].toFixed(3)}</span>
                    </div>
                    <div className="h-3 bg-screen-ink/5 rounded-full overflow-hidden mt-0.5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: CLUSTER_COLOR[c] }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 200, damping: 24 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* STEP 3 — Weights as a lens */}
          <Panel
            n={3}
            title="The model's opinion on each cluster"
            blurb="These weights are what the model learned from YOUR labeled weeks. Positive = this cluster predicts a good week. Negative = predicts an off week."
            formula={`bias b = ${model.b.toFixed(3)}  (your baseline “good week” lean)`}
          >
            <WeightLens weights={model.w} />
            {model.updates === 0 && (
              <p className="mt-3 font-mono text-[10px] text-screen-ink/50">
                no labeled weeks yet → weights are all zero, model has no opinion.
              </p>
            )}
          </Panel>

          {/* STEP 4 — Contribution stacking */}
          <Panel
            n={4}
            title="Stack up the votes"
            blurb="Multiply each cluster score by its weight. Green bars pull toward YES (good week). Red bars pull toward NO."
            formula="z = b + Σ w_c · score_c"
          >
            <div className="space-y-1.5">
              {contribs.map((d) => {
                const pct = Math.min(100, (Math.abs(d.v) / maxAbsContrib) * 100);
                const positive = d.v >= 0;
                return (
                  <div key={d.c} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold w-12 text-screen-ink/70">{d.c}</span>
                    <div className="flex-1 grid grid-cols-2 gap-0 h-3 bg-screen-ink/5 rounded">
                      <div className="flex justify-end">
                        {!positive && (
                          <motion.div
                            className="h-full bg-rose-400 rounded-l"
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 200, damping: 24 }}
                          />
                        )}
                      </div>
                      <div className="flex justify-start">
                        {positive && (
                          <motion.div
                            className="h-full bg-emerald-400 rounded-r"
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 200, damping: 24 }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] tabular-nums w-14 text-right text-screen-ink/70">
                      {d.v >= 0 ? "+" : ""}{d.v.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-2 border-t border-screen-ink/10 flex justify-between font-mono text-xs">
              <span className="text-screen-ink/60">total z (incl. bias {model.b.toFixed(2)})</span>
              <span className={`font-bold tabular-nums ${z >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {z >= 0 ? "+" : ""}{z.toFixed(3)}
              </span>
            </div>
          </Panel>

          {/* STEP 5 — Sigmoid curve with live dot */}
          <Panel
            n={5}
            title="Squish z into a probability"
            blurb="The sigmoid curve takes any number z and squashes it between 0 and 1. That's the model's confidence the week will be good."
            formula="p = 1 / (1 + e^(−z))"
          >
            <SigmoidPlot z={z} p={p} />
            <div className="mt-2 flex items-center justify-between font-mono text-xs">
              <span className="text-screen-ink/60">model says:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${p >= 0.5 ? "bg-emerald-300/60 text-emerald-900" : "bg-rose-300/60 text-rose-900"}`}>
                {p >= 0.5 ? "GOOD WEEK" : "OFF WEEK"} · {(Math.max(p, 1 - p) * 100).toFixed(0)}% sure
              </span>
            </div>
          </Panel>

          {/* STEP 6 — Loss curves */}
          <Panel
            n={6}
            title="How wrong was the guess?"
            blurb="When Sunday comes, you tell the model what actually happened. Loss = how badly its guess matched the truth. Big loss = big learning step."
            formula="L = −[ y·log(p) + (1−y)·log(1−p) ]"
          >
            <LossPlot p={p} />
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-emerald-100 rounded p-2 flex justify-between">
                <span>if truth = GOOD</span>
                <span className="font-bold">L = {lossY1.toFixed(3)}</span>
              </div>
              <div className="bg-rose-100 rounded p-2 flex justify-between">
                <span>if truth = OFF</span>
                <span className="font-bold">L = {lossY0.toFixed(3)}</span>
              </div>
            </div>
          </Panel>

          {/* STEP 7 — Learning rule */}
          <Panel
            n={7}
            title="Then the model nudges itself"
            blurb="After every labeled week, each weight slides a tiny bit toward whatever would have been less wrong. Small steps, over and over — that's learning."
            formula={`η = ${ETA}  (step size)   ·   λ = ${LAMBDA}  (don't let weights blow up)`}
          >
            <div className="font-mono text-[11px] text-screen-ink/80 leading-relaxed bg-screen-ink/5 rounded p-3">
              <div>w ← w − η · (p − y) · x − η · λ · w</div>
              <div>b ← b − η · (p − y)</div>
            </div>
            <p className="mt-2 font-mono text-[10px] text-screen-ink/60">
              the bias b is your personal baseline — never penalized, so the model can be honestly optimistic or pessimistic about you.
            </p>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-screen-ink/60">
              <span>training steps so far</span>
              <span className="font-bold tabular-nums">{model.updates}</span>
            </div>
          </Panel>

          {/* Corpus footer */}
          <div className="bg-screen-ink/5 rounded-lg p-3 font-mono text-[10px] text-screen-ink/60 leading-relaxed">
            corpus: {corpus.N} of your messages · {Object.keys(corpus.df).length} unique words you've used ·
            blended with {500} background docs so rare words don't dominate.
          </div>
        </div>
      </DeviceShell>

      <DeviceNav />
    </main>
  );
}

function Panel({
  n,
  title,
  blurb,
  formula,
  children,
}: {
  n: number;
  title: string;
  blurb: string;
  formula?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white/80 rounded-xl p-4 border border-screen-ink/10">
      <div className="flex items-start gap-3 mb-2">
        <span className="shrink-0 size-7 rounded-full bg-action text-screen-ink font-display font-black flex items-center justify-center text-sm shadow-[0_2px_0_var(--color-action-shadow)]">
          {n}
        </span>
        <div className="flex-1">
          <h3 className="font-display font-bold text-base text-screen-ink leading-tight">{title}</h3>
          <p className="font-sans text-[12px] text-screen-ink/70 mt-0.5 leading-snug">{blurb}</p>
        </div>
      </div>
      {formula && (
        <p className="font-mono text-[10px] text-screen-ink/55 mb-3 bg-screen-ink/5 rounded px-2 py-1 inline-block">
          {formula}
        </p>
      )}
      {children}
    </section>
  );
}

function WeightLens({ weights }: { weights: readonly number[] }) {
  const maxAbs = Math.max(0.01, ...weights.map((w) => Math.abs(w)));
  return (
    <div className="space-y-1.5">
      {CLUSTERS.map((c, i) => {
        const w = weights[i];
        const pct = Math.min(100, (Math.abs(w) / maxAbs) * 100);
        const positive = w >= 0;
        return (
          <div key={c} className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold w-12 text-screen-ink/70">{c}</span>
            <div className="flex-1 grid grid-cols-2 h-3 bg-screen-ink/5 rounded relative">
              <div className="absolute inset-y-0 left-1/2 w-px bg-screen-ink/20" />
              <div className="flex justify-end">
                {!positive && (
                  <motion.div
                    className="h-full bg-rose-400 rounded-l"
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  />
                )}
              </div>
              <div className="flex justify-start">
                {positive && (
                  <motion.div
                    className="h-full bg-emerald-400 rounded-r"
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  />
                )}
              </div>
            </div>
            <span className="font-mono text-[10px] tabular-nums w-14 text-right text-screen-ink/70">
              {w >= 0 ? "+" : ""}{w.toFixed(3)}
            </span>
          </div>
        );
      })}
      <div className="flex justify-between font-mono text-[9px] text-screen-ink/40 pt-1">
        <span>← predicts OFF</span>
        <span>predicts GOOD →</span>
      </div>
    </div>
  );
}

function SigmoidPlot({ z, p }: { z: number; p: number }) {
  const W = 320;
  const H = 110;
  const zMin = -6;
  const zMax = 6;
  const xAt = (zv: number) => ((zv - zMin) / (zMax - zMin)) * W;
  const yAt = (pv: number) => H - pv * H;
  const path = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const zv = zMin + (i / 60) * (zMax - zMin);
      pts.push(`${i === 0 ? "M" : "L"}${xAt(zv).toFixed(1)},${yAt(sigmoid(zv)).toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);
  const zClamped = Math.max(zMin, Math.min(zMax, z));
  const dotX = xAt(zClamped);
  const dotY = yAt(p);
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        {/* axes */}
        <line x1={0} y1={H} x2={W} y2={H} stroke="currentColor" className="text-screen-ink/20" strokeWidth={1} />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="currentColor" className="text-screen-ink/20" strokeDasharray="2 2" />
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="currentColor" className="text-screen-ink/15" strokeDasharray="2 2" />
        {/* curve */}
        <path d={path} fill="none" stroke="var(--color-action)" strokeWidth={2.5} strokeLinecap="round" />
        {/* z guide */}
        <line x1={dotX} y1={0} x2={dotX} y2={H} stroke="var(--color-screen-ink)" strokeOpacity={0.3} strokeDasharray="3 3" />
        {/* p guide */}
        <line x1={0} y1={dotY} x2={W} y2={dotY} stroke="var(--color-screen-ink)" strokeOpacity={0.3} strokeDasharray="3 3" />
        {/* dot */}
        <motion.circle
          cx={dotX}
          cy={dotY}
          r={5}
          fill="var(--color-action)"
          stroke="white"
          strokeWidth={2}
          animate={{ cx: dotX, cy: dotY }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        />
        <text x={4} y={12} className="font-mono fill-screen-ink/50" fontSize={9}>p=1</text>
        <text x={4} y={H - 4} className="font-mono fill-screen-ink/50" fontSize={9}>p=0</text>
        <text x={W / 2 + 4} y={H - 4} className="font-mono fill-screen-ink/50" fontSize={9}>z=0</text>
      </svg>
      <div className="flex justify-between font-mono text-[10px] text-screen-ink/60 -mt-1">
        <span>z = <span className="font-bold tabular-nums">{z.toFixed(2)}</span></span>
        <span>p = <span className="font-bold tabular-nums">{p.toFixed(3)}</span></span>
      </div>
    </div>
  );
}

function LossPlot({ p }: { p: number }) {
  const W = 320;
  const H = 90;
  const pMin = 0.01;
  const pMax = 0.99;
  const Lmax = -Math.log(pMin); // ~4.6
  const xAt = (pv: number) => ((pv - pMin) / (pMax - pMin)) * W;
  const yAt = (l: number) => H - (l / Lmax) * H;
  const pathFor = (y: 0 | 1) => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const pv = pMin + (i / 60) * (pMax - pMin);
      const l = bce(pv, y);
      pts.push(`${i === 0 ? "M" : "L"}${xAt(pv).toFixed(1)},${yAt(l).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const pc = Math.max(pMin, Math.min(pMax, p));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      <line x1={0} y1={H} x2={W} y2={H} stroke="currentColor" className="text-screen-ink/20" />
      <path d={pathFor(1)} fill="none" stroke="oklch(0.65 0.16 145)" strokeWidth={2} />
      <path d={pathFor(0)} fill="none" stroke="oklch(0.65 0.2 25)" strokeWidth={2} />
      <line x1={xAt(pc)} y1={0} x2={xAt(pc)} y2={H} stroke="var(--color-screen-ink)" strokeOpacity={0.3} strokeDasharray="3 3" />
      <circle cx={xAt(pc)} cy={yAt(bce(pc, 1))} r={4} fill="oklch(0.55 0.16 145)" />
      <circle cx={xAt(pc)} cy={yAt(bce(pc, 0))} r={4} fill="oklch(0.6 0.2 25)" />
      <text x={4} y={12} className="font-mono fill-screen-ink/50" fontSize={9}>loss</text>
      <text x={W - 30} y={H - 4} className="font-mono fill-screen-ink/50" fontSize={9}>p → 1</text>
    </svg>
  );
}
