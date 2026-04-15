import { NextRequest } from "next/server";
import { createRoom, getRoomByCode } from "@/lib/room-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name: string = body?.name || "The Hall";
    const lat: number | undefined = typeof body?.lat === "number" ? body.lat : undefined;
    const lng: number | undefined = typeof body?.lng === "number" ? body.lng : undefined;

    const room = createRoom(name.trim().slice(0, 60), lat, lng);
    return Response.json({ id: room.id, code: room.code, name: room.name });
  } catch (err) {
    console.error("[room/create]", err);
    return Response.json({ error: "Failed to create room" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return Response.json({ error: "code required" }, { status: 400 });

  const room = getRoomByCode(code);
  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

  return Response.json({ id: room.id, code: room.code, name: room.name });
}
