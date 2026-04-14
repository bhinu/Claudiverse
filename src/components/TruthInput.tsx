"use client";

/**
 * TruthInput
 * ----------
 * A weighted, confidential-feeling text input for submitting unspoken truths.
 * Animates in with Framer Motion and clears after submission.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Lock } from "lucide-react";
import { useLatentHall } from "@/context/LatentHallContext";

const MAX_CHARS = 280;
const PLACEHOLDER_CYCLE = [
  "Something I've never said out loud…",
  "What I actually think about my future…",
  "The feeling I carry into every room…",
  "What I wish someone here understood…",
];

export default function TruthInput() {
  const { submitTruth } = useLatentHall();
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    setPlaceholderIdx(Math.floor(Math.random() * PLACEHOLDER_CYCLE.length));
  }, []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = value.trim().length > 3 && value.length <= MAX_CHARS;
  const charRatio = value.length / MAX_CHARS;

  function handleSubmit() {
    if (!canSubmit) return;
    submitTruth(value.trim());
    setValue("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="relative flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
        <Lock size={10} className="text-slate-600" />
        <span>Anonymous · Never attributed</span>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER_CYCLE[placeholderIdx]}
          rows={3}
          maxLength={MAX_CHARS + 10}
          className="truth-input w-full resize-none rounded-lg bg-[#0d1117] border border-[#21262d] px-3.5 py-3 text-sm text-slate-200 placeholder-slate-600 transition-all duration-300 focus:border-[#00d4ff44]"
        />
        {/* Char indicator strip */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-lg overflow-hidden">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${charRatio * 100}%`,
              background:
                charRatio > 0.9
                  ? "#f43f5e"
                  : charRatio > 0.7
                  ? "#a855f7"
                  : "#00d4ff",
            }}
          />
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] tabular-nums ${
            value.length > MAX_CHARS ? "text-rose-500" : "text-slate-600"
          }`}
        >
          {value.length} / {MAX_CHARS}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-700">⌘↵ to send</span>
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, #00d4ff22, #a855f722)"
                : "transparent",
              border: `1px solid ${canSubmit ? "#00d4ff55" : "#21262d"}`,
              color: canSubmit ? "#00d4ff" : "#64748b",
              boxShadow: canSubmit
                ? "0 0 12px rgba(0,212,255,0.15)"
                : "none",
            }}
          >
            <Send size={12} />
            Submit
          </motion.button>
        </div>
      </div>

      {/* Success flash */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#0d1117]/90 backdrop-blur-sm border border-emerald-500/30"
          >
            <span className="text-emerald-400 text-sm font-medium" style={{ textShadow: "0 0 12px rgba(16,185,129,0.7)" }}>
              Truth added to the field ✦
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
