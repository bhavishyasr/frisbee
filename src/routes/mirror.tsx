import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeviceNav } from "@/components/DeviceNav";
import { Mascot } from "@/components/Mascot";
import { allMessages, allWeeks, getModel } from "@/lib/frisbee/vault";
import { wordDeltas } from "@/lib/frisbee/scientist";
import type { MessageRow, ModelState, WeekRow } from "@/lib/frisbee/types";
import { CLUSTERS } from "@/lib/frisbee/types";

export const Route = createFileRoute("/mirror")({
  head: () => ({
    meta: [
      { title: "Mirror — FRISBEE" },
      { name: "description", content: "One true thing surfaced. Screenshot-worthy." },
    ],
  }),
  component: MirrorPage,
});

function MirrorPage() {
  const [insight, setInsight] = useState<string>("…");
  const [sub, setSub] = useState<string>("");
  const [model, setModel] = useState<ModelState | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [msgs, weeks, m] = await Promise.all([allMessages(), allWeeks(), getModel()]);
    setModel(m);
    setCount(msgs.length);
    setInsight(generateInsight(msgs, weeks, m));
    setSub(generateSub(msgs, weeks, m));
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12 flex flex-col items-center">
      <h1 className="sr-only">FRISBEE — Mirror</h1>
      {/* The screenshot card. 9:16-ish. */}
      <article
        className="w-full max-w-[360px] aspect-[9/16] rounded-[2rem] bg-screen-ink text-screen p-7 relative overflow-hidden device-bevel"
        style={{ boxShadow: "0 20px 60px -20px oklch(0 0 0 / 0.5), inset 0 0 0 1px oklch(1 0 0 / 0.05)" }}
      >
        <div className="absolute inset-0 lcd-scanlines opacity-20 pointer-events-none" />
        <div className="absolute inset-0 paper-grain opacity-30 pointer-events-none" />

        <header className="flex justify-between items-center relative">
          <span className="font-mono text-[10px] font-bold tracking-widest bg-screen/10 rounded px-2 py-1">
            INSIGHT · {count.toString().padStart(3, "0")}
          </span>
          <span className="font-display italic font-black text-action text-sm">FRISBEE</span>
        </header>

        <div className="absolute top-20 right-6">
          <Mascot mood={count > 0 ? "proud" : "neutral"} size={56} />
        </div>

        <div className="relative mt-32 flex flex-col h-[calc(100%-8rem)]">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-action/80 mb-3">
            the one true thing
          </p>
          <h2 className="font-display text-3xl sm:text-[2rem] font-bold leading-[1.1] text-balance">
            {insight}
          </h2>
          <p className="mt-4 text-screen/70 text-sm leading-snug">{sub}</p>

          <div className="mt-auto pt-4 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-mono uppercase text-screen/40">model</p>
              <p className="font-mono text-xs text-screen/80">
                {model ? `${model.updates} steps · b=${model.b.toFixed(2)}` : "…"}
              </p>
            </div>
            <span className="text-[9px] font-mono text-screen/40">local · this device only</span>
          </div>
        </div>
      </article>

      <p className="mt-6 text-xs font-mono text-muted-foreground max-w-sm text-center">
        Long-press to screenshot. Send it to a friend. <Link to="/" className="underline">back to today</Link>.
      </p>

      <DeviceNav />
    </main>
  );
}

function generateInsight(msgs: MessageRow[], weeks: WeekRow[], model: ModelState): string {
  if (msgs.length === 0) {
    return "the model is listening. say one true thing.";
  }
  if (msgs.length < 3) {
    return "still learning your voice. keep going.";
  }
  // pick the largest |w_i| cluster as the dominant signal
  const labeled = weeks.filter((w) => w.truth !== undefined);
  if (labeled.length >= 1) {
    const cands = wordDeltas(msgs, weeks, 5);
    const top = cands[0];
    if (top) {
      const dir = top.delta > 0 ? "good" : "off";
      return `you say "${top.word}" mostly on ${dir} weeks.`;
    }
  }
  // fall back to model bias as personal base rate
  const baseRate = 1 / (1 + Math.exp(-model.b));
  if (baseRate > 0.65) return "you mostly show up as the version of you you imagined.";
  if (baseRate < 0.35) return "the gap between who you slept as and who woke up is real this week.";
  return "you're somewhere between the two yous. the model's still figuring out which is which.";
}

function generateSub(msgs: MessageRow[], weeks: WeekRow[], model: ModelState): string {
  if (msgs.length === 0) return "no data yet — the cold start is solved by background corpus.";
  // top weight cluster
  const order = CLUSTERS.map((c, i) => ({ c, w: model.w[i] })).sort(
    (a, b) => Math.abs(b.w) - Math.abs(a.w),
  );
  const top = order[0];
  return `${msgs.length} messages · ${weeks.filter((w) => w.truth !== undefined).length} labeled weeks · top signal: ${top.c} (w=${top.w.toFixed(2)})`;
}
