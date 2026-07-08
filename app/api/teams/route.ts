import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function formatTeam(team: any) {
  return {
    id: team.id,
    name: team.name,
    avatar: team.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    membersCount: team._count?.members ?? 0,
    channels: (team.channels || []).map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      description: ch.description || "",
      isPrivate: ch.type === "PRIVATE",
      unreadCount: 0,
      messages: (ch.messages || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.authorId,
        senderName: msg.author.name || "Unknown",
        senderAvatar: (msg.author.name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
        reactions: [],
        replyCount: 0,
      })),
    })),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.userId },
    include: {
      team: {
        include: {
          channels: {
            include: {
              messages: {
                include: {
                  author: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { name: "asc" },
          },
          _count: { select: { members: true } },
        },
      },
    },
  });

  return NextResponse.json({ teams: memberships.map((m) => formatTeam(m.team)) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "team";

     const existing = await prisma.team.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A team with this name already exists" }, { status: 409 });
  }

  const team = await prisma.team.create({
    data: {
      name,
      slug,
      description,
      members: {
        create: { userId: session.userId, role: "OWNER" },
      },
      channels: {
        create: { name: "general", description: "General discussion" },
      },
    },
    include: {
      channels: {
        include: {
          messages: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { members: true } },
    },
  });

  await prisma.activityEvent.create({
    data: {
      type: "TEAM_JOINED",
      metadata: { teamId: team.id, teamName: team.name },
      userId: session.userId,
    },
  });

  return NextResponse.json({ team: formatTeam(team) }, { status: 201 });
}
