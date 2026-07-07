"use client";

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Send } from 'lucide-react';
import { Message, ThreadReply, User } from '@/lib/types';

interface ThreadPanelProps {
  currentUser: User;
  parentMessage: Message | null;
  replies: ThreadReply[];
  onClose: () => void;
  onSendReply: (parentMessageId: string, content: string) => void;
  onAddReaction: (replyId: string, emoji: string) => void;
}

export const ThreadPanel = ({
  currentUser,
  parentMessage,
  replies,
  onClose,
  onSendReply,
  onAddReaction,
}: ThreadPanelProps) => {
  const [replyText, setReplyText] = useState('');
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const filteredReplies = replies.filter(r => r.messageId === parentMessage?.id);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies, parentMessage]);

  const handleSend = () => {
    if (!replyText.trim() || !parentMessage) return;
    onSendReply(parentMessage.id, replyText);
    setReplyText('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!parentMessage) return null;

  return (
    <div id="thread-sidebar-panel" className="w-[320px] bg-[#111827] border-l border-[#374151] flex flex-col flex-shrink-0 z-10 h-full">
      <div className="h-14 border-b border-[#374151] px-4 flex items-center justify-between bg-[#111827] flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-white">Thread replies</h3>
          <p className="text-[10px] text-gray-400 font-mono">Conversational thread</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-[#1F2937] p-1.5 rounded-lg transition-colors"
          title="Close Thread"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-3 rounded-xl bg-[#1F2937]/45 border border-[#374151]/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 text-indigo-300 font-bold text-xs flex items-center justify-center border border-[#374151]">
              {parentMessage.senderAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate leading-tight">{parentMessage.senderName}</h4>
              <p className="text-[9px] text-gray-500 font-mono mt-0.5">Original Poster</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-2.5 leading-relaxed break-words whitespace-pre-wrap select-text">
            {parentMessage.content}
          </p>
        </div>

        <div className="flex items-center gap-2 select-none">
          <div className="h-[1px] bg-[#374151] flex-1" />
          <span className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-wider">Replies ({filteredReplies.length})</span>
          <div className="h-[1px] bg-[#374151] flex-1" />
        </div>

        <div className="space-y-3.5">
          {filteredReplies.length === 0 ? (
            <div className="py-4 text-center select-none">
              <p className="text-xs text-gray-400">No replies yet.</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Be the first to leave a comment below.</p>
            </div>
          ) : (
            filteredReplies.map((reply) => (
              <div key={reply.id} className="flex gap-2.5 items-start">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-900/40 text-indigo-200 font-bold text-[10px] flex items-center justify-center border border-[#374151]">
                    {reply.senderAvatar}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{reply.senderName}</span>
                    <span className="text-[9px] text-gray-500 font-mono flex-shrink-0">
                      {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed break-words whitespace-pre-wrap select-text">
                    {reply.content}
                  </p>

                  {reply.reactions && reply.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {reply.reactions.map((react, index) => (
                        <button
                          key={index}
                          onClick={() => onAddReaction(reply.id, react.emoji)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium transition-all ${
                            react.users.includes(currentUser.id)
                              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold'
                              : 'bg-[#1F2937]/40 border-[#374151] text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          <span>{react.emoji}</span>
                          <span>{react.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={repliesEndRef} />
        </div>
      </div>

      <div className="p-3 bg-[#111827] border-t border-[#374151] flex-shrink-0">
        <div className="flex items-center bg-[#1F2937] border border-[#374151] rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#6366F1] focus-within:border-[#6366F1] transition-all">
          <input
            id="thread-reply-input-field"
            type="text"
            placeholder="Reply to this thread..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent text-white placeholder-gray-400 text-xs focus:outline-none py-1"
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim()}
            className="bg-[#6366F1] text-white p-1.5 rounded-lg hover:bg-[#5053e1] disabled:opacity-50 transition-all flex-shrink-0 ml-1.5"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2 text-[9px] text-gray-500 flex items-center gap-1 font-mono select-none px-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div> Active thread sync • Secure node
        </div>
      </div>
    </div>
  );
};
