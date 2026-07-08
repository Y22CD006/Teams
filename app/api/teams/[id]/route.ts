import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, description } = await req.json();

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId: id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    data.name = name;
    data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "team";
  }
  if (description !== undefined) data.description = description;

  const team = await prisma.team.update({ where: { id }, data });
  await cacheDel(`user:${session.userId}:teams`);
  return NextResponse.json({ team });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId: id } },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Only the owner can delete the team" }, { status: 403 });
  }

  await prisma.team.delete({ where: { id } });
  await cacheDel(`user:${session.userId}:teams`);
  return NextResponse.json({ success: true });
}
