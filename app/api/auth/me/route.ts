import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: authUserId } = await auth();
  const userId = authUserId as string;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Mock user creation
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@example.com`,
          username: `user_${userId}`,
          name: "Mock User",
          imageUrl: "",
          status: "AVAILABLE",
        }
      });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId: authUserId } = await auth();
  const userId = authUserId as string;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, role, customStatus } = body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(role !== undefined && { role }),
        ...(customStatus !== undefined && { customStatus }),
      },
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

