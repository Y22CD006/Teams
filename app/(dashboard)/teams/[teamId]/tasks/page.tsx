import { KanbanBoard } from "@/components/tasks/kanban-board";
import { getTasksForTeam } from "@/lib/services/task-service";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const tasks = await getTasksForTeam(teamId);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Tasks</h1>
      <KanbanBoard tasks={tasks} teamId={teamId} />
    </div>
  );
}
