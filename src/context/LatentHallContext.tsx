"use client";

/**
 * LatentHallContext
 * -----------------
 * Central state store for nodes, edges, bridges, and the active modal.
 * Persists nodes to localStorage so demo state survives refreshes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
} from "react";
import type { TruthNode, TruthEdge, Bridge } from "@/lib/types";
import { computeEdges } from "@/lib/similarity";
import { nanoid } from "@/lib/nanoid";

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  nodes: TruthNode[];
  edges: TruthEdge[];
  bridges: Record<string, Bridge>;
  /** Edge id of the currently open bridge modal (null = closed) */
  activeEdgeId: string | null;
}

const STORAGE_KEY = "latent-hall-nodes-v1";

function loadNodes(): TruthNode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TruthNode[]) : [];
  } catch {
    return [];
  }
}

function saveNodes(nodes: TruthNode[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  } catch {
    /* quota exceeded – ignore */
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD_NODE_OPTIMISTIC"; node: TruthNode }
  | {
      type: "RESOLVE_NODE";
      id: string;
      coords: [number, number];
      sentiment: number;
      category: string;
    }
  | { type: "SEED_NODES"; nodes: TruthNode[] }
  | { type: "CLEAR_NODES" }
  | { type: "SET_BRIDGE_LOADING"; edgeId: string }
  | { type: "SET_BRIDGE"; edgeId: string; question: string }
  | { type: "OPEN_MODAL"; edgeId: string }
  | { type: "CLOSE_MODAL" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_NODE_OPTIMISTIC": {
      const nodes = [...state.nodes, action.node];
      const edges = computeEdges(nodes);
      return { ...state, nodes, edges };
    }
    case "RESOLVE_NODE": {
      const nodes = state.nodes.map((n) =>
        n.id === action.id
          ? {
              ...n,
              coords: action.coords,
              sentiment: action.sentiment,
              category: action.category,
              pending: false,
            }
          : n
      );
      const edges = computeEdges(nodes);
      return { ...state, nodes, edges };
    }
    case "SEED_NODES": {
      const nodes = [...state.nodes, ...action.nodes];
      const edges = computeEdges(nodes);
      return { ...state, nodes, edges };
    }
    case "CLEAR_NODES":
      return { ...state, nodes: [], edges: [], bridges: {}, activeEdgeId: null };
    case "SET_BRIDGE_LOADING":
      return {
        ...state,
        bridges: {
          ...state.bridges,
          [action.edgeId]: { edgeId: action.edgeId, question: "", loading: true },
        },
      };
    case "SET_BRIDGE":
      return {
        ...state,
        bridges: {
          ...state.bridges,
          [action.edgeId]: {
            edgeId: action.edgeId,
            question: action.question,
            loading: false,
          },
        },
      };
    case "OPEN_MODAL":
      return { ...state, activeEdgeId: action.edgeId };
    case "CLOSE_MODAL":
      return { ...state, activeEdgeId: null };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ContextValue {
  state: State;
  dispatch: Dispatch<Action>;
  submitTruth: (text: string) => void;
  clickEdge: (edgeId: string) => void;
}

const LatentHallContext = createContext<ContextValue | null>(null);

export function LatentHallProvider({ children }: { children: React.ReactNode }) {
  const initialNodes = loadNodes();
  const [state, dispatch] = useReducer(reducer, {
    nodes: initialNodes,
    edges: computeEdges(initialNodes),
    bridges: {},
    activeEdgeId: null,
  });

  // Persist nodes on every change
  useEffect(() => {
    saveNodes(state.nodes.filter((n) => !n.pending));
  }, [state.nodes]);

  // ── Submit a new truth (optimistic UI + async AI resolution) ──────────────
  const submitTruth = useCallback(
    (text: string) => {
      const id = nanoid();
      // Optimistic node: random coords, neutral sentiment, pending=true
      const optimisticNode: TruthNode = {
        id,
        text,
        coords: [
          40 + (Math.random() - 0.5) * 20,
          40 + (Math.random() - 0.5) * 20,
        ],
        sentiment: 0,
        category: "Processing…",
        pending: true,
        createdAt: Date.now(),
      };
      dispatch({ type: "ADD_NODE_OPTIMISTIC", node: optimisticNode });

      // Fire-and-forget AI call
      fetch("/api/process-truth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truth: text }),
      })
        .then((r) => r.json())
        .then((data) => {
          dispatch({
            type: "RESOLVE_NODE",
            id,
            coords: data.coords,
            sentiment: data.sentiment,
            category: data.category,
          });
        })
        .catch(() => {
          // Resolve with a slight random offset so it at least appears
          dispatch({
            type: "RESOLVE_NODE",
            id,
            coords: [
              50 + (Math.random() - 0.5) * 30,
              50 + (Math.random() - 0.5) * 30,
            ],
            sentiment: 0,
            category: "Human Experience",
          });
        });
    },
    [dispatch]
  );

  // ── Click an edge → fetch bridge (cached after first load) ───────────────
  const clickEdge = useCallback(
    (edgeId: string) => {
      dispatch({ type: "OPEN_MODAL", edgeId });

      if (state.bridges[edgeId]) return; // already cached

      const edge = state.edges.find((e) => e.id === edgeId);
      if (!edge) return;

      const nodeA = state.nodes.find((n) => n.id === edge.sourceId);
      const nodeB = state.nodes.find((n) => n.id === edge.targetId);
      if (!nodeA || !nodeB) return;

      dispatch({ type: "SET_BRIDGE_LOADING", edgeId });

      fetch("/api/generate-bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truthA: nodeA.text, truthB: nodeB.text }),
      })
        .then((r) => r.json())
        .then((data) => {
          dispatch({ type: "SET_BRIDGE", edgeId, question: data.question });
        })
        .catch(() => {
          dispatch({
            type: "SET_BRIDGE",
            edgeId,
            question:
              "What's one thing you carry quietly that you wish someone here could understand?",
          });
        });
    },
    [state.bridges, state.edges, state.nodes]
  );

  return (
    <LatentHallContext.Provider value={{ state, dispatch, submitTruth, clickEdge }}>
      {children}
    </LatentHallContext.Provider>
  );
}

export function useLatentHall() {
  const ctx = useContext(LatentHallContext);
  if (!ctx) throw new Error("useLatentHall must be used inside LatentHallProvider");
  return ctx;
}
