"use client";

/**
 * The Latent Hall — Main Dashboard
 * ---------------------------------
 * Control-center layout:
 *   - Left sidebar: title, stats, truth input, seed button, legend
 *   - Main area: full-screen force graph
 *   - BridgeModal: floats above everything when an edge is clicked
 */

import dynamic from "next/dynamic";
import { LatentHallProvider } from "@/context/LatentHallContext";
import TruthInput from "@/components/TruthInput";
import SeedButton from "@/components/SeedButton";
import StatsBar from "@/components/StatsBar";
import Legend from "@/components/Legend";
import BridgeModal from "@/components/BridgeModal";

// ForceGraphMap is heavy — lazy load it
const ForceGraphMap = dynamic(() => import("@/components/ForceGraphMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <PulsingOrb />
        <span className="text-xs">Initializing latent space…</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return (
    <LatentHallProvider>
      <div className="scanlines relative flex h-screen w-screen overflow-hidden bg-[#050810]">
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="relative z-10 flex w-72 shrink-0 flex-col gap-5 overflow-y-auto border-r border-[#21262d] bg-[#080c12]/80 px-5 py-6 backdrop-blur-sm">
          {/* Logo / Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PulsingOrb size="sm" />
              <h1
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: "#00d4ff", textShadow: "0 0 12px rgba(0,212,255,0.6)" }}
              >
                The Latent Hall
              </h1>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Semantic map of anonymous unspoken truths in this room.
            </p>
          </div>

          {/* Divider */}
          <Divider />

          {/* Stats */}
          <section>
            <SectionLabel>Field Status</SectionLabel>
            <StatsBar />
          </section>

          <Divider />

          {/* Input */}
          <section>
            <SectionLabel>Speak Your Truth</SectionLabel>
            <TruthInput />
          </section>

          <Divider />

          {/* Seed */}
          <section>
            <SectionLabel>Demo</SectionLabel>
            <SeedButton />
          </section>

          <Divider />

          {/* Legend */}
          <section>
            <Legend />
          </section>

          {/* Axis guide */}
          <div className="mt-auto pt-4 border-t border-[#21262d]">
            <p className="text-[10px] text-slate-700 leading-relaxed">
              <span className="text-slate-600">X-axis:</span> Personal → Societal
              <br />
              <span className="text-slate-600">Y-axis:</span> Present Fear → Future Hope
            </p>
            <p className="text-[10px] text-slate-700 mt-2">
              Click a glowing bridge to reveal an icebreaker.
            </p>
          </div>
        </aside>

        {/* ── Graph Canvas ─────────────────────────────────────────────── */}
        <main className="relative flex-1 overflow-hidden">
          {/* Subtle radial vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(5,8,16,0.7) 100%)",
            }}
          />
          {/* Axis lines */}
          <AxisLines />
          <div className="relative z-10 h-full w-full">
            <ForceGraphMap />
          </div>
        </main>

        {/* ── Bridge Modal ─────────────────────────────────────────────── */}
        <BridgeModal />
      </div>
    </LatentHallProvider>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px w-full bg-[#21262d]" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
      {children}
    </p>
  );
}

function PulsingOrb({ size = "default" }: { size?: "sm" | "default" }) {
  const dim = size === "sm" ? "w-2 h-2" : "w-4 h-4";
  return (
    <span className="relative inline-flex">
      <span
        className={`${dim} rounded-full bg-cyan-400`}
        style={{ boxShadow: "0 0 8px rgba(0,212,255,0.8)" }}
      />
      <span
        className={`absolute inset-0 ${dim} rounded-full bg-cyan-400 opacity-60`}
        style={{ animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }}
      />
    </span>
  );
}

function AxisLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.04]"
      preserveAspectRatio="none"
    >
      {/* Horizontal midline */}
      <line
        x1="0"
        y1="50%"
        x2="100%"
        y2="50%"
        stroke="#00d4ff"
        strokeWidth="1"
        strokeDasharray="4 8"
      />
      {/* Vertical midline */}
      <line
        x1="50%"
        y1="0"
        x2="50%"
        y2="100%"
        stroke="#00d4ff"
        strokeWidth="1"
        strokeDasharray="4 8"
      />
    </svg>
  );
}
