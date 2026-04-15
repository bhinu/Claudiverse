import { NextRequest } from "next/server";
import { getRoomById } from "@/lib/room-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoomById(roomId);
  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

  return Response.json({
    id: room.id,
    code: room.code,
    name: room.name,
    presenceCount: room.presenceCount,
    messageCount: room.messages.length,
    createdAt: room.createdAt,
  });
}
