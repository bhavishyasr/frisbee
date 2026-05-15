import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "TODAY" },
  { to: "/week", label: "WEEK" },
  { to: "/mirror", label: "MIRROR" },
  { to: "/lab", label: "LAB" },
  { to: "/me", label: "ME" },
] as const;

export function DeviceNav() {
  const { pathname } = useLocation();
  return (
    <nav className="w-full max-w-2xl mx-auto mt-6 mb-12 grid grid-cols-5 gap-2 sm:gap-3">
      {TABS.map((t) => {
        const active = pathname === t.to;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "press-key rounded-xl text-center py-3 sm:py-4 font-mono text-[11px] sm:text-xs font-bold tracking-widest transition-colors",
              active
                ? "bg-action text-screen-ink shadow-[0_5px_0_var(--color-action-shadow)]"
                : "bg-white text-device-shadow shadow-[0_5px_0_var(--color-device-shadow)] hover:bg-screen",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
