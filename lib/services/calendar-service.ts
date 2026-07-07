import { prisma } from "@/lib/prisma";

export async function getEventsForUser(userId: string, start: Date, end: Date) {
  return prisma.event.findMany({
    where: {
      attendees: { some: { userId } },
      startTime: { gte: start },
      endTime: { lte: end },
    },
    include: {
      creator: { select: { id: true, name: true, imageUrl: true } },
      attendees: { include: { user: { select: { id: true, name: true, imageUrl: true } } } },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function createEvent(data: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  meetingLink?: string;
  creatorId: string;
  attendeeIds: string[];
}) {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      isAllDay: data.isAllDay ?? false,
      meetingLink: data.meetingLink,
      creatorId: data.creatorId,
      attendees: {
        createMany: {
          data: data.attendeeIds.map((userId) => ({
            userId,
            status: userId === data.creatorId ? "ACCEPTED" : "PENDING",
          })),
        },
      },
    },
    include: {
      creator: true,
      attendees: { include: { user: true } },
    },
  });
  return event;
}

export async function updateEvent(eventId: string, data: { status: string }) {
  return prisma.eventAttendee.update({
    where: { id: eventId },
    data: { status: data.status, respondedAt: new Date() },
  });
}
