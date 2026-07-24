"use server";

import { auth } from "@/lib/auth";
import * as meetingService from "@/lib/services/meeting-service";

export async function createMeetingAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const room = meetingService.generateRoomName();
  return meetingService.createMeetingRoom(userId, room);
}

export async function joinMeetingAction(room: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return meetingService.createMeetingRoom(userId, room);
}
