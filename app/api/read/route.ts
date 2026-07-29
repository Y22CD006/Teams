import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, channelId } = await req.json();

  if (!chatId && !channelId) {
    return NextResponse.json({ error: "chatId or channelId required" }, { status: 400 });
  }

  // Find all messages in the chat/channel that are NOT from the current user
  const unreadMessages = await prisma.message.findMany({
    where: {
      ...(chatId ? { dmId: chatId } : { channelId }),
      authorId: { not: session.userId },
      readReceipts: {
        none: { userId: session.userId }
      }
    },
    select: { id: true }
  });

  if (unreadMessages.length > 0) {
    // Create read receipts for all unread messages
    await prisma.readReceipt.createMany({
      data: unreadMessages.map(m => ({
        messageId: m.id,
        userId: session.userId,
      })),
      skipDuplicates: true,
    });
  }

  // Clear cache
  if (chatId) await cacheDel(`user:${session.userId}:chats`);
  if (channelId) await cacheDel(`user:${session.userId}:teams`);

  return NextResponse.json({ success: true, count: unreadMessages.length }, { status: 200 });
}

