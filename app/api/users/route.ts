import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const mapped = users.map((u) => ({
    id: u.id,
    name: u.name || u.username || u.email,
    avatar: (u.name || u.email).charAt(0).toUpperCase(),
    role: "",
    status: u.status.toLowerCase() as "online" | "busy" | "away" | "offline",
    email: u.email,
  }));

  return NextResponse.json({ users: mapped });
}
