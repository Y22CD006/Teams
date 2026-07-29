"use server";

import { auth } from "@/lib/auth";
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
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return calendarService.createEvent({ ...data, creatorId: userId as string });
}

export async function getEventsAction(start: Date, end: Date) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return calendarService.getEventsForUser(userId, start, end);
}
