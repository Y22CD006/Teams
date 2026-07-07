"use server";

import { getAuthUserId, requireAuth } from "@/lib/clerk";
import * as channelService from "@/lib/services/channel-service";
import { ChannelType } from "@prisma/client";

export async function createChannelAction(data: { name: string; description?: string; type?: ChannelType; teamId: string }) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return channelService.createChannel(data, userId);
}

export async function getChannelsAction(teamId: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return channelService.getChannelsForTeam(teamId, userId);
}

export async function updateChannelAction(channelId: string, data: { name?: string; description?: string }) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return channelService.updateChannel(channelId, data);
}

export async function deleteChannelAction(channelId: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return channelService.deleteChannel(channelId);
}
