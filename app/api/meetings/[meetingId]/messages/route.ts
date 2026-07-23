import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest, { params }: { params: { meetingId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId } = params;

  try {
    const messages = await prisma.message.findMany({
      where: { meetingId },
      include: {
        author: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const mapped = messages.map((msg) => ({
      id: msg.id,
      message: msg.content,
      timestamp: msg.createdAt.getTime(),
      from: {
        identity: msg.authorId,
        name: msg.author.name || "Unknown",
        metadata: JSON.stringify({ profileImage: msg.author.imageUrl })
      }
    }));

    return NextResponse.json({ messages: mapped });
  } catch (error) {
    console.error("[MEETING_MESSAGES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { meetingId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId } = params;
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  try {
    const msg = await prisma.message.create({
      data: {
        content,
        authorId: userId,
        meetingId,
      },
      include: {
        author: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    const formatted = {
      id: msg.id,
      message: msg.content,
      timestamp: msg.createdAt.getTime(),
      from: {
        identity: msg.authorId,
        name: msg.author.name || "Unknown",
        metadata: JSON.stringify({ profileImage: msg.author.imageUrl })
      }
    };

    return NextResponse.json({ message: formatted }, { status: 201 });
  } catch (error) {
    console.error("[MEETING_MESSAGES_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
