import { useEffect, useState } from "react";

/**
 * Footer credit — gamified, not corporate.
 * Click the heart for a tiny easter egg combo counter.
 */
export function CraftedBy() {
  const [combo, setCombo] = useState(0);
  const [pop, setPop] = useState(0);

  useEffect(() => {
    if (combo === 0) return;
    const t = setTimeout(() => setCombo(0), 1800);
    return () => clearTimeout(t);
  }, [combo, pop]);

  const tier =
    combo >= 10 ? "LEGENDARY" :
    combo >= 5  ? "COMBO ×" + combo :
    combo >= 2  ? "×" + combo :
                  null;

  return (
    <div className="mt-6 mb-10 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground select-none">
      <span>crafted with</span>
      <button
        type="button"
        onClick={() => { setCombo((c) => c + 1); setPop((p) => p + 1); }}
        aria-label="thanks"
        className="relative inline-flex items-center justify-center size-5 rounded-full hover:scale-125 active:scale-95 transition-transform"
      >
        <span
          key={pop}
          className="text-base leading-none animate-wiggle"
          style={{
            color: "oklch(0.68 0.19 145)",
            filter: "drop-shadow(0 1px 0 oklch(0.45 0.14 145)) drop-shadow(0 0 6px oklch(0.78 0.2 145 / 0.55))",
          }}
        >
          ♥
        </span>

        {tier && (
          <span
            key={"t" + pop}
            className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-action text-screen-ink text-[9px] font-bold tracking-widest shadow-[0_2px_0_var(--color-action-shadow)] whitespace-nowrap animate-kachow"
          >
            {tier}
          </span>
        )}
      </button>
      <span>by</span>
      <a
        href="https://github.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-foreground hover:text-action transition-colors normal-case tracking-normal text-xs"
      >
        Bhavishya Srivastava
      </a>
      <span aria-hidden className="text-foreground/30">·</span>
      <span className="normal-case tracking-normal">player 1</span>
    </div>
  );
}
