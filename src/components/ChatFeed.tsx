"use client";

/**
 * ChatFeed
 * --------
 * Scrollable live feed of anonymous truths with resonate buttons.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Clock } from "lucide-react";
import { useRoom } from "@/context/RoomContext";
import type { Message } from "@/lib/types";

function sentimentColor(s: number): string {
  if (s > 0.4) return "#34d399";
  if (s > 0)   return "#22d3ee";
  if (s > -0.4) return "#a78bfa";
  return "#fb7185";
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function ChatFeed() {
  const { state, identity, resonate } = useRoom();
  const { messages } = state;
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (pinned) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pinned]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600 px-6 text-center">
        <Sparkles size={28} className="opacity-30" />
        <p className="text-sm">No truths yet.<br />Be the first to speak.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5"
        onScroll={(e) => {
          const el = e.currentTarget;
          const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
          setPinned(nearBottom);
        }}
      >
        <AnimatePresence initial={false}>
          {[...messages].reverse().map((msg) => (
            <ChatCard
              key={msg.id}
              message={msg}
              isMine={msg.authorId === identity.id}
              hasResonated={msg.resonatedBy.includes(identity.id)}
              onResonate={() => resonate(msg.id)}
            />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom pill */}
      <AnimatePresence>
        {!pinned && (
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => { setPinned(true); bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] glass-bright border border-cyan-500/20 text-cyan-400 flex items-center gap-1.5"
          >
            New messages ↓
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Single message card ──────────────────────────────────────────────────────

function ChatCard({ message, isMine, hasResonated, onResonate }: {
  message: Message;
  isMine: boolean;
  hasResonated: boolean;
  onResonate: () => void;
}) {
  const [popped, setPopped] = useState(false);
  const color = message.pending ? "#334155" : sentimentColor(message.sentiment);

  function handleResonate() {
    onResonate();
    setPopped(true);
    setTimeout(() => setPopped(false), 400);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="rounded-xl p-3.5 relative overflow-hidden"
      style={{
        background: isMine ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.03)",
        borderStyle: "solid",
        borderTopWidth: "1px",
        borderRightWidth: "1px",
        borderBottomWidth: "1px",
        borderLeftWidth: "3px",
        borderTopColor: `${color}22`,
        borderRightColor: `${color}22`,
        borderBottomColor: `${color}22`,
        borderLeftColor: color,
      }}
    >
      {/* Author row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center"
            style={{ background: `${message.authorColor}22`, color: message.authorColor }}>
            {message.authorName.split(" ").map((w) => w[0]).join("")}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: message.authorColor }}>
            {isMine ? "You" : message.authorName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <Clock size={9} />
          <span className="text-[10px]">{timeAgo(message.createdAt)}</span>
        </div>
      </div>

      {/* Text */}
      {message.pending ? (
        <div className="h-4 rounded shimmer mb-2" />
      ) : (
        <p className="text-xs text-slate-300 leading-relaxed mb-2.5">{message.text}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {message.pending ? (
          <span className="text-[10px] text-slate-600 italic">Mapping to latent space…</span>
        ) : (
          <span className="text-[10px] rounded-full px-2 py-0.5 font-medium"
            style={{ background: `${color}18`, color }}>
            {message.category}
          </span>
        )}

        {/* Resonate button */}
        {!message.pending && !isMine && (
          <button
            onClick={handleResonate}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] transition-all ${popped ? "resonate-pop" : ""}`}
            style={{
              background: hasResonated ? "rgba(251,113,133,0.15)" : "rgba(255,255,255,0.04)",
              color: hasResonated ? "#fb7185" : "#475569",
              border: `1px solid ${hasResonated ? "rgba(251,113,133,0.3)" : "transparent"}`,
            }}
          >
            <Heart size={10} fill={hasResonated ? "#fb7185" : "none"} />
            <span>{message.resonances > 0 ? message.resonances : ""}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
