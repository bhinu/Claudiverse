"use client";

/**
 * RoomHeader
 * ----------
 * Top bar showing room name, join code, live presence, and identity badge.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Copy, Check, Users } from "lucide-react";
import { useRoom } from "@/context/RoomContext";

export default function RoomHeader() {
  const { state, identity } = useRoom();
  const { room, messages } = state;
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const live = messages.filter((m) => !m.pending).length;
  const bridges = state.edges.length;

  async function copyCode() {
    await navigator.clipboard.writeText(room!.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <header className="glass-bright shrink-0 flex items-center justify-between px-5 py-3 border-b z-20"
      style={{ borderColor: "var(--border)" }}>
      {/* Left: room identity */}
      <div className="flex items-center gap-3">
        <span className="relative inline-flex">
          <Radio size={14} style={{ color: "#22d3ee" }} />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ boxShadow: "0 0 5px rgba(52,211,153,0.9)" }} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-200 leading-none">{room.name}</h2>
          <p className="text-[10px] text-slate-600 mt-0.5">Latent space active</p>
        </div>
      </div>

      {/* Centre: stats */}
      <div className="hidden sm:flex items-center gap-4">
        <Stat value={live} label="Voices" color="#22d3ee" />
        <div className="w-px h-6 bg-white/5" />
        <Stat value={bridges} label="Bridges" color="#a78bfa" />
        <div className="w-px h-6 bg-white/5" />
        <Stat value={room.presenceCount} label="Here now" color="#34d399" icon={<Users size={10} />} />
      </div>

      {/* Right: code + identity */}
      <div className="flex items-center gap-3">
        {/* Room code chip */}
        <button onClick={copyCode}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-bold transition-all border"
          style={{
            background: "rgba(34,211,238,0.06)",
            borderColor: "rgba(34,211,238,0.2)",
            color: "#22d3ee",
          }}>
          <span>{room.code}</span>
          <AnimatePresence mode="wait">
            {copied
              ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check size={10} />
                </motion.span>
              : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy size={10} />
                </motion.span>
            }
          </AnimatePresence>
        </button>

        {/* Identity badge */}
        <div className="flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 border"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: `${identity.color}33`,
          }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: `${identity.color}22`, color: identity.color }}>
            {identity.name.split(" ").map((w) => w[0]).join("")}
          </span>
          <span className="text-[11px] font-medium hidden md:block" style={{ color: identity.color }}>
            {identity.name}
          </span>
        </div>
      </div>
    </header>
  );
}

function Stat({ value, label, color, icon }: {
  value: number; label: string; color: string; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span style={{ color }}>{icon}</span>}
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[11px] text-slate-600">{label}</span>
    </div>
  );
}
