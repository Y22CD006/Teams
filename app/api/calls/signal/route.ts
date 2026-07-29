import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId: authUserId } = await auth();
    const userId = authUserId as string;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, receiverId, roomId, isVideo, callerName, payload, teamId } = body;

    if (!type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type === "INCOMING_CHANNEL_CALL") {
      if (!teamId || !roomId) {
        return NextResponse.json({ error: "teamId and roomId required for channel calls" }, { status: 400 });
      }
      
      const members = await prisma.teamMember.findMany({ where: { teamId } });
      
      if (redis) {
        for (const member of members) {
          if (member.userId !== userId) {
            await redis.publish(
              `user:${member.userId}`,
              JSON.stringify({
                id: `call-sig-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                type,
                roomId,
                isVideo,
                callerId: userId,
                callerName,
                payload, // Can include channelName
                timestamp: new Date().toISOString()
              })
            );
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required for 1-1 calls" }, { status: 400 });
    }

    if (type === "INCOMING_CALL") {
      // Create a Call record in PostgreSQL
      await prisma.call.create({
        data: {
          roomId,
          callerId: userId,
          receiverId,
          callType: isVideo ? "VIDEO" : "VOICE",
          status: "RINGING",
        }
      });
    } else if (type === "ACCEPT_CALL" || type === "REJECT_CALL" || type === "END_CALL") {
      // Update Call record status
      const statusMap = {
        "ACCEPT_CALL": "ONGOING",
        "REJECT_CALL": "REJECTED",
        "END_CALL": "COMPLETED"
      };
      
      const call = await prisma.call.findUnique({ where: { roomId } });
      if (call) {
        await prisma.call.update({
          where: { roomId },
          data: {
            status: statusMap[type as keyof typeof statusMap],
            ...(type === "END_CALL" && { 
              endTime: new Date(),
              duration: Math.floor((Date.now() - new Date(call.startTime).getTime()) / 1000)
            })
          }
        });
      }
    }

    let finalCallerName = callerName;
    if (!finalCallerName || finalCallerName === userId || finalCallerName.startsWith("cmr")) {
      const callerUser = await prisma.user.findUnique({ where: { id: userId } });
      if (callerUser) {
        finalCallerName = callerUser.name || callerUser.username || callerUser.email?.split('@')[0] || userId;
      }
    }

    // Broadcast via Redis
    if (redis) {
      const messagePayload = JSON.stringify({
        id: `call-sig-${Date.now()}`,
        type,
        roomId,
        isVideo,
        callerId: userId,
        callerName: finalCallerName,
        payload,
        forEveryone: body.forEveryone || false,
        timestamp: new Date().toISOString()
      });

      await redis.publish(`user:${receiverId}`, messagePayload);
      if (body.forEveryone === true) {
        await redis.publish("calls:broadcast", messagePayload);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Call Signal Error:", error);
    return NextResponse.json({ error: "Internal Error", message: error?.message, stack: error?.stack }, { status: 500 });
  }
}
