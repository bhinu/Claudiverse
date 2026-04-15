"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useRoom } from "@/context/RoomContext";

export default function BridgeModal() {
  const { state, dispatch } = useRoom();
  const { activeEdgeId, bridges, edges, messages } = state;

  const isOpen = !!activeEdgeId;
  const bridge = activeEdgeId ? bridges[activeEdgeId] : null;
  const edge = activeEdgeId ? edges.find((e) => e.id === activeEdgeId) : null;
  const msgA = edge ? messages.find((m) => m.id === edge.sourceId) : null;
  const msgB = edge ? messages.find((m) => m.id === edge.targetId) : null;

  function close() { dispatch({ type: "CLOSE_MODAL" }); }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70"
            style={{ backdropFilter: "blur(6px)" }}
            onClick={close}
          />

          <motion.div key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md"
          >
            <div className="glass-bright relative rounded-2xl p-6 overflow-hidden"
              style={{
                borderColor: "rgba(34,211,238,0.25)",
                boxShadow: "0 0 0 1px rgba(34,211,238,0.08), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,211,238,0.06)",
              }}>

              {/* Corner aurora */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)" }} />

              <button onClick={close}
                className="absolute top-3.5 right-3.5 text-slate-600 hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-white/5">
                <X size={14} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={13} className="text-cyan-400" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-glow-cyan"
                  style={{ color: "#22d3ee" }}>
                  Bridge Icebreaker
                </span>
              </div>

              {/* Two truths */}
              {msgA && msgB && (
                <div className="flex gap-2 mb-5">
                  <TruthChip text={msgA.text} category={msgA.category} color={msgA.authorColor} />
                  <div className="flex items-center text-slate-700 text-base shrink-0 mt-1">↔</div>
                  <TruthChip text={msgB.text} category={msgB.category} color={msgB.authorColor} />
                </div>
              )}

              {bridge?.loading ? <LoadingDots /> : (
                <motion.p key={bridge?.question}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium leading-relaxed text-slate-100">
                  &ldquo;{bridge?.question}&rdquo;
                </motion.p>
              )}

              {edge && !bridge?.loading && (
                <div className="mt-4 flex items-center gap-2.5">
                  <div className="flex-1 h-px rounded-full overflow-hidden bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${edge.similarity * 100}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #22d3ee, #a78bfa)",
                        boxShadow: "0 0 8px rgba(34,211,238,0.5)",
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-600 tabular-nums shrink-0">
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

function TruthChip({ text, category, color }: { text: string; category: string; color: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-lg px-2.5 py-2"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22` }}>
      <div className="text-[10px] mb-0.5 truncate" style={{ color: `${color}99` }}>{category}</div>
      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{text}</p>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-xs text-slate-600">Generating icebreaker</span>
      {[0, 1, 2].map((i) => (
        <motion.span key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className="w-1 h-1 rounded-full inline-block bg-cyan-400"
        />
      ))}
    </div>
  );
}
