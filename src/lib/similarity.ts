import type { TruthNode, TruthEdge } from "./types";
import { nanoid } from "./nanoid";

/** Euclidean distance in the 0–100 semantic coordinate space. */
function distance(a: [number, number], b: [number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

/** Convert distance to similarity (0–1). Max possible distance ≈ 141. */
function toSimilarity(dist: number): number {
  return Math.max(0, 1 - dist / 141);
}

/**
 * Recompute all edges from the current node list.
 * Only creates edges above a similarity threshold to avoid visual noise.
 */
export function computeEdges(
  nodes: TruthNode[],
  threshold = 0.78
): TruthEdge[] {
  const live = nodes.filter((n) => !n.pending);
  const edges: TruthEdge[] = [];

  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const dist = distance(live[i].coords, live[j].coords);
      const sim = toSimilarity(dist);
      if (sim >= threshold) {
        edges.push({
          id: `${live[i].id}-${live[j].id}`,
          sourceId: live[i].id,
          targetId: live[j].id,
          similarity: sim,
        });
      }
    }
  }

  // Keep only the strongest edges (cap at 40 for perf)
  return edges
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 40);
}
