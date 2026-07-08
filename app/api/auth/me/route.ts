import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, username: true, imageUrl: true, status: true, customStatus: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, status, customStatus, role } = body;

  const STATUS_MAP: Record<string, string> = {
    online: "AVAILABLE",
    busy: "BUSY",
    away: "AWAY",
    offline: "OFFLINE",
  };

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (status !== undefined) data.status = STATUS_MAP[status] || status;
  if (customStatus !== undefined) data.customStatus = customStatus;
  if (role !== undefined) data.role = role;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { id: true, email: true, name: true, username: true, imageUrl: true, status: true, customStatus: true, role: true },
  });

  if (status !== undefined || customStatus !== undefined) {
    await prisma.activityEvent.create({
      data: {
        type: "STATUS_CHANGED",
        metadata: { status: user.status, customStatus: user.customStatus },
        userId: session.userId,
      },
    });
  }

  return NextResponse.json({ user });
}
