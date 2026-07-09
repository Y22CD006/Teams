import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    }

    const { targetUserId, type, payload } = await req.json();

    if (!targetUserId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, avatar: true },
    });

    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const message = JSON.stringify({
      type,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      payload,
      timestamp: new Date().toISOString(),
    });

    // Publish directly to the target user's channel
    await redis.publish(`user:${targetUserId}`, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signal API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
