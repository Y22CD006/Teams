"use server";

import { getAuthUserId, requireAuth } from "@/lib/clerk";
import * as messageService from "@/lib/services/message-service";

export async function sendMessageAction(data: {
  content: string;
  channelId?: string;
  dmId?: string;
}) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return messageService.sendMessage({ ...data, authorId: userId });
}

export async function replyToThreadAction(data: {
  content: string;
  messageId: string;
}) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return messageService.replyToThread({ ...data, authorId: userId });
}

export async function getChannelMessagesAction(channelId: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return messageService.getMessagesForChannel(channelId);
}

export async function markAsReadAction(messageId: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return messageService.markAsRead(userId, messageId);
}
