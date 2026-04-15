"use client";

/**
 * RoomContext
 * -----------
 * Real-time room state via polling (every 3s).
 *
 * Polling is used instead of SSE because Next.js runs route handlers in
 * isolated worker threads that don't share in-memory state. Polling reads from
 * the shared file-based store and is reliable across all workers.
 */

import {
  createContext, useCallback, useContext, useEffect,
  useReducer, useRef, useState,
} from "react";
import type { Message, Room, TruthEdge, Bridge, BridgeMessage, Identity } from "@/lib/types";
import { computeEdges } from "@/lib/similarity";
import { getOrCreateIdentity } from "@/lib/identity";

const POLL_INTERVAL = 3000; // ms

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  room: Room | null;
  messages: Message[];
  edges: TruthEdge[];
  bridges: Record<string, Bridge>;
  activeEdgeId: string | null;
  bridgeChats: Record<string, BridgeMessage[]>;
}

type Action =
  | { type: "SET_ROOM"; room: Room }
  | { type: "SET_MESSAGES"; messages: Message[] }
  | { type: "MERGE_MESSAGES"; incoming: Message[] }
  | { type: "SET_PRESENCE"; count: number }
  | { type: "SET_BRIDGE_LOADING"; edgeId: string }
  | { type: "SET_BRIDGE"; edgeId: string; question: string }
  | { type: "OPEN_MODAL"; edgeId: string }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_BRIDGE_MESSAGES"; bridgeId: string; messages: BridgeMessage[] }
  | { type: "APPEND_BRIDGE_MESSAGE"; bridgeId: string; message: BridgeMessage };

function toNodes(messages: Message[]) {
  return messages
    .filter((m) => m.coords !== null)
    .map((m) => ({
      id: m.id,
      text: m.text,
      coords: m.coords as [number, number],
      sentiment: m.sentiment,
      category: m.category,
      pending: m.pending,
      createdAt: m.createdAt,
    }));
}

function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m); // upsert (handles updates)
  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ROOM":
      return { ...state, room: action.room };
    case "SET_MESSAGES": {
      const messages = action.messages;
      return { ...state, messages, edges: computeEdges(toNodes(messages)) };
    }
    case "MERGE_MESSAGES": {
      if (action.incoming.length === 0) return state;
      const messages = mergeMessages(state.messages, action.incoming);
      return { ...state, messages, edges: computeEdges(toNodes(messages)) };
    }
    case "SET_PRESENCE":
      return state.room
        ? { ...state, room: { ...state.room, presenceCount: action.count } }
        : state;
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
          [action.edgeId]: { edgeId: action.edgeId, question: action.question, loading: false },
        },
      };
    case "OPEN_MODAL":
      return { ...state, activeEdgeId: action.edgeId };
    case "CLOSE_MODAL":
      return { ...state, activeEdgeId: null };
    case "SET_BRIDGE_MESSAGES":
      return {
        ...state,
        bridgeChats: { ...state.bridgeChats, [action.bridgeId]: action.messages },
      };
    case "APPEND_BRIDGE_MESSAGE": {
      const existing = state.bridgeChats[action.bridgeId] ?? [];
      return {
        ...state,
        bridgeChats: {
          ...state.bridgeChats,
          [action.bridgeId]: [...existing, action.message],
        },
      };
    }
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ContextValue {
  state: State;
  identity: Identity;
  postTruth: (text: string) => void;
  resonate: (messageId: string) => void;
  clickEdge: (edgeId: string) => void;
  postBridgeMessage: (bridgeId: string, text: string) => void;
  dispatch: React.Dispatch<Action>;
}

