import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { TaskCard } from './task-card';
import { TaskStatus } from "@prisma/client";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: string;
  assignee: { id: string; name: string | null; imageUrl: string | null } | null;
};

interface KanbanBoardProps {
  tasks: Task[];
  teamId: string;
  onAddTask: (task: { title: string; description?: string; priority: string; teamId: string }) => Promise<void>;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const COLUMNS = [
  { title: "To Do", status: TaskStatus.TODO, color: "border-t-gray-500" },
  { title: "In Progress", status: TaskStatus.IN_PROGRESS, color: "border-t-amber-500" },
  { title: "Done", status: TaskStatus.DONE, color: "border-t-emerald-500" },
];

export function KanbanBoard({ tasks, teamId, onAddTask, onUpdateStatus, onDeleteTask }: KanbanBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    await onAddTask({ title: newTitle.trim(), description: newDesc, priority: newPriority, teamId });
    setNewTitle('');
    setNewDesc('');
    setNewPriority('MEDIUM');
    setSaving(false);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Kanban Board</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-[#6366F1] text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#5053e1] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-sm rounded-lg px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            autoFocus
          />
          <div className="flex gap-2">
            {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer ${
                  newPriority === p
                    ? 'bg-[#6366F1]/10 border-[#6366F1] text-[#6366F1]'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-xs rounded-lg px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1] resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-transparent text-[var(--text-secondary)] py-2 rounded-lg border border-[var(--border-color)] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !newTitle.trim()}
              className="flex-1 bg-[#6366F1] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#5053e1] disabled:opacity-60 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className={`rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 border-t-2 ${col.color}`}>
            <div className="p-3 border-b border-[var(--border-color)]">
              <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] font-mono tracking-wider">
                {col.title}
                <span className="ml-2 text-[10px] text-gray-500">({tasks.filter((t) => t.status === col.status).length})</span>
              </h3>
            </div>
            <div
              className="p-3 space-y-2 min-h-[120px]"
              onDrop={async (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId) await onUpdateStatus(taskId, col.status);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {tasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                    className="group relative"
                  >
                    <TaskCard task={task} />
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
