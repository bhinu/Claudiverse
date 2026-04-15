import { NextRequest } from "next/server";
import { getBridgeMessages, addBridgeMessage } from "@/lib/room-store";
import { nanoid } from "@/lib/nanoid";
import type { BridgeMessage } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string; bridgeId: string }> }
) {
  const { bridgeId } = await params;
  return Response.json({ messages: getBridgeMessages(bridgeId) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; bridgeId: string }> }
) {
  const { bridgeId } = await params;
  const body = await request.json();
  const { text, authorId, authorName, authorColor } = body;

  if (!text?.trim() || !authorId) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const msg: BridgeMessage = {
    id: nanoid(),
    bridgeId,
    authorId,
    authorName,
    authorColor,
    text: text.trim(),
    createdAt: Date.now(),
  };

  addBridgeMessage(bridgeId, msg);
  return Response.json({ message: msg });
}
