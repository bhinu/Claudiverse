import { NextRequest } from "next/server";
import { getRoomById, addMessage, updateMessage } from "@/lib/room-store";
import { analyzeTruth } from "@/lib/analyze-truth";
import { nanoid } from "@/lib/nanoid";
import type { Message } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoomById(roomId);
  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const text: string = body?.text;
  const authorId: string = body?.authorId ?? nanoid();
  const authorName: string = body?.authorName ?? "Anonymous";
  const authorColor: string = body?.authorColor ?? "#94a3b8";

  if (!text || text.trim().length < 3) {
    return Response.json({ error: "text too short" }, { status: 400 });
  }

  // 1. Create a pending message and broadcast immediately (optimistic)
  const message: Message = {
    id: nanoid(),
    text: text.trim().slice(0, 300),
    authorId,
    authorName,
    authorColor,
    coords: null,
    sentiment: 0,
    category: "Processing…",
    resonances: 0,
    resonatedBy: [],
    createdAt: Date.now(),
    pending: true,
  };
  addMessage(roomId, message);

  // 2. Resolve with AI async (don't block the HTTP response)
  analyzeTruth(message.text)
    .then(({ coords, sentiment, category }) => {
      const resolved: Message = {
        ...message,
        coords,
        sentiment,
        category,
        pending: false,
      };
      updateMessage(roomId, resolved);
    })
    .catch(() => {
      const fallback: Message = {
        ...message,
        coords: [50 + (Math.random() - 0.5) * 20, 50 + (Math.random() - 0.5) * 20],
        sentiment: 0,
        category: "Human Experience",
        pending: false,
      };
      updateMessage(roomId, fallback);
    });

  return Response.json({ id: message.id });
}
