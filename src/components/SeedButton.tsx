"use client";

/**
 * SeedButton
 * ----------
 * Populates the graph with 20 pre-computed demo nodes representing
 * a diverse, polarized UW-Madison lecture hall.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Trash2 } from "lucide-react";
import { useLatentHall } from "@/context/LatentHallContext";
import { buildDemoNodes } from "@/lib/demo-data";

export default function SeedButton() {
  const { state, dispatch } = useLatentHall();
  const [seeding, setSeeding] = useState(false);

  const hasNodes = state.nodes.length > 0;

  async function handleSeed() {
    setSeeding(true);
    // Small delay to let the animation be visible
    await new Promise((r) => setTimeout(r, 120));
    dispatch({ type: "SEED_NODES", nodes: buildDemoNodes() });
    setSeeding(false);
  }

  function handleClear() {
    dispatch({ type: "CLEAR_NODES" });
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={handleSeed}
        disabled={seeding}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 w-full justify-center border"
        style={{
          background: "linear-gradient(135deg, #a855f711, #00d4ff11)",
          borderColor: "rgba(168,85,247,0.35)",
          color: seeding ? "#64748b" : "#a855f7",
          boxShadow: seeding ? "none" : "0 0 16px rgba(168,85,247,0.12)",
        }}
      >
        <motion.span
          animate={seeding ? { rotate: 360 } : { rotate: 0 }}
          transition={seeding ? { repeat: Infinity, duration: 0.7, ease: "linear" } : {}}
        >
          <Zap size={12} />
        </motion.span>
        {seeding ? "Seeding…" : "Seed Demo Lecture Hall (20 nodes)"}
      </motion.button>

      {hasNodes && (
        <motion.button
          onClick={handleClear}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 w-full justify-center border border-[#21262d] text-slate-600 hover:text-rose-500 hover:border-rose-500/30"
        >
          <Trash2 size={12} />
          Clear All
        </motion.button>
      )}
    </div>
  );
}
