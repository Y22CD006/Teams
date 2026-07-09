import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (event.creatorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.eventAttendee.deleteMany({ where: { eventId: id } });
  await prisma.event.delete({ where: { id } });
  await cacheDel(`user:${session.userId}:meetings`);

  return NextResponse.json({ success: true });
}
