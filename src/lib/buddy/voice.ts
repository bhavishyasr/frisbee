// Voice lexicon. Friend tone. Dry, warm, never therapy-speak, never hustle-bro.
// Pick by category, not random soup. Most lines have multiple variants — the
// brain rotates so the buddy doesn't sound like a chatbot loop.

export const VOICE = {
  greeting: {
    morning: ["mornin'.", "you're up. nice.", "early. respect.", "okay, fresh slate."],
    afternoon: ["yo.", "hey.", "back already?", "good — check in time."],
    evening: ["evening.", "long day?", "okay. wind down with me.", "spill it."],
    night: ["late. you good?", "couldn't sleep?", "I'm up too.", "real talk hour."],
  },

  empty_input: [
    "what happened today",
    "spill it",
    "real talk only",
    "one line. anything.",
    "tell me something true",
    "the messy version, please",
  ],

  first_ever_message: {
    drift: ["okay so we're starting in the dirt. respect for the honesty.", "first message and you're already telling on yourself. I like you."],
    align: ["oh. confident opener. okay, prove it then.", "starting strong. let's see if it sticks."],
    excuse: ["the qualifiers are loud already. noted.", "lots of 'but' in there. I'm watching."],
    energy: ["the vibes are immaculate. let's go.", "you came in hot. love that."],
    neutral: ["okay. I'm listening now. that's the whole job.", "first one's in the vault. nothing leaves this device."],
  },

  message_acknowledged: {
    drift: ["heard. drifty day.", "okay. honest.", "noted, in the dirt."],
    align: ["that lands.", "solid one.", "okay, you showed up."],
    excuse: ["a lot of 'almost' in there.", "the 'should' count is high.", "soft commitments noted."],
    energy: ["you're lit today.", "good fuel.", "okay, channel that."],
    flat: ["got it.", "in the vault.", "noted."],
  },

  duel: {
    challenge: ["bet.", "prove me wrong.", "let's see who knows you better.", "I've been studying."],
    user_picks_yes: ["bold. okay.", "you think? I'm not so sure.", "alright, defending it."],
    user_picks_no: ["called it on yourself. brave.", "rough self-read. let's see.", "okay, dark mode."],
    reveal_pause: ["...", "okay drumroll", "...one sec"],
    user_wins: ["okay you got me. respect.", "fine. you know you better than I do.", "...this round.", "lucky guess. probably."],
    model_wins: ["called it. don't be mad.", "I read you like a book.", "told you I've been studying.", "the math doesn't lie."],
    both_right: ["we agree. terrifying.", "lockstep. the vibes are aligned.", "we're on the same page."],
    both_wrong: ["okay neither of us saw that. wild week.", "we both whiffed. it happens.", "humbling for both of us."],
  },

  long_press: ["I see you.", "hi.", "yeah I'm here.", "*looks at you*", "what."],

  vault_wiped: ["clean slate. starting over.", "okay. fresh. I forgot everything.", "wiped. I'm a baby again."],

  hypothesis: [
    "I noticed something. when you write '{w}', the week usually goes well.",
    "pattern: '{w}' shows up on your good weeks. just saying.",
    "'{w}' is doing a lot of work in your good week vocabulary.",
  ],

  idle_thoughts: [
    "...",
    "thinking",
    "*hums*",
    "still here",
    "boop",
    "what's the move",
  ],
} as const;

export function pick<T>(arr: readonly T[], seed?: number): T {
  if (arr.length === 0) throw new Error("empty pick");
  const i = seed === undefined
    ? Math.floor(Math.random() * arr.length)
    : Math.abs(seed) % arr.length;
  return arr[i];
}

export function timeOfDayGreeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return pick(VOICE.greeting.night);
  if (h < 12) return pick(VOICE.greeting.morning);
  if (h < 17) return pick(VOICE.greeting.afternoon);
  if (h < 22) return pick(VOICE.greeting.evening);
  return pick(VOICE.greeting.night);
}
