import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = `user:${session.userId}:notifications`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const mapped = notifications.map((n) => ({
    id: n.id,
    type: n.type.toLowerCase(),
    title: n.title,
    detail: n.detail,
    read: n.read,
    teamId: n.teamId,
    channelId: n.channelId,
    createdAt: n.createdAt.toISOString(),
  }));

  await cacheSet(cacheKey, { notifications: mapped }, 15);
  return NextResponse.json({ notifications: mapped });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, type, title, detail, actorId, teamId, channelId } = await req.json();

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      detail,
      actorId,
      teamId,
      channelId,
    },
  });

  await cacheDel(`user:${session.userId}:notifications`);
  if (userId) await cacheDel(`user:${userId}:notifications`);
  return NextResponse.json({ notification }, { status: 201 });
}
