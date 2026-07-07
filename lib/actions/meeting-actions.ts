"use server";

import { getAuthUserId, requireAuth } from "@/lib/clerk";
import * as meetingService from "@/lib/services/meeting-service";

export async function createMeetingAction() {
  const userId = await getAuthUserId();
  requireAuth(userId);
  const room = meetingService.generateRoomName();
  return meetingService.createMeetingRoom(userId, room);
}

export async function joinMeetingAction(room: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return meetingService.createMeetingRoom(userId, room);
}
