"use client";

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { 
  Phone, Video, Info, Smile, Paperclip, Send, Bold, Italic, Code, 
  MoreHorizontal, CornerUpRight, Trash2, Heart, ThumbsUp, Flame,
  CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Chat, Team, Channel, Message, User, Attachment } from '@/lib/types';

interface ChatViewProps {
  currentUser: User;
  activeChat: Chat | null;
  activeTeam: Team | null;
  activeChannel: Channel | null;
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  onOpenThread: (message: Message) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onStartCall: (isVideo: boolean) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const ChatView = ({
  currentUser,
  activeChat,
  activeTeam,
  activeChannel,
  onSendMessage,
  onOpenThread,
  onAddReaction,
  onStartCall,
  onDeleteMessage,
}: ChatViewProps) => {
  const [inputText, setInputText] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat, activeChannel, activeChat?.messages, activeChannel?.messages]);

  const handleSend = () => {
    if (!inputText.trim() && selectedAttachments.length === 0) return;
    onSendMessage(inputText, selectedAttachments);
    setInputText('');
    setSelectedAttachments([]);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const simulateAttachment = () => {
    const mockFiles: Attachment[] = [
      { id: `att-${Date.now()}-1`, name: 'Apollo-Layout-Specs-v2.pdf', type: 'pdf', size: '1.4 MB' },
      { id: `att-${Date.now()}-2`, name: 'index.css', type: 'code', size: '3.1 KB' },
      { id: `att-${Date.now()}-3`, name: 'performance-audit.xlsx', type: 'xls', size: '240 KB' },
    ];
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setSelectedAttachments(prev => [...prev, randomFile]);
  };

  const removeAttachment = (id: string) => {
    setSelectedAttachments(prev => prev.filter(a => a.id !== id));
  };

  const addFormatting = (format: string) => {
    if (format === 'bold') setInputText(prev => `${prev}**bold text**`);
    if (format === 'italic') setInputText(prev => `${prev}*italic text*`);
    if (format === 'code') setInputText(prev => `${prev}\`code block\``);
    setFormatMenuOpen(false);
  };

  const isChannel = !!activeChannel;
  const title = isChannel ? `# ${activeChannel?.name}` : activeChat?.name || '';
  const subtitle = isChannel 
    ? activeChannel?.description 
    : activeChat?.participants.filter(p => p.id !== currentUser.id).map(p => p.role).join(', ') || '';

  const messages = isChannel ? activeChannel?.messages : activeChat?.messages || [];

  const quickReactions = ['👍', '❤️', '🔥', '🎉', '😄', '👀'];

  return (
    <div id="chat-messages-canvas" className="flex-1 bg-[#0B0F19] flex flex-col h-full overflow-hidden min-w-0">
      
      {/* Chat Header */}
      <div id="chat-thread-header" className="h-14 border-b border-[#374151] px-5 flex items-center justify-between bg-[#111827] flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5 truncate leading-tight">
            {isChannel && <span className="text-gray-500 font-mono">#</span>}
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10px] text-gray-400 font-mono truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onStartCall(false)}
            className="p-2 rounded-xl hover:bg-[#1F2937] text-gray-400 hover:text-[#6366F1] transition-all"
            title="Start Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStartCall(true)}
            className="p-2 rounded-xl hover:bg-[#1F2937] text-gray-400 hover:text-[#6366F1] transition-all"
            title="Start Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-[#374151] mx-1" />
          <button className="p-2 rounded-xl hover:bg-[#1F2937] text-gray-400 hover:text-white transition-all">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div id="main-messages-scroller" className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const hasThread = (msg.replyCount || 0) > 0;
          return (
            <div
              key={msg.id}
              id={`chat-message-${msg.id}`}
              className="group flex gap-2.5 p-2.5 rounded-xl hover:bg-[#1F2937]/20 transition-all duration-100 relative"
            >
              {/* Sender Avatar */}
              {!isMe && (
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-white text-xs font-bold flex items-center justify-center border border-[#374151]">
                    {msg.senderAvatar}
                  </div>
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* Sender Name + Timestamp Line */}
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-white leading-tight">
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Content */}
                <p className="text-xs text-gray-300 mt-0.5 leading-relaxed whitespace-pre-wrap break-words select-text">
                  {msg.content}
                </p>

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-1.5 bg-[#1F2937] border border-[#374151] px-2.5 py-1.5 rounded-lg">
                        <div className="p-1 rounded bg-indigo-950/40">
                          <Code className="w-3 h-3 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-mono text-gray-300 truncate max-w-[120px]">{att.name}</span>
                        <span className="text-[9px] text-gray-500">{att.size}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {msg.reactions.map((react, idx) => (
                      <button
                        key={idx}
                        onClick={() => onAddReaction(msg.id, react.emoji)}
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

                {/* Thread reply indicator */}
                {hasThread && (
                  <button
                    onClick={() => onOpenThread(msg)}
                    className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <CornerUpRight className="w-3 h-3" />
                    <span>{msg.replyCount} {(msg.replyCount || 0) === 1 ? 'reply' : 'replies'}</span>
                  </button>
                )}
              </div>

              {/* Message Hover Actions Toolbar */}
              <div className="absolute -top-3 right-2 bg-[#1F2937] border border-[#374151] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex items-center gap-0.5 p-0.5 z-20">
                {/* Quick Emoji Actions */}
                {quickReactions.slice(0, 3).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onAddReaction(msg.id, emoji)}
                    className="p-1 hover:bg-[#111827] rounded text-xs transition-all hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}

                <div className="w-[1px] h-4 bg-[#374151] mx-0.5" />

                <button
                  onClick={() => onOpenThread(msg)}
                  className="p-1 hover:bg-[#111827] rounded text-gray-400 hover:text-white transition-all"
                  title="Reply in thread"
                >
                  <CornerUpRight className="w-3 h-3" />
                </button>

                {isMe && onDeleteMessage && (
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="p-1 hover:bg-[#111827] rounded text-rose-400 hover:text-rose-300 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-3 bg-[#111827] border-t border-[#374151] flex-shrink-0">
        {/* Attachment preview chips */}
        {selectedAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-2">
            {selectedAttachments.map((att) => (
              <div key={att.id} className="flex items-center gap-1.5 bg-[#1F2937] border border-[#374151] px-2 py-1 rounded-lg">
                <Code className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-gray-300">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="text-gray-500 hover:text-rose-400 ml-0.5"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-[#1F2937] border border-[#374151] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#6366F1] focus-within:border-[#6366F1] transition-all">
            {/* Inline Formatting Bar */}
            <div className="flex items-center gap-0.5 mb-1.5">
              <div className="relative">
                <button
                  onClick={() => setFormatMenuOpen(!formatMenuOpen)}
                  className="p-1 rounded hover:bg-[#111827] text-gray-400 hover:text-white transition-all"
                >
                  <Bold className="w-3 h-3" />
                </button>
                {formatMenuOpen && (
                  <div className="absolute bottom-8 left-0 bg-[#1F2937] border border-[#374151] rounded-lg shadow-xl flex items-center gap-0.5 p-1 z-30">
                    <button onClick={() => addFormatting('bold')} className="p-1.5 rounded hover:bg-[#111827] text-gray-300 hover:text-white text-xs font-bold">B</button>
                    <button onClick={() => addFormatting('italic')} className="p-1.5 rounded hover:bg-[#111827] text-gray-300 hover:text-white text-xs italic">I</button>
                    <button onClick={() => addFormatting('code')} className="p-1.5 rounded hover:bg-[#111827] text-gray-300 hover:text-white text-xs font-mono">&lt;/&gt;</button>
                  </div>
                )}
              </div>
              <div className="w-[1px] h-3 bg-[#374151]" />
              <button
                onClick={simulateAttachment}
                className="p-1 rounded hover:bg-[#111827] text-gray-400 hover:text-white transition-all"
                title="Attach file"
              >
                <Paperclip className="w-3 h-3" />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" />
            </div>

            <input
              id="chat-message-input-field"
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none py-0.5"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() && selectedAttachments.length === 0}
            className="bg-[#6366F1] text-white p-2.5 rounded-xl hover:bg-[#5053e1] disabled:opacity-40 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
