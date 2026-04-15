"use client";

/**
 * ForceGraphMap
 * -------------
 * Full-screen 2D force-graph visualization.
 * Nodes = "Energy Points" glowing by sentiment (from live room messages).
 * Edges = "Bridges" (neon lines) between semantically similar nodes.
 * Clicking an edge opens the Steelman Icebreaker modal.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRoom } from "@/context/RoomContext";
import type { TruthEdge, Message } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-slate-700 text-sm">
      Loading latent space…
    </div>
  ),
});

// ─── Colour helpers ───────────────────────────────────────────────────────────

function sentimentColor(s: number, pending: boolean): string {
  if (pending) return "#1e293b";
  if (s > 0.4)  return "#34d399";
  if (s > 0)    return "#22d3ee";
  if (s > -0.4) return "#a78bfa";
  return "#fb7185";
}

function glowRgba(color: string, a = 0.5): string {
  const map: Record<string, string> = {
    "#34d399": `rgba(52,211,153,${a})`,
    "#22d3ee": `rgba(34,211,238,${a})`,
    "#a78bfa": `rgba(167,139,250,${a})`,
    "#fb7185": `rgba(251,113,133,${a})`,
    "#1e293b": `rgba(30,41,59,${a})`,
  };
  return map[color] ?? `rgba(255,255,255,${a})`;
}

// ─── Graph adapters ───────────────────────────────────────────────────────────

interface GNode {
  id: string; text: string; authorName: string; authorColor: string;
  sentiment: number; category: string; pending: boolean;
  x?: number; y?: number; fx?: number; fy?: number;
}
interface GLink { id: string; source: string; target: string; similarity: number; }

function toGNodes(messages: Message[], dims: { width: number; height: number }): GNode[] {
  const pad = 0.12;
  const usableW = dims.width * (1 - 2 * pad);
  const usableH = dims.height * (1 - 2 * pad);
  return messages
    .filter((m) => m.coords !== null)
    .map((m) => ({
      id: m.id, text: m.text, authorName: m.authorName, authorColor: m.authorColor,
      sentiment: m.sentiment, category: m.category, pending: m.pending,
      fx: dims.width * pad + (m.coords![0] / 100) * usableW,
      fy: dims.height * pad + (m.coords![1] / 100) * usableH,
    }));
}

function toGLinks(edges: TruthEdge[]): GLink[] {
  return edges.map((e) => ({
    id: e.id, source: e.sourceId, target: e.targetId, similarity: e.similarity,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ForceGraphMap() {
  const { state, clickEdge } = useRoom();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setDims({ width: r.width, height: r.height });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Pulse repaint ticker
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 900);
    return () => clearInterval(id);
  }, []);

  const graphData = {
    nodes: toGNodes(state.messages, dims),
    links: toGLinks(state.edges),
  };

  // ── Node painter ────────────────────────────────────────────────────────────
  const nodeCanvasObject = useCallback(
    (node: GNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const color = sentimentColor(node.sentiment, node.pending);
      const baseR = node.pending ? 3 : 4.5;
      const pulse = node.pending ? 1 + 0.2 * Math.sin((Date.now() / 500) * Math.PI) : 1;
      const r = baseR * pulse;

      // Aura
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 3.8);
      grd.addColorStop(0, glowRgba(color, 0.4));
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(x, y, r * 3.8, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();

      // Core
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();

      // Author dot ring
      if (!node.pending) {
        ctx.beginPath(); ctx.arc(x, y, r + 1, 0, Math.PI * 2);
        ctx.strokeStyle = `${node.authorColor}44`;
        ctx.lineWidth = 0.75; ctx.stroke();
      }

      // Category label
      if (globalScale > 1.5 && !node.pending) {
        const fontSize = 9 / globalScale;
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = "rgba(148,163,184,0.8)";
        ctx.textAlign = "center";
        ctx.fillText(node.category, x, y + r + fontSize + 2);
      }
    },
    [tick]
  );

  // ── Link painter ────────────────────────────────────────────────────────────
  const linkCanvasObject = useCallback((link: GLink, ctx: CanvasRenderingContext2D) => {
    const src = link.source as unknown as GNode;
    const tgt = link.target as unknown as GNode;
    if (src?.x == null || tgt?.x == null || src?.y == null || tgt?.y == null) return;

    // Gradient line
    const grd = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
    const alpha = 0.45 + link.similarity * 0.45;
    grd.addColorStop(0, `rgba(251,146,60,${alpha})`);   // orange-400
    grd.addColorStop(1, `rgba(234,179,8,${alpha})`);    // yellow-500

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1 + link.similarity * 2.5;
    ctx.shadowColor = "rgba(251,146,60,0.7)";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, []);

  const onLinkClick = useCallback((link: GLink) => clickEdge(link.id), [clickEdge]);

  const nodeLabel = useCallback(
    (node: GNode) => node.pending ? "Mapping…" :
      `<div style="max-width:240px;font-size:12px;line-height:1.5;padding:8px 10px;background:#0f1520;border:1px solid rgba(34,211,238,0.2);border-radius:8px;color:#e2e8f0">
        <div style="color:${node.authorColor};font-size:10px;margin-bottom:4px">${node.authorName}</div>
        ${node.text}
      </div>`,
    []
  );

  const linkLabel = useCallback(
    () => `<div style="font-size:11px;padding:4px 8px;background:#0f1520;border:1px solid rgba(34,211,238,0.3);border-radius:4px;color:#22d3ee">✦ Click to reveal icebreaker</div>`,
    []
  );

  const liveNodes = state.messages.filter((m) => m.coords !== null);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {liveNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-700 pointer-events-none select-none">
          <div className="w-10 h-10 rounded-full border border-dashed border-slate-800 flex items-center justify-center">
            <span className="text-slate-700 text-lg">✦</span>
          </div>
          <p className="text-xs text-center">Post a truth to begin mapping the field</p>
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
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        cooldownTicks={0}
        enableNodeDrag={false}
        nodePointerAreaPaint={((node: GNode, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, 12, 0, Math.PI * 2);
          ctx.fill();
        }) as never}
        linkPointerAreaPaint={((link: GLink, color: string, ctx: CanvasRenderingContext2D) => {
          const src = link.source as unknown as GNode;
          const tgt = link.target as unknown as GNode;
          if (src?.x == null || tgt?.x == null || src?.y == null || tgt?.y == null) return;
          ctx.strokeStyle = color;
          ctx.lineWidth = 12; // wide invisible hit area
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);
          ctx.stroke();
        }) as never}
      />
    </div>
  );
}
