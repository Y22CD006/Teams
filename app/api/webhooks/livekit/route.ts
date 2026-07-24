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
         // Create Call if not exists
         const roomId = event.room.name;
         // Extract caller and receiver from room ID assuming format call_userA_userB_timestamp
         const parts = roomId.split("_");
         if (parts.length >= 3 && parts[0] === "call") {
             const callerId = parts[1];
             const receiverId = parts[2];
             
             await prisma.call.upsert({
               where: { roomId },
               update: { status: "ONGOING", startTime: new Date() },
               create: {
                 roomId,
                 callerId,
                 receiverId,
                 callType: "VIDEO",
                 status: "ONGOING",
               }
             });
         }
      }
    } else if (event.event === "room_finished") {
      if (event.room?.name) {
        const call = await prisma.call.findUnique({ where: { roomId: event.room.name } });
        if (call) {
          const endedAt = new Date();
          const duration = Math.floor((endedAt.getTime() - call.startTime.getTime()) / 1000);
          
          await prisma.call.update({
            where: { id: call.id },
            data: { status: "COMPLETED", endTime: endedAt, duration }
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
