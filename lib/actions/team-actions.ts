"use server";

import { getAuthUserId, requireAuth } from "@/lib/clerk";
import * as teamService from "@/lib/services/team-service";

export async function createTeamAction(data: { name: string; description?: string }) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return teamService.createTeam(data, userId);
}

export async function getTeamsAction() {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return teamService.getTeamsForUser(userId);
}

export async function getTeamAction(teamId: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return teamService.getTeamById(teamId);
}

export async function updateTeamAction(teamId: string, data: { name?: string; description?: string }) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return teamService.updateTeam(teamId, data);
}

export async function deleteTeamAction(teamId: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return teamService.deleteTeam(teamId);
}
