"use client";

import { useState } from 'react';
import { Search, Plus, Hash, Lock, PhoneCall, Video, Star, FileText, UserPlus, Clock, ChevronDown, ChevronRight, BellRing, Settings as SettingsIcon } from 'lucide-react';
import { Chat, Team, CalendarMeeting, FileItem, User } from '@/lib/types';
import { USERS } from '@/lib/data';

interface ListPanelProps {
  activeView: string;
  chats: Chat[];
  teams: Team[];
  activeChatId: string | null;
  activeChannelId: string | null;
  meetings: CalendarMeeting[];
  files: FileItem[];
  onSelectChat: (id: string) => void;
  onSelectChannel: (teamId: string, channelId: string) => void;
  onSelectFileView: (view: string) => void;
  onJoinMeeting: (meeting: CalendarMeeting) => void;
  onNewChat: () => void;
  onNewMeeting: () => void;
  onDialCall: (userName: string, isVideo: boolean) => void;
  onSelectMeeting: (meetingId: string) => void;
}

export const ListPanel = ({
  activeView,
  chats,
  teams,
  activeChatId,
  activeChannelId,
  meetings,
  files,
  onSelectChat,
  onSelectChannel,
  onSelectFileView,
  onJoinMeeting,
  onNewChat,
  onNewMeeting,
  onDialCall,
  onSelectMeeting,
}: ListPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({
    'team-1': true,
    'team-2': true,
  });
  const [callInput, setCallInput] = useState('');

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'busy': return 'bg-rose-500';
      case 'away': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTeams = teams.map(team => {
    const matchingChannels = team.channels.filter(ch => 
      ch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...team, channels: matchingChannels };
  }).filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) || team.channels.length > 0
  );

  const filteredMeetings = meetings.filter(meet =>
    meet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meet.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPanelHeader = () => {
    switch (activeView) {
      case 'activity':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <BellRing className="w-4.5 h-4.5 text-[#6366F1]" /> Activity Feed
            </h2>
            <button className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1F2937] transition-all">
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        );
      case 'chat':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
            <h2 className="text-base font-semibold text-white tracking-tight">Chats</h2>
            <button 
              id="btn-new-chat"
              onClick={onNewChat}
              className="bg-[#1F2937] text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-[#2e3748] transition-all flex items-center gap-1"
              title="New Chat"
            >
              <Plus className="w-4 h-4 text-[#6366F1]" />
              <span className="text-xs font-medium pr-1">New</span>
            </button>
          </div>
        );
      case 'teams':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
            <h2 className="text-base font-semibold text-white tracking-tight">Teams Workspaces</h2>
            <button 
              onClick={onNewChat} 
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1F2937] transition-all"
              title="Join or create team"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        );
      case 'calendar':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
            <h2 className="text-base font-semibold text-white tracking-tight">Calendar</h2>
            <button 
              id="btn-new-meeting"
              onClick={onNewMeeting}
              className="bg-[#6366F1] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#5053e1] transition-all text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-950/40"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule
            </button>
          </div>
        );
      case 'calls':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
            <h2 className="text-base font-semibold text-white tracking-tight">Voice & Video</h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-medium px-2 py-0.5 rounded-full border border-emerald-500/20">
              VoIP Enabled
            </span>
          </div>
        );
      case 'files':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
            <h2 className="text-base font-semibold text-white tracking-tight">Files Library</h2>
            <span className="text-xs text-gray-400">OneDrive Connected</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div id="list-panel-container" className="w-[280px] bg-[#111827] border-r border-[#374151] flex flex-col flex-shrink-0 select-none h-full z-10">
      {getPanelHeader()}

      {activeView !== 'calls' && activeView !== 'calendar' && (
        <div className="p-3 border-b border-[#374151]/50">
          <div className="relative">
            <input
              id="search-filter-input"
              type="text"
              placeholder={`Search ${activeView}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1F2937] text-white placeholder-gray-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] transition-all"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      )}

      <div id="list-panel-scrollbar" className="flex-1 overflow-y-auto p-2 space-y-1">
        
        {activeView === 'activity' && (
          <div className="space-y-1.5">
            {[
              {
                id: 'act-1',
                title: 'Sarah Chen replied to your message',
                detail: '"Yes! The layout recalculations..."',
                time: '15 mins ago',
                icon: FileText,
                unread: true,
                onClick: () => onSelectChannel('team-1', 'c-apollo-components'),
              },
              {
                id: 'act-2',
                title: 'Emily Zhao tagged you in General',
                detail: 'Apollo Sprint Planning kick-off starts at 2 PM.',
                time: '2 hours ago',
                icon: Star,
                unread: false,
                onClick: () => onSelectChannel('team-1', 'c-apollo-gen'),
              },
              {
                id: 'act-3',
                title: 'Production Migrated Successfully',
                detail: 'DevOps team: Container latencies dropped 180ms.',
                time: 'Yesterday',
                icon: BellRing,
                unread: false,
                onClick: () => onSelectChannel('team-2', 'c-core-gen'),
              },
              {
                id: 'act-4',
                title: 'Sarah Chen shared apollo-tokens-v2.json',
                detail: 'Uploaded in Tokens & Themes channel.',
                time: 'Yesterday',
                icon: FileText,
                unread: false,
                onClick: () => onSelectChannel('team-1', 'c-apollo-tokens'),
              },
            ].map(item => (
              <div
                key={item.id}
                onClick={item.onClick}
                className={`p-3 rounded-xl cursor-pointer hover:bg-[#1F2937] transition-all duration-150 border border-transparent hover:border-[#374151] flex gap-2.5 items-start ${
                  item.unread ? 'bg-[#1F2937]/40 relative' : ''
                }`}
              >
                {item.unread && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#6366F1]" />
                )}
                <div className="p-1.5 rounded-lg bg-[#1F2937] border border-[#374151]">
                  <item.icon className="w-4 h-4 text-[#6366F1]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate leading-tight">{item.title}</h4>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.detail}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'chat' && (
          <div className="space-y-0.5">
            {filteredChats.map((chat) => {
              const active = activeChatId === chat.id;
              const targetUser = chat.participants.find(u => u.id !== 'user-current') || USERS[1];
              const lastMsg = chat.messages[chat.messages.length - 1];

              return (
                <div
                  key={chat.id}
                  id={`chat-item-${chat.id}`}
                  onClick={() => onSelectChat(chat.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-150 border border-transparent ${
                    active 
                      ? 'bg-[#1F2937] border-[#374151] text-white shadow-md' 
                      : 'text-gray-300 hover:bg-[#1F2937]/55 hover:text-white'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-[#374151] text-white font-semibold text-xs flex items-center justify-center border border-[#1F2937]">
                      {chat.type === 'direct' ? targetUser.avatar : chat.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {chat.type === 'direct' && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111827] ${getStatusColor(targetUser.status)}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold truncate text-white leading-tight">
                        {chat.name}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {lastMsg ? lastMsg.timestamp.split('T')[1].substring(0, 5) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {lastMsg ? `${lastMsg.senderId === 'user-current' ? 'You: ' : ''}${lastMsg.content}` : 'No messages'}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && !active && (
                    <span className="bg-[#6366F1] text-white font-bold text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-sm">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'teams' && (
          <div className="space-y-2">
            {filteredTeams.map((team) => (
              <div key={team.id} className="space-y-0.5">
                <div 
                  onClick={() => toggleTeam(team.id)}
                  className="flex items-center justify-between p-1.5 hover:bg-[#1F2937]/30 rounded-lg cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {expandedTeams[team.id] ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                    )}
                    <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-slate-700 to-slate-800 text-white font-bold text-[10px] flex items-center justify-center border border-[#374151]">
                      {team.avatar}
                    </div>
                    <span className="text-xs font-semibold text-gray-300 truncate group-hover:text-white transition-colors">
                      {team.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-[#1F2937] px-1.5 py-0.5 rounded font-mono font-medium">
                    {team.membersCount}
                  </span>
                </div>

                {expandedTeams[team.id] && (
                  <div className="pl-3.5 space-y-0.5 border-l border-[#374151]/30 ml-4.5 mt-0.5">
                    {team.channels.map((ch) => {
                      const isActive = activeChannelId === ch.id;
                      return (
                        <div
                          key={ch.id}
                          id={`channel-item-${ch.id}`}
                          onClick={() => onSelectChannel(team.id, ch.id)}
                          className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                            isActive
                              ? 'bg-[#1F2937] text-white font-semibold shadow-inner'
                              : 'text-gray-400 hover:bg-[#1F2937]/45 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {ch.isPrivate ? (
                              <Lock className="w-3.5 h-3.5 text-[#6366F1]" />
                            ) : (
                              <Hash className="w-3.5 h-3.5 text-gray-500" />
                            )}
                            <span className="text-xs truncate">{ch.name}</span>
                          </div>

                          {ch.unreadCount > 0 && !isActive && (
                            <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="space-y-2">
            <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              Today's Schedule
            </div>
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => onSelectMeeting(meeting.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  meeting.isLive 
                    ? 'bg-[#1F2937] border-[#6366F1]/50 ring-1 ring-[#6366F1]/30' 
                    : 'bg-[#111827] border-[#374151] hover:bg-[#1F2937] hover:border-[#374151]'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="text-xs font-semibold text-white leading-tight line-clamp-2">
                    {meeting.title}
                  </h4>
                  {meeting.isLive && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{meeting.startTime} - {meeting.endTime}</span>
                </div>

                {meeting.isLive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinMeeting(meeting);
                    }}
                    className="w-full mt-3 bg-[#6366F1] text-white py-1.5 rounded-lg hover:bg-[#5053e1] transition-all text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" /> Join Call
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeView === 'calls' && (
          <div className="space-y-4">
            <div className="p-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block mb-1.5">
                Quick Dial Contact
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Enter name or team..."
                  value={callInput}
                  onChange={(e) => setCallInput(e.target.value)}
                  className="flex-1 bg-[#1F2937] text-white text-xs rounded-lg px-2 py-1.5 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                />
                <button
                  disabled={!callInput}
                  onClick={() => {
                    onDialCall(callInput, true);
                    setCallInput('');
                  }}
                  className="bg-[#6366F1] hover:bg-[#5053e1] disabled:opacity-50 text-white p-2 rounded-lg transition-all"
                  title="Video Call"
                >
                  <Video className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block px-1">
                Speed Dial
              </label>
              {USERS.filter(u => u.id !== 'user-current').map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1F2937]/35 border border-transparent hover:bg-[#1F2937] hover:border-[#374151] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center justify-center">
                        {user.avatar}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#111827] ${getStatusColor(user.status)}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate leading-tight">{user.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.role}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onDialCall(user.name, false)}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#111827] transition-all"
                      title="Audio Call"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDialCall(user.name, true)}
                      className="text-gray-400 hover:text-[#6366F1] p-1 rounded hover:bg-[#111827] transition-all"
                      title="Video Call"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'files' && (
          <div className="space-y-1.5">
            {[
              { id: 'f-recents', label: 'Recent Documents', icon: Clock },
              { id: 'f-my', label: 'My Cloud Drive', icon: FileText },
              { id: 'f-teams', label: 'Shared Workspaces', icon: Star },
            ].map((cat) => (
              <div
                key={cat.id}
                onClick={() => onSelectFileView(cat.id)}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-[#1F2937] text-gray-300 hover:text-white transition-all duration-150 border border-transparent hover:border-[#374151]"
              >
                <div className="p-1 rounded bg-[#1F2937] border border-[#374151]">
                  <cat.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-semibold">{cat.label}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
