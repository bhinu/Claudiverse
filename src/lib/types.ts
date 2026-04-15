// ─── Anonymous Identity ───────────────────────────────────────────────────────

export interface Identity {
  id: string;
  name: string;   // e.g. "Neon Wolf"
  color: string;  // hex, used for text & borders
}

// ─── Room ─────────────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  code: string;       // short join code e.g. "JADE-7"
  name: string;       // e.g. "ECON 301"
  messages: Message[];
  presenceCount: number;
  lat?: number;
  lng?: number;
  createdAt: number;
}

// ─── Message (truth) ─────────────────────────────────────────────────────────

export interface Message {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  /** Semantic position [0–100, 0–100]. null while AI is processing. */
  coords: [number, number] | null;
  /** -1 → 1 */
  sentiment: number;
  /** Short human-values label */
  category: string;
  resonances: number;
  /** IDs of users who resonated */
  resonatedBy: string[];
  createdAt: number;
  pending: boolean;
}

// ─── Real-time Events (SSE payload) ──────────────────────────────────────────

export type RoomEvent =
  | { type: "init"; room: Room }
  | { type: "message_added"; message: Message }
  | { type: "message_updated"; message: Message }
  | { type: "presence"; count: number };

// ─── Map edge + bridge (kept for ForceGraphMap) ──────────────────────────────

export interface TruthEdge {
  id: string;
  sourceId: string;
  targetId: string;
  similarity: number;
}

export interface Bridge {
  edgeId: string;
  question: string;
  loading: boolean;
}
