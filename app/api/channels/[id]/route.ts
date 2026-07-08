import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, description } = await req.json();

  const channel = await prisma.channel.findUnique({ where: { id }, include: { team: true } });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId: channel.teamId } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;

  const updated = await prisma.channel.update({ where: { id }, data });
  return NextResponse.json({ channel: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const channel = await prisma.channel.findUnique({ where: { id }, include: { team: true } });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId: channel.teamId } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (channel.name === "general") {
    return NextResponse.json({ error: "Cannot delete the general channel" }, { status: 400 });
  }

  await prisma.channel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
