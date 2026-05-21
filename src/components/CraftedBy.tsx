/**
 * Footer credit — a quiet signature, like ink in the corner of a sketch.
 */
export function CraftedBy() {
  return (
    <footer className="mt-10 mb-12 flex flex-col items-center gap-2 select-none">
      <span
        aria-hidden
        className="h-px w-10 bg-foreground/15"
      />
      <p
        className="text-[11px] text-muted-foreground"
        style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}
      >
        crafted by{" "}
        <span className="text-foreground" style={{ fontStyle: "italic" }}>
          Bhavishya Srivastava
        </span>
      </p>
    </footer>
  );
}
