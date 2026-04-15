import type { TruthEdge } from "./types";

/** Minimal node shape needed for edge computation. */
export interface EdgeNode {
  id: string;
  coords: [number, number];
  pending: boolean;
}

function distance(a: [number, number], b: [number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function toSimilarity(dist: number): number {
  return Math.max(0, 1 - dist / 141);
}

/**
 * Recompute all edges from a list of positioned nodes.
 * Only creates edges above the similarity threshold to avoid visual noise.
 */
export function computeEdges(nodes: EdgeNode[], threshold = 0.62): TruthEdge[] {
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

  return edges.sort((a, b) => b.similarity - a.similarity).slice(0, 40);
}
