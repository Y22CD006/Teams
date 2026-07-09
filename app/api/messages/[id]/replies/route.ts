import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redis } from "@/lib/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const replies = await prisma.threadReply.findMany({
    where: { messageId: params.id },
    include: {
      author: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const formattedReplies = replies.map((reply) => ({
    id: reply.id,
    content: reply.content,
    timestamp: reply.createdAt.toISOString(),
    senderId: reply.author.id,
    senderName: reply.author.name || "Unknown",
    senderAvatar: reply.author.imageUrl
      ? reply.author.imageUrl.substring(0, 2).toUpperCase()
      : (reply.author.name || "U").charAt(0).toUpperCase(),
    messageId: reply.messageId,
  }));

  return NextResponse.json({ replies: formattedReplies });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Content missing" }, { status: 400 });

  const message = await prisma.message.findUnique({
    where: { id: params.id },
  });

  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const reply = await prisma.threadReply.create({
    data: {
      content,
      messageId: params.id,
      authorId: session.userId,
    },
    include: {
      author: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  const formattedReply = {
    id: reply.id,
    content: reply.content,
    timestamp: reply.createdAt.toISOString(),
    senderId: reply.author.id,
    senderName: reply.author.name || "Unknown",
    senderAvatar: reply.author.imageUrl
      ? reply.author.imageUrl.substring(0, 2).toUpperCase()
      : (reply.author.name || "U").charAt(0).toUpperCase(),
    messageId: reply.messageId,
    isReply: true, // This flag helps the frontend differentiate from regular messages
  };

  if (redis) {
    const channelKey = message.channelId || message.dmId;
    if (channelKey) {
      await redis.publish(`message:${channelKey}`, JSON.stringify(formattedReply));
    }
  }

  return NextResponse.json({ reply: formattedReply }, { status: 201 });
}
