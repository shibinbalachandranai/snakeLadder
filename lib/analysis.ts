import type { PlayerStats } from "./gameReducer";

export type PsychProfile = {
  title: string;
  emoji: string;
  bgClass: string;
  accentClass: string;
  insight: string;
  description: string;
  quote: string;
  quoteAuthor: string;
};

export type DiceSummary = {
  counts: Record<number, number>;
  average: number;
  mostCommon: number;
  total: number;
};

// ─── Dice analysis ───────────────────────────────────────────────────────────

export function getDiceSummary(diceHistory: number[]): DiceSummary {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const d of diceHistory) counts[d] = (counts[d] ?? 0) + 1;
  const total = diceHistory.length;
  const average =
    total > 0
      ? Math.round((diceHistory.reduce((a, b) => a + b, 0) / total) * 10) / 10
      : 0;
  const mostCommon = [1, 2, 3, 4, 5, 6].reduce(
    (best, d) => (counts[d] > counts[best] ? d : best),
    1
  );
  return { counts, average, mostCommon, total };
}

// ─── Psychological profiles ───────────────────────────────────────────────────

const PROFILES: Record<string, Omit<PsychProfile, "quote" | "quoteAuthor">> = {
  mastermind: {
    title: "The Mastermind",
    emoji: "🎯",
    bgClass: "bg-indigo-50",
    accentClass: "text-indigo-700",
    insight: "Strategic • Opportunity-seeker • Calculated",
    description:
      "You moved with purpose. Every ladder you found wasn't luck — it was the natural result of a mind that turns chaos into advantage. You see opportunity where others see obstacles.",
  },
  lucky_charm: {
    title: "The Lucky Charm",
    emoji: "🍀",
    bgClass: "bg-emerald-50",
    accentClass: "text-emerald-700",
    insight: "Optimistic • Magnetic • High-energy",
    description:
      "Fortune smiled on you today, and you were ready to accept it. Your open spirit and positive momentum attracted opportunity. The universe rewards those who stay in motion.",
  },
  comeback_king: {
    title: "The Comeback King",
    emoji: "👑",
    bgClass: "bg-amber-50",
    accentClass: "text-amber-700",
    insight: "Resilient • Gritty • Unbreakable",
    description:
      "You were swallowed by serpents, dragged backward, and still you rose. Champions are not made in the highs — they are forged in the lows. Today proved you are a champion.",
  },
  steady_climber: {
    title: "The Steady Climber",
    emoji: "🧗",
    bgClass: "bg-sky-50",
    accentClass: "text-sky-700",
    insight: "Disciplined • Patient • Consistent",
    description:
      "Your progress was not loud or dramatic — it was reliable. Step by step you moved forward, unmoved by distraction. Discipline, not luck, defines greatness. You proved that today.",
  },
  fighter: {
    title: "The Fighter",
    emoji: "⚡",
    bgClass: "bg-violet-50",
    accentClass: "text-violet-700",
    insight: "Tenacious • Driven • Won't quit",
    description:
      "You didn't win today, but you never stopped fighting. Every move you made was a statement: I am still here. That spirit is rarer than victory, and more valuable in the long run.",
  },
  unlucky_soul: {
    title: "The Storm Rider",
    emoji: "🌊",
    bgClass: "bg-rose-50",
    accentClass: "text-rose-700",
    insight: "Tested • Weathered • Battle-hardened",
    description:
      "The snakes conspired against you, but you kept rolling. You were tested by forces outside your control and showed the world what you are made of. Not every battle is yours to win — but every battle shapes you.",
  },
  philosopher: {
    title: "The Philosopher",
    emoji: "🌟",
    bgClass: "bg-yellow-50",
    accentClass: "text-yellow-700",
    insight: "Reflective • Calm • Growth-oriented",
    description:
      "Sometimes the dice simply don't cooperate, and yet here you are — unbothered, still present, still playing. That equanimity is wisdom. The one who can lose gracefully is already halfway to their next victory.",
  },
  warrior: {
    title: "The Warrior",
    emoji: "🔥",
    bgClass: "bg-orange-50",
    accentClass: "text-orange-700",
    insight: "Fierce • Bold • Unapologetic",
    description:
      "You played your game — no excuses, no retreat. Whether the board was in your favour or not, you showed up with full force. Warriors are not measured by a single battle, but by the fire they carry into every fight.",
  },
};

const QUOTES: Record<string, { text: string; author: string }[]> = {
  winner: [
    {
      text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
    },
    {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
    },
    {
      text: "It always seems impossible until it's done.",
      author: "Nelson Mandela",
    },
    {
      text: "Success usually comes to those who are too busy to be looking for it.",
      author: "Henry David Thoreau",
    },
  ],
  resilience: [
    {
      text: "Fall seven times, stand up eight.",
      author: "Japanese Proverb",
    },
    {
      text: "The oak fought the wind and was broken, the willow bent when it must and survived.",
      author: "Robert Jordan",
    },
    {
      text: "Rock bottom became the solid foundation on which I rebuilt my life.",
      author: "J.K. Rowling",
    },
    {
      text: "Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, I will try again tomorrow.",
      author: "Mary Anne Radmacher",
    },
  ],
  hardwork: [
    {
      text: "The harder you work for something, the greater you'll feel when you achieve it.",
      author: "Anonymous",
    },
    {
      text: "Dreams don't work unless you do.",
      author: "John C. Maxwell",
    },
    {
      text: "Opportunities don't happen. You create them.",
      author: "Chris Grosser",
    },
  ],
  philosophy: [
    {
      text: "You have power over your mind — not outside events. Realize this and you will find strength.",
      author: "Marcus Aurelius",
    },
    {
      text: "The impediment to action advances action. What stands in the way becomes the way.",
      author: "Marcus Aurelius",
    },
    {
      text: "It does not matter how slowly you go as long as you do not stop.",
      author: "Confucius",
    },
    {
      text: "In the middle of difficulty lies opportunity.",
      author: "Albert Einstein",
    },
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateProfile(
  stats: PlayerStats,
  isWinner: boolean
): PsychProfile {
  const { snakesHit, laddersClimbed, totalMoves } = stats;
  const snakeRate = totalMoves > 0 ? snakesHit / totalMoves : 0;
  const ladderRate = totalMoves > 0 ? laddersClimbed / totalMoves : 0;

  let profileKey: string;
  let quoteCategory: keyof typeof QUOTES;

  if (isWinner) {
    if (snakesHit >= 3 && laddersClimbed >= 1) {
      profileKey = "comeback_king";
      quoteCategory = "resilience";
    } else if (laddersClimbed >= 3) {
      profileKey = "lucky_charm";
      quoteCategory = "winner";
    } else if (ladderRate >= 0.25 && snakeRate <= 0.1) {
      profileKey = "mastermind";
      quoteCategory = "winner";
    } else {
      profileKey = "steady_climber";
      quoteCategory = "hardwork";
    }
  } else {
    if (snakesHit >= 4) {
      profileKey = "unlucky_soul";
      quoteCategory = "resilience";
    } else if (totalMoves >= 20) {
      profileKey = "fighter";
      quoteCategory = "resilience";
    } else if (snakesHit <= 1) {
      profileKey = "philosopher";
      quoteCategory = "philosophy";
    } else {
      profileKey = "warrior";
      quoteCategory = "hardwork";
    }
  }

  const base = PROFILES[profileKey];
  const quotePack = QUOTES[quoteCategory];
  const chosen = pickRandom(quotePack);

  return {
    ...base,
    quote: chosen.text,
    quoteAuthor: chosen.author,
  };
}
