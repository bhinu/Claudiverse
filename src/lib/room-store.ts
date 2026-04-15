/**
 * File-based room store.
 *
 * Next.js runs route handlers in separate worker threads that each have their
 * own globalThis — an in-memory Map is invisible across workers. Writing to a
 * shared JSON file on disk solves this without any external dependencies.
 *
 * Trade-off: synchronous file I/O on every read/write. Fine for a demo with
 * ≤100 concurrent users. For production, swap for SQLite or Redis.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Room, Message, BridgeMessage } from "./types";
import { nanoid } from "./nanoid";

const DB_PATH = join(process.cwd(), ".latent-rooms.json");
const BRIDGES_PATH = join(process.cwd(), ".latent-bridges.json");

// ─── Bridge chat helpers ──────────────────────────────────────────────────────

function readBridges(): Record<string, BridgeMessage[]> {
  try { return JSON.parse(readFileSync(BRIDGES_PATH, "utf-8")); }
  catch { return {}; }
}

function writeBridges(data: Record<string, BridgeMessage[]>) {
  try { writeFileSync(BRIDGES_PATH, JSON.stringify(data), "utf-8"); }
  catch (err) { console.error("[room-store] bridge write failed", err); }
}

export function getBridgeMessages(bridgeId: string): BridgeMessage[] {
  return readBridges()[bridgeId] ?? [];
}

export function addBridgeMessage(bridgeId: string, msg: BridgeMessage): void {
  const data = readBridges();
  if (!data[bridgeId]) data[bridgeId] = [];
  data[bridgeId].push(msg);
  writeBridges(data);
}


// ─── Presence (in-memory per worker, ephemeral) ───────────────────────────────
// Presence is inherently approximate when workers are isolated; tracking last-
// poll time per user gives a "good enough" live count.
const presence = new Map<string, Map<string, number>>(); // roomId → userId → lastSeen

// ─── File helpers ─────────────────────────────────────────────────────────────

function readStore(): Record<string, Room> {
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Room>) {
  try {
    writeFileSync(DB_PATH, JSON.stringify(store), "utf-8");
  } catch (err) {
    console.error("[room-store] write failed", err);
  }
}

// ─── Geo helper ───────────────────────────────────────────────────────────────

function haversineMeters(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6_371_000;
  const r = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(r(la2 - la1) / 2) ** 2 +
    Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateCode(): string {
  const words = ["JADE", "NOVA", "ECHO", "FLUX", "HALO", "IRIS", "LYRA", "ONYX", "SAGE", "TIDE"];
  return `${words[Math.floor(Math.random() * words.length)]}-${Math.floor(Math.random() * 9) + 1}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createRoom(name: string, lat?: number, lng?: number): Room {
  const store = readStore();
  const room: Room = {
    id: nanoid(),
    code: generateCode(),
    name: name || "The Hall",
    messages: [],
    presenceCount: 0,
    lat,
    lng,
    createdAt: Date.now(),
  };
  store[room.id] = room;
  writeStore(store);
  return room;
}

export function getRoomById(id: string): Room | undefined {
  return readStore()[id];
}

export function getRoomByCode(code: string): Room | undefined {
  const store = readStore();
  return Object.values(store).find(
    (r) => r.code.toUpperCase() === code.toUpperCase()
  );
}

export function getNearbyRooms(lat: number, lng: number, radiusMeters = 300): Room[] {
  return Object.values(readStore()).filter(
    (r) => r.lat != null && r.lng != null &&
      haversineMeters(lat, lng, r.lat!, r.lng!) <= radiusMeters
  );
}

export function addMessage(roomId: string, message: Message): boolean {
  const store = readStore();
  const room = store[roomId];
  if (!room) return false;
  room.messages.push(message);
  writeStore(store);
  return true;
}

export function updateMessage(roomId: string, updated: Message): boolean {
  const store = readStore();
  const room = store[roomId];
  if (!room) return false;
  const idx = room.messages.findIndex((m) => m.id === updated.id);
  if (idx === -1) return false;
  room.messages[idx] = updated;
  writeStore(store);
  return true;
}

export function toggleResonate(roomId: string, messageId: string, userId: string): Message | null {
  const store = readStore();
  const room = store[roomId];
  if (!room) return null;
  const msg = room.messages.find((m) => m.id === messageId);
  if (!msg) return null;

  if (msg.resonatedBy.includes(userId)) {
    msg.resonatedBy = msg.resonatedBy.filter((id) => id !== userId);
    msg.resonances = Math.max(0, msg.resonances - 1);
  } else {
    msg.resonatedBy.push(userId);
    msg.resonances += 1;
  }
  writeStore(store);
  return msg;
}

/** Called by the poll endpoint to update presence and get current count. */
export function heartbeat(roomId: string, userId: string): number {
  if (!presence.has(roomId)) presence.set(roomId, new Map());
  presence.get(roomId)!.set(userId, Date.now());

  // Evict users last seen > 12s ago (poll interval is ~3s, so 4 missed = gone)
  const now = Date.now();
  presence.get(roomId)!.forEach((ts, uid) => {
    if (now - ts > 12_000) presence.get(roomId)!.delete(uid);
  });

  return presence.get(roomId)!.size;
}
