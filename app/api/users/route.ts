import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET() {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cached = await cacheGet<any>("global:users"); if (cached) return NextResponse.json(cached);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });

  const mapped = users.map((u) => {
    let displayName = u.name;
    if (!displayName || displayName === u.id) {
      displayName = u.username || u.email?.split("@")[0] || u.id;
    }
    return {
      id: u.id,
      name: displayName,
      avatar: displayName.charAt(0).toUpperCase(),
      role: "",
      status: u.status.toLowerCase() as "online" | "busy" | "away" | "offline",
      email: u.email,
    };
  });

  await cacheSet("global:users", { users: mapped }, 30);
  return NextResponse.json({ users: mapped });
}
