import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channelId = (await params).id;

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: userId, teamId: channel.teamId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a team member" }, { status: 403 });

  const members = await prisma.channelMember.findMany({
    where: { channelId },
    include: {
      user: { select: { id: true, name: true, username: true, email: true, status: true } },
    },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.user.id,
      name: m.user.name || m.user.username,
      email: m.user.email,
      status: m.user.status,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channelId = (await params).id;
  const { userId: targetUserId } = await req.json();

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: userId, teamId: channel.teamId } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const cm = await prisma.channelMember.create({
    data: { userId, channelId },
    include: { user: { select: { id: true, name: true, username: true, email: true } } },
  });

  return NextResponse.json({ member: cm }, { status: 201 });
}
