import { NextRequest } from "next/server";
import { getNearbyRooms } from "@/lib/room-store";

export async function GET(request: NextRequest) {
  const lat = parseFloat(request.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(request.nextUrl.searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json({ error: "lat and lng required" }, { status: 400 });
  }

  const nearby = getNearbyRooms(lat, lng, 300).map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    presenceCount: r.presenceCount,
  }));

  return Response.json({ rooms: nearby });
}
