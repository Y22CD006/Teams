import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: session.userId },
        { team: { members: { some: { userId: session.userId } } } },
      ],
    },
    include: {
      assignee: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const mapped = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({
      id: t.id,
      title: t.title,
      date: t.dueDate!.toISOString().split("T")[0],
      time: t.dueDate!.toISOString().split("T")[1]?.substring(0, 5),
      status: t.status,
      priority: t.priority,
      assigneeName: t.assignee?.name || null,
    }));

  return NextResponse.json({ tasks: mapped });
}

export async function POST(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, priority, dueDate, assigneeId, teamId } = await req.json();

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId,
      teamId,
      createdById: session.userId,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}

