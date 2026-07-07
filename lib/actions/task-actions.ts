"use server";

import { getAuthUserId, requireAuth } from "@/lib/clerk";
import * as taskService from "@/lib/services/task-service";
import { TaskStatus } from "@prisma/client";

export async function getTasksAction(teamId: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return taskService.getTasksForTeam(teamId);
}

export async function createTaskAction(data: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  assigneeId?: string;
  teamId: string;
}) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return taskService.createTask({ ...data, createdById: userId });
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return taskService.updateTaskStatus(taskId, status);
}

export async function deleteTaskAction(taskId: string) {
  const userId = await getAuthUserId();
  requireAuth(userId);
  return taskService.deleteTask(taskId);
}
