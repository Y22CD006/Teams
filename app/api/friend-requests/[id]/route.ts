import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!status || !["ACCEPTED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Status must be ACCEPTED or REJECTED" }, { status: 400 });
  }

  const request = await prisma.friendRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.recipientId !== session.userId) {
    return NextResponse.json({ error: "Not your request to respond to" }, { status: 403 });
  }

  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Request already resolved" }, { status: 400 });
  }

  const updated = await prisma.friendRequest.update({
    where: { id },
    data: { status },
    include: {
      sender: { select: { id: true, name: true, username: true, email: true } },
    },
  });

  if (status === "ACCEPTED") {
    await prisma.activityEvent.create({
      data: {
        type: "FRIEND_ACCEPTED",
        metadata: { friendId: request.senderId, friendName: updated.sender.name || updated.sender.username || updated.sender.email },
        userId: session.userId,
      },
    });
    await prisma.activityEvent.create({
      data: {
        type: "FRIEND_ACCEPTED",
        metadata: { friendId: session.userId },
        userId: request.senderId,
      },
    });
    const existingDm = await prisma.directMessage.findFirst({
      where: {
        isGroup: false,
        members: {
          every: { userId: { in: [request.senderId, request.recipientId] } },
        },
      },
    });

    if (!existingDm) {
      const dm = await prisma.directMessage.create({
        data: { isGroup: false },
      });
      await prisma.dMMember.createMany({
        data: [
          { userId: request.senderId, dmId: dm.id },
          { userId: request.recipientId, dmId: dm.id },
        ],
      });
    }
  }

  return NextResponse.json({ request: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const request = await prisma.friendRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.senderId !== session.userId && request.recipientId !== session.userId) {
    return NextResponse.json({ error: "Not your connection" }, { status: 403 });
  }

  const otherId = request.senderId === session.userId ? request.recipientId : request.senderId;

  await prisma.friendRequest.delete({ where: { id } });

  const dm = await prisma.directMessage.findFirst({
    where: {
      isGroup: false,
      members: {
        every: { userId: { in: [session.userId, otherId] } },
      },
    },
  });

  if (dm) {
    await prisma.dMMember.deleteMany({
      where: { dmId: dm.id },
    });
    await prisma.message.deleteMany({
      where: { dmId: dm.id },
    });
    await prisma.directMessage.delete({ where: { id: dm.id } });
  }

  return NextResponse.json({ success: true });
}
