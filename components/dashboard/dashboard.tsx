"use client";

import { useState, useEffect, FormEvent } from "react";
import { Calendar, MessageSquare, HardDrive } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ListPanel } from "@/components/layout/list-panel";
import { ChatView } from "@/components/chat/chat-view";
import { ThreadPanel } from "@/components/messages/thread-panel";
import { MeetingView } from "@/components/meetings/meeting-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { FilesView } from "@/components/files/files-view";
import {
  CURRENT_USER, USERS, MOCK_TEAMS, MOCK_CHATS, MOCK_THREAD_REPLIES,
  MOCK_MEETINGS, MOCK_FILES,
} from "@/lib/data";
import type { Chat, Team, Channel, Message, ThreadReply, CalendarMeeting, FileItem, Attachment, UserStatus, User } from "@/lib/types";

export function Dashboard({ dbUser }: { dbUser?: any }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const [activeView, setActiveView] = useState<string>("chat");
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [meetings, setMeetings] = useState<CalendarMeeting[]>(MOCK_MEETINGS);
  const [files, setFiles] = useState<FileItem[]>(MOCK_FILES);
  const [threadReplies, setThreadReplies] = useState<ThreadReply[]>(MOCK_THREAD_REPLIES);

  const [activeChatId, setActiveChatId] = useState<string | null>("chat-1");
  const [activeTeamId, setActiveTeamId] = useState<string | null>("team-1");
  const [activeChannelId, setActiveChannelId] = useState<string | null>("c-apollo-gen");

  const [activeThreadParent, setActiveThreadParent] = useState<Message | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<CalendarMeeting | null>(null);
  const [activeFileView, setActiveFileView] = useState<string>("f-recents");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const currentUser: User = dbUser ? {
    id: dbUser.id,
    name: dbUser.name || dbUser.email?.split("@")[0] || "User",
    avatar: dbUser.imageUrl ? dbUser.imageUrl.substring(0, 2).toUpperCase() : (dbUser.name ? dbUser.name.substring(0, 2).toUpperCase() : "U"),
    role: "Member",
    status: (dbUser.status as UserStatus) || "online",
    email: dbUser.email,
    customStatus: dbUser.customStatus || "",
  } : CURRENT_USER;

  const [showProfileSetup, setShowProfileSetup] = useState(() => {
    return dbUser ? (!dbUser.firstName || !dbUser.lastName || !dbUser.phoneNumber) : false;
  });
  const [setupFirstName, setSetupFirstName] = useState(dbUser?.firstName || "");
  const [setupMiddleName, setSetupMiddleName] = useState(dbUser?.middleName || "");
  const [setupLastName, setSetupLastName] = useState(dbUser?.lastName || "");
  const [setupPhone, setSetupPhone] = useState(dbUser?.phoneNumber || "");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  const [settingsRole, setSettingsRole] = useState(currentUser.role);
  const [settingsStatusMsg, setSettingsStatusMsg] = useState(currentUser.customStatus || "");

  useEffect(() => {
    setSettingsRole(currentUser.role);
    setSettingsStatusMsg(currentUser.customStatus || "");
  }, [currentUser.role, currentUser.customStatus]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const activeTeam = teams.find(t => t.id === activeTeamId) || null;
  const activeChannel = activeTeam?.channels.find(ch => ch.id === activeChannelId) || null;

  useEffect(() => {
    if (activeView === "chat" && activeChatId) {
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, unreadCount: 0 } : c));
    }
  }, [activeView, activeChatId]);

  useEffect(() => {
    if (activeView === "teams" && activeChannelId && activeTeamId) {
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeamId) {
          const updatedChannels = t.channels.map(ch =>
            ch.id === activeChannelId ? { ...ch, unreadCount: 0 } : ch,
          );
          return { ...t, channels: updatedChannels };
        }
        return t;
      }));
    }
  }, [activeView, activeChannelId, activeTeamId]);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view !== "chat" && view !== "teams") {
      setActiveThreadParent(null);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveView("chat");
  };

  const handleSelectChannel = (teamId: string, channelId: string) => {
    setActiveTeamId(teamId);
    setActiveChannelId(channelId);
    setActiveView("teams");
  };

  const handleSendMessage = (content: string, attachments?: Attachment[]) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content,
      timestamp: new Date().toISOString(),
      reactions: [],
      attachments,
    };

    if (attachments && attachments.length > 0) {
      const newFiles: FileItem[] = attachments.map(att => ({
        id: `f-${Date.now()}-${att.id}`,
        name: att.name,
        type: (att.type as FileItem["type"]) || "pdf",
        size: att.size,
        uploadedBy: currentUser.name,
        uploadedAt: new Date().toISOString(),
        teamId: activeView === "teams" ? activeTeamId || undefined : undefined,
        channelId: activeView === "teams" ? activeChannelId || undefined : undefined,
      }));
      setFiles(prev => [newFiles[0], ...prev]);
    }

    if (activeView === "chat" && activeChatId) {
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, newMessage] };
        }
        return c;
      }));
    } else if (activeView === "teams" && activeTeamId && activeChannelId) {
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeamId) {
          const updatedCh = t.channels.map(ch => {
            if (ch.id === activeChannelId) {
              return { ...ch, messages: [...ch.messages, newMessage] };
            }
            return ch;
          });
          return { ...t, channels: updatedCh };
        }
        return t;
      }));
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (activeView === "chat" && activeChatId) {
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: c.messages.filter(m => m.id !== messageId) };
        }
        return c;
      }));
    } else if (activeView === "teams" && activeTeamId && activeChannelId) {
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeamId) {
          const updatedCh = t.channels.map(ch => {
            if (ch.id === activeChannelId) {
              return { ...ch, messages: ch.messages.filter(m => m.id !== messageId) };
            }
            return ch;
          });
          return { ...t, channels: updatedCh };
        }
        return t;
      }));
    }
  };

  const handleSendReply = (parentMessageId: string, content: string) => {
    const newReply: ThreadReply = {
      id: `reply-${Date.now()}`,
      messageId: parentMessageId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content,
      timestamp: new Date().toISOString(),
      reactions: [],
    };

    setThreadReplies(prev => [...prev, newReply]);

    const updateReplyCount = (msgs: Message[]) =>
      msgs.map(m => m.id === parentMessageId ? { ...m, replyCount: (m.replyCount || 0) + 1 } : m);

    if (activeView === "chat" && activeChatId) {
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updateReplyCount(c.messages) } : c));
    } else if (activeView === "teams" && activeTeamId && activeChannelId) {
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeamId) {
          const updatedCh = t.channels.map(ch =>
            ch.id === activeChannelId ? { ...ch, messages: updateReplyCount(ch.messages) } : ch
          );
          return { ...t, channels: updatedCh };
        }
        return t;
      }));
    }

    if (activeThreadParent && activeThreadParent.id === parentMessageId) {
      setActiveThreadParent(prev => prev ? { ...prev, replyCount: (prev.replyCount || 0) + 1 } : null);
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    const applyReaction = (reactions: Message["reactions"]) => {
      const existing = reactions.find(r => r.emoji === emoji);
      if (existing) {
        if (existing.users.includes(currentUser.id)) {
          const filteredUsers = existing.users.filter(uid => uid !== currentUser.id);
          if (filteredUsers.length === 0) {
            return reactions.filter(r => r.emoji !== emoji);
          }
          return reactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, users: filteredUsers } : r);
        } else {
          return reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, currentUser.id] } : r);
        }
      } else {
        return [...reactions, { emoji, count: 1, users: [currentUser.id] }];
      }
    };

    if (activeView === "chat" && activeChatId) {
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          const updatedMsgs = c.messages.map(m =>
            m.id === messageId ? { ...m, reactions: applyReaction(m.reactions) } : m
          );
          return { ...c, messages: updatedMsgs };
        }
        return c;
      }));
    } else if (activeView === "teams" && activeTeamId && activeChannelId) {
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeamId) {
          const updatedCh = t.channels.map(ch => {
            if (ch.id === activeChannelId) {
              const updatedMsgs = ch.messages.map(m =>
                m.id === messageId ? { ...m, reactions: applyReaction(m.reactions) } : m
              );
              return { ...ch, messages: updatedMsgs };
            }
            return ch;
          });
          return { ...t, channels: updatedCh };
        }
        return t;
      }));
    }

    setThreadReplies(prev => prev.map(reply => {
      if (reply.id === messageId) {
        return { ...reply, reactions: applyReaction(reply.reactions) };
      }
      return reply;
    }));

    if (activeThreadParent && activeThreadParent.id === messageId) {
      setActiveThreadParent(prev => prev ? { ...prev, reactions: applyReaction(prev.reactions) } : null);
    }
  };

  const handleStartCall = (isVideo: boolean) => {
    const mockMeeting: CalendarMeeting = {
      id: `meet-${Date.now()}`,
      title: activeView === "chat" ? `Sync Call with ${activeChat?.name}` : `Sync Call in #${activeChannel?.name}`,
      organizer: currentUser.name,
      date: new Date().toISOString().split("T")[0],
      startTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      endTime: "",
      description: "Ad-hoc video call initiated inside conversation thread.",
      attendees: [currentUser.name, ...USERS.filter(u => u.id !== currentUser.id).slice(0, 2).map(u => u.name)],
    };
    setActiveMeeting(mockMeeting);
  };

  const handleJoinMeeting = (meeting: CalendarMeeting) => {
    setActiveMeeting(meeting);
  };

  const handleLeaveCall = () => {
    const sysMsg: Message = {
      id: `msg-sys-${Date.now()}`,
      senderId: "system",
      senderName: "System Network",
      senderAvatar: "SYS",
      content: "Meeting call ended. Call duration: 4 minutes, 12 seconds.",
      timestamp: new Date().toISOString(),
      reactions: [],
      isCallNotification: true,
    };

    if (activeView === "chat" && activeChatId) {
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, sysMsg] } : c));
    } else if (activeView === "teams" && activeTeamId && activeChannelId) {
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeamId) {
          const updatedCh = t.channels.map(ch =>
            ch.id === activeChannelId ? { ...ch, messages: [...ch.messages, sysMsg] } : ch
          );
          return { ...t, channels: updatedCh };
        }
        return t;
      }));
    }

    setActiveMeeting(null);
  };

  const handleAddMeeting = (meetDetails: Omit<CalendarMeeting, "id">) => {
    const newMeet: CalendarMeeting = {
      id: `meet-${Date.now()}`,
      ...meetDetails,
    };
    setMeetings(prev => [...prev, newMeet]);
  };

  const handleUploadFile = (name: string, type: FileItem["type"], size: string) => {
    const newFile: FileItem = {
      id: `f-${Date.now()}`,
      name,
      type,
      size,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
    };
    setFiles(prev => [newFile, ...prev]);
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDialCall = (userName: string, isVideo: boolean) => {
    const mockMeeting: CalendarMeeting = {
      id: `meet-${Date.now()}`,
      title: `Outgoing Call: ${userName}`,
      organizer: currentUser.name,
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      description: "Speed dial phone sync.",
      attendees: [currentUser.name, userName],
    };
    setActiveMeeting(mockMeeting);
  };

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    setShowSettingsModal(false);
  };

  const handleUpdateStatus = (status: UserStatus) => {};

  const handleNewChatTrigger = () => {
    const randomUser = USERS.filter(u => u.id !== currentUser.id)[Math.floor(Math.random() * 4)];
    const existing = chats.find(c => c.type === "direct" && c.participants.some(p => p.id === randomUser.id));
    if (existing) {
      setActiveChatId(existing.id);
      setActiveView("chat");
    } else {
      const newId = `chat-${Date.now()}`;
      const newChat: Chat = {
        id: newId,
        name: randomUser.name,
        type: "direct",
        participants: [currentUser, randomUser],
        unreadCount: 0,
        messages: [],
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newId);
      setActiveView("chat");
    }
  };

  const handleProfileSetupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSetupError("");
    setSetupLoading(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firstName: setupFirstName, 
          middleName: setupMiddleName, 
          lastName: setupLastName, 
          phoneNumber: setupPhone 
        }),
      });
      if (res.ok) {
        setShowProfileSetup(false);
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } else {
        const data = await res.json();
        setSetupError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setSetupError("An unexpected error occurred");
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div id="enterprise-workspace-canvas" className="w-full h-screen bg-[#0B0F19] text-white flex overflow-hidden font-sans">
      <SidebarNav
        activeView={activeView}
        onViewChange={handleViewChange}
        currentUser={currentUser}
        onOpenSettings={() => setShowSettingsModal(true)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
      />

      {activeMeeting ? (
        <MeetingView
          currentUser={currentUser}
          meetingTitle={activeMeeting.title}
          onLeave={handleLeaveCall}
        />
      ) : (
        <>
          <ListPanel
            activeView={activeView}
            chats={chats}
            teams={teams}
            activeChatId={activeChatId}
            activeChannelId={activeChannelId}
            meetings={meetings}
            files={files}
            onSelectChat={handleSelectChat}
            onSelectChannel={handleSelectChannel}
            onSelectFileView={setActiveFileView}
            onJoinMeeting={handleJoinMeeting}
            onNewChat={handleNewChatTrigger}
            onNewMeeting={() => { setActiveView("calendar"); }}
            onDialCall={handleDialCall}
            onSelectMeeting={setSelectedMeetingId}
          />

          <div id="main-content-canvas" className="flex-1 flex overflow-hidden min-w-0 h-full relative">
            {(activeView === "chat" || activeView === "teams") && (
              <ChatView
                currentUser={currentUser}
                activeChat={activeChat}
                activeTeam={activeTeam}
                activeChannel={activeChannel}
                onSendMessage={handleSendMessage}
                onOpenThread={setActiveThreadParent}
                onAddReaction={handleAddReaction}
                onStartCall={handleStartCall}
                onDeleteMessage={handleDeleteMessage}
              />
            )}

            {activeView === "calendar" && (
              <CalendarView
                meetings={meetings}
                onAddMeeting={handleAddMeeting}
                onJoinMeeting={handleJoinMeeting}
                selectedMeetingId={selectedMeetingId}
              />
            )}

            {activeView === "files" && (
              <FilesView
                files={files}
                onUploadFile={handleUploadFile}
                onDeleteFile={handleDeleteFile}
              />
            )}

            {activeView === "activity" && (
              <div className="flex-1 bg-[#0B0F19] p-8 md:p-12 overflow-y-auto flex flex-col justify-start h-full">
                <div className="max-w-4xl w-full mx-auto space-y-8">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                      Welcome back, {currentUser.name}
                    </h1>
                    <p className="text-sm text-gray-400">
                      Here is an overview of your team&apos;s workspace activity today.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-5 rounded-2xl bg-[#111827] border border-[#374151] flex flex-col justify-between h-[160px] group hover:border-gray-500 transition-all duration-200">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">Schedule</span>
                          <Calendar className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-3">{meetings.length} Meetings</h3>
                        <p className="text-xs text-gray-400 mt-1">Scheduled for this week</p>
                      </div>
                      <button
                        onClick={() => setActiveView("calendar")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold text-left flex items-center gap-1 group/btn mt-4 cursor-pointer"
                      >
                        View Calendar &rarr;
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#111827] border border-[#374151] flex flex-col justify-between h-[160px] group hover:border-gray-500 transition-all duration-200">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">Unreads</span>
                          <MessageSquare className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-3">
                          {chats.reduce((acc, c) => acc + c.unreadCount, 0) + teams.reduce((acc, t) => acc + t.channels.reduce((sum, ch) => sum + ch.unreadCount, 0), 0)} Messages
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Awaiting your response</p>
                      </div>
                      <button
                        onClick={() => setActiveView("chat")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold text-left flex items-center gap-1 group/btn mt-4 cursor-pointer"
                      >
                        Open Chats &rarr;
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#111827] border border-[#374151] flex flex-col justify-between h-[160px] group hover:border-gray-500 transition-all duration-200">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">Shared Space</span>
                          <HardDrive className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-3">{files.length} Shared Files</h3>
                        <p className="text-xs text-gray-400 mt-1">Stored in Cloud Drive</p>
                      </div>
                      <button
                        onClick={() => setActiveView("files")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold text-left flex items-center gap-1 group/btn mt-4 cursor-pointer"
                      >
                        Access files &rarr;
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-white tracking-tight">Recent Live Activity</h3>
                    <div className="h-[1px] bg-[#374151]/50" />

                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-gray-300">Daily Standup Sync is currently scheduled</span>
                        </div>
                        <span className="text-gray-500 font-mono">Active Slot</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-gray-300">Sarah Chen updated the component guidelines</span>
                        </div>
                        <span className="text-gray-500 font-mono">15m ago</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-gray-300">Marcus Vance shared design specifications</span>
                        </div>
                        <span className="text-gray-500 font-mono">2h ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "settings" && (
              <div className="flex-1 bg-[#0B0F19] p-8 overflow-y-auto max-w-3xl mx-auto flex flex-col justify-center">
                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white">General User Profile Preferences</h3>
                  <div className="h-[1px] bg-[#374151]/50" />
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Username: <span className="text-white font-bold">{currentUser.name}</span></p>
                    <p className="text-xs text-gray-400">Role: <span className="text-white font-bold">{currentUser.role}</span></p>
                    <p className="text-xs text-gray-400">Status message: <span className="text-indigo-300 italic">{currentUser.customStatus || "Not set"}</span></p>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-[#6366F1] text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Edit Workspace Details
                  </button>
                </div>
              </div>
            )}

            {activeThreadParent && (
              <ThreadPanel
                currentUser={currentUser}
                parentMessage={activeThreadParent}
                replies={threadReplies}
                onClose={() => setActiveThreadParent(null)}
                onSendReply={handleSendReply}
                onAddReaction={handleAddReaction}
              />
            )}
          </div>
        </>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="h-12 bg-[#1F2937] px-4 flex items-center justify-between border-b border-[#374151]">
              <h3 className="text-sm font-bold text-white">Edit Profile & Workspace Status</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Presence Status</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["online", "busy", "away", "offline"] as UserStatus[]).map((st) => {
                    const active = currentUser.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(st)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold uppercase border tracking-wider transition-all ${
                          active
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                            : "bg-[#1F2937] border-[#374151] text-gray-400 hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Enterprise Title / Role</label>
                <input
                  type="text"
                  value={settingsRole}
                  onChange={(e) => setSettingsRole(e.target.value)}
                  className="w-full bg-[#1F2937] text-white text-xs rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Custom status description</label>
                <input
                  type="text"
                  placeholder="Coding a beautiful Teams clone..."
                  value={settingsStatusMsg}
                  onChange={(e) => setSettingsStatusMsg(e.target.value)}
                  className="w-full bg-[#1F2937] text-white text-xs rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#374151]/50">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 bg-transparent text-gray-400 hover:text-white py-2 rounded-xl border border-[#374151] text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#6366F1] hover:bg-[#5053e1] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-950/40"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileSetup && (
        <div className="fixed inset-0 bg-[#0B0F19] z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleProfileSetupSubmit} className="bg-[#111827] border border-[#374151] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-white">Complete Your Profile</h1>
              <p className="text-sm text-gray-400">Please provide your full name and phone number to access the dashboard.</p>
            </div>

            {setupError && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{setupError}</p>
            )}

            <div className="space-y-1 opacity-60">
              <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Email (Read-only)</label>
              <input
                type="email"
                value={dbUser?.email || ""}
                disabled
                className="w-full bg-[#1F2937] text-gray-400 text-sm rounded-xl px-3 py-2 border border-[#374151] cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">First Name</label>
              <input
                type="text"
                value={setupFirstName}
                onChange={(e) => setSetupFirstName(e.target.value)}
                className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                required
                placeholder="John"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Middle Name (Optional)</label>
              <input
                type="text"
                value={setupMiddleName}
                onChange={(e) => setSetupMiddleName(e.target.value)}
                className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                placeholder="M."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Last Name</label>
              <input
                type="text"
                value={setupLastName}
                onChange={(e) => setSetupLastName(e.target.value)}
                className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                required
                placeholder="Doe"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                value={setupPhone}
                onChange={(e) => setSetupPhone(e.target.value)}
                className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                required
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <button
              type="submit"
              disabled={setupLoading}
              className="w-full bg-[#6366F1] hover:bg-[#5053e1] disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 mt-4"
            >
              {setupLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {setupLoading ? "Saving..." : "Enter Workspace"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              Sign Out instead
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
