import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { EgressClient, EncodedFileOutput } from "livekit-server-sdk";

export async function GET(req: NextRequest, { params }: { params: { meetingId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId } = params;

  try {
    const recording = await prisma.recording.findFirst({
      where: { meetingId, status: { in: ["STARTING", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
    });

    const event = await prisma.event.findUnique({ where: { id: meetingId } });
    const isHost = !event || event.creatorId === userId;

    return NextResponse.json({ recording, isHost });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { meetingId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId } = params;
  const { action, egressId } = await req.json();

  try {
    // Host Check
    const event = await prisma.event.findUnique({ where: { id: meetingId } });
    if (event && event.creatorId !== userId) {
      return NextResponse.json({ error: "Only the meeting host can control recordings." }, { status: 403 });
    }

    const egressClient = new EgressClient(
      process.env.NEXT_PUBLIC_LIVEKIT_URL || "",
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );

    if (action === "start") {
      const existing = await prisma.recording.findFirst({
        where: { meetingId, status: { in: ["STARTING", "ACTIVE"] } },
      });
      if (existing) {
        return NextResponse.json({ error: "Recording is already active." }, { status: 400 });
      }

      const fileOutput = new EncodedFileOutput({
        filepath: `recordings/${meetingId}-${Date.now()}.mp4`,
      });

      const info = await egressClient.startRoomCompositeEgress(meetingId, {
        file: fileOutput,
      });

      const recording = await prisma.recording.create({
        data: {
          egressId: info.egressId,
          meetingId,
          startedById: userId,
          status: "STARTING",
        },
      });

      return NextResponse.json({ recording });
    } else if (action === "stop") {
      if (!egressId) return NextResponse.json({ error: "egressId required" }, { status: 400 });

      const info = await egressClient.stopEgress(egressId);

      const recording = await prisma.recording.update({
        where: { egressId },
        data: { status: "COMPLETED" },
      });

      return NextResponse.json({ recording });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[EGRESS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to control recording" }, { status: 500 });
  }
}
