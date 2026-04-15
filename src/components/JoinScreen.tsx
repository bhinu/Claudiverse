"use client";

/**
 * JoinScreen
 * ----------
 * Landing page UI — create a new Hall or join an existing one by code.
 * Optionally detects nearby rooms via geolocation.
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Hash, MapPin, ArrowRight, Loader2, Users } from "lucide-react";

type Tab = "create" | "join";

interface NearbyRoom {
  id: string;
  code: string;
  name: string;
  presenceCount: number;
}

export default function JoinScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("join");
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nearby, setNearby] = useState<NearbyRoom[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  // Auto-focus join code input
  useEffect(() => { if (tab === "join") codeRef.current?.focus(); }, [tab]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!roomName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/room/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/room/create?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) throw new Error("Room not found. Check the code and try again.");
      router.push(`/room/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function findNearby() {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const res = await fetch(`/api/room/nearby?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          setNearby(data.rooms ?? []);
        } catch { setError("Could not find nearby halls"); }
        finally { setLocLoading(false); }
      },
      () => { setError("Location access denied"); setLocLoading(false); }
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="relative inline-flex">
            <span className="w-3 h-3 rounded-full bg-cyan-400"
              style={{ boxShadow: "0 0 10px rgba(34,211,238,0.9)" }} />
            <span className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 opacity-60"
              style={{ animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
          </span>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase text-glow-cyan"
            style={{ color: "#22d3ee" }}>
            The Latent Hall
          </h1>
        </div>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          A live semantic map of the unspoken truths in your lecture hall.
          Anonymous. Proximity-aware. Human.
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass-bright rounded-2xl p-6 w-full max-w-sm glow-cyan"
      >
        {/* Tabs */}
        <div className="flex rounded-lg p-1 mb-6"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          {(["join", "create"] as Tab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className="flex-1 py-2 rounded-md text-xs font-semibold uppercase tracking-widest transition-all duration-200"
              style={{
                background: tab === t ? "rgba(34,211,238,0.12)" : "transparent",
                color: tab === t ? "#22d3ee" : "#475569",
                boxShadow: tab === t ? "0 0 12px rgba(34,211,238,0.15)" : "none",
              }}>
              {t === "join" ? "Join a Hall" : "Create a Hall"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "join" ? (
            <motion.form key="join"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
              onSubmit={handleJoin} className="flex flex-col gap-3">
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                Room Code
              </label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  ref={codeRef}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="JADE-7"
                  maxLength={8}
                  className="truth-input w-full rounded-lg pl-8 pr-4 py-3 text-sm font-mono tracking-widest"
                />
              </div>
              <SubmitButton loading={loading} label="Enter the Hall" />
            </motion.form>
          ) : (
            <motion.form key="create"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
              onSubmit={handleCreate} className="flex flex-col gap-3">
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                Hall Name
              </label>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="ECON 301 · Spring Semester"
                maxLength={60}
                className="truth-input w-full rounded-lg px-4 py-3 text-sm"
              />
              <SubmitButton loading={loading} label="Open This Hall" />
            </motion.form>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="mt-3 text-xs text-rose-400 text-center">
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Nearby divider */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <button onClick={findNearby} disabled={locLoading}
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors mx-auto">
            {locLoading
              ? <Loader2 size={12} className="animate-spin" />
              : <MapPin size={12} />}
            Find nearby halls via location
          </button>
        </div>

        {/* Nearby results */}
        <AnimatePresence>
          {nearby.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex flex-col gap-2 overflow-hidden">
              {nearby.map((r) => (
                <button key={r.id} onClick={() => router.push(`/room/${r.id}`)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-all hover:bg-white/5 border border-white/5">
                  <div className="flex flex-col items-start">
                    <span className="text-slate-300 font-medium">{r.name}</span>
                    <span className="text-slate-600 font-mono">{r.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users size={10} />
                    <span>{r.presenceCount}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
          {nearby.length === 0 && !locLoading && nearby !== undefined && (
            <></>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-6 text-[11px] text-slate-700 text-center max-w-xs">
        All truths are anonymous. No accounts. No tracking. Just proximity.
      </motion.p>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
      className="flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all duration-200 mt-1"
      style={{
        background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.15))",
        border: "1px solid rgba(34,211,238,0.3)",
        color: loading ? "#475569" : "#22d3ee",
        boxShadow: loading ? "none" : "0 0 20px rgba(34,211,238,0.12)",
      }}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : (
        <>{label} <ArrowRight size={14} /></>
      )}
    </motion.button>
  );
}
