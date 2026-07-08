import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const dmId = searchParams.get("dmId");

    if (!channelId && !dmId) {
      return NextResponse.json({ error: "channelId or dmId required" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        ...(channelId ? { channelId } : { dmId }),
        isThread: false,
      },
      include: {
        author: {
          select: { id: true, name: true, imageUrl: true, status: true, email: true }
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { content, channelId, dmId } = await req.json();

    if (!content || (!channelId && !dmId)) {
      return NextResponse.json({ error: "Content and channelId/dmId required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const message = await prisma.message.create({
      data: {
        content,
        authorId: user.id,
        ...(channelId ? { channelId } : { dmId }),
      },
      include: {
        author: {
          select: { id: true, name: true, imageUrl: true, status: true, email: true }
        },
      },
    });

    const pusherChannel = channelId ? `channel-${channelId}` : `dm-${dmId}`;
    await pusherServer.trigger(pusherChannel, "new-message", message);

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
