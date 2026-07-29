import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function PATCH() {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  });

  await cacheDel(`user:${session.userId}:notifications`);
  return NextResponse.json({ success: true });
}

