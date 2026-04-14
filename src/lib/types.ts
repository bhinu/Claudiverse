/** A single "truth" node in the latent space map. */
export interface TruthNode {
  id: string;
  text: string;
  /** [x, y] in 0–100 semantic space */
  coords: [number, number];
  /** -1 (negative) → 0 (neutral) → 1 (positive) */
  sentiment: number;
  /** Short human-values label, e.g. "Career Anxiety" */
  category: string;
  /** True while awaiting AI processing */
  pending: boolean;
  createdAt: number;
}

/** An edge connecting two semantically similar nodes. */
export interface TruthEdge {
  id: string;
  sourceId: string;
  targetId: string;
  /** 0–1, strength of semantic similarity */
  similarity: number;
}

/** A "Steelman Icebreaker" generated for a specific edge. */
export interface Bridge {
  edgeId: string;
  question: string;
  loading: boolean;
}

/** Shape returned by the /api/process-truth endpoint. */
export interface ProcessTruthResponse {
  coords: [number, number];
  sentiment: number;
  category: string;
}

/** Shape returned by the /api/generate-bridge endpoint. */
export interface GenerateBridgeResponse {
  question: string;
}
