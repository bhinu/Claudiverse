"use client";

/**
 * StatsBar
 * --------
 * Live stats shown in the sidebar: node count, bridge count, avg sentiment.
 */

import { useLatentHall } from "@/context/LatentHallContext";

export default function StatsBar() {
  const { state } = useLatentHall();
  const live = state.nodes.filter((n) => !n.pending);
  const avgSentiment =
    live.length > 0
      ? live.reduce((s, n) => s + n.sentiment, 0) / live.length
      : null;

  const sentimentLabel =
    avgSentiment === null
      ? "—"
      : avgSentiment > 0.3
      ? "Hopeful"
      : avgSentiment < -0.3
      ? "Burdened"
      : "Conflicted";

  const sentimentColor =
    avgSentiment === null
      ? "#475569"
      : avgSentiment > 0.3
      ? "#10b981"
      : avgSentiment < -0.3
      ? "#f43f5e"
      : "#a855f7";

  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="Voices" value={live.length} />
      <Stat label="Bridges" value={state.edges.length} />
      <Stat label="Field Tone" value={sentimentLabel} color={sentimentColor} />
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-[#21262d] bg-[#0d1117] px-3 py-2 text-center">
      <div
        className="text-base font-bold tabular-nums"
        style={{ color: color ?? "#e2e8f0" }}
      >
        {value}
      </div>
      <div className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}
