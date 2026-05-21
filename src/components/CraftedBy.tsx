/**
 * Footer credit — quiet, not loud.
 */
export function CraftedBy() {
  return (
    <div className="mt-6 mb-10 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground select-none">
      <span>crafted with</span>
      <span
        className="text-base leading-none"
        style={{ color: "oklch(0.68 0.19 145)" }}
      >
        ♥
      </span>
      <span>by</span>
      <span className="font-bold text-foreground normal-case tracking-normal text-xs">
        Bhavishya Srivastava
      </span>
      <span aria-hidden className="text-foreground/30">·</span>
      <span className="normal-case tracking-normal">player 1</span>
    </div>
  );
}
