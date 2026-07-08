"use client";

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { 
  Phone, Video, Info, Smile, Send, Bold, Italic, Code, 
  MoreHorizontal, CornerUpRight, Trash2, Heart, ThumbsUp, Flame,
  CheckCircle2, AlertCircle, RefreshCw, Type, MonitorUp, Users, PanelRightOpen, Plus
} from 'lucide-react';
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
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    onSendMessage(inputText);
    
    // Send to actual DB and Pusher
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

  // Use real DB messages if available, otherwise fallback to mock so it's not totally empty
  const messages = dbMessages.length > 0 ? dbMessages : (isChannel ? activeChannel?.messages : activeChat?.messages) || [];

  const quickReactions = ['👍', '❤️', '🔥', '🎉', '😄', '👀'];

  return (
    <div id="chat-messages-canvas" className="flex-1 bg-[var(--bg-primary)] flex flex-col h-full overflow-hidden min-w-0">
      
      {/* Chat Header */}
      <div id="chat-thread-header" className="border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex-shrink-0 flex flex-col justify-end pt-3 px-5 relative z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            {!isChannel && activeChat && (
              <div className="w-10 h-10 rounded-full bg-[#E1DFDD] dark:bg-[#484644] text-[#323130] dark:text-[#F3F2F1] font-semibold text-sm flex items-center justify-center flex-shrink-0 relative">
                {activeChat.name.charAt(0)}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)] bg-emerald-500`} />
              </div>
            )}
            
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-1.5 truncate leading-tight">
                {isChannel && <span className="text-gray-500 font-mono">#</span>}
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  Available &bull; {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onStartCall(true)}
              className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[#5B5FC7] dark:hover:text-[#7977F7] transition-all"
              title="Video call"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={() => onStartCall(false)}
              className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[#5B5FC7] dark:hover:text-[#7977F7] transition-all"
              title="Audio call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[#5B5FC7] dark:hover:text-[#7977F7] transition-all"
              title="Share screen"
            >
              <MonitorUp className="w-5 h-5" />
            </button>
            <div className="w-[1px] h-6 bg-[var(--border-color)] mx-1" />
            <button className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Add people">
              <Users className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Pop out chat">
              <PanelRightOpen className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Teams Tabs */}
        <div className="flex gap-6 mt-2 border-none">
          {['Chat', 'Files', 'Shared'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'border-[#5B5FC7] dark:border-[#7977F7] text-[#5B5FC7] dark:text-[#7977F7]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
          <button className="pb-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div id="main-messages-scroller" className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.id;
          const hasThread = (msg.replyCount || 0) > 0;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId || (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 5 * 60000);

          return (
            <div
              key={msg.id}
              id={`chat-message-${msg.id}`}
              className={`group flex gap-3 px-4 py-1.5 hover:bg-[#F3F2F1] dark:hover:bg-[#292929] transition-colors relative ${showHeader ? 'mt-3' : 'mt-0'}`}
            >
              {/* Sender Avatar */}
              <div className="flex-shrink-0 w-9 pt-1">
                {showHeader ? (
                  <div className="w-9 h-9 rounded-full bg-[#E1DFDD] dark:bg-[#484644] text-[#323130] dark:text-[#F3F2F1] font-semibold text-xs flex items-center justify-center overflow-hidden">
                    {msg.senderAvatar || msg.senderName.charAt(0)}
                  </div>
                ) : (
                  <div className="w-9 h-9" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5 pb-1">
                {/* Sender Name + Timestamp Line */}
                {showHeader && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                      {msg.senderName}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium hover:underline cursor-pointer">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Message Content */}
                <p className="text-[13px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words select-text">
                  {msg.content}
                </p>

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {msg.reactions.map((react, idx) => (
                      <button
                        key={idx}
                        onClick={() => onAddReaction(msg.id, react.emoji)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${
                          react.users.includes(currentUser.id)
                            ? 'bg-[#EBF3FC] dark:bg-[#2B3C5A] border-[#CDE1F9] dark:border-[#3D5276] text-[#006CBE] dark:text-[#6CB8F9]'
                            : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
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
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#5B5FC7] dark:text-[#7977F7] hover:underline"
                  >
                    <CornerUpRight className="w-3.5 h-3.5" />
                    <span>{msg.replyCount} {(msg.replyCount || 0) === 1 ? 'reply' : 'replies'}</span>
                  </button>
                )}
              </div>

              {/* Message Hover Actions Toolbar (Teams style float top right) */}
              <div className="absolute -top-3 right-6 bg-white dark:bg-[#3B3A39] border border-[var(--border-color)] rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex items-center gap-0.5 p-1 z-20">
                {/* Quick Emoji Actions */}
                {quickReactions.slice(0, 4).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onAddReaction(msg.id, emoji)}
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
                <button className="p-1.5 hover:bg-[#F3F2F1] dark:hover:bg-[#484644] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="More options">
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
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input (Teams Style) */}
      <div className="p-4 bg-[var(--bg-primary)] flex-shrink-0">
        <div className="bg-white dark:bg-[#3B3A39] border border-[var(--border-color)] rounded-lg flex flex-col shadow-sm focus-within:border-[#5B5FC7] dark:focus-within:border-[#7977F7] focus-within:ring-1 focus-within:ring-[#5B5FC7] dark:focus-within:ring-[#7977F7] transition-all">
          
          {/* Top formatting toolbar - standard teams UI */}
          <div className="flex items-center gap-1 p-1.5 border-b border-[var(--border-color)] bg-[#F3F2F1] dark:bg-[#292929] rounded-t-lg">
            <button
              onClick={() => setFormatMenuOpen(!formatMenuOpen)}
              className="p-1.5 rounded hover:bg-[#E1DFDD] dark:hover:bg-[#484644] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              title="Format"
            >
              <Type className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-[var(--border-color)] mx-1" />
            <button className="p-1.5 rounded hover:bg-[#E1DFDD] dark:hover:bg-[#484644] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Bold">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-[#E1DFDD] dark:hover:bg-[#484644] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Italic">
              <Italic className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-[#E1DFDD] dark:hover:bg-[#484644] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Code snippet">
              <Code className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-[var(--border-color)] mx-1" />
            <button className="p-1.5 rounded hover:bg-[#E1DFDD] dark:hover:bg-[#484644] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Emoji">
              <Smile className="w-4 h-4" />
            </button>
          </div>

          {/* Input Area */}
          <div className="flex items-end px-3 py-2">
            <textarea
              id="chat-message-input-field"
              placeholder="Type a new message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm focus:outline-none min-h-[40px] max-h-[200px] resize-none overflow-y-auto"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-1.5 rounded-md flex-shrink-0 transition-all ${
                !inputText.trim()
                  ? 'text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                  : 'text-[#5B5FC7] dark:text-[#7977F7] hover:bg-[#F3F2F1] dark:hover:bg-[#484644]'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
