"use server";

import { auth } from "@/lib/auth";
import * as teamService from "@/lib/services/team-service";

export async function createTeamAction(data: { name: string; description?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return teamService.createTeam(data, userId);
}

export async function getTeamsAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return teamService.getTeamsForUser(userId);
}

export async function getTeamAction(teamId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return teamService.getTeamById(teamId);
}

export async function updateTeamAction(teamId: string, data: { name?: string; description?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return teamService.updateTeam(teamId, data);
}

export async function deleteTeamAction(teamId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return teamService.deleteTeam(teamId);
}
