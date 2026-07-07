"use server";

import { getAuthUserId, requireAuth } from "@/lib/clerk";
import * as calendarService from "@/lib/services/calendar-service";

export async function createEventAction(data: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  meetingLink?: string;
  attendeeIds: string[];
}) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return calendarService.createEvent({ ...data, creatorId: userId });
}

export async function getEventsAction(start: Date, end: Date) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return calendarService.getEventsForUser(userId, start, end);
}
