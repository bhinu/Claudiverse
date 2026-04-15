"use client";

/**
 * RoomShell
 * ---------
 * The full room experience:
 * ┌──────────────────────────────────────────────┐
 * │            RoomHeader (top bar)              │
 * ├──────────────────────┬───────────────────────┤
 * │                      │                       │
 * │   ForceGraphMap      │     ChatFeed          │
 * │   (semantic map)     │     (live truths)     │
 * │                      │                       │
 * ├──────────────────────┴───────────────────────┤
 * │            TruthComposer (bottom bar)        │
 * └──────────────────────────────────────────────┘
 */

import dynamic from "next/dynamic";
import { RoomProvider } from "@/context/RoomContext";
import RoomHeader from "@/components/RoomHeader";
import ChatFeed from "@/components/ChatFeed";
import TruthComposer from "@/components/TruthComposer";
import BridgeModal from "@/components/BridgeModal";
import AuroraBackground from "@/components/AuroraBackground";

const ForceGraphMap = dynamic(() => import("@/components/ForceGraphMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-slate-700 text-xs">
      Initializing latent space…
    </div>
  ),
});

export function RoomShell({ roomId }: { roomId: string }) {
  return (
    <RoomProvider roomId={roomId}>
      <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#030508]">
        <AuroraBackground />

        {/* Top bar */}
        <RoomHeader />

        {/* Main split */}
        <div className="relative z-10 flex flex-1 overflow-hidden">
          {/* Map — takes remaining width on large screens */}
          <div className="relative flex-1 overflow-hidden">
            {/* Axis labels */}
            <AxisLabel pos="top" text="Hope / Aspiration" />
            <AxisLabel pos="bottom" text="Fear / Pain" />
            <AxisLabel pos="left" text="Personal" />
            <AxisLabel pos="right" text="Societal" />
            {/* Mid-lines */}
            <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full"
              preserveAspectRatio="none">
              <line x1="0" y1="50%" x2="100%" y2="50%"
                stroke="rgba(255,255,255,0.025)" strokeWidth="1" strokeDasharray="6 10" />
              <line x1="50%" y1="0" x2="50%" y2="100%"
                stroke="rgba(255,255,255,0.025)" strokeWidth="1" strokeDasharray="6 10" />
            </svg>
            <div className="relative z-10 h-full w-full">
              <ForceGraphMap />
            </div>
          </div>

          {/* Chat panel */}
          <aside className="glass relative z-10 flex w-80 shrink-0 flex-col border-l"
            style={{ borderColor: "var(--border)" }}>
            <div className="px-4 py-2.5 border-b flex items-center gap-2"
              style={{ borderColor: "var(--border)" }}>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Live Field
              </span>
              <LiveDot />
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatFeed />
            </div>
          </aside>
        </div>

        {/* Bottom composer */}
        <div className="relative z-10">
          <TruthComposer />
        </div>

        {/* Bridge modal */}
        <BridgeModal />
      </div>
    </RoomProvider>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function AxisLabel({ pos, text }: { pos: "top" | "bottom" | "left" | "right"; text: string }) {
  const base = "pointer-events-none absolute text-[9px] text-slate-800 uppercase tracking-widest select-none";
  const posClass = {
    top: "top-2 left-1/2 -translate-x-1/2",
    bottom: "bottom-2 left-1/2 -translate-x-1/2",
    left: "left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center",
    right: "right-2 top-1/2 -translate-y-1/2 rotate-90 origin-center",
  }[pos];
  return <span className={`${base} ${posClass}`}>{text}</span>;
}

function LiveDot() {
  return (
    <span className="relative inline-flex ml-auto">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
        style={{ boxShadow: "0 0 5px rgba(52,211,153,0.9)" }} />
      <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-60"
        style={{ animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
    </span>
  );
}
