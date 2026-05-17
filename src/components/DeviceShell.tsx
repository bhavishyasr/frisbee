import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { setMuted, isMuted } from "@/lib/buddy/fx";

/**
 * The chunky plastic shell. Wraps every screen so the whole app feels like
 * one handheld device — Tamagotchi-meets-cyberdeck. Friend-built warmth.
 */
export function DeviceShell({
  children,
  className,
  label = "BIP-01",
  status = "LIVE",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  status?: string;
}) {
  const [muted, setMutedState] = useState(isMuted());
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };
  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="device-bevel rounded-[2.5rem] bg-device p-6 sm:p-8 relative">
        {/* Brand strip */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-action shadow-[0_0_8px_var(--color-action)]" />
            <span className="font-display font-bold text-white/90 italic tracking-tight text-lg">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "unmute sounds" : "mute sounds"}
              className="text-[11px] font-mono text-white/70 hover:text-white transition-colors active:scale-95"
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">
              {status}
            </span>
            <div className="size-2 rounded-full bg-emerald-300 animate-pulse" />
          </div>
        </div>
        {/* Screen */}
        <div className="screen-inset rounded-2xl bg-screen border-[10px] border-black/15 p-5 sm:p-7 relative overflow-hidden">
          <div className="lcd-scanlines absolute inset-0 pointer-events-none opacity-50" />
          <div className="relative">{children}</div>
        </div>
      </div>
    </div>
  );
}
