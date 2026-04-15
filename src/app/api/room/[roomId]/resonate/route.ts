import { NextRequest } from "next/server";
import { getRoomById, toggleResonate } from "@/lib/room-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoomById(roomId);
  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { messageId, userId } = body;
  if (!messageId || !userId) {
    return Response.json({ error: "messageId and userId required" }, { status: 400 });
  }

  const updated = toggleResonate(roomId, messageId, userId);
  if (!updated) return Response.json({ error: "Message not found" }, { status: 404 });

  return Response.json({ resonances: updated.resonances, resonatedBy: updated.resonatedBy });
}
