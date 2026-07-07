import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { MembershipRole } from "@prisma/client";

export async function getTeamsForUser(userId: string) {
  return prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: { _count: { select: { members: true, channels: true } } },
  });
}

export async function getTeamById(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { user: { select: { id: true, name: true, username: true, imageUrl: true } } } },
      channels: { where: { type: "PUBLIC" }, orderBy: { name: "asc" } },
    },
  });
}

export async function createTeam(data: { name: string; description?: string }, creatorId: string) {
  const team = await prisma.team.create({
    data: {
      name: data.name,
      slug: slugify(data.name),
      description: data.description,
      members: { create: { userId: creatorId, role: MembershipRole.OWNER } },
    },
  });
  await prisma.channel.create({
    data: { name: "general", description: "General discussion", teamId: team.id },
  });
  return team;
}

export async function updateTeam(teamId: string, data: { name?: string; description?: string }) {
  return prisma.team.update({
    where: { id: teamId },
    data: { ...data, ...(data.name && { slug: slugify(data.name) }) },
  });
}

export async function deleteTeam(teamId: string) {
  return prisma.team.delete({ where: { id: teamId } });
}

export async function addTeamMember(teamId: string, userId: string, role: MembershipRole = MembershipRole.MEMBER) {
  return prisma.teamMember.create({ data: { userId, teamId, role } });
}

export async function removeTeamMember(teamId: string, userId: string) {
  return prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } });
}
