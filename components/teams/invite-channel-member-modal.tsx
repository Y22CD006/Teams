"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, UserPlus, UserCheck, X, Check } from "lucide-react";

interface UserResult {
  id: string;
  name: string;
  email: string;
  username: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Props {
  open: boolean;
  channelId: string;
  teamId: string;
  onClose: () => void;
}

export function InviteChannelMemberModal({ open, channelId, teamId, onClose }: Props) {
  const [teamMemberIds, setTeamMemberIds] = useState<Set<string>>(new Set());
  const [channelMemberIds, setChannelMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSearchResults([]);
    setAddedIds(new Set());
    setError("");
    loadExistingMembers();
  }, [open, channelId, teamId]);

  const loadExistingMembers = async () => {
    setLoading(true);
    try {
      const [teamRes, channelRes] = await Promise.all([
        fetch(`/api/teams/${teamId}/members`),
        fetch(`/api/channels/${channelId}/members`),
      ]);
      if (!teamRes.ok) throw new Error("Failed to load team members");
      if (!channelRes.ok) throw new Error("Failed to load channel members");

      const teamData = await teamRes.json();
      const channelData = await channelRes.json();

      setTeamMemberIds(new Set((teamData.members || []).map((m: any) => m.id)));
      setChannelMemberIds(new Set((channelData.members || []).map((m: any) => m.id)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(search.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const handleAdd = async (userId: string) => {
    if (adding.has(userId)) return;
    setAdding((prev) => new Set(prev).add(userId));
    setError("");
    try {
      if (!teamMemberIds.has(userId)) {
        const teamRes = await fetch(`/api/teams/${teamId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role: "MEMBER" }),
        });
        if (!teamRes.ok) {
          const err = await teamRes.text();
          throw new Error(err || "Failed to add to team");
        }
        setTeamMemberIds((prev) => new Set(prev).add(userId));
      }

      const res = await fetch(`/api/channels/${channelId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to add to channel");
      }
      setAddedIds((prev) => new Set(prev).add(userId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const filtered = searchResults.filter((u) => !channelMemberIds.has(u.id) && !addedIds.has(u.id));

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="h-12 bg-[var(--bg-tertiary)] px-4 flex items-center justify-between border-b border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Add People to Channel</h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-lg">&times;</button>
        </div>

        <div className="p-4">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search by name, email or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-2.5" />
            {searching && <Loader2 className="w-3.5 h-3.5 text-indigo-400 absolute right-2.5 top-2.5 animate-spin" />}
          </div>

          {error && (
            <div className="p-2 mb-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-1.5">
              <X className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            ) : search.trim().length < 2 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-8">
                Type at least 2 characters to search for users
              </p>
            ) : filtered.length === 0 && !searching ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-8">
                {searching ? "" : "No matching users found"}
              </p>
            ) : (
              filtered.map((u) => {
                const isTeamMember = teamMemberIds.has(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#374151] text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {u.name?.charAt(0) || u.username?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{u.name || u.username}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">{u.email || `@${u.username}`}</p>
                        {!isTeamMember && (
                          <span className="text-[9px] text-amber-400 font-medium">Not in team yet</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(u.id)}
                      disabled={adding.has(u.id)}
                      className="flex items-center gap-1 text-[10px] bg-[#6366F1] text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-[#5053e1] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {adding.has(u.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      {adding.has(u.id) ? "Adding..." : isTeamMember ? "Add" : "Add to Team"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {addedIds.size > 0 && (
          <div className="px-4 pb-4">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{addedIds.size} member{addedIds.size !== 1 ? "s" : ""} added successfully</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
