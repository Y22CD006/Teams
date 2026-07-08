"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (team: any) => void;
}

export function CreateTeamModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      onCreated(data.team);
    }
    setCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="h-12 bg-[var(--bg-tertiary)] px-4 flex items-center justify-between border-b border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Create Team</h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-lg">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team"
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this team about?"
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold transition-all">Cancel</button>
            <button type="submit" disabled={creating || !name.trim()} className="flex-1 bg-[#6366F1] hover:bg-[#5053e1] disabled:opacity-60 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {creating ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
