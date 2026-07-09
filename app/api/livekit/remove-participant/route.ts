import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { room, participantIdentity } = await req.json();

  if (!room || !participantIdentity) {
    return NextResponse.json({ error: "Missing room or participantIdentity" }, { status: 400 });
  }

  const client = new RoomServiceClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880",
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
  );

  try {
    await client.removeParticipant(room, participantIdentity);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Failed to remove participant:", e);
    return NextResponse.json({ error: "Failed to remove participant" }, { status: 500 });
  }
}
