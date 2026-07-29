"use server";

import { auth } from "@/lib/auth";
import * as taskService from "@/lib/services/task-service";
import { TaskStatus } from "@prisma/client";

export async function getTasksAction(teamId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
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
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return taskService.createTask({ ...data, createdById: userId as string });
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return taskService.updateTaskStatus(taskId, status);
}

export async function deleteTaskAction(taskId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return taskService.deleteTask(taskId);
}
