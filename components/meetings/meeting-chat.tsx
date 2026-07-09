"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Room, RoomEvent } from "livekit-client";
import { Send, X, User } from "lucide-react";

interface ChatMessage {
  id: string;
  senderIdentity: string;
  senderName: string;
  content: string;
  timestamp: number;
}

interface MeetingChatProps {
  room: React.MutableRefObject<Room | null>;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}

export function MeetingChat({
  room,
  currentUserId,
  currentUserName,
  onClose,
}: MeetingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = room.current;
    if (!r) return;

    const handleData = (
      payload: Uint8Array,
    ) => {
      try {
        const decoder = new TextDecoder();
        const raw = decoder.decode(payload);
        const msg: ChatMessage = JSON.parse(raw);
        setMessages((prev) => [...prev, msg]);
      } catch {
        // ignore invalid data
      }
    };

    r.on(RoomEvent.DataReceived, handleData);
    return () => {
      r.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const r = room.current;
    if (!r?.localParticipant) return;

    const msg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderIdentity: currentUserId,
      senderName: currentUserName,
      content: text,
      timestamp: Date.now(),
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(msg));

    try {
      await r.localParticipant.publishData(data, { reliable: true });
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      console.warn("chat send failed:", e);
    }
  }, [input, room, currentUserId, currentUserName]);

  return (
    <div className="w-72 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border-color)] flex-shrink-0">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          In-call messages
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
            <User className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-medium">
              No messages yet
            </p>
            <p className="text-[10px] mt-1">
              Messages are sent to everyone in the call
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderIdentity === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] text-[var(--text-secondary)] mb-0.5 px-1">
                {isMe ? "You" : msg.senderName}
              </span>
              <div
                className={`px-3 py-1.5 rounded-xl text-xs max-w-[90%] break-words ${
                  isMe
                    ? "bg-[#5B5FC7] text-white rounded-tr-sm"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-color)]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Send a message..."
            className="flex-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-lg px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1] placeholder-[var(--text-secondary)]"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-[#5B5FC7] hover:bg-[#4a4eb5] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
