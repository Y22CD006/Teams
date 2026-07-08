import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
            include: {
              author: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const chats = memberships.map((m) => {
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

    return {
      id: dm.id,
      name,
      type: isGroup ? "group" as const : "direct" as const,
      participants,
      unreadCount: 0,
      messages: dm.messages.map((msg) => ({
        id: msg.id,
        senderId: msg.authorId,
        senderName: msg.author.name || "Unknown",
        senderAvatar: (msg.author.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
        reactions: [],
        replyCount: 0,
      })),
    };
  });

  return NextResponse.json({ chats });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
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
        include: { author: { select: { id: true, name: true } } },
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
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!created) {
    return NextResponse.json({ error: "Failed to create DM" }, { status: 500 });
  }

  const chat = formatChat(created, session.userId);
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
    unreadCount: 0,
    messages: dm.messages.map((msg: any) => ({
      id: msg.id,
      senderId: msg.authorId,
      senderName: msg.author.name || "Unknown",
      senderAvatar: (msg.author.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      reactions: [],
      replyCount: 0,
    })),
  };
}
