import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = (await params).id;
  const { name, description, type } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
  }

  const channel = await prisma.channel.create({
    data: {
      name,
      description,
      type: type === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      teamId,
    },
  });

  await prisma.channelMember.create({
    data: { userId: session.userId, channelId: channel.id },
  });

  await prisma.activityEvent.create({
    data: {
      type: "CHANNEL_CREATED",
      metadata: { channelId: channel.id, channelName: channel.name, teamId },
      userId: session.userId,
    },
  });

  await cacheDel(`user:${session.userId}:teams`);
  return NextResponse.json({
    channel: {
      id: channel.id,
      name: channel.name,
      description: channel.description || "",
      isPrivate: channel.type === "PRIVATE",
      unreadCount: 0,
      messages: [],
    },
  }, { status: 201 });
}
