import { TaskStatus } from "@prisma/client";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  assignee: { id: string; name: string | null; imageUrl: string | null } | null;
};

export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="text-sm font-medium">{task.title}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-xs font-medium ${
          task.priority === "HIGH" || task.priority === "URGENT"
            ? "text-red-600"
            : task.priority === "MEDIUM"
              ? "text-yellow-600"
              : "text-green-600"
        }`}>
          {task.priority}
        </span>
        {task.assignee && (
          <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
        )}
      </div>
    </div>
  );
}
