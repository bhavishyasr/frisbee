import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DeviceShell } from "@/components/DeviceShell";
import { DeviceNav } from "@/components/DeviceNav";
import { Mascot, type MascotMood } from "@/components/Mascot";
import { submitMessage, weekStartOf } from "@/lib/yours/engine";
import { allMessages } from "@/lib/yours/vault";
import type { MessageRow } from "@/lib/yours/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Yours" },
      { name: "description", content: "One free-form message. The model listens." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const [text, setText] = useState("");
  const [mood, setMood] = useState<MascotMood>("neutral");
  const [last, setLast] = useState<{ p: number; x: number[] } | null>(null);
  const [todayMsgs, setTodayMsgs] = useState<MessageRow[]>([]);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void refresh();
    taRef.current?.focus();
  }, []);

  async function refresh() {
    const all = await allMessages();
    const ws = weekStartOf(Date.now());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setTodayMsgs(
      all.filter((m) => m.weekStart === ws && m.ts >= today.getTime()),
    );
  }

  async function onSubmit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setMood("thinking");
    try {
      const r = await submitMessage(text.trim());
      setLast({ p: r.p, x: r.x });
      setMood(r.p >= 0.5 ? "proud" : "sheepish");
      setText("");
      await refresh();
    } finally {
      setBusy(false);
      setTimeout(() => setMood("neutral"), 2200);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <h1 className="sr-only">Yours — Today</h1>
      <DeviceShell label="BIP-01 // TODAY" status="LISTENING">
        <div className="flex items-start justify-between gap-4 mb-5">
          <Mascot mood={mood} size={84} />
          <div className="text-right font-mono text-[10px] text-screen-ink/70 uppercase">
            <p>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
            <p className="mt-1">today: {todayMsgs.length} msg{todayMsgs.length === 1 ? "" : "s"}</p>
            {last && (
              <p className="mt-1 text-screen-ink">
                model says: <span className="font-bold">{(last.p * 100).toFixed(0)}%</span>
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
          rows={6}
          placeholder="bro why did I spend 4 hours on youtube again..."
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-xl sm:text-2xl font-medium text-screen-ink placeholder:text-screen-ink/30 resize-none leading-snug"
        />

        <div className="mt-5 pt-4 border-t-2 border-screen-ink/10 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/60">
            ⌘+Enter to send · stays on this device
          </span>
          <button
            onClick={() => void onSubmit()}
            disabled={busy || !text.trim()}
            className="press-key bg-action text-screen-ink rounded-xl px-6 py-3 font-display font-black tracking-wider shadow-[0_5px_0_var(--color-action-shadow)] disabled:opacity-40 disabled:translate-y-0"
          >
            {busy ? "READING..." : "FEED IT"}
          </button>
        </div>

        {last && (
          <div className="mt-6 grid grid-cols-4 gap-2 font-mono text-[10px] text-screen-ink/80">
            {(["drift", "align", "excuse", "energy"] as const).map((c, i) => (
              <div key={c} className="bg-screen-ink/5 rounded-md px-2 py-2 text-center">
                <div className="uppercase tracking-widest">{c}</div>
                <div className="font-bold text-sm mt-1">{last.x[i].toFixed(3)}</div>
              </div>
            ))}
          </div>
        )}
      </DeviceShell>

      <DeviceNav />

      <p className="text-center text-xs font-mono text-muted-foreground max-w-md mx-auto">
        Yours is a personal intelligence machine. It learns YOUR words from your own messages.
        Nothing leaves this browser. <Link to="/lab" className="underline">See the math</Link>.
      </p>
    </main>
  );
}
