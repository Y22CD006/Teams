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
    const { type, receiverId, roomId, isVideo, callerName, payload } = body;

    if (!receiverId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // Broadcast via Redis
    if (redis) {
      await redis.publish(
        `user:${receiverId}`,
        JSON.stringify({
          id: `call-sig-${Date.now()}`,
          type,
          roomId,
          isVideo,
          callerId: userId,
          callerName,
          payload,
          timestamp: new Date().toISOString()
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Call Signal Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

