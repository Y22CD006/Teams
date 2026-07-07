import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

export async function getTasksForTeam(teamId: string) {
  return prisma.task.findMany({
    where: { teamId },
    include: {
      assignee: { select: { id: true, name: true, username: true, imageUrl: true } },
      createdBy: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  assigneeId?: string;
  teamId: string;
  createdById: string;
}) {
  return prisma.task.create({ data });
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  return prisma.task.update({ where: { id: taskId }, data: { status } });
}

export async function updateTask(taskId: string, data: {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: Date | null;
  assigneeId?: string | null;
}) {
  return prisma.task.update({ where: { id: taskId }, data });
}

export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } });
}
