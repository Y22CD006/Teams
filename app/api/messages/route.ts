import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redis, cacheDel } from "@/lib/redis";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const dmId = searchParams.get("dmId");

  if (!channelId && !dmId) {
    return NextResponse.json({ error: "channelId or dmId required" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: {
      ...(channelId ? { channelId } : { dmId }),
      isThread: false,
    },
    include: {
      author: { select: { id: true, name: true, imageUrl: true, status: true, email: true } },
      reactions: { include: { user: { select: { id: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const mapped = messages.map((msg) => ({
    ...msg,
    reactions: formatReactions(msg.reactions),
  }));

  return NextResponse.json({ messages: mapped });
}

function formatReactions(reactions: { emoji: string; user: { id: string } }[]) {
  const grouped = new Map<string, { emoji: string; count: number; users: string[] }>();
  for (const r of reactions) {
    const existing = grouped.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(r.user.id);
    } else {
      grouped.set(r.emoji, { emoji: r.emoji, count: 1, users: [r.user.id] });
    }
  }
  return Array.from(grouped.values());
}

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
      author: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  const formatted = {
    id: msg.id,
    senderId: msg.authorId,
    senderName: msg.author.name || "Unknown",
    senderAvatar: msg.author.imageUrl
      ? msg.author.imageUrl.substring(0, 2).toUpperCase()
      : (msg.author.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    content: msg.content,
    timestamp: msg.createdAt.toISOString(),
    channelId: msg.channelId,
    dmId: msg.dmId,
    reactions: [],
    replyCount: 0,
  };

  if (redis) {
    const channelKey = channelId || dmId;
    if (channelKey) {
      await redis.publish(`message:${channelKey}`, JSON.stringify(formatted));
    }
  }

  await cacheDel(`user:${session.userId}:activity`);
  return NextResponse.json({ message: formatted }, { status: 201 });
}
