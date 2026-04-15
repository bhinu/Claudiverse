import { NextRequest } from "next/server";
import { getRoomById, heartbeat } from "@/lib/room-store";

/**
 * GET /api/room/[roomId]/poll?after=N&userId=...
 *
 * Returns:
 *  - room metadata (name, code, presenceCount)
 *  - all messages with index >= `after`  (so the client only fetches deltas)
 *  - total message count
 *
 * The client polls this every ~3 seconds. `after=0` returns the full history.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoomById(roomId);
  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

  const after = parseInt(request.nextUrl.searchParams.get("after") ?? "0", 10);
  const userId = request.nextUrl.searchParams.get("userId") ?? "anon";

  const presenceCount = heartbeat(roomId, userId);
  const newMessages = room.messages.slice(isNaN(after) ? 0 : after);

  return Response.json({
    room: {
      id: room.id,
      code: room.code,
      name: room.name,
      presenceCount,
    },
    messages: newMessages,
    total: room.messages.length,
  });
}
