import { prisma } from "@/lib/prisma";
import { ChannelType } from "@prisma/client";

export async function getChannelsForTeam(teamId: string, userId: string) {
  return prisma.channel.findMany({
    where: {
      teamId,
      OR: [
        { type: ChannelType.PUBLIC },
        { members: { some: { userId } } },
      ],
    },
    orderBy: { name: "asc" },
  });
}

export async function getChannelById(channelId: string) {
  return prisma.channel.findUnique({
    where: { id: channelId },
    include: { team: true },
  });
}

export async function createChannel(data: { name: string; description?: string; type?: ChannelType; teamId: string }, creatorId: string) {
  const channel = await prisma.channel.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type ?? ChannelType.PUBLIC,
      teamId: data.teamId,
      members: data.type === ChannelType.PRIVATE
        ? { create: { userId: creatorId } }
        : undefined,
    },
  });
  return channel;
}

export async function updateChannel(channelId: string, data: { name?: string; description?: string }) {
  return prisma.channel.update({ where: { id: channelId }, data });
}

export async function deleteChannel(channelId: string) {
  return prisma.channel.delete({ where: { id: channelId } });
}

export async function addChannelMember(channelId: string, userId: string) {
  return prisma.channelMember.create({ data: { userId, channelId } });
}

export async function removeChannelMember(channelId: string, userId: string) {
  return prisma.channelMember.delete({ where: { userId_channelId: { userId, channelId } } });
}
