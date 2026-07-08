import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!pusherServer) {
    return NextResponse.json({ error: "Pusher not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const socketId = formData.get("socket_id") as string;
  const channel = formData.get("channel_name") as string;

  const authResponse = pusherServer.authorizeChannel(socketId, channel, { user_id: session.userId });
  return NextResponse.json(authResponse);
}
