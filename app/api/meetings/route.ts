import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = `user:${session.userId}:meetings`; const cached = await cacheGet<any>(cacheKey); if (cached) return NextResponse.json(cached);

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { creatorId: session.userId },
        { attendees: { some: { userId: session.userId } } },
      ],
    },
    include: {
      creator: { select: { id: true, name: true } },
      attendees: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const meetings = events.map((event) => ({
    id: event.id,
    title: event.title,
    organizer: event.creator.name || "Unknown",
    date: event.startTime.toISOString().split("T")[0],
    startTime: event.startTime.toISOString().split("T")[1].substring(0, 5),
    endTime: event.endTime.toISOString().split("T")[1].substring(0, 5),
    description: event.description || "",
    attendees: event.attendees.map((a) => a.user.name || "Unknown"),
    isLive: false,
  }));

  await cacheSet(cacheKey, { meetings }, 30);
  return NextResponse.json({ meetings });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, startTime, endTime, attendees } = await req.json();

  const event = await prisma.event.create({
    data: {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      creatorId: session.userId,
    },
  });

  if (attendees && attendees.length > 0) {
    await prisma.eventAttendee.createMany({
      data: attendees.map((userId: string) => ({
        eventId: event.id,
        userId,
      })),
    });
  }

  await prisma.activityEvent.create({
    data: {
      type: "MEETING_CREATED",
      metadata: { eventId: event.id, title: event.title },
      userId: session.userId,
    },
  });

  await cacheDel(`user:${session.userId}:meetings`);
  return NextResponse.json({ event }, { status: 201 });
}
