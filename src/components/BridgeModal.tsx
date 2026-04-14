"use client";

/**
 * BridgeModal
 * -----------
 * Framer Motion modal that surfaces the "Steelman Icebreaker" question
 * when a user clicks a Bridge (edge) between two nodes.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useLatentHall } from "@/context/LatentHallContext";

export default function BridgeModal() {
  const { state, dispatch } = useLatentHall();
  const { activeEdgeId, bridges, edges, nodes } = state;

  const isOpen = !!activeEdgeId;
  const bridge = activeEdgeId ? bridges[activeEdgeId] : null;
  const edge = activeEdgeId ? edges.find((e) => e.id === activeEdgeId) : null;
  const nodeA = edge ? nodes.find((n) => n.id === edge.sourceId) : null;
  const nodeB = edge ? nodes.find((n) => n.id === edge.targetId) : null;

  function close() {
    dispatch({ type: "CLOSE_MODAL" });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="modal-backdrop fixed inset-0 z-40 bg-black/60"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md"
          >
            <div
              className="relative rounded-2xl p-6 border overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
                borderColor: "rgba(0,212,255,0.25)",
                boxShadow:
                  "0 0 0 1px rgba(0,212,255,0.08), 0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,212,255,0.08)",
              }}
            >
              {/* Corner glow */}
              <div
                className="absolute -top-10 -right-10 h-40 w-40 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)",
                }}
              />

              {/* Close button */}
              <button
                onClick={close}
                className="absolute top-3 right-3 text-slate-600 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-cyan-400" />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#00d4ff", textShadow: "0 0 8px rgba(0,212,255,0.5)" }}
                >
                  Bridge Icebreaker
                </span>
              </div>

              {/* Two truth snippets */}
              {nodeA && nodeB && (
                <div className="flex gap-2 mb-5">
                  <TruthChip text={nodeA.text} category={nodeA.category} />
                  <div className="flex items-center text-cyan-800 text-lg font-light">
                    ↔
                  </div>
                  <TruthChip text={nodeB.text} category={nodeB.category} />
                </div>
              )}

              {/* The question */}
              {bridge?.loading ? (
                <LoadingDots />
              ) : (
                <motion.p
                  key={bridge?.question}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base font-medium leading-relaxed text-slate-100"
                  style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
                >
                  &ldquo;{bridge?.question}&rdquo;
                </motion.p>
              )}

              {/* Similarity score */}
              {edge && !bridge?.loading && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-[2px] rounded-full bg-[#21262d] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${edge.similarity * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #00d4ff, #a855f7)",
                        boxShadow: "0 0 6px rgba(0,212,255,0.5)",
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-600 tabular-nums">
                    {Math.round(edge.similarity * 100)}% resonance
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TruthChip({ text, category }: { text: string; category: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-lg border border-[#21262d] bg-[#050810] px-2.5 py-2">
      <div className="text-[10px] text-slate-600 mb-0.5 truncate">{category}</div>
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{text}</p>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-xs text-slate-600">Generating icebreaker</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className="inline-block w-1 h-1 rounded-full bg-cyan-400"
        />
      ))}
    </div>
  );
}
