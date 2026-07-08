import { useState, FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';

interface TaskFormProps {
  selectedDate: string;
  onSave: (task: {
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    dueTime?: string;
    assigneeId?: string;
  }) => void;
  onCancel: () => void;
}

export function TaskForm({ selectedDate, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueTime, setDueTime] = useState('12:00');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please provide a task title.');
      return;
    }

    onSave({
      title: title.trim(),
      description,
      priority,
      dueDate: selectedDate,
      dueTime,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Task</h3>
        <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
          Due: {new Date(selectedDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
      </div>

      <div className="h-[1px] bg-[#374151]/50" />

      {errorMsg && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Task Title</label>
        <input
          type="text"
          placeholder="Complete design review..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Due Time</label>
        <input
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Priority</label>
        <div className="grid grid-cols-3 gap-1.5">
          {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`py-1.5 rounded-lg text-[10px] font-bold uppercase border tracking-wider transition-all cursor-pointer ${
                priority === p
                  ? p === 'HIGH'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                    : p === 'MEDIUM'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Description</label>
        <textarea
          placeholder="Task details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1] resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-transparent hover:bg-[#1F2937] text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
        >
          Create Task
        </button>
      </div>
    </form>
  );
}
