"use client";

/**
 * TruthComposer
 * -------------
 * Full-width truth submission bar at the bottom of the room.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Lock, Sparkles } from "lucide-react";
import { useRoom } from "@/context/RoomContext";

const MAX = 280;
const PLACEHOLDERS = [
  "Something I've never said out loud…",
  "What I actually think about my future…",
  "The feeling I carry into every room…",
  "What I wish someone here understood…",
  "The truth behind my silence…",
];

export default function TruthComposer() {
  const { postTruth } = useRoom();
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [flashed, setFlashed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  }, []);

  const canSubmit = value.trim().length > 3 && value.length <= MAX;
  const ratio = value.length / MAX;

  function submit() {
    if (!canSubmit) return;
    postTruth(value.trim());
    setValue("");
    setFlashed(true);
    setTimeout(() => setFlashed(false), 1800);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
  }

  return (
    <div className="glass-bright shrink-0 border-t px-4 py-3 relative"
      style={{ borderColor: "var(--border)" }}>

      {/* Sent flash */}
      <AnimatePresence>
        {flashed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-none z-10"
            style={{ background: "rgba(8,12,20,0.92)" }}>
            <span className="flex items-center gap-2 text-sm text-emerald-400 font-medium"
              style={{ textShadow: "0 0 12px rgba(52,211,153,0.7)" }}>
              <Sparkles size={14} /> Truth added to the field
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3">
        <Lock size={13} className="mb-2.5 text-slate-700 shrink-0" />

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={2}
            maxLength={MAX + 5}
            className="truth-input w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed"
          />
          {/* char bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl overflow-hidden">
            <div className="h-full transition-all duration-200 rounded-full"
              style={{
                width: `${ratio * 100}%`,
                background: ratio > 0.9 ? "#fb7185" : ratio > 0.7 ? "#a78bfa" : "#22d3ee",
              }} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 mb-1 shrink-0">
          <span className={`text-[10px] tabular-nums ${value.length > MAX ? "text-rose-500" : "text-slate-700"}`}>
            {MAX - value.length}
          </span>
          <motion.button
            onClick={submit}
            disabled={!canSubmit}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: canSubmit ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${canSubmit ? "rgba(34,211,238,0.4)" : "var(--border)"}`,
              color: canSubmit ? "#22d3ee" : "#334155",
              boxShadow: canSubmit ? "0 0 16px rgba(34,211,238,0.2)" : "none",
            }}
          >
            <Send size={14} />
          </motion.button>
        </div>
      </div>

      <p className="text-[10px] text-slate-700 mt-1.5 ml-6">
        Anonymous · ⌘↵ to send · Maps to the latent field
      </p>
    </div>
  );
}
