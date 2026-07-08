import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, channelId, dmId } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const msg = await prisma.message.create({
    data: {
      content,
      authorId: session.userId,
      channelId: channelId || null,
      dmId: dmId || null,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    message: {
      id: msg.id,
      senderId: msg.authorId,
      senderName: msg.author.name || "Unknown",
      senderAvatar: (msg.author.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      reactions: [],
      replyCount: 0,
    },
  }, { status: 201 });
}
