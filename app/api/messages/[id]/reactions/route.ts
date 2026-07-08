import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messageId = (await params).id;
  const { emoji } = await req.json();

  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const existing = await prisma.reaction.findUnique({
    where: { userId_messageId_emoji: { userId: session.userId, messageId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", emoji });
  }

  await prisma.reaction.create({
    data: { emoji, userId: session.userId, messageId },
  });

  return NextResponse.json({ action: "added", emoji });
}
