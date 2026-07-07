import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const socketId = formData.get("socket_id") as string;
  const channel = formData.get("channel_name") as string;

  const authResponse = pusherServer.authorizeChannel(socketId, channel, { user_id: userId });
  return NextResponse.json(authResponse);
}
