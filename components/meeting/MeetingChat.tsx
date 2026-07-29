"use client";

import { useState, useEffect, useRef } from "react";
import { useChat, useLocalParticipant } from "@livekit/components-react";
import { Send, Loader2, User as UserIcon } from "lucide-react";
import { useParams } from "next/navigation";

interface MeetingChatProps {
  meetingId: string;
}

export default function MeetingChat({ meetingId }: MeetingChatProps) {
  const { send, chatMessages, isSending } = useChat();
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { localParticipant } = useLocalParticipant();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/meetings/${meetingId}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            setHistory(data.messages);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    fetchHistory();
  }, [meetingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = input.trim();
    setInput("");

    try {
      // 1. Broadcast via LiveKit Data Channel for instant zero-latency delivery
      await send(message);

      // 2. Persist to PostgreSQL asynchronously
      fetch(`/api/meetings/${meetingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      }).catch(err => console.error("Failed to persist message", err));
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Combine DB history with ephemeral LiveKit messages, ensuring no strict duplicates
  // and sorting by timestamp.
  const allMessages = [...history, ...chatMessages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Meeting Chat</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory && (
          <div className="flex justify-center items-center py-4 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading history...
          </div>
        )}
        
        {allMessages.map((msg, index) => {
          const isOwn = localParticipant?.identity === msg.from?.identity;
          
          let profileImage = null;
          try {
             const meta = msg.from?.metadata ? JSON.parse(msg.from.metadata) : null;
             profileImage = meta?.profileImage;
          } catch (e) {}

          const timeString = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={msg.id || index} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                {profileImage ? (
                  <img src={profileImage} alt={msg.from?.name || "User"} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-300">{msg.from?.name || "Unknown User"}</span>
                  <span className="text-[10px] text-slate-500">{timeString}</span>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm ${isOwn ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-800 text-slate-200 rounded-tl-sm"}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
