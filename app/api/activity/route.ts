import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.userId;

  const [events, meetingsCount, filesCount, unreadChats, unreadChannelMessages] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),

    prisma.event.count({
      where: {
        OR: [
          { creatorId: userId },
          { attendees: { some: { userId } } },
        ],
      },
    }),

    prisma.storedFile.count({
      where: { uploadedById: userId },
    }),

    prisma.message.count({
      where: {
        dm: {
          members: { some: { userId } },
        },
        authorId: { not: userId },
        readReceipts: { none: { userId } },
      },
    }),

    prisma.message.count({
      where: {
        channel: {
          team: {
            members: { some: { userId } },
          },
        },
        authorId: { not: userId },
        readReceipts: { none: { userId } },
      },
    }),
  ]);

  const mappedEvents = events.map((e) => ({
    id: e.id,
    type: e.type.toLowerCase(),
    metadata: e.metadata,
    userName: e.user.name || e.user.email,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json({
    events: mappedEvents,
    summary: {
      meetingsCount,
      filesCount,
      unreadCount: unreadChats + unreadChannelMessages,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, metadata } = await req.json();

  const event = await prisma.activityEvent.create({
    data: {
      type,
      metadata: metadata || {},
      userId: session.userId,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
