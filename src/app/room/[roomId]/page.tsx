/**
 * Room page — the main experience.
 * Server component passes roomId to the client shell.
 */

import { RoomShell } from "./RoomShell";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomShell roomId={roomId} />;
}
