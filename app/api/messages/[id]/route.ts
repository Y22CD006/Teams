import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const msg = await prisma.message.findUnique({ where: { id } });
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (msg.authorId !== session.userId) {
    return NextResponse.json({ error: "Can only delete your own messages" }, { status: 403 });
  }

  await prisma.message.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
