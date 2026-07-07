import { TaskCard } from "./task-card";
import { TaskStatus } from "@prisma/client";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  assignee: { id: string; name: string | null; imageUrl: string | null } | null;
};

const COLUMNS = [
  { title: "To Do", status: TaskStatus.TODO },
  { title: "In Progress", status: TaskStatus.IN_PROGRESS },
  { title: "Done", status: TaskStatus.DONE },
];

export function KanbanBoard({ tasks, teamId }: { tasks: Task[]; teamId: string }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {COLUMNS.map((col) => (
        <div key={col.status} className="rounded-lg border bg-muted/20 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{col.title}</h3>
          <div className="space-y-2">
            {tasks
              .filter((t) => t.status === col.status)
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
