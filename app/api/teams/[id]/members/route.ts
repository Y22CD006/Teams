import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = (await params).id;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: userId, teamId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, username: true, email: true, status: true } },
    },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.user.id,
      name: m.user.name || m.user.username,
      email: m.user.email,
      role: m.role,
      status: m.user.status,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = (await params).id;
  const { userId: targetUserId, role } = await req.json();

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const current = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: userId, teamId } },
  });
  if (!current) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const member = await prisma.teamMember.create({
      data: { userId: targetUserId, teamId, role: role || "MEMBER" },
      include: { user: { select: { id: true, name: true, username: true, email: true } } },
    });

    await cacheDel(`user:${targetUserId}:teams`);
    await cacheDel(`user:${userId}:teams`);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "User is already a member of this team" }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = (await params).id;
  const { userId: targetUserId } = await req.json();

  const current = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: userId, teamId } },
  });
  if (!current || current.role === "MEMBER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (userId === targetUserId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId: targetUserId, teamId } },
  });

  await cacheDel(`user:${targetUserId}:teams`);
  await cacheDel(`user:${userId}:teams`);
  return NextResponse.json({ success: true });
}