const RoomContext = createContext<ContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RoomProvider({ roomId, children }: { roomId: string; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    room: null, messages: [], edges: [], bridges: {}, activeEdgeId: null, bridgeChats: {},
  });
  const [identity, setIdentity] = useState<Identity>({
    id: "loading", name: "…", color: "#94a3b8",
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track how many messages the client already has (for delta polling)
  const seenCount = useRef(0);
  const identityRef = useRef(identity);
  identityRef.current = identity;

  // Load identity once on mount (avoids hydration mismatch)
  useEffect(() => {
    setIdentity(getOrCreateIdentity());
  }, []);

  // ── Polling loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    async function poll(isFirst: boolean) {
      const userId = identityRef.current.id;
      const after = isFirst ? 0 : seenCount.current;
      try {
        const res = await fetch(
          `/api/room/${roomId}/poll?after=${after}&userId=${encodeURIComponent(userId)}`
        );
        if (!res.ok) return;
        const data = await res.json();

        dispatch({ type: "SET_ROOM", room: data.room });
        dispatch({ type: "SET_PRESENCE", count: data.room.presenceCount });

        if (isFirst) {
          dispatch({ type: "SET_MESSAGES", messages: data.messages });
        } else {
          dispatch({ type: "MERGE_MESSAGES", incoming: data.messages });
        }
        seenCount.current = data.total;
      } catch { /* network hiccup — retry next interval */ }
    }

    poll(true);
    const id = setInterval(() => poll(false), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [roomId]);

  // ── Post a truth ──────────────────────────────────────────────────────────
  const postTruth = useCallback(
    (text: string) => {
      const { id, name, color } = identityRef.current;
      fetch(`/api/room/${roomId}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, authorId: id, authorName: name, authorColor: color }),
      })
        .then(() => {
          // Poll immediately after posting for snappy feedback
          fetch(`/api/room/${roomId}/poll?after=${seenCount.current}&userId=${encodeURIComponent(id)}`)
            .then((r) => r.json())
            .then((data) => {
              dispatch({ type: "MERGE_MESSAGES", incoming: data.messages });
              seenCount.current = data.total;
            })
            .catch(() => {});
        })
        .catch(console.error);
    },
    [roomId]
  );

  // ── Resonate ──────────────────────────────────────────────────────────────
  const resonate = useCallback(
    (messageId: string) => {
      fetch(`/api/room/${roomId}/resonate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, userId: identityRef.current.id }),
      })
        .then(() => {
          // Pick up the updated resonance count on the next natural poll
        })
        .catch(console.error);
    },
    [roomId]
  );

  // ── Click edge → icebreaker ───────────────────────────────────────────────
  const clickEdge = useCallback((edgeId: string) => {
    dispatch({ type: "OPEN_MODAL", edgeId });
    const { bridges, edges, messages } = stateRef.current;
    if (bridges[edgeId]) return;

    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const nodeA = messages.find((m) => m.id === edge.sourceId);
    const nodeB = messages.find((m) => m.id === edge.targetId);
    if (!nodeA || !nodeB) return;

    dispatch({ type: "SET_BRIDGE_LOADING", edgeId });
    fetch("/api/generate-bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ truthA: nodeA.text, truthB: nodeB.text }),
    })
      .then((r) => r.json())
      .then((d) => dispatch({ type: "SET_BRIDGE", edgeId, question: d.question }))
      .catch(() =>
        dispatch({
          type: "SET_BRIDGE",
          edgeId,
          question: "What's one thing you carry quietly that you wish someone here could understand?",
        })
      );
  }, []);

  // ── Bridge chat polling (while a modal is open) ───────────────────────────
  useEffect(() => {
    const edgeId = stateRef.current.activeEdgeId;
    if (!edgeId || !roomId) return;
    const capturedEdgeId = edgeId;

    async function pollChat() {
      const res = await fetch(`/api/room/${roomId}/bridge/${capturedEdgeId}`).catch(() => null);
      if (!res?.ok) return;
      const data = await res.json();
      dispatch({ type: "SET_BRIDGE_MESSAGES", bridgeId: capturedEdgeId, messages: data.messages });
    }

    pollChat();
    const id = setInterval(pollChat, 2000);
    return () => clearInterval(id);
  }, [roomId, state.activeEdgeId]);

  // ── Post bridge chat message ───────────────────────────────────────────────
  const postBridgeMessage = useCallback(
    (bridgeId: string, text: string) => {
      const { id, name, color } = identityRef.current;
      const optimistic: BridgeMessage = {
        id: `tmp-${Date.now()}`,
        bridgeId,
        authorId: id,
        authorName: name,
        authorColor: color,
        text,
        createdAt: Date.now(),
      };
      dispatch({ type: "APPEND_BRIDGE_MESSAGE", bridgeId, message: optimistic });

      fetch(`/api/room/${roomId}/bridge/${bridgeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, authorId: id, authorName: name, authorColor: color }),
      }).catch(console.error);
    },
    [roomId]
  );

  return (
    <RoomContext.Provider value={{ state, identity, postTruth, resonate, clickEdge, postBridgeMessage, dispatch }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
}
