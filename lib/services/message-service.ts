import { prisma } from "@/lib/prisma";
import { publishToChannel, CHANNELS, EVENTS } from "@/lib/api/pusher";

export async function getMessagesForChannel(channelId: string, limit = 50) {
  return prisma.message.findMany({
    where: { channelId, isThread: false },
    include: {
      author: { select: { id: true, name: true, username: true, imageUrl: true } },
      threadReplies: { include: { author: { select: { id: true, name: true, username: true, imageUrl: true } } }, orderBy: { createdAt: "asc" } },
      readReceipts: { select: { userId: true, readAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getMessagesForDM(dmId: string, limit = 50) {
  return prisma.message.findMany({
    where: { dmId },
    include: {
      author: { select: { id: true, name: true, username: true, imageUrl: true } },
      readReceipts: { select: { userId: true, readAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function sendMessage(data: {
  content: string;
  authorId: string;
  channelId?: string;
  dmId?: string;
}) {
  const message = await prisma.message.create({
    data: {
      content: data.content,
      authorId: data.authorId,
      channelId: data.channelId,
      dmId: data.dmId,
    },
    include: { author: true },
  });

  if (data.channelId) {
    await publishToChannel({
      channel: CHANNELS.CHANNEL(data.channelId),
      event: EVENTS.MESSAGE_CREATED,
      data: { message },
    });
  }

  if (data.dmId) {
    await publishToChannel({
      channel: CHANNELS.DM(data.dmId),
      event: EVENTS.MESSAGE_CREATED,
      data: { message },
    });
  }

  return message;
}

export async function replyToThread(data: {
  content: string;
  authorId: string;
  messageId: string;
}) {
  const reply = await prisma.threadReply.create({
    data: {
      content: data.content,
      authorId: data.authorId,
      messageId: data.messageId,
    },
    include: { author: true },
  });

  const parent = await prisma.message.findUnique({ where: { id: data.messageId } });
  if (parent?.channelId) {
    await publishToChannel({
      channel: CHANNELS.CHANNEL(parent.channelId),
      event: EVENTS.THREAD_REPLY,
      data: { reply, parentMessageId: data.messageId },
    });
  }

  return reply;
}

export async function markAsRead(userId: string, messageId: string) {
  return prisma.readReceipt.upsert({
    where: { userId_messageId: { userId, messageId } },
    update: { readAt: new Date() },
    create: { userId, messageId },
  });
}
