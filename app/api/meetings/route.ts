import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[GET Meetings] Fetching events for user:", userId);
    const events = await prisma.event.findMany({
      where: {
        attendees: { some: { userId } },
      },
      include: {
        creator: { select: { id: true, name: true } },
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { startTime: "asc" },
    });

    // Format database Event objects into CalendarMeeting interface format
    const formattedMeetings = events.map((event) => {
      const pad = (n: number) => n.toString().padStart(2, "0");
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      
      const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
      const startTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      const endTimeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

      return {
        id: event.id,
        title: event.title,
        organizer: event.creator?.name || "Unknown",
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        description: event.description || "",
        attendees: event.attendees.map((att) => att.user.name),
      };
    });

    console.log(`[GET Meetings] Successfully fetched and formatted ${formattedMeetings.length} meetings.`);
    return NextResponse.json({ meetings: formattedMeetings });
  } catch (error) {
    console.error("[GET Meetings] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, startTime, endTime, attendees } = body;

    console.log("[POST Meetings] Form submission data received:", { title, description, startTime, endTime, attendees });

    if (!title || !startTime || !endTime) {
      console.warn("[POST Meetings] Missing required fields:", { title, startTime, endTime });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find matching user IDs for input attendees names/emails
    let attendeeIds: string[] = [userId];
    if (attendees && attendees.length > 0) {
      const matchedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { in: attendees, mode: "insensitive" } },
            { email: { in: attendees, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      attendeeIds = Array.from(new Set([userId, ...matchedUsers.map(u => u.id)]));
    }
    console.log("[POST Meetings] Resolved attendee IDs:", attendeeIds);

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        creatorId: userId,
        attendees: {
          createMany: {
            data: attendeeIds.map((uid) => ({
              userId: uid,
              status: uid === userId ? "ACCEPTED" : "PENDING",
            })),
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true } },
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    const pad = (n: number) => n.toString().padStart(2, "0");
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const startTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endTimeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

    const formattedMeeting = {
      id: event.id,
      title: event.title,
      organizer: event.creator?.name || "Unknown",
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      description: event.description || "",
      attendees: event.attendees.map((att) => att.user.name),
    };

    console.log("[POST Meetings] Successfully created meeting event:", formattedMeeting.id);
    return NextResponse.json({ success: true, event: formattedMeeting });
  } catch (error) {
    console.error("[POST Meetings] Error saving event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
