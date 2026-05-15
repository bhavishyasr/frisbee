import { cn } from "@/lib/utils";
import { useBuddy, type Mood } from "@/lib/buddy/brain";
import { emit } from "@/lib/buddy/bus";
import { useRef } from "react";

/**
 * Pixel mascot — now with a brain. Reads mood + thought from the buddy store.
 * Long-press fires `mascot:long-pressed`. Tap fires `mascot:tapped`.
 * Pure CSS, zero assets.
 */
export type MascotMood = Mood;

const FACES: Record<MascotMood, { eyes: string; mouth: string }> = {
  neutral:  { eyes: "( o   o )", mouth: "  —" },
  proud:    { eyes: "( ^   ^ )", mouth: "  ‿" },
  sheepish: { eyes: "( ·   · )", mouth: "  ︵" },
  kachow:   { eyes: "( >   < )", mouth: "  ◡" },
  thinking: { eyes: "( o   ◔ )", mouth: "  ~" },
  smug:     { eyes: "( ¬   ¬ )", mouth: "  ⌣" },
  sleepy:   { eyes: "( -   - )", mouth: "  z" },
  curious:  { eyes: "( O   o )", mouth: "  ?" },
};

export function Mascot({
  mood: forcedMood,
  size = 96,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  const storeMood = useBuddy((s) => s.mood);
  const thought = useBuddy((s) => s.thought);
  const thoughtVisible = useBuddy((s) => s.thoughtVisible);
  const mood = forcedMood ?? storeMood;
  const { eyes, mouth } = FACES[mood] ?? FACES.neutral;

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const startPress = () => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      emit({ type: "mascot:long-pressed" });
    }, 550);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!longPressed.current) emit({ type: "mascot:tapped" });
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {thoughtVisible && thought && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-10 max-w-[18ch] text-center px-3 py-2 rounded-lg bg-paper text-ink text-xs font-mono shadow-md border border-ink/10 animate-fade-in"
          aria-live="polite"
        >
          <span className="lcd-glow-off">{thought}</span>
          <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-paper border-r border-b border-ink/10" />
        </div>
      )}
      <button
        type="button"
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={() => { if (pressTimer.current) clearTimeout(pressTimer.current); }}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        className={cn(
          "rounded-xl bg-screen-ink text-screen flex flex-col items-center justify-center font-mono leading-none select-none cursor-pointer transition-transform active:scale-95",
        )}
        style={{ width: size, height: size }}
        aria-label={`mascot ${mood}`}
      >
        <span className="animate-blink lcd-glow" style={{ fontSize: size * 0.18 }}>{eyes}</span>
        <span className="lcd-glow mt-1" style={{ fontSize: size * 0.22 }}>{mouth}</span>
        {mood === "kachow" && (
          <span
            className="absolute -top-3 -right-3 font-display font-black italic text-action animate-kachow pointer-events-none"
            style={{ fontSize: size * 0.28, textShadow: "2px 2px 0 var(--color-action-shadow)" }}
          >
            KACHOW!
          </span>
        )}
      </button>
    </div>
  );
}
