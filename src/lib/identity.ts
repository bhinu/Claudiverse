import type { Identity } from "./types";
import { nanoid } from "./nanoid";

const ADJECTIVES = [
  "Neon", "Cosmic", "Ember", "Midnight", "Aurora",
  "Quantum", "Shadow", "Crystal", "Stellar", "Prism",
  "Indigo", "Lunar", "Solar", "Arctic", "Velvet",
];

const ANIMALS = [
  "Wolf", "Fox", "Owl", "Hawk", "Lynx",
  "Raven", "Tiger", "Bear", "Eagle", "Deer",
  "Crane", "Viper", "Bison", "Heron", "Mink",
];

const COLORS = [
  "#22d3ee", "#a78bfa", "#34d399", "#fb923c", "#f472b6",
  "#60a5fa", "#facc15", "#4ade80", "#f87171", "#818cf8",
  "#2dd4bf", "#e879f9", "#38bdf8", "#a3e635", "#fbbf24",
];

/** Generate a fresh anonymous identity. Deterministic from a seed if provided. */
export function generateIdentity(seed?: string): Identity {
  const hash = seed
    ? [...seed].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0)
    : Math.floor(Math.random() * 1e9);
  const abs = Math.abs(hash);
  return {
    id: seed ?? nanoid(),
    name: `${ADJECTIVES[abs % ADJECTIVES.length]} ${ANIMALS[abs % ANIMALS.length]}`,
    color: COLORS[abs % COLORS.length],
  };
}

const STORAGE_KEY = "latent-hall-identity-v1";

/** Load or create a persistent identity from localStorage. */
export function getOrCreateIdentity(): Identity {
  if (typeof window === "undefined") {
    return { id: "server", name: "Anonymous", color: "#94a3b8" };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Identity;
  } catch { /* ignore */ }

  const identity = generateIdentity();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch { /* ignore */ }
  return identity;
}
