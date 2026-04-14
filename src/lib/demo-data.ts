import type { TruthNode } from "./types";
import { nanoid } from "./nanoid";

/**
 * 20 seed truths representing a diverse, polarized UW-Madison lecture hall.
 * Pre-computed coords and sentiment so no API calls are needed for seeding.
 */
export const DEMO_TRUTHS: Omit<TruthNode, "id" | "createdAt" | "pending">[] = [
  {
    text: "I'm drowning in student loans and I smile every time someone talks about their 'passion'.",
    coords: [18, 72],
    sentiment: -0.72,
    category: "Financial Anxiety",
  },
  {
    text: "I've already decided I'm dropping out after this semester. I just haven't told my parents yet.",
    coords: [22, 58],
    sentiment: -0.55,
    category: "Life Direction",
  },
  {
    text: "I don't actually believe in my thesis topic. I chose it because my advisor needed a body.",
    coords: [35, 65],
    sentiment: -0.48,
    category: "Academic Integrity",
  },
  {
    text: "Every group project I'm in, I end up doing 90% of the work and saying nothing.",
    coords: [28, 45],
    sentiment: -0.6,
    category: "Unrecognized Effort",
  },
  {
    text: "I think social media activism is mostly performative and makes real change harder.",
    coords: [62, 30],
    sentiment: -0.35,
    category: "Social Change",
  },
  {
    text: "My family is proud I'm here but they don't understand anything I'm studying. It's lonely.",
    coords: [20, 30],
    sentiment: -0.65,
    category: "Belonging",
  },
  {
    text: "I feel guilty being 'neutral' on issues that are treated as moral obligations.",
    coords: [55, 40],
    sentiment: -0.3,
    category: "Moral Pressure",
  },
  {
    text: "I come from a conservative town and I don't share my real views here because I'm afraid.",
    coords: [70, 35],
    sentiment: -0.5,
    category: "Political Safety",
  },
  {
    text: "I genuinely think most of what we call 'networking' is just learning to be fake.",
    coords: [48, 55],
    sentiment: -0.4,
    category: "Authenticity",
  },
  {
    text: "Some days I sit in this lecture hall and feel like everyone has a plan except me.",
    coords: [30, 60],
    sentiment: -0.7,
    category: "Purpose",
  },
  {
    text: "I'm the first in my family to go to college and I feel like an imposter every single day.",
    coords: [15, 50],
    sentiment: -0.62,
    category: "Belonging",
  },
  {
    text: "I secretly believe I'm smarter than my professors in this subject, and that scares me.",
    coords: [75, 65],
    sentiment: 0.1,
    category: "Ambition",
  },
  {
    text: "I changed my major three times because I keep chasing what I think I *should* want.",
    coords: [40, 48],
    sentiment: -0.25,
    category: "Life Direction",
  },
  {
    text: "The most meaningful conversations I've had here were with strangers, never classmates.",
    coords: [50, 25],
    sentiment: 0.15,
    category: "Human Connection",
  },
  {
    text: "I grew up very poor. Watching people casually waste money here genuinely makes me angry.",
    coords: [25, 78],
    sentiment: -0.7,
    category: "Financial Anxiety",
  },
  {
    text: "I think I'm only here because my parents wanted me to be. I'd rather be building something.",
    coords: [65, 58],
    sentiment: -0.3,
    category: "Autonomy",
  },
  {
    text: "I've realized that kindness, not intelligence, is the thing I most want to cultivate.",
    coords: [55, 80],
    sentiment: 0.75,
    category: "Human Values",
  },
  {
    text: "I failed a class last semester and lied to everyone about it, including my therapist.",
    coords: [10, 65],
    sentiment: -0.8,
    category: "Shame",
  },
  {
    text: "Underneath everything, I just want to make something that outlasts me. That's my whole drive.",
    coords: [78, 75],
    sentiment: 0.65,
    category: "Legacy",
  },
  {
    text: "I'm furious about the state of the world but I'm too exhausted to do anything about it.",
    coords: [42, 20],
    sentiment: -0.6,
    category: "Civic Despair",
  },
];

export function buildDemoNodes(): TruthNode[] {
  return DEMO_TRUTHS.map((t) => ({
    ...t,
    id: nanoid(),
    pending: false,
    createdAt: Date.now() - Math.floor(Math.random() * 60000),
  }));
}
