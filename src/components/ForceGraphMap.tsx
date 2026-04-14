"use client";

/**
 * ForceGraphMap
 * -------------
 * Full-screen 2D force-graph visualization.
 * Nodes = "Energy Points" glowing by sentiment.
 * Edges = "Bridges" (neon lines) between semantically similar nodes.
 * Clicking an edge opens the Steelman Icebreaker modal.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLatentHall } from "@/context/LatentHallContext";
import type { TruthNode, TruthEdge } from "@/lib/types";

// react-force-graph-2d uses browser APIs – must be dynamically imported
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-slate-600 text-sm">
      Loading graph…
    </div>
  ),
});

// ─── Colour helpers ────────────────────────────────────────────────────────────

/** Maps a sentiment value (-1 → 1) to a neon colour. */
function sentimentColor(sentiment: number, pending: boolean): string {
  if (pending) return "#334155"; // slate-700
  if (sentiment > 0.4) return "#10b981"; // emerald (positive)
  if (sentiment > 0) return "#22d3ee"; // cyan (mildly positive)
  if (sentiment > -0.4) return "#a855f7"; // purple (mildly negative)
  return "#f43f5e"; // rose (negative)
}

/** Converts a sentiment colour to a semi-transparent glow version. */
function glowColor(color: string, alpha = 0.45): string {
  const map: Record<string, string> = {
    "#10b981": `rgba(16,185,129,${alpha})`,
    "#22d3ee": `rgba(34,211,238,${alpha})`,
    "#a855f7": `rgba(168,85,247,${alpha})`,
    "#f43f5e": `rgba(244,63,94,${alpha})`,
    "#334155": `rgba(51,65,85,${alpha})`,
  };
  return map[color] ?? `rgba(255,255,255,${alpha})`;
}

// ─── Graph node/link data adapters ───────────────────────────────────────────

interface GNode {
  id: string;
  text: string;
  sentiment: number;
  category: string;
  pending: boolean;
  // force-graph positions (mutable)
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GLink {
  id: string;
  source: string;
  target: string;
  similarity: number;
}

function toGNodes(nodes: TruthNode[]): GNode[] {
  return nodes.map((n) => ({
    id: n.id,
    text: n.text,
    sentiment: n.sentiment,
    category: n.category,
    pending: n.pending,
    // Pin nodes to their semantic coords (scaled to graph canvas)
    fx: n.coords[0],
    fy: n.coords[1],
  }));
}

function toGLinks(edges: TruthEdge[]): GLink[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    similarity: e.similarity,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ForceGraphMap() {
  const { state, clickEdge } = useLatentHall();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [tick, setTick] = useState(0); // forces re-render for pulse animation

  // Responsive resize
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      setDims({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Pulse tick (every 1.2s) to animate pending nodes
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  const graphData = {
    nodes: toGNodes(state.nodes),
    links: toGLinks(state.edges),
  };

  // ── Node canvas painter ──────────────────────────────────────────────────
  const nodeCanvasObject = useCallback(
    (node: GNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const color = sentimentColor(node.sentiment, node.pending);
      const baseR = node.pending ? 4 : 6;

      // Pulse scale for pending nodes
      const pulseScale = node.pending
        ? 1 + 0.2 * Math.sin((Date.now() / 600) * Math.PI)
        : 1;
      const r = baseR * pulseScale;

      // Outer glow
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
      grd.addColorStop(0, glowColor(color, 0.6));
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(x, y, r * 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Category label (visible at zoom > 1.4)
      if (globalScale > 1.4 && !node.pending) {
        ctx.font = `${10 / globalScale}px Inter, sans-serif`;
        ctx.fillStyle = "rgba(226,232,240,0.75)";
        ctx.textAlign = "center";
        ctx.fillText(node.category, x, y + r + 10 / globalScale);
      }
    },
    [tick] // tick dependency drives repaint for pulse
  );

  // ── Link canvas painter ──────────────────────────────────────────────────
  const linkCanvasObject = useCallback(
    (link: GLink, ctx: CanvasRenderingContext2D) => {
      const src = link.source as unknown as GNode;
      const tgt = link.target as unknown as GNode;
      if (src?.x == null || tgt?.x == null || src?.y == null || tgt?.y == null) return;

      const alpha = 0.3 + link.similarity * 0.5;
      const width = 0.5 + link.similarity * 2;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      // Neon cyan bridge
      ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
      ctx.lineWidth = width;
      ctx.shadowColor = "rgba(0,212,255,0.6)";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    []
  );

  // ── Link click area (invisible wider stroke) ─────────────────────────────
  const onLinkClick = useCallback(
    (link: GLink) => {
      clickEdge(link.id);
    },
    [clickEdge]
  );

  // ── Tooltip ──────────────────────────────────────────────────────────────
  const nodeLabel = useCallback(
    (node: GNode) =>
      node.pending
        ? "Processing…"
        : `<div style="max-width:220px;font-size:12px;line-height:1.4;padding:6px 8px;background:#0d1117;border:1px solid #21262d;border-radius:6px;color:#e2e8f0">${node.text}</div>`,
    []
  );

  const linkLabel = useCallback(
    () =>
      `<div style="font-size:11px;padding:4px 8px;background:#0d1117;border:1px solid #00d4ff44;border-radius:4px;color:#00d4ff">Click to reveal icebreaker</div>`,
    []
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {state.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600 pointer-events-none select-none">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-sm">No truths yet. Submit one or seed demo data.</p>
        </div>
      )}
      <ForceGraph2D
        graphData={graphData}
        width={dims.width}
        height={dims.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject as never}
        nodeCanvasObjectMode={() => "replace"}
        linkCanvasObject={linkCanvasObject as never}
        linkCanvasObjectMode={() => "replace"}
        onLinkClick={onLinkClick as never}
        nodeLabel={nodeLabel as never}
        linkLabel={linkLabel as never}
        // Disable physics — nodes are pinned to semantic coords
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        cooldownTicks={0}
        enableNodeDrag={false}
        nodePointerAreaPaint={((node: GNode, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, 10, 0, 2 * Math.PI);
          ctx.fill();
        }) as never}
      />
    </div>
  );
}
