"use client";

import { useState } from "react";
import { Search, Hash, MessageSquare, CornerUpRight } from "lucide-react";
import { Message, Chat, Team } from "@/lib/types";

interface ForwardModalProps {
  message: Message;
  chats: Chat[];
  teams: Team[];
  onClose: () => void;
  onSubmit: (targetType: "chat" | "channel", targetId: string) => void;
}

export function ForwardModal({ message, chats, teams, onClose, onSubmit }: ForwardModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ type: "chat" | "channel"; id: string } | null>(null);

  const normalizedSearch = search.toLowerCase();

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(normalizedSearch)
  );

  const filteredChannels = teams.flatMap((t) =>
    t.channels
      .filter((ch) => ch.name.toLowerCase().includes(normalizedSearch) || t.name.toLowerCase().includes(normalizedSearch))
      .map((ch) => ({ ...ch, teamName: t.name }))
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="h-14 bg-[var(--bg-tertiary)] px-5 flex items-center justify-between border-b border-[var(--border-color)] flex-shrink-0">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CornerUpRight className="w-4 h-4 text-[#5B5FC7] dark:text-[#7977F7]" />
            Forward Message
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-lg"
          >
            &times;
          </button>
        </div>

        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex-shrink-0">
          <div className="text-[13px] text-[var(--text-secondary)] mb-3 bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-color)] line-clamp-3">
            <span className="font-semibold text-[var(--text-primary)]">{message.senderName}:</span> {message.content}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search for a person or channel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-[13px] rounded-xl pl-9 pr-3 py-2.5 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#5B5FC7]"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredChats.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Recent Chats
              </div>
              <div className="space-y-0.5">
                {filteredChats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected({ type: "chat", id: c.id })}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      selected?.id === c.id
                        ? "bg-[#EBF3FC] dark:bg-[#2B3C5A] border-[#CDE1F9] dark:border-[#3D5276]"
                        : "hover:bg-[var(--bg-tertiary)] border border-transparent"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#E1DFDD] dark:bg-[#484644] text-[var(--text-primary)] font-semibold text-xs flex items-center justify-center flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <span className="text-[13.5px] font-medium text-[var(--text-primary)] truncate">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredChannels.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Channels
              </div>
              <div className="space-y-0.5">
                {filteredChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelected({ type: "channel", id: ch.id })}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      selected?.id === ch.id
                        ? "bg-[#EBF3FC] dark:bg-[#2B3C5A] border-[#CDE1F9] dark:border-[#3D5276]"
                        : "hover:bg-[var(--bg-tertiary)] border border-transparent"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-[#F3F2F1] dark:bg-[#292929] text-[var(--text-secondary)] flex items-center justify-center flex-shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start truncate min-w-0">
                      <span className="text-[13.5px] font-medium text-[var(--text-primary)] truncate">
                        {ch.name}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] truncate">
                        {ch.teamName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredChats.length === 0 && filteredChannels.length === 0 && (
            <div className="py-8 text-center text-[13px] text-[var(--text-secondary)]">
              No chats or channels found matching "{search}"
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)] flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 rounded-xl border border-[var(--border-color)] text-[13px] font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onSubmit(selected.type, selected.id)}
            disabled={!selected}
            className="flex-1 bg-[#5B5FC7] hover:bg-[#4f52b2] dark:bg-[#7977F7] dark:hover:bg-[#6b69db] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2"
          >
            Send
            <CornerUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
