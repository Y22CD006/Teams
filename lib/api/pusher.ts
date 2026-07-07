import { pusherServer } from "@/lib/pusher";

type ChannelEvent = {
  channel: string;
  event: string;
  data: Record<string, unknown>;
};

export async function publishToChannel({ channel, event, data }: ChannelEvent) {
  await pusherServer.trigger(channel, event, data);
}

export const CHANNELS = {
  TEAM: (id: string) => `team-${id}`,
  CHANNEL: (id: string) => `channel-${id}`,
  DM: (id: string) => `dm-${id}`,
  PRESENCE: "presence-teams",
} as const;

export const EVENTS = {
  MESSAGE_CREATED: "message:created",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  THREAD_REPLY: "thread:reply",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  PRESENCE_UPDATE: "presence:update",
} as const;
