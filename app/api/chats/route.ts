import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

export async function GET() {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = `user:${session.userId}:chats`; const cached = await cacheGet<any>(cacheKey); if (cached) return NextResponse.json(cached);

  const memberships = await prisma.dMMember.findMany({
    where: { userId: session.userId },
    include: {
      dm: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              author: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const dmIds = memberships.map(m => m.dm.id);

  const unreadCounts = await Promise.all(
    dmIds.map(dmId =>
      prisma.message.count({
        where: {
          dmId,
          authorId: { not: session.userId },
          readReceipts: { none: { userId: session.userId } },
        },
      })
    )
  );

  const chats = memberships.map((m, i) => {
    const dm = m.dm;
    const otherMembers = dm.members.filter((mem) => mem.userId !== session.userId);
    const name = dm.name || otherMembers.map((mem) => mem.user.name).join(", ") || "Unknown";
    const isGroup = dm.isGroup;
    const participants = dm.members.map((mem) => ({
      id: mem.user.id,
      name: mem.user.name || "Unknown",
      avatar: (mem.user.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
      role: "",
      status: "online" as const,
      email: mem.user.email,
    }));

    const lastMsg = dm.messages[0];

    return {
      id: dm.id,
      name,
      type: isGroup ? "group" as const : "direct" as const,
      participants,
      unreadCount: unreadCounts[i],
      messages: lastMsg ? [{
        id: lastMsg.id,
        senderId: lastMsg.authorId,
        senderName: lastMsg.author.name || "Unknown",
        senderAvatar: (lastMsg.author.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
        content: lastMsg.content,
        timestamp: lastMsg.createdAt.toISOString(),
        reactions: [],
        replyCount: 0,
      }] : [],
    };
  });

  await cacheSet(cacheKey, { chats }, 30);
  return NextResponse.json({ chats });
}

export async function POST(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { otherUserId } = await req.json();

  // Check if DM already exists between these two users
  const existing = await prisma.directMessage.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: session.userId } } },
        { members: { some: { userId: otherUserId } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      messages: {
        include: { 
          author: { select: { id: true, name: true } },
          readReceipts: { where: { userId: session.userId } },
          reactions: { include: { user: { select: { id: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (existing) {
    const chat = formatChat(existing, session.userId);
    return NextResponse.json({ chat, existing: true });
  }

  const dm = await prisma.directMessage.create({
    data: { isGroup: false },
  });

  await prisma.dMMember.createMany({
    data: [
      { userId: session.userId, dmId: dm.id },
      { userId: otherUserId, dmId: dm.id },
    ],
  });

  const created = await prisma.directMessage.findUnique({
    where: { id: dm.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      messages: {
        include: { 
          author: { select: { id: true, name: true } },
          readReceipts: { where: { userId: session.userId } },
          reactions: { include: { user: { select: { id: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!created) {
    return NextResponse.json({ error: "Failed to create DM" }, { status: 500 });
  }

  const chat = formatChat(created, session.userId);
  await cacheDel(`user:${session.userId}:chats`);
  return NextResponse.json({ chat, existing: false }, { status: 201 });
}

function formatChat(dm: any, currentUserId: string) {
  const otherMembers = dm.members.filter((mem: any) => mem.userId !== currentUserId);
  const name = dm.name || otherMembers.map((mem: any) => mem.user.name).join(", ") || "Unknown";
  const participants = dm.members.map((mem: any) => ({
    id: mem.user.id,
    name: mem.user.name || "Unknown",
    avatar: (mem.user.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    role: "",
    status: "online" as const,
    email: mem.user.email,
  }));
  return {
    id: dm.id,
    name,
    type: dm.isGroup ? "group" as const : "direct" as const,
    participants,
    unreadCount: dm.messages?.filter((msg: any) => msg.authorId !== currentUserId && msg.readReceipts?.length === 0).length || 0,
    messages: dm.messages.map((msg: any) => ({
      id: msg.id,
      senderId: msg.authorId,
      senderName: msg.author.name || "Unknown",
      senderAvatar: (msg.author.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      reactions: msg.reactions ? formatReactions(msg.reactions) : [],
      replyCount: 0,
    })),
  };
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

