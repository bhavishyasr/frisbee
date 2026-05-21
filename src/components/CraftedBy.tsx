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
      <span>by Bhavishya Srivastava</span>
    </div>
  );
}
