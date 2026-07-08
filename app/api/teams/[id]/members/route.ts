import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = (await params).id;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId } },
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = (await params).id;
  const { userId, role } = await req.json();

  const current = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId } },
  });
  if (!current || current.role === "MEMBER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const member = await prisma.teamMember.create({
    data: { userId, teamId, role: role || "MEMBER" },
    include: { user: { select: { id: true, name: true, username: true, email: true } } },
  });

  await cacheDel(`user:${session.userId}:teams`);
  return NextResponse.json({ member }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = (await params).id;
  const { userId } = await req.json();

  const current = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId } },
  });
  if (!current || current.role === "MEMBER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (session.userId === userId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId, teamId } },
  });

  await cacheDel(`user:${session.userId}:teams`);
  return NextResponse.json({ success: true });
}
