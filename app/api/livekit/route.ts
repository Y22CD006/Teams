import { NextRequest, NextResponse } from "next/server";
import { createMeetingRoom, generateRoomName } from "@/lib/services/meeting-service";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { room: existingRoom } = await req.json().catch(() => ({}));
  const room = existingRoom || generateRoomName();
  const meeting = createMeetingRoom(userId, room);

  return NextResponse.json(meeting);
}
