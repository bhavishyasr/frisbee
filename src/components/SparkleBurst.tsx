// Tiny sparkle burst — pure CSS particles. Fires when `trigger` changes.
// Lives on top of any button. No deps.

import { useEffect, useState } from "react";

export function SparkleBurst({ trigger, color = "var(--color-action)" }: { trigger: number; color?: string }) {
  const [bursts, setBursts] = useState<number[]>([]);
  useEffect(() => {
    if (trigger === 0) return;
    const id = trigger;
    setBursts((b) => [...b, id]);
    const t = setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 900);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {bursts.map((id) => (
        <span key={id} className="absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = (i / 10) * Math.PI * 2;
            const dist = 40 + Math.random() * 30;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const delay = Math.random() * 60;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 size-1.5 rounded-full"
                style={{
                  background: color,
                  animation: `sparkle-fly 700ms ease-out ${delay}ms forwards`,
                  // CSS custom props feed the keyframes
                  ["--dx" as string]: `${dx}px`,
                  ["--dy" as string]: `${dy}px`,
                }}
              />
            );
          })}
        </span>
      ))}
    </span>
  );
}
