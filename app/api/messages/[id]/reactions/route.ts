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

  const existing = await prisma.readReceipt.findFirst({
    where: { userId: session.userId, messageId },
  });

  return NextResponse.json({ success: true, emoji });
}
