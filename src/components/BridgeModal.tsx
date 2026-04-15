"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useRoom } from "@/context/RoomContext";

export default function BridgeModal() {
  const { state, identity, dispatch, postBridgeMessage } = useRoom();
  const { activeEdgeId, bridges, edges, messages, bridgeChats } = state;

  const isOpen = !!activeEdgeId;
  const bridge = activeEdgeId ? bridges[activeEdgeId] : null;
  const edge = activeEdgeId ? edges.find((e) => e.id === activeEdgeId) : null;
  const msgA = edge ? messages.find((m) => m.id === edge.sourceId) : null;
  const msgB = edge ? messages.find((m) => m.id === edge.targetId) : null;
  const chatMessages = activeEdgeId ? (bridgeChats[activeEdgeId] ?? []) : [];

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  function close() { dispatch({ type: "CLOSE_MODAL" }); }

  function send() {
    const text = draft.trim();
    if (!text || !activeEdgeId) return;
    postBridgeMessage(activeEdgeId, text);
    setDraft("");
  }

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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
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
                  Conversation Starter
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
                        background: "linear-gradient(90deg, #fb923c, #eab308)",
                        boxShadow: "0 0 8px rgba(251,146,60,0.6)",
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-600 tabular-nums shrink-0">
                    {Math.round(edge.similarity * 100)}% resonance
                  </span>
                </div>
              )}

              {/* Chat */}
              {!bridge?.loading && (
                <div className="mt-4 border-t border-white/5 pt-3 flex flex-col gap-2">
                  <div className="h-36 overflow-y-auto flex flex-col gap-1.5 pr-1"
                    style={{ scrollbarWidth: "none" }}>
                    {chatMessages.length === 0 && (
                      <p className="text-[11px] text-slate-700 text-center mt-4">
                        Be the first to respond…
                      </p>
                    )}
                    {chatMessages.map((m) => {
                      const isMe = m.authorId === identity.id;
                      return (
                        <div key={m.id} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                          <span className="text-[10px]" style={{ color: `${m.authorColor}99` }}>
                            {isMe ? "You" : m.authorName}
                          </span>
                          <div className="max-w-[85%] rounded-xl px-3 py-1.5 text-[12px] leading-relaxed"
                            style={{
                              background: isMe ? `${m.authorColor}18` : "rgba(255,255,255,0.05)",
                              border: `1px solid ${isMe ? m.authorColor + "33" : "rgba(255,255,255,0.06)"}`,
                              color: "#e2e8f0",
                            }}>
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="flex gap-2 mt-1">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder="Reply…"
                      maxLength={200}
                      className="flex-1 rounded-lg px-3 py-1.5 text-[12px] bg-white/5 border border-white/8 text-slate-200 placeholder:text-slate-700 outline-none focus:border-orange-400/30 transition-colors"
                    />
                    <button
                      onClick={send}
                      disabled={!draft.trim()}
                      className="rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-30"
                      style={{ background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.25)" }}>
                      <Send size={12} className="text-orange-400" />
                    </button>
                  </div>
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
      <span className="text-xs text-slate-600">Thinking of something to say</span>
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
