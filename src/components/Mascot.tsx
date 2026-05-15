import { cn } from "@/lib/utils";

/**
 * Pixel mascot. Reacts to model "mood" — proud (just got it right),
 * sheepish (just got it wrong), neutral (waiting), kachow (committing).
 * Pure CSS, zero assets.
 */
export type MascotMood = "neutral" | "proud" | "sheepish" | "kachow" | "thinking";

export function Mascot({
  mood = "neutral",
  size = 96,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  const face: Record<MascotMood, { eyes: string; mouth: string }> = {
    neutral:   { eyes: "( o   o )", mouth: "  —" },
    proud:     { eyes: "( ^   ^ )", mouth: "  ‿" },
    sheepish:  { eyes: "( ·   · )", mouth: "  ︵" },
    kachow:    { eyes: "( >   < )", mouth: "  ◡" },
    thinking:  { eyes: "( o   ◔ )", mouth: "  ~" },
  };
  const { eyes, mouth } = face[mood];
  return (
    <div
      className={cn(
        "relative rounded-xl bg-screen-ink text-screen flex flex-col items-center justify-center font-mono leading-none select-none",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={`mascot ${mood}`}
    >
      <span
        className="animate-blink lcd-glow"
        style={{ fontSize: size * 0.18 }}
      >
        {eyes}
      </span>
      <span
        className="lcd-glow mt-1"
        style={{ fontSize: size * 0.22 }}
      >
        {mouth}
      </span>
      {mood === "kachow" && (
        <span
          className="absolute -top-3 -right-3 font-display font-black italic text-action animate-kachow"
          style={{ fontSize: size * 0.28, textShadow: "2px 2px 0 var(--color-action-shadow)" }}
        >
          KACHOW!
        </span>
      )}
    </div>
  );
}
