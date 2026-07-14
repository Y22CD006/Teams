import { NextRequest, NextResponse } from "next/server";
import { createMeetingRoom, generateRoomName } from "@/lib/services/meeting-service";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { room: existingRoom } = await req.json().catch(() => ({}));
  const room = existingRoom || generateRoomName();
  const meeting = await createMeetingRoom(session.userId, room);

  const host = req.headers.get("host") || "";
  const hostname = host.split(":")[0];
  if (meeting.url.includes("localhost") && hostname && hostname !== "localhost") {
    meeting.url = meeting.url.replace("localhost", hostname);
  }

  console.log("LIVEKIT URL GENERATED:", meeting.url);

  return NextResponse.json(meeting);
}
