import { NextRequest, NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY || "",
    process.env.LIVEKIT_API_SECRET || ""
  );

  try {
    const body = await req.text();
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const event = await receiver.receive(body, authHeader);

    // Egress Events (Recordings)
    if (event.event === "egress_started") {
      await prisma.recording.updateMany({
        where: { egressId: event.egressInfo?.egressId },
        data: { status: "ACTIVE" },
      });
    } else if (event.event === "egress_ended") {
      await prisma.recording.updateMany({
        where: { egressId: event.egressInfo?.egressId },
        data: { status: "COMPLETED" },
      });
    } else if (event.event === "egress_updated") {
       if (event.egressInfo?.status === 3 || event.egressInfo?.status === 4) { // 3: Failed, 4: Aborted
          await prisma.recording.updateMany({
            where: { egressId: event.egressInfo?.egressId },
            data: { status: "FAILED" },
          });
       }
    }
    
    // Room Lifecycle Events (Metadata)
    else if (event.event === "room_started") {
      if (event.room?.name) {
        await prisma.meeting.upsert({
          where: { id: event.room.name },
          update: { status: "ACTIVE", startedAt: new Date() },
          create: {
            id: event.room.name,
            eventId: event.room.name, // Assuming room name matches eventId
            status: "ACTIVE",
          }
        });
      }
    } else if (event.event === "room_finished") {
      if (event.room?.name) {
        const meeting = await prisma.meeting.findUnique({ where: { id: event.room.name } });
        if (meeting) {
          const endedAt = new Date();
          const duration = Math.floor((endedAt.getTime() - meeting.startedAt.getTime()) / 1000);
          
          await prisma.meeting.update({
            where: { id: meeting.id },
            data: { status: "ENDED", endedAt, duration }
          });

          // Generate Analytics
          const totalAttendees = await prisma.meetingParticipant.count({ where: { meetingId: meeting.id } });
          const totalMessages = await prisma.message.count({ where: { meetingId: meeting.id } });
          
          await prisma.meetingAnalytics.upsert({
            where: { meetingId: meeting.id },
            update: { totalAttendees, totalMessages },
            create: { meetingId: meeting.id, totalAttendees, totalMessages }
          });
        }
      }
    }
    
    // Participant Lifecycle Events (Analytics)
    else if (event.event === "participant_joined") {
      if (event.room?.name && event.participant?.identity) {
        // Create Meeting if it doesn't exist just in case webhook ordering is weird
        await prisma.meeting.upsert({
          where: { id: event.room.name },
          update: {},
          create: { id: event.room.name, eventId: event.room.name, status: "ACTIVE" }
        });
        
        await prisma.meetingParticipant.create({
          data: {
            meetingId: event.room.name,
            userId: event.participant.identity,
            joinedAt: new Date(),
          }
        });
      }
    } else if (event.event === "participant_left") {
      if (event.room?.name && event.participant?.identity) {
        // Find the most recent active join for this user in this room
        const activeParticipation = await prisma.meetingParticipant.findFirst({
          where: { meetingId: event.room.name, userId: event.participant.identity, leftAt: null },
          orderBy: { joinedAt: 'desc' }
        });
        
        if (activeParticipation) {
          const leftAt = new Date();
          const duration = Math.floor((leftAt.getTime() - activeParticipation.joinedAt.getTime()) / 1000);
          await prisma.meetingParticipant.update({
            where: { id: activeParticipation.id },
            data: { leftAt, duration }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LIVEKIT_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
