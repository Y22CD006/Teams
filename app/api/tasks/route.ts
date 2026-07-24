import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const { userId: authUserId } = await auth();
    const userId = authUserId as string;
    const session = userId ? { userId } : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[GET Tasks] Fetching tasks for user:", session.userId);
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: session.userId },
          { createdById: session.userId },
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
      .map((t) => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        const d = new Date(t.dueDate!);
        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

        return {
          id: t.id,
          title: t.title,
          date: dateStr,
          time: timeStr,
          status: t.status,
          priority: t.priority,
          assigneeName: t.assignee?.name || null,
        };
      });

    console.log(`[GET Tasks] Successfully fetched and formatted ${mapped.length} tasks.`);
    return NextResponse.json({ tasks: mapped });
  } catch (err) {
    console.error("[GET Tasks] Error fetching tasks:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: authUserId } = await auth();
    const userId = authUserId as string;
    const session = userId ? { userId } : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { title, description, priority, dueDate, assigneeId, teamId } = await req.json();
    console.log("[POST Tasks] Submission payload:", { title, description, priority, dueDate, assigneeId, teamId });

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Robust teamId resolution if not supplied or empty
    if (!teamId) {
      const memberTeam = await prisma.teamMember.findFirst({
        where: { userId: session.userId },
        select: { teamId: true },
      });
      if (memberTeam) {
        teamId = memberTeam.teamId;
      } else {
        const fallbackTeam = await prisma.team.findFirst({ select: { id: true } });
        if (fallbackTeam) {
          teamId = fallbackTeam.id;
        } else {
          return NextResponse.json({ error: "No team context found. Cannot create task." }, { status: 400 });
        }
      }
      console.log("[POST Tasks] Resolved teamId automatically:", teamId);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        teamId,
        createdById: session.userId,
      },
    });

    console.log("[POST Tasks] Successfully created task in DB:", task.id);
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("[POST Tasks] Error creating task:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
