import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest, { params }: { params: { meetingId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId } = params;
  const { action, identity, trackSid } = await req.json();

  try {
    // Check if the user is the host
    const event = await prisma.event.findUnique({ where: { id: meetingId } });
    if (event && event.creatorId !== userId) {
      return NextResponse.json({ error: "Only the meeting host can perform this action." }, { status: 403 });
    }

    const roomService = new RoomServiceClient(
      process.env.NEXT_PUBLIC_LIVEKIT_URL || "",
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );

    switch (action) {
      case "mute":
        if (!identity || !trackSid) return NextResponse.json({ error: "Missing identity or trackSid" }, { status: 400 });
        await roomService.mutePublishedTrack(meetingId, identity, trackSid, true);
        break;
      case "remove":
        if (!identity) return NextResponse.json({ error: "Missing identity" }, { status: 400 });
        await roomService.removeParticipant(meetingId, identity);
        break;
      case "end":
        await roomService.deleteRoom(meetingId);
        break;
      default:
        return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MODERATION_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to moderate meeting" }, { status: 500 });
  }
}
