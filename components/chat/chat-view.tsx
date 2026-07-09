"use client";

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { 
  Phone, Video, Info, Smile, Send, Bold, Italic, Code, 
  MoreHorizontal, CornerUpRight, Trash2, Heart, ThumbsUp, Flame,
  CheckCircle2, AlertCircle, RefreshCw, Type, MonitorUp, Users, PanelRightOpen, Plus, Forward, Search, Paperclip, Image as ImageIcon
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useQueryClient } from '@tanstack/react-query';
import { Chat, Team, Channel, Message, User } from '@/lib/types';
import { useChat } from '@/hooks/use-chat';

interface ChatViewProps {
  currentUser: User;
  activeChat: Chat | null;
  activeTeam: Team | null;
  activeChannel: Channel | null;
  onSendMessage: (content: string) => void;
  onOpenThread: (message: Message) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onStartCall: (isVideo: boolean) => void;
  onDeleteMessage?: (messageId: string) => void;
  onForwardMessage?: (message: Message) => void;
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
  onForwardMessage,
}: ChatViewProps) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setInputText(prev => prev + `\n[Attached: ${file.name}]`);
      e.target.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat, activeChannel, activeChat?.messages, activeChannel?.messages]);

  const isChannel = !!activeChannel;
  const { messages: dbMessages, isLoading, sendMessage } = useChat(
    isChannel ? activeChannel.id : undefined,
    !isChannel && activeChat ? activeChat.id : undefined
  );

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    await sendMessage(inputText);
    
    setInputText('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const addFormatting = (format: string) => {
    if (format === 'bold') setInputText(prev => `${prev}**bold text**`);
    if (format === 'italic') setInputText(prev => `${prev}*italic text*`);
    if (format === 'code') setInputText(prev => `${prev}\`code block\``);
    setFormatMenuOpen(false);
  };

  const title = isChannel ? `# ${activeChannel?.name}` : activeChat?.name || '';
  const subtitle = isChannel 
    ? activeChannel?.description 
    : activeChat?.participants.filter(p => p.id !== currentUser.id).map(p => p.role).join(', ') || '';

  const messages = dbMessages.length > 0 ? dbMessages : (isChannel ? activeChannel?.messages : activeChat?.messages) || [];

  const queryClient = useQueryClient();

  const handleReactionClick = async (messageId: string, emoji: string) => {
    await fetch(`/api/messages/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });

    const queryKey = isChannel
      ? ['messages', 'channel', activeChannel!.id]
      : ['messages', 'dm', activeChat!.id];

    queryClient.setQueryData<Message[]>(queryKey, (old = []) =>
      old.map((m) => {
        if (m.id !== messageId) return m;
        const existingIdx = m.reactions.findIndex((r) => r.emoji === emoji);
        let newReactions = [...m.reactions];
        if (existingIdx >= 0) {
          const existing = newReactions[existingIdx];
          if (existing.users.includes(currentUser.id)) {
            const filtered = existing.users.filter((uid) => uid !== currentUser.id);
            newReactions = filtered.length === 0
              ? newReactions.filter((r) => r.emoji !== emoji)
              : newReactions.map((r) =>
                  r.emoji === emoji ? { ...r, count: r.count - 1, users: filtered } : r
                );
          } else {
            newReactions[existingIdx] = { ...existing, count: existing.count + 1, users: [...existing.users, currentUser.id] };
          }
        } else {
          newReactions = [...newReactions, { emoji, count: 1, users: [currentUser.id] }];
        }
        return { ...m, reactions: newReactions };
      })
    );
  };

  const quickReactions = ['👍', '❤️', '🔥', '🎉', '😄', '👀'];
  return (
    <div id="chat-messages-canvas" className="flex-1 bg-[var(--bg-primary)] flex flex-col h-full overflow-hidden min-w-0">
      
      {/* Chat Header */}
      <div id="chat-thread-header" className="border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex-shrink-0 flex items-center justify-between py-2 px-5 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          {!isChannel && activeChat && (
            <div className="w-9 h-9 rounded-full bg-[#E1DFDD] dark:bg-[#484644] text-[#323130] dark:text-[#F3F2F1] font-semibold text-sm flex items-center justify-center flex-shrink-0 relative">
              {activeChat.name.charAt(0)}
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)] bg-emerald-500`} />
            </div>
          )}
          
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 truncate leading-tight">
              {isChannel && <span className="text-gray-500 font-mono">#</span>}
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => alert("Search within chat")}
            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert("More options")}
            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div id="main-messages-scroller" className="flex-1 overflow-y-auto p-4 space-y-1 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 mt-10">
            <div className="w-20 h-20 rounded-full bg-[#3B3A39] flex items-center justify-center overflow-hidden mb-6 relative">
              {currentUser.avatar ? (
                <span className="text-3xl">{currentUser.avatar}</span>
              ) : (
                <span className="text-3xl text-[var(--text-primary)] font-bold">{currentUser.name.charAt(0)}</span>
              )}
            </div>
            <h3 className="text-[17px] font-bold text-[var(--text-primary)] mb-2">This is your space</h3>
            <p className="text-[13px] text-[var(--text-secondary)] text-center max-w-sm leading-relaxed">
              This chat is just for you...with you. Use it for drafts, send files to yourself, or get to know chat features a little better.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.id;
          const hasThread = (msg.replyCount || 0) > 0;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId || (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 5 * 60000);

          return (
            <div
              key={msg.id}
              id={`chat-message-${msg.id}`}
              className={`group flex gap-3 px-4 py-1.5 hover:bg-[#F3F2F1] dark:hover:bg-[#292929] transition-colors relative ${showHeader ? 'mt-3' : 'mt-0'} ${isMe ? 'flex-row-reverse' : ''}`}
            >
              {/* Sender Avatar (hidden for own messages) */}
              {!isMe && (
                <div className="flex-shrink-0 w-9 pt-1">
                  {showHeader ? (
                    <div className="w-9 h-9 rounded-full bg-[#E1DFDD] dark:bg-[#484644] text-[#323130] dark:text-[#F3F2F1] font-semibold text-xs flex items-center justify-center overflow-hidden">
                      {msg.senderAvatar || msg.senderName?.charAt(0) || "U"}
                    </div>
                  ) : (
                    <div className="w-9 h-9" />
                  )}
                </div>
              )}

              <div className={`flex flex-col min-w-0 pt-0.5 pb-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender Name + Timestamp Line */}
                {showHeader && !isMe && (
                  <div className="flex items-baseline gap-2 mb-1 flex-row">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                      {msg.senderName || "Unknown"}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium hover:underline cursor-pointer">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {showHeader && isMe && (
                  <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium hover:underline cursor-pointer">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Message Content Bubble */}
                <div className={`relative px-3.5 py-2 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                  isMe 
                    ? 'bg-[#5B5FC7] dark:bg-[#7977F7] text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-[#3B3A39] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {msg.reactions.map((react, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleReactionClick(msg.id, react.emoji)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${
                          react.users.includes(currentUser.id)
                            ? 'bg-[#EBF3FC] dark:bg-[#2B3C5A] border-[#CDE1F9] dark:border-[#3D5276] text-[#006CBE] dark:text-[#6CB8F9]'
                            : 'bg-white dark:bg-[#292929] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[#F3F2F1] dark:hover:bg-[#484644]'
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
                    className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#5B5FC7] dark:text-[#7977F7] hover:underline ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <CornerUpRight className="w-3.5 h-3.5" />
                    <span>{msg.replyCount} {(msg.replyCount || 0) === 1 ? 'reply' : 'replies'}</span>
                  </button>
                )}
              </div>

              {/* Message Hover Actions Toolbar */}
              <div className={`absolute top-0 -translate-y-1/2 ${isMe ? 'right-4 left-auto' : 'right-4'} bg-white dark:bg-[#3B3A39] border border-[var(--border-color)] rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex items-center gap-0.5 p-1 z-20`}>
                {/* Quick Emoji Actions */}
                {quickReactions.slice(0, 4).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(msg.id, emoji)}
                    className="p-1 hover:bg-[#F3F2F1] dark:hover:bg-[#484644] rounded text-sm transition-all hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}

                <div className="w-[1px] h-4 bg-[var(--border-color)] mx-1" />

                <button
                  onClick={() => onOpenThread(msg)}
                  className="p-1.5 hover:bg-[#F3F2F1] dark:hover:bg-[#484644] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                  title="Reply in thread"
                >
                  <CornerUpRight className="w-4 h-4" />
                </button>
                {onForwardMessage && (
                  <button 
                    onClick={() => onForwardMessage(msg)}
                    className="p-1.5 hover:bg-[#F3F2F1] dark:hover:bg-[#484644] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" 
                    title="Forward"
                  >
                    <Forward className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => alert("Message options")}
                  className="p-1.5 hover:bg-[#F3F2F1] dark:hover:bg-[#484644] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="More options">
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMe && onDeleteMessage && (
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="p-1.5 hover:bg-[#F3F2F1] dark:hover:bg-[#484644] rounded text-rose-500 hover:text-rose-600 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        }))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input (Teams Style) */}
      <div className="p-4 bg-[var(--bg-primary)] flex-shrink-0">
        <div className="bg-white dark:bg-[#3B3A39] border border-[var(--border-color)] rounded-lg flex shadow-sm focus-within:border-[#5B5FC7] dark:focus-within:border-[#7977F7] transition-all px-3 py-2 items-end relative">
          
          <textarea
            id="chat-message-input-field"
            placeholder="Type a message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-[13.5px] focus:outline-none min-h-[22px] max-h-[200px] resize-none overflow-y-auto py-1"
            rows={1}
          />
          
          <div className="flex items-center gap-1.5 ml-2 mb-0.5">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleFileUpload} />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded text-[var(--text-secondary)] hover:bg-[#F3F2F1] dark:hover:bg-[#484644] hover:text-[var(--text-primary)] transition-all"
              title="Emoji"
            >
              <Smile className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded text-[var(--text-secondary)] hover:bg-[#F3F2F1] dark:hover:bg-[#484644] hover:text-[var(--text-primary)] transition-all" title="Attach">
              <Paperclip className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => imageInputRef.current?.click()}
              className="p-1 rounded text-[var(--text-secondary)] hover:bg-[#F3F2F1] dark:hover:bg-[#484644] hover:text-[var(--text-primary)] transition-all" title="Image">
              <ImageIcon className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded text-[var(--text-secondary)] hover:bg-[#F3F2F1] dark:hover:bg-[#484644] hover:text-[var(--text-primary)] transition-all" 
              title="More options"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-1 rounded transition-all ml-1 ${
                !inputText.trim()
                  ? 'text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                  : 'text-[var(--text-primary)] hover:bg-[#F3F2F1] dark:hover:bg-[#484644]'
              }`}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 z-50 shadow-2xl rounded-lg border border-[var(--border-color)]">
              <EmojiPicker 
                onEmojiClick={(e) => {
                  setInputText(prev => prev + e.emoji);
                  setShowEmojiPicker(false);
                }} 
                theme="dark"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
