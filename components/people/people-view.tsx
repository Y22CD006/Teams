"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, UserPlus, UserCheck, Check, X } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function PeopleView({ currentUserId }: { currentUserId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sending, setSending] = useState<Set<string>>(new Set());
  const [responding, setResponding] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/friend-requests");
    if (res.ok) {
      const data = await res.json();
      setSentRequests(data.sent);
      setReceivedRequests(data.received);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = async (recipientId: string) => {
    if (sending.has(recipientId)) return;
    setSending((prev) => new Set(prev).add(recipientId));
    const res = await fetch("/api/friend-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId }),
    });
    if (res.ok) fetchRequests();
    setSending((prev) => {
      const next = new Set(prev);
      next.delete(recipientId);
      return next;
    });
  };

  const handleRespond = async (id: string, status: string) => {
    if (responding.has(id)) return;
    setResponding((prev) => new Set(prev).add(id));
    await fetch(`/api/friend-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRequests();
    setResponding((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const getConnectionId = (userId: string) => {
    const r = receivedRequests.find((r) => r.senderId === userId && r.status === "ACCEPTED");
    if (r) return r.id;
    const s = sentRequests.find((r) => r.recipientId === userId && r.status === "ACCEPTED");
    if (s) return s.id;
    return null;
  };

  const isConnected = (userId: string) => !!getConnectionId(userId);

  const handleRemove = async (userId: string) => {
    const id = getConnectionId(userId);
    if (!id || removing.has(userId)) return;
    setRemoving((prev) => new Set(prev).add(userId));
    await fetch(`/api/friend-requests/${id}`, { method: "DELETE" });
    fetchRequests();
    setRemoving((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    setConfirmRemove(null);
  };

  return (
    <div className="flex-1 bg-[var(--bg-primary)] p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">People & Connections</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Search for users, send connection requests, and start messaging.
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-gray-400 text-sm rounded-xl pl-10 pr-4 py-3 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
          />
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-3.5" />
          {searching && <Loader2 className="w-4 h-4 text-indigo-400 absolute right-3.5 top-3.5 animate-spin" />}
        </div>

        {searchQuery.length >= 2 && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 space-y-1">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono mb-2">Search Results</p>
            {searchResults.length === 0 && !searching && (
              <p className="text-sm text-gray-500 text-center py-6">No users found</p>
            )}
            {searchResults.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#374151] text-white font-semibold text-sm flex items-center justify-center">
                    {user.name?.charAt(0) || user.username?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name || user.username}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">@{user.username} &middot; {user.email}</p>
                  </div>
                </div>
                {isConnected(user.id) ? (
                  <button
                    onClick={() => setConfirmRemove(user.id)}
                    disabled={removing.has(user.id)}
                    className="text-xs text-emerald-400 hover:text-rose-400 font-medium flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {removing.has(user.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {removing.has(user.id) ? "Removing..." : "Connected"}
                  </button>
                ) : sentRequests.some((r) => r.recipientId === user.id) ? (
                  <span className="text-xs text-[var(--text-secondary)]">Requested</span>
                ) : receivedRequests.some((r) => r.senderId === user.id) ? (
                  <button
                    onClick={() => handleRespond(receivedRequests.find((r) => r.senderId === user.id)?.id, "ACCEPTED")}
                    disabled={responding.has(receivedRequests.find((r) => r.senderId === user.id)?.id || '')}
                    className="text-xs bg-[#6366F1] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#5053e1] transition-all flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {responding.has(receivedRequests.find((r) => r.senderId === user.id)?.id || '') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {responding.has(receivedRequests.find((r) => r.senderId === user.id)?.id || '') ? "Accepting..." : "Accept"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sending.has(user.id)}
                    className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg font-semibold hover:bg-[#2e3748] transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending.has(user.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {receivedRequests.filter((r) => r.status === "PENDING").length > 0 && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Pending Requests</p>
            {receivedRequests.filter((r) => r.status === "PENDING").map((req) => (
              <div key={req.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#374151] text-white font-semibold text-sm flex items-center justify-center">
                    {req.sender.name?.charAt(0) || req.sender.username?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{req.sender.name || req.sender.username}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Sent you a request</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(req.id, "ACCEPTED")}
                    disabled={responding.has(req.id)}
                    className="text-xs bg-[#6366F1] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#5053e1] transition-all flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {responding.has(req.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {responding.has(req.id) ? "Accepting..." : "Accept"}
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, "REJECTED")}
                    disabled={responding.has(req.id)}
                    className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg font-semibold hover:bg-[#2e3748] transition-all flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {responding.has(req.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    {responding.has(req.id) ? "Declining..." : "Decline"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sentRequests.length > 0 && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Sent Requests</p>
            {sentRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#374151] text-white font-semibold text-sm flex items-center justify-center">
                    {req.recipient.name?.charAt(0) || req.recipient.username?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{req.recipient.name || req.recipient.username}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{req.status === "PENDING" ? "Request pending" : req.status === "ACCEPTED" ? "Connected" : "Declined"}</p>
                  </div>
                </div>
                {req.status === "ACCEPTED" ? (
                  <button
                    onClick={() => setConfirmRemove(req.recipient.id)}
                    disabled={removing.has(req.recipient.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    {removing.has(req.recipient.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Remove"}
                  </button>
                ) : req.status === "PENDING" ? (
                  <button
                    onClick={async () => {
                      if (removing.has(req.recipient.id)) return;
                      setRemoving((prev) => new Set(prev).add(req.recipient.id));
                      await fetch(`/api/friend-requests/${req.id}`, { method: "DELETE" });
                      fetchRequests();
                      setRemoving((prev) => {
                        const next = new Set(prev);
                        next.delete(req.recipient.id);
                        return next;
                      });
                    }}
                    disabled={removing.has(req.recipient.id)}
                    className="text-xs text-[var(--text-secondary)] hover:text-rose-400 font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    {removing.has(req.recipient.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Cancel"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmRemove}
        title="Remove Connection"
        message="Are you sure you want to remove this connection? The direct message conversation will also be deleted."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => confirmRemove && handleRemove(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}
