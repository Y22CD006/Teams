import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function GET() {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sent, received] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { senderId: session.userId },
      include: {
        recipient: { select: { id: true, name: true, username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendRequest.findMany({
      where: { recipientId: session.userId },
      include: {
        sender: { select: { id: true, name: true, username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ sent, received });
}

export async function POST(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipientId } = await req.json();
  if (!recipientId) {
    return NextResponse.json({ error: "recipientId required" }, { status: 400 });
  }

  if (recipientId === session.userId) {
    return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await prisma.friendRequest.findUnique({
    where: { senderId_recipientId: { senderId: session.userId, recipientId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Request already sent" }, { status: 409 });
  }

  const reverse = await prisma.friendRequest.findUnique({
    where: { senderId_recipientId: { senderId: recipientId, recipientId: session.userId } },
  });
  if (reverse?.status === "ACCEPTED") {
    return NextResponse.json({ error: "Already connected" }, { status: 409 });
  }

  const request = await prisma.friendRequest.create({
    data: { senderId: session.userId, recipientId },
    include: {
      recipient: { select: { id: true, name: true, username: true, email: true } },
    },
  });

  await cacheDel(`user:${session.userId}:activity`);
  return NextResponse.json({ request }, { status: 201 });
}

