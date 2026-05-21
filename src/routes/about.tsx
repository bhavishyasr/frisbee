import { createFileRoute, Link } from "@tanstack/react-router";
import { DeviceShell } from "@/components/DeviceShell";
import { DeviceNav } from "@/components/DeviceNav";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "What on earth is this? — FRISBEE" },
      { name: "description", content: "FRISBEE in plain English. What it does, why it's weird, and how to play." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <h1 className="sr-only">What on earth is FRISBEE</h1>

      <DeviceShell wide label="BIP-01 // ABOUT" status="EXPLAINING">
        <div className="flex items-start justify-between gap-4 mb-5">
          <Mascot size={84} />
          <div className="text-right font-mono text-[10px] text-screen-ink/70 uppercase">
            <p>what on earth</p>
            <p className="mt-1">is this thing</p>
          </div>
        </div>

        <section className="text-screen-ink lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-7 space-y-6 lg:space-y-0">
          <div className="lg:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/60 mb-2">
              ▶ the elevator pitch
            </p>
            <p className="text-lg sm:text-xl leading-snug font-medium">
              You drop one message a day about how things actually went. A tiny model
              eats your words, notices patterns, and at the end of the week tries to
              guess if you had a <Tag tone="good">yes week</Tag> or a <Tag tone="bad">no week</Tag>.
              Then <em>you</em> guess. Then the truth lands. <strong>Try to beat your own model.</strong>
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/60 mb-2">
              ▶ why though
            </p>
            <p className="text-base leading-relaxed text-screen-ink/85">
              There's a gap between who you <em>say</em> you are in the morning and who
              actually shows up by 11pm. FRISBEE is the smallest possible mirror for
              that gap. No streaks. No badges. No "you got 47 XP." Just: <em>did you
              know yourself this week, or did your model know you better?</em>
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/60 mb-2">
              ▶ the boring honest part
            </p>
            <p className="text-base leading-relaxed text-screen-ink/85">
              Everything lives in your browser's local storage (IndexedDB, if you're
              nerdy). No account. No server. No cloud. Close the tab → it's still
              there. Clear your browser data → it's gone forever. There is no
              "forgot password" because there's no password. There's no you on
              our side because there's no us.
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/60 mb-2">
              ▶ the five rooms
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Room to="/" name="TODAY">
                Type whatever. The bars under the box twitch live as you write — that's
                the device reading your vibes in four flavors: <b>drift</b>, <b>align</b>,
                <b> excuse</b>, <b>energy</b>. Hit <kbd className="kbd">⌘+Enter</kbd> to feed it.
              </Room>
              <Room to="/week" name="WEEK">
                Once a week, before the model shows you its guess, you commit yours.
                Blind. No peeking. Then both are revealed. <em>This is the game.</em>
              </Room>
              <Room to="/mirror" name="MIRROR">
                The engine surfaces little hypotheses — like "you say 'tomorrow' a lot
                in weeks that go sideways." Some are true. Some are coincidence. You decide.
              </Room>
              <Room to="/lab" name="LAB">
                A 7-step visual walkthrough of the actual math. Built so a high
                schooler can follow. (You can. It's not that bad.)
              </Room>
              <Room to="/me" name="ME">
                Export everything as JSON. Or nuke it all. Your data, your call —
                because it never left this browser in the first place.
              </Room>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-screen-ink/60 mb-2">
              ▶ how to actually play
            </p>
            <ol className="space-y-2 text-base leading-relaxed text-screen-ink/85 list-decimal pl-5 marker:font-mono marker:text-screen-ink/50">
              <li>Drop a message in <Link to="/" className="underline font-semibold">TODAY</Link>. Anything. "Studied. Then didn't." counts.</li>
              <li>Come back tomorrow. And the next day. The model has nothing to learn from one message.</li>
              <li>End of week, head to <Link to="/week" className="underline font-semibold">WEEK</Link>. Predict yourself first.</li>
              <li>Compare. Was the model right? Were you? Train one step. Repeat.</li>
              <li>Around week 4, things get spooky. That's the whole product.</li>
            </ol>
          </div>

          <div className="lg:col-span-2 pt-2 border-t-2 border-screen-ink/10 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="press-key bg-action text-screen-ink rounded-xl px-5 py-3 font-display font-black tracking-wider shadow-[0_5px_0_var(--color-action-shadow)]"
            >
              OK, FEED IT →
            </Link>
            <Link
              to="/lab"
              className="press-key bg-white text-screen-ink rounded-xl px-5 py-3 font-mono text-xs font-bold tracking-widest shadow-[0_5px_0_var(--color-device-shadow)]"
            >
              SHOW ME THE MATH
            </Link>
          </div>
        </section>
      </DeviceShell>


      <DeviceNav />

      <p className="text-center text-xs font-mono text-muted-foreground max-w-md mx-auto">
        still confused? that's allowed. just <Link to="/" className="underline">drop a message</Link> and see what happens.
      </p>
    </main>
  );
}

function Room({ to, name, children }: { to: string; name: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <Link
        to={to}
        className="shrink-0 self-start font-mono text-[10px] font-bold tracking-widest bg-screen-ink/5 hover:bg-screen-ink/10 text-screen-ink rounded-md px-2 py-1 transition-colors"
      >
        /{name.toLowerCase()}
      </Link>
      <p className="text-sm sm:text-base leading-relaxed text-screen-ink/85">{children}</p>
    </li>
  );
}

function Tag({ tone, children }: { tone: "good" | "bad"; children: React.ReactNode }) {
  const cls =
    tone === "good"
      ? "bg-emerald-300/60 text-screen-ink"
      : "bg-rose-300/60 text-screen-ink";
  return (
    <span className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}
