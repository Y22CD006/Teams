"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Hash, Lock, PhoneCall, Video, Star, FileText, UserPlus, Clock, ChevronDown, ChevronRight, BellRing, Settings as SettingsIcon, Check, X, UserCheck, UserX, Loader2, Trash2, Edit3, Filter, Edit, MoreHorizontal, Calendar, ListTodo, Users } from 'lucide-react';
import { Chat, Team, FileItem, User, CalendarMeeting, CalendarTask } from '@/lib/types';
import { EventForm } from '@/components/calendar/event-form';
import { TaskForm } from '@/components/tasks/task-form';
import { CreateTeamModal } from '@/components/teams/create-team-modal';
import { CreateChannelModal } from '@/components/teams/create-channel-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useAppDispatch } from '@/lib/store/hooks';
import { addTeam, addChannel, removeTeam, removeChannel } from '@/lib/store/dataSlice';

interface ListPanelProps {
  activeView: string;
  chats: Chat[];
  teams: Team[];
  activeChatId: string | null;
  activeChannelId: string | null;
  files: FileItem[];
  currentUserId: string;
  allUsers: User[];
  onSelectChat: (chatId: string) => void;
  onSelectChannel: (channelId: string, teamId: string) => void;
  onSelectFileView: (view: string) => void;
  onNewChat: () => void;
  onNewMeeting: () => void;
  onDialCall: (userName: string, isVideo: boolean) => void;
  meetings?: CalendarMeeting[];
  tasks?: CalendarTask[];
  selectedCalendarDate?: string;
  onAddMeeting?: (meeting: Omit<CalendarMeeting, 'id'>) => void;
  onAddTask?: (task: { title: string; description: string; priority: string; dueDate: string; dueTime?: string }) => void;
  onDeleteMeeting?: (meetingId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onJoinMeeting?: (meeting: CalendarMeeting) => void;
  selectedMeetingId?: string | null;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  read: boolean;
  teamId: string | null;
  channelId: string | null;
  createdAt: string;
}

export const ListPanel = ({
  activeView,
  chats,
  teams,
  activeChatId,
  activeChannelId,
  files,
  currentUserId,
  allUsers,
  onSelectChat,
  onSelectChannel,
  onSelectFileView,
  onNewChat,
  onNewMeeting,
  onDialCall,
  meetings,
  tasks,
  selectedCalendarDate,
  onAddMeeting,
  onAddTask,
  onDeleteMeeting,
  onDeleteTask,
  onJoinMeeting,
  selectedMeetingId,
}: ListPanelProps) => {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({
    'team-1': true,
    'team-2': true,
  });
  const [expandedPinned, setExpandedPinned] = useState(true);
  const [expandedRecent, setExpandedRecent] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [calendarFormMode, setCalendarFormMode] = useState<'meeting' | 'task'>('meeting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState('');
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scheduleRef.current && !scheduleRef.current.contains(e.target as Node)) {
        setShowScheduleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.ok ? r.json() : { notifications: [] })
      .then((data) => setNotifications(data.notifications || []));
  }, []);

  const [teamCreateOpen, setTeamCreateOpen] = useState(false);
  const [channelCreateInfo, setChannelCreateInfo] = useState<{ open: boolean; teamId: string }>({ open: false, teamId: '' });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [membersModalTeam, setMembersModalTeam] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'team' | 'channel'; id: string; teamId?: string } | null>(null);

  const [callInput, setCallInput] = useState('');

  const [peopleSearch, setPeopleSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch('/api/friend-requests');
      if (res.ok) {
        const data = await res.json();
        setSentRequests(data.sent);
        setReceivedRequests(data.received);
      }
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'people') {
      fetchRequests();
    }
  }, [activeView, fetchRequests]);

  useEffect(() => {
    if (peopleSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(peopleSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [peopleSearch]);

  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [respondingRequests, setRespondingRequests] = useState<Set<string>>(new Set());

  const handleSendRequest = async (recipientId: string) => {
    if (sendingRequests.has(recipientId)) return;
    setSendingRequests((prev) => new Set(prev).add(recipientId));
    const res = await fetch('/api/friend-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId }),
    });
    if (res.ok) {
      fetchRequests();
    }
    setSendingRequests((prev) => {
      const next = new Set(prev);
      next.delete(recipientId);
      return next;
    });
  };

  const handleRespondRequest = async (id: string, status: string) => {
    if (respondingRequests.has(id)) return;
    setRespondingRequests((prev) => new Set(prev).add(id));
    const res = await fetch(`/api/friend-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchRequests();
    }
    setRespondingRequests((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

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

  const getPanelHeader = () => {
    switch (activeView) {
      case 'activity':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <BellRing className="w-4.5 h-4.5 text-[#6366F1]" /> Activity Feed
            </h2>
            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[#1F2937] transition-all">
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        );
      case 'chat':
        return (
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Chat</h2>
            <div className="flex items-center gap-1">
              <button 
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
                title="Filter"
              >
                <Filter className="w-4 h-4" />
              </button>
              <button 
                id="btn-new-chat"
                onClick={onNewChat}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
                title="New Chat"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      case 'teams':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Teams Workspaces</h2>
            <button 
              onClick={() => setTeamCreateOpen(true)} 
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[#1F2937] transition-all"
              title="Create new team"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        );
      case 'calendar':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Calendar</h2>
            <div ref={scheduleRef} className="relative">
              <button
                id="btn-new-meeting"
                onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                className="bg-[#6366F1] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#5053e1] transition-all text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-950/40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule
              </button>
              {showScheduleDropdown && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setCalendarFormMode('meeting'); setShowCalendarForm(true); setShowScheduleDropdown(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Schedule Meeting
                  </button>
                  <button
                    onClick={() => { setCalendarFormMode('task'); setShowCalendarForm(true); setShowScheduleDropdown(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                  >
                    <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
                    Add Task
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'calls':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Voice & Video</h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-medium px-2 py-0.5 rounded-full border border-emerald-500/20">
              VoIP Enabled
            </span>
          </div>
        );
      case 'people':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-[#6366F1]" /> People
            </h2>
          </div>
        );
      case 'files':
        return (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Files Library</h2>
            <span className="text-xs text-[var(--text-secondary)]">OneDrive Connected</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div id="list-panel-container" className="w-[280px] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col flex-shrink-0 select-none h-full z-10">
      {getPanelHeader()}

      {activeView !== 'calls' && activeView !== 'calendar' && activeView !== 'people' && (
        <div className="p-3 border-b border-[var(--border-color)]">
          <div className="relative">
            <input
              id="search-filter-input"
              type="text"
              placeholder={`Search ${activeView}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-2.5" />
          </div>
        </div>
      )}

      <div id="list-panel-scrollbar" className="flex-1 overflow-y-auto p-2 space-y-1">
        
        {activeView === 'calendar' && !showCalendarForm && (
          <div className="space-y-3 p-1">
            {selectedCalendarDate && (
              <div className="text-[10px] text-[var(--text-secondary)] font-mono font-semibold px-1">
                {new Date(selectedCalendarDate + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            )}
            {tasks && selectedCalendarDate && tasks.filter(t => t.date === selectedCalendarDate).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1 px-1">
                  <ListTodo className="w-3 h-3" /> Tasks
                </p>
                {tasks.filter(t => t.date === selectedCalendarDate).map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-1.5 group/task">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)]">{t.title}</h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          t.priority === 'HIGH' ? 'text-rose-400 bg-rose-500/10' :
                          t.priority === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10' :
                          'text-emerald-400 bg-emerald-500/10'
                        }`}>
                          {t.priority}
                        </span>
                        {onDeleteTask && (
                          <button
                            onClick={async () => {
                              setDeletingId(t.id);
                              try { await onDeleteTask(t.id); } finally { setDeletingId(null); }
                            }}
                            disabled={deletingId === t.id}
                            className="opacity-0 group-hover/task:opacity-100 text-gray-500 hover:text-rose-400 p-1 rounded transition-all disabled:opacity-50"
                            title="Delete task"
                          >
                            {deletingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                    {t.time && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--text-secondary)] font-mono">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Due by {t.time}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {meetings && selectedCalendarDate && meetings.filter(m => m.date === selectedCalendarDate).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1 px-1">
                  <Calendar className="w-3 h-3" /> Meetings
                </p>
                {meetings.filter(m => m.date === selectedCalendarDate).map((meet) => (
                  <div key={meet.id} className={`p-2.5 rounded-xl border transition-all group/meet ${
                    selectedMeetingId === meet.id
                      ? 'bg-[var(--bg-tertiary)] border-[#6366F1]'
                      : meet.isLive
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-[var(--bg-tertiary)]/30 border-[var(--border-color)]'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{meet.title}</h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {meet.isLive && (
                          <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                          </span>
                        )}
                        {onDeleteMeeting && (
                          <button
                            onClick={async () => {
                              setDeletingId(meet.id);
                              try { await onDeleteMeeting(meet.id); } finally { setDeletingId(null); }
                            }}
                            disabled={deletingId === meet.id}
                            className="opacity-0 group-hover/meet:opacity-100 text-gray-500 hover:text-rose-400 p-1 rounded transition-all disabled:opacity-50"
                            title="Delete meeting"
                          >
                            {deletingId === meet.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--text-secondary)] font-mono">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>{meet.startTime} - {meet.endTime}</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-relaxed line-clamp-2">{meet.description}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Users className="w-3 h-3 text-gray-500" />
                      <p className="text-[8px] text-indigo-300 font-semibold truncate">{meet.attendees.join(', ')}</p>
                    </div>
                    {meet.isLive && onJoinMeeting && (
                      <button
                        onClick={() => onJoinMeeting(meet)}
                        className="w-full mt-2 bg-[#6366F1] text-white py-1.5 rounded-lg hover:bg-[#5053e1] transition-all text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Video className="w-3 h-3" />
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        Join Active Call
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {tasks && meetings && selectedCalendarDate && tasks.filter(t => t.date === selectedCalendarDate).length === 0 && meetings.filter(m => m.date === selectedCalendarDate).length === 0 && (
              <div className="py-6 text-center select-none space-y-2">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-gray-500 mx-auto">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Nothing scheduled</p>
                <p className="text-[10px] text-gray-500 max-w-[180px] mx-auto">
                  Click Schedule to add a meeting or task.
                </p>
              </div>
            )}
          </div>
        )}

        {activeView === 'calendar' && showCalendarForm && calendarFormMode === 'meeting' && (
          <div className="p-3">
            <EventForm
              selectedDate={selectedCalendarDate || ''}
              existingMeetings={meetings || []}
              onSave={async (data) => {
                setIsSubmitting(true);
                setServerError('');
                try {
                  await onAddMeeting?.(data);
                  setShowCalendarForm(false);
                } catch (e: any) {
                  setServerError(e.message || 'Failed to create meeting');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              onCancel={() => { setShowCalendarForm(false); setServerError(''); }}
              isSubmitting={isSubmitting}
              serverError={serverError}
            />
          </div>
        )}

        {activeView === 'calendar' && showCalendarForm && calendarFormMode === 'task' && (
          <div className="p-3">
            <TaskForm
              selectedDate={selectedCalendarDate || ''}
              onSave={async (data) => {
                setIsSubmitting(true);
                setServerError('');
                try {
                  await onAddTask?.(data);
                  setShowCalendarForm(false);
                } catch (e: any) {
                  setServerError(e.message || 'Failed to create task');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              onCancel={() => { setShowCalendarForm(false); setServerError(''); }}
              isSubmitting={isSubmitting}
              serverError={serverError}
            />
          </div>
        )}
        
        {activeView === 'activity' && (
          <div className="space-y-1.5">
            {notifications.length === 0 && (
              <p className="text-[11px] text-[var(--text-secondary)] text-center py-8">No notifications yet.</p>
            )}
            {notifications.map((item) => {
              const iconMap: Record<string, React.ElementType> = {
                message_reply: FileText,
                tag: Star,
                file_shared: FileText,
                system: BellRing,
                friend_request: UserPlus,
              };
              const Icon = iconMap[item.type] || BellRing;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.teamId && item.channelId) {
                      onSelectChannel(item.teamId, item.channelId);
                    }
                  }}
                  className={`p-3 rounded-xl cursor-pointer hover:bg-[#1F2937] transition-all duration-150 border border-transparent hover:border-[#374151] flex gap-2.5 items-start ${
                    !item.read ? 'bg-[var(--bg-tertiary)]/40 relative' : ''
                  }`}
                >
                  {!item.read && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#6366F1]" />
                  )}
                  <div className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <Icon className="w-4 h-4 text-[#6366F1]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">{item.title}</h4>
                    {item.detail && (
                      <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{item.detail}</p>
                    )}
                    <p className="text-[10px] text-gray-500 font-mono mt-1">{formatTimeAgo(item.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'chat' && (
          <div className="space-y-2 pb-4">
            {/* Pinned Section */}
            <div className="group/section">
              <div
                onClick={() => setExpandedPinned(!expandedPinned)}
                className="flex items-center gap-1.5 px-3 py-1 hover:bg-[var(--bg-tertiary)]/30 cursor-pointer rounded-lg transition-colors"
              >
                {expandedPinned ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
                <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover/section:text-[var(--text-primary)]">Pinned</span>
              </div>
              {expandedPinned && (
                <div className="space-y-[2px] mt-1">
                  <p className="text-[11px] text-[var(--text-secondary)] px-8 py-1.5">No pinned chats</p>
                </div>
              )}
            </div>

            {/* Recent Section */}
            <div className="group/section">
              <div
                onClick={() => setExpandedRecent(!expandedRecent)}
                className="flex items-center gap-1.5 px-3 py-1 hover:bg-[var(--bg-tertiary)]/30 cursor-pointer rounded-lg transition-colors"
              >
                {expandedRecent ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
                <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover/section:text-[var(--text-primary)]">Recent</span>
              </div>
              {expandedRecent && (
                <div className="space-y-[2px] mt-1 px-1.5">
                  {filteredChats.map((chat) => {
                    const active = activeChatId === chat.id;
                    const targetUser = chat.participants.find((u) => u.id !== currentUserId) || allUsers[0];
                    const lastMsg = chat.messages[chat.messages.length - 1];
                    const hasUnread = chat.unreadCount > 0;

                    return (
                      <div
                        key={chat.id}
                        id={`chat-item-${chat.id}`}
                        onClick={() => onSelectChat(chat.id)}
                        className={`group/chatitem flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-75 relative ${
                          active 
                            ? 'bg-white dark:bg-[#292929] shadow-sm' 
                            : 'hover:bg-[#F3F2F1] dark:hover:bg-[#292929]'
                        }`}
                      >
                        {/* Active Selection Indicator */}
                        {active && (
                          <div className="absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-[#5B5FC7] dark:bg-[#7977F7] rounded-r-full" />
                        )}

                        <div className="relative flex-shrink-0 ml-1">
                          <div className="w-9 h-9 rounded-full bg-[#E1DFDD] dark:bg-[#484644] text-[#323130] dark:text-[#F3F2F1] font-semibold text-xs flex items-center justify-center overflow-hidden">
                            {chat.type === 'direct' ? (targetUser.avatar || targetUser.name.charAt(0)) : chat.name.charAt(0)}
                          </div>
                          {chat.type === 'direct' && (
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-secondary)] dark:border-[#292929] ${getStatusColor(targetUser.status)}`} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm truncate text-[var(--text-primary)] leading-tight ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
                              {chat.name}
                            </h4>
                            <span suppressHydrationWarning className={`text-[11px] font-mono pl-2 flex-shrink-0 ${hasUnread ? 'font-bold text-[#5B5FC7] dark:text-[#7977F7]' : 'text-[var(--text-secondary)]'}`}>
                              {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-0.5">
                            <p className={`text-xs truncate ${hasUnread ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                              {lastMsg ? `${lastMsg.senderId === currentUserId ? 'You: ' : ''}${lastMsg.content}` : 'No messages'}
                            </p>
                            
                            <div className="flex items-center opacity-0 group-hover/chatitem:opacity-100 transition-opacity flex-shrink-0 pl-1">
                              <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0.5 rounded hover:bg-[var(--bg-tertiary)]" title="More options">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {hasUnread && !active && (
                              <div className="flex-shrink-0 ml-1 opacity-100 group-hover/chatitem:hidden">
                                <span className="bg-[#5B5FC7] dark:bg-[#7977F7] text-white font-bold text-[10px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
                                  {chat.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'teams' && (
          <div className="space-y-2">
            {filteredTeams.map((team) => (
              <div key={team.id} className="space-y-0.5 group/team">
                <div className="flex items-center justify-between px-1.5">
                  <div
                    onClick={() => toggleTeam(team.id)}
                    className="flex items-center gap-2 min-w-0 flex-1 p-1.5 hover:bg-[#1F2937]/30 rounded-lg cursor-pointer"
                  >
                    {expandedTeams[team.id] ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-slate-700 to-slate-800 text-white font-bold text-[10px] flex items-center justify-center border border-[var(--border-color)] flex-shrink-0">
                      {team.avatar}
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {team.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setChannelCreateInfo({ open: true, teamId: team.id }); }}
                      className="opacity-0 group-hover/team:opacity-100 text-gray-500 hover:text-[var(--text-primary)] p-1 rounded transition-all"
                      title="Create channel"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingMembers(team.id);
                        const res = await fetch(`/api/teams/${team.id}/members`);
                        if (res.ok) {
                          const data = await res.json();
                          setTeamMembers(data.members);
                          setMembersModalTeam(team.id);
                        }
                        setLoadingMembers(null);
                      }}
                      className="text-[10px] text-gray-500 bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded font-mono font-medium hover:text-[var(--text-primary)] transition-colors"
                      title="View members"
                    >
                      {loadingMembers === team.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        team.membersCount
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'team', id: team.id }); }}
                      className="opacity-0 group-hover/team:opacity-100 text-gray-500 hover:text-rose-400 p-1 rounded transition-all"
                      title="Delete team"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {expandedTeams[team.id] && (
                  <div className="pl-3.5 space-y-0.5 border-l border-[var(--border-color)] ml-4.5 mt-0.5">
                    {team.channels.map((ch) => {
                      const isActive = activeChannelId === ch.id;
                      return (
                        <div key={ch.id} className="group/channel flex items-center">
                          <div
                            id={`channel-item-${ch.id}`}
                            onClick={() => onSelectChannel(team.id, ch.id)}
                            className={`flex items-center justify-between flex-1 p-1.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                              isActive
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold shadow-inner'
                                : 'text-[var(--text-secondary)] hover:bg-[#1F2937]/45 hover:text-[var(--text-primary)]'
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
                          <button
                            onClick={() => setDeleteConfirm({ type: 'channel', id: ch.id, teamId: team.id })}
                            className="opacity-0 group-hover/channel:opacity-100 text-gray-500 hover:text-rose-400 p-1 rounded transition-all ml-1"
                            title="Delete channel"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeView === 'calls' && (
          <div className="space-y-4">
            <div className="p-1">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block mb-1.5">
                Quick Dial Contact
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Enter name or team..."
                  value={callInput}
                  onChange={(e) => setCallInput(e.target.value)}
                  className="flex-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-lg px-2 py-1.5 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
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
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block px-1">
                Speed Dial
              </label>
              {allUsers.filter((u) => u.id !== currentUserId).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-tertiary)]/35 border border-transparent hover:bg-[#1F2937] hover:border-[#374151] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center justify-center">
                        {user.avatar}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#111827] ${getStatusColor(user.status)}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">{user.name}</h4>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">{user.role}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onDialCall(user.name, false)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[#111827] transition-all"
                      title="Audio Call"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDialCall(user.name, true)}
                      className="text-[var(--text-secondary)] hover:text-[#6366F1] p-1 rounded hover:bg-[#111827] transition-all"
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

        {activeView === 'people' && (
          <div className="space-y-3">
            <div className="p-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, username or email..."
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-400 text-xs rounded-lg pl-8 pr-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] transition-all"
                />
                <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-2.5" />
                {searching && <Loader2 className="w-3.5 h-3.5 text-indigo-400 absolute right-2.5 top-2.5 animate-spin" />}
              </div>
            </div>

            {peopleSearch.length >= 2 && (
              <div className="px-2">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono mb-1.5">Search Results</p>
                {searchResults.length === 0 && !searching && (
                  <p className="text-xs text-gray-500 text-center py-4">No users found</p>
                )}
                <div className="space-y-1">
                  {searchResults.map((user: any) => {
                    const alreadySent = sentRequests.some((r: any) => r.recipientId === user.id);
                    const alreadyReceived = receivedRequests.some((r: any) => r.senderId === user.id);
                    const isConnected = receivedRequests.some((r: any) => r.senderId === user.id && r.status === 'ACCEPTED')
                      || sentRequests.some((r: any) => r.recipientId === user.id && r.status === 'ACCEPTED');
                    return (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1F2937] transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#374151] text-white font-semibold text-xs flex items-center justify-center">
                            {user.name?.charAt(0) || user.username?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.name || user.username}</p>
                            <p className="text-[10px] text-[var(--text-secondary)] truncate">@{user.username}</p>
                          </div>
                        </div>
                        {isConnected ? (
                          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Connected
                          </span>
                        ) : alreadySent ? (
                          <span className="text-[10px] text-[var(--text-secondary)]">Requested</span>
                        ) : alreadyReceived ? (
                          <button
                            onClick={() => handleRespondRequest(
                              receivedRequests.find((r: any) => r.senderId === user.id)?.id,
                              'ACCEPTED'
                            )}
                            disabled={respondingRequests.has(receivedRequests.find((r: any) => r.senderId === user.id)?.id || '')}
                            className="text-[10px] bg-[#6366F1] text-white px-2 py-1 rounded-lg font-semibold hover:bg-[#5053e1] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {respondingRequests.has(receivedRequests.find((r: any) => r.senderId === user.id)?.id || '') ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : null}
                            {respondingRequests.has(receivedRequests.find((r: any) => r.senderId === user.id)?.id || '') ? 'Accepting...' : 'Accept'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(user.id)}
                            disabled={sendingRequests.has(user.id)}
                            className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg font-semibold hover:bg-[#2e3748] transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingRequests.has(user.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserPlus className="w-3 h-3" />
                            )} Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="h-[1px] bg-[#374151]/30 mx-2" />

            <div className="px-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                  Pending Requests
                </p>
                {loadingRequests && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
              </div>

              {receivedRequests.filter((r: any) => r.status === 'PENDING').length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No pending requests</p>
              )}

              <div className="space-y-1">
                {receivedRequests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-tertiary)]/40 border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center justify-center">
                        {req.sender.name?.charAt(0) || req.sender.username?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{req.sender.name || req.sender.username}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">@{req.sender.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRespondRequest(req.id, 'ACCEPTED')}
                        disabled={respondingRequests.has(req.id)}
                        className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Accept"
                      >
                        {respondingRequests.has(req.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req.id, 'REJECTED')}
                        disabled={respondingRequests.has(req.id)}
                        className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Reject"
                      >
                        {respondingRequests.has(req.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {sentRequests.filter((r: any) => r.status === 'PENDING').length > 0 && (
                <>
                  <div className="h-[1px] bg-[#374151]/30 my-2" />
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono mb-1.5">Sent Requests</p>
                  <div className="space-y-1">
                    {sentRequests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                      <div key={req.id} className="flex items-center gap-2 p-2 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-[#374151] text-white font-semibold text-xs flex items-center justify-center">
                          {req.recipient.name?.charAt(0) || req.recipient.username?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{req.recipient.name || req.recipient.username}</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">Pending...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-[#1F2937] text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-all duration-150 border border-transparent hover:border-[#374151]"
              >
                <div className="p-1 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <cat.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-semibold">{cat.label}</span>
              </div>
            ))}
          </div>
        )}

      </div>

      <CreateTeamModal
        open={teamCreateOpen}
        onClose={() => setTeamCreateOpen(false)}
        onCreated={(team) => {
          dispatch(addTeam(team));
          setTeamCreateOpen(false);
        }}
      />

      <CreateChannelModal
        open={channelCreateInfo.open}
        onClose={() => setChannelCreateInfo({ open: false, teamId: '' })}
        teamId={channelCreateInfo.teamId}
        onCreated={(channel) => {
          dispatch(addChannel({ teamId: channelCreateInfo.teamId, channel }));
        }}
      />

      {membersModalTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="h-12 bg-[var(--bg-tertiary)] px-4 flex items-center justify-between border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Team Members</h3>
              <button onClick={() => setMembersModalTeam(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-lg">&times;</button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-1.5">
              {teamMembers.length === 0 && <p className="text-xs text-[var(--text-secondary)] text-center py-4">No members found.</p>}
              {teamMembers.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#374151] text-white font-semibold text-xs flex items-center justify-center">
                      {m.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{m.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{m.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium ${m.role === 'OWNER' ? 'text-amber-400' : 'text-gray-500'}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteConfirm?.type === 'team'}
        title="Delete Team"
        message="Are you sure you want to delete this team? All channels and messages will be permanently removed."
        confirmLabel="Delete Team"
        variant="danger"
        loading={deletingTeam}
        onConfirm={async () => {
          if (!deleteConfirm || deleteConfirm.type !== 'team') return;
          setDeletingTeam(true);
          try {
            await fetch(`/api/teams/${deleteConfirm.id}`, { method: 'DELETE' });
            dispatch(removeTeam(deleteConfirm.id));
            setDeleteConfirm(null);
          } finally {
            setDeletingTeam(false);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmModal
        open={deleteConfirm?.type === 'channel'}
        title="Delete Channel"
        message="Are you sure you want to delete this channel? All messages will be permanently removed."
        confirmLabel="Delete Channel"
        variant="danger"
        onConfirm={async () => {
          if (!deleteConfirm || deleteConfirm.type !== 'channel') return;
          await fetch(`/api/channels/${deleteConfirm.id}`, { method: 'DELETE' });
          if (deleteConfirm.teamId) {
            dispatch(removeChannel({ teamId: deleteConfirm.teamId, channelId: deleteConfirm.id }));
          }
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
