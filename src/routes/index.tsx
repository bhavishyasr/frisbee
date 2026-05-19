import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DeviceShell } from "@/components/DeviceShell";
import { DeviceNav } from "@/components/DeviceNav";
import { Mascot } from "@/components/Mascot";
import { SparkleBurst } from "@/components/SparkleBurst";
import { submitMessage, weekStartOf } from "@/lib/frisbee/engine";
import { allMessages, getCorpus, getModel } from "@/lib/frisbee/vault";
import { extractFeatures, type PersonalCorpus, EMPTY_PERSONAL } from "@/lib/frisbee/features";
import { predict } from "@/lib/frisbee/model";
import type { MessageRow, ModelState } from "@/lib/frisbee/types";
import { CLUSTERS } from "@/lib/frisbee/types";
import { emit } from "@/lib/buddy/bus";
import { reactToFirstMessage, reactToMessage, dominantCluster, useBuddy } from "@/lib/buddy/brain";
import { VOICE, pick } from "@/lib/buddy/voice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — FRISBEE" },
      { name: "description", content: "One free-form message. The model listens in real time." },
    ],
  }),
  component: TodayPage,
});

const ZERO_X: [number, number, number, number] = [0, 0, 0, 0];

function TodayPage() {
  const [text, setText] = useState("");
  const [last, setLast] = useState<{ p: number; x: [number, number, number, number] } | null>(null);
  const [burst, setBurst] = useState(0);
  const [liveX, setLiveX] = useState<[number, number, number, number]>(ZERO_X);
  const [liveP, setLiveP] = useState<number | null>(null);
  const [allMsgs, setAllMsgs] = useState<MessageRow[]>([]);
  const [corpus, setCorpus] = useState<PersonalCorpus>(EMPTY_PERSONAL);
  const [model, setModel] = useState<ModelState | null>(null);
  const [busy, setBusy] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }));
  }, []);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const setStoreMood = useBuddy((s) => s.setMood);
  const placeholder = useMemo(() => pick(VOICE.empty_input), []);

  const todayMsgs = useMemo(() => {
    const ws = weekStartOf(Date.now());
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return allMsgs.filter((m) => m.weekStart === ws && m.ts >= today.getTime());
  }, [allMsgs]);

  const recent = useMemo(() => allMsgs.slice(-3).reverse(), [allMsgs]);

  useEffect(() => {
    void refresh();
    taRef.current?.focus();
  }, []);

  // Live feature extraction — debounced so it doesn't thrash the mascot on every keystroke.
  useEffect(() => {
    if (!text.trim()) {
      setLiveX(ZERO_X);
      setLiveP(null);
      return;
    }
    const t = setTimeout(() => {
      const x = extractFeatures(text, corpus);
      setLiveX(x as [number, number, number, number]);
      if (model) setLiveP(predict(model, x));
      // mascot tracks dominant cluster as you type — silently, no thought bubble
      const c = dominantCluster(x as [number, number, number, number]);
      if (c === "energy") setStoreMood("kachow", 800);
      else if (c === "align") setStoreMood("proud", 800);
      else if (c === "drift") setStoreMood("sheepish", 800);
      else if (c === "excuse") setStoreMood("thinking", 800);
    }, 220);
    return () => clearTimeout(t);
  }, [text, corpus, model, setStoreMood]);

  async function refresh() {
    const [m, c, mdl] = await Promise.all([allMessages(), getCorpus(), getModel()]);
    setAllMsgs(m);
    setCorpus(c);
    setModel(mdl);
  }

  async function onSubmit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const isFirstEver = allMsgs.length === 0;
      const r = await submitMessage(text.trim());
      setLast({ p: r.p, x: r.x as [number, number, number, number] });
      setBurst(Date.now());
      emit({ type: "message:dropped", text: text.trim(), isFirstEver });
      if (isFirstEver) reactToFirstMessage(r.x as [number, number, number, number]);
      else reactToMessage(r.x as [number, number, number, number]);
      setText("");
      setLiveX(ZERO_X);
      setLiveP(null);
      await refresh();
      setTimeout(() => taRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }

  // Bars use the live vector while typing; freeze on submit (last).
  const showX = text.trim() ? liveX : (last?.x ?? ZERO_X);
  const showP = text.trim() ? liveP : (last?.p ?? null);
  const maxX = Math.max(0.01, ...showX);

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <h1 className="sr-only">FRISBEE — Today</h1>
      <DeviceShell label="BIP-01 // TODAY" status={text.trim() ? "READING" : "LISTENING"}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <Mascot size={84} />
          <div className="text-right font-mono text-[10px] text-screen-ink/70 uppercase">
            <p suppressHydrationWarning>{today ?? "\u00A0"}</p>
            <p className="mt-1">today: {todayMsgs.length} msg{todayMsgs.length === 1 ? "" : "s"}</p>
            {model && (
              <p className="mt-1 normal-case tracking-normal text-screen-ink/50">
                {model.updates} train step{model.updates === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>

        <label className="block font-mono text-xs uppercase tracking-widest text-screen-ink/80 mb-2">
          ▶ Today's download
        </label>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void onSubmit();
            }
          }}
          rows={5}
          placeholder={placeholder}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-xl sm:text-2xl font-medium text-screen-ink placeholder:text-screen-ink/30 resize-none leading-snug"
        />

        {/* Live cluster bars — the device's pulse */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {CLUSTERS.map((c, i) => {
            const v = showX[i];
            const pct = Math.min(100, (v / maxX) * 100);
            const tone = CLUSTER_TONE[c];
            return (
              <div key={c} className="font-mono">
                <div className="flex items-baseline justify-between text-[9px] uppercase tracking-widest text-screen-ink/70">
                  <span>{c}</span>
                  <span className="tabular-nums text-screen-ink/50">{v.toFixed(2)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-screen-ink/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: tone }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 220, damping: 26 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Confidence pill — only when there's a model + live or submitted prediction */}
        <AnimatePresence>
          {showP !== null && (
            <motion.div
              key="conf"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-screen-ink/70"
            >
              <span>model leans</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${showP >= 0.5 ? "bg-emerald-300/60 text-screen-ink" : "bg-rose-300/60 text-screen-ink"}`}>
                {showP >= 0.5 ? "YES" : "NO"} · {(Math.max(showP, 1 - showP) * 100).toFixed(0)}%
              </span>
              <span className="text-screen-ink/40 normal-case tracking-normal">
                {model && model.updates === 0 ? "(untrained guess — needs a labeled week)" : ""}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 pt-4 border-t-2 border-screen-ink/10 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/60">
            ⌘+Enter to send · stays on this device
          </span>
          <button
            onClick={() => void onSubmit()}
            disabled={busy || !text.trim()}
            className="press-key relative bg-action text-screen-ink rounded-xl px-6 py-3 font-display font-black tracking-wider shadow-[0_5px_0_var(--color-action-shadow)] disabled:opacity-40 disabled:translate-y-0"
          >
            <SparkleBurst trigger={burst} />
            {busy ? "READING..." : "FEED IT"}
          </button>
        </div>

        {/* Recent strip — proves the device remembers you */}
        {recent.length > 0 && (
          <div className="mt-6 pt-4 border-t-2 border-screen-ink/10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/60 mb-2">
              recent ({allMsgs.length} total)
            </p>
            <ul className="space-y-1.5">
              {recent.map((m) => {
                const c = dominantCluster(m.x);
                const dot = c === "neutral" ? "oklch(0.6 0.02 250)" : CLUSTER_TONE[c];
                return (
                  <li key={m.id} className="flex items-start gap-2 text-sm text-screen-ink/80">
                    <span className="mt-1.5 size-2 rounded-full shrink-0" style={{ background: dot }} aria-hidden />
                    <span className="font-mono text-[10px] text-screen-ink/40 tabular-nums shrink-0 mt-0.5">
                      {formatRelative(m.ts)}
                    </span>
                    <span className="truncate flex-1">{m.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </DeviceShell>

      <DeviceNav />

      <p className="text-center text-xs font-mono text-muted-foreground max-w-md mx-auto">
        FRISBEE learns YOUR words from your own messages. Nothing leaves this browser.{" "}
        <Link to="/lab" className="underline">See the math</Link> ·{" "}
        <Link to="/about" className="underline">What on earth is this?</Link>
      </p>
    </main>
  );
}

const CLUSTER_TONE: Record<"drift" | "align" | "excuse" | "energy", string> = {
  drift: "oklch(0.7 0.16 25)",   // rose
  align: "oklch(0.72 0.16 145)", // emerald
  excuse: "oklch(0.72 0.13 75)", // amber
  energy: "oklch(0.7 0.18 295)", // violet
};

function formatRelative(ts: number): string {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d`;
}
