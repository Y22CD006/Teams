"use client";

import { useState, useEffect, FormEvent, useCallback, useMemo } from "react";
import { Calendar, MessageSquare, HardDrive, Loader2, Search } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ListPanel } from "@/components/layout/list-panel";
import { ChatView } from "@/components/chat/chat-view";
import { ThreadPanel } from "@/components/messages/thread-panel";
import { CallWindow } from "@/components/calls/CallWindow";
import { IncomingCallModal } from "@/components/calls/IncomingCallModal";
import MeetingRoom from "@/components/meeting/MeetingRoom";
import { WorkspaceVoiceCall } from "@/components/calls/WorkspaceVoiceCall";
import { OutgoingCallModal } from "@/components/calls/OutgoingCallModal";
import { CalendarView } from "@/components/calendar/calendar-view";
import { FilesView } from "@/components/files/files-view";
import { PeopleView } from "@/components/people/people-view";
import type { Chat, Team, Channel, Message, ThreadReply, CalendarMeeting, CalendarTask, FileItem, Attachment, UserStatus } from "@/lib/types";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import {
  fetchCurrentUser, updateUser,
} from "@/lib/store/authSlice";
import {
  setActiveView, setActiveChatId, setActiveTeamId, setActiveChannelId,
  setActiveThreadParent, setActiveMeeting, setActiveFileView, setFileSearchQuery,
  setSelectedMeetingId, setShowSettingsModal, toggleTheme,
} from "@/lib/store/uiSlice";
import {
  fetchAllData, addChat, addMessage, addReaction, deleteMessage, addReply,
  addTeam, addChannel, removeTeam, removeChannel,
  addMeeting, addTask, markAsRead, addFile, deleteFile, updateFile
} from "@/lib/store/dataSlice";

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function Dashboard() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.ui.theme);
  const activeView = useAppSelector((s) => s.ui.activeView);
  const activeChatId = useAppSelector((s) => s.ui.activeChatId);
  const activeTeamId = useAppSelector((s) => s.ui.activeTeamId);
  const activeChannelId = useAppSelector((s) => s.ui.activeChannelId);
  const activeThreadParent = useAppSelector((s) => s.ui.activeThreadParent);
  const activeMeeting = useAppSelector((s) => s.ui.activeMeeting);
  const activeFileView = useAppSelector((s) => s.ui.activeFileView);
  const fileSearchQuery = useAppSelector((s) => s.ui.fileSearchQuery);
  const selectedMeetingId = useAppSelector((s) => s.ui.selectedMeetingId);
  const showSettingsModal = useAppSelector((s) => s.ui.showSettingsModal);
  const chats = useAppSelector((s) => s.data.chats);
  const teams = useAppSelector((s) => s.data.teams);
  const meetings = useAppSelector((s) => s.data.meetings);
  const tasks = useAppSelector((s) => s.data.tasks);
  const files = useAppSelector((s) => s.data.files);
  const threadReplies = useAppSelector((s) => s.data.threadReplies);
  const allUsers = useAppSelector((s) => s.data.allUsers);
  const loading = useAppSelector((s) => s.data.loading);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayStr);
  const [activityEvents, setActivityEvents] = useState<any[]>([]);
  const [activitySummary, setActivitySummary] = useState<{
    meetingsCount: number; filesCount: number; unreadCount: number;
  }>({ meetingsCount: 0, filesCount: 0, unreadCount: 0 });
  const [notifBadge, setNotifBadge] = useState(0);

  // Call States
  const [incomingCall, setIncomingCall] = useState<{ roomId: string; callerName: string; isVideo: boolean; callerId: string; isChannelCall?: boolean; channelName?: string; } | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<{ roomId: string; receiverName: string; isVideo: boolean; receiverId: string } | null>(null);
  const [activeCall, setActiveCall] = useState<{ roomId: string; otherUserName: string; otherUserId: string; isVideo: boolean; isCaller: boolean } | null>(null);
  const [meetingRoomDetails, setMeetingRoomDetails] = useState<{ token: string; serverUrl: string; meetingId: string } | null>(null);

  useEffect(() => {
    if (activeMeeting) {
      const fetchToken = async () => {
        try {
          const res = await fetch("/api/livekit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: activeMeeting.id })
          });
          if (res.ok) {
            const data = await res.json();
            setMeetingRoomDetails({
              token: data.token,
              serverUrl: data.url,
              meetingId: activeMeeting.id
            });
          }
        } catch (err) {
          console.error("Error fetching meeting room details:", err);
        }
      };
      fetchToken();
    } else {
      setMeetingRoomDetails(null);
    }
  }, [activeMeeting]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : { notifications: [] })
      .then((data) => setNotifBadge((data.notifications || []).filter((n: any) => !n.read).length));
  }, []);

  const chatUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0)
    + teams.reduce((acc, t) => acc + t.channels.reduce((sum, ch) => sum + ch.unreadCount, 0), 0);

  const todayMeetings = meetings.filter((m) => m.date === new Date().toISOString().split("T")[0]);

  const badges = {
    activity: notifBadge,
    chat: chatUnread,
    calendar: todayMeetings.length,
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      if (saved !== theme) dispatch(toggleTheme());
    }
    const savedView = localStorage.getItem("activeView");
    if (savedView) dispatch(setActiveView(savedView));
    const savedChat = localStorage.getItem("activeChatId");
    if (savedChat) dispatch(setActiveChatId(savedChat));
    const savedTeam = localStorage.getItem("activeTeamId");
    if (savedTeam) dispatch(setActiveTeamId(savedTeam));
    const savedChannel = localStorage.getItem("activeChannelId");
    if (savedChannel) dispatch(setActiveChannelId(savedChannel));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("activeView", activeView);
  }, [activeView]);

  useEffect(() => {
    if (activeChatId) localStorage.setItem("activeChatId", activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    if (activeTeamId) localStorage.setItem("activeTeamId", activeTeamId);
  }, [activeTeamId]);

  useEffect(() => {
    if (activeChannelId) localStorage.setItem("activeChannelId", activeChannelId);
  }, [activeChannelId]);

  // Global SSE listener for all chats and channels
  useEffect(() => {
    if (!currentUser) return;
    
    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.type && (msg.type.includes("CALL") || msg.type.startsWith("WEBRTC_"))) {
          if (msg.type === "INCOMING_CALL") {
            setIncomingCall({
              roomId: msg.roomId,
              callerName: msg.callerName,
              isVideo: msg.isVideo,
              callerId: msg.callerId,
            });
          } else if (msg.type === "INCOMING_CHANNEL_CALL") {
            setIncomingCall({
              roomId: msg.roomId,
              callerName: msg.callerName,
              isVideo: msg.isVideo,
              callerId: msg.callerId,
              isChannelCall: true,
              channelName: msg.payload?.channelName,
            });
          } else if (msg.type === "ACCEPT_CALL") {
            setOutgoingCall(null);
            setIncomingCall(null);
            if (!activeMeeting) {
              dispatch(setActiveMeeting({
                id: msg.roomId,
                title: `Call with ${msg.callerName || "User"}`,
                organizer: msg.callerName || "User",
                date: new Date().toISOString().split("T")[0],
                startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                endTime: "",
                description: "1-on-1 Call",
                attendees: [currentUser.name, msg.callerName || "User"],
                isLive: true,
                isVideo: msg.isVideo ?? true
              }));
            }
          } else if (msg.type === "REJECT_CALL") {
            setIncomingCall(null);
            setOutgoingCall(null);
            setActiveCall(null);
            if (activeMeeting?.id === msg.roomId) {
              dispatch(setActiveMeeting(null));
            }
          } else if (msg.type === "END_CALL") {
            setIncomingCall(null);
            setOutgoingCall(null);
            setActiveCall(null);
            if (msg.forEveryone === true && activeMeeting?.id === msg.roomId) {
              dispatch(setActiveMeeting(null));
            }
          } else if (msg.type.startsWith("WEBRTC_")) {
            const customEvent = new CustomEvent("webrtc-signal", { detail: msg });
            window.dispatchEvent(customEvent);
          }
          return;
        }

        if (msg.id) {
          const isDm = msg.dmId != null;
          const id = msg.dmId || msg.channelId;

          dispatch(addMessage({
            chatId: isDm ? id : undefined,
            channelId: !isDm ? id : undefined,
            message: msg,
            isMine: msg.senderId === currentUser.id,
          }));
        }
      } catch (err) {
        // Ping or unparseable messages
      }
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser, dispatch]);

  useEffect(() => {
    dispatch(fetchCurrentUser());
    dispatch(fetchAllData());
  }, [dispatch]);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setActivityEvents(data.events);
          setActivitySummary(data.summary);
        }
      });
  }, []);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const activeTeam = teams.find(t => t.id === activeTeamId) || null;
  const activeChannel = activeTeam?.channels.find(ch => ch.id === activeChannelId) || null;

  const [settingsRole, setSettingsRole] = useState("");
  const [settingsStatusMsg, setSettingsStatusMsg] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>("online");
  const [saving, setSaving] = useState(false);
  const [showNewChatPicker, setShowNewChatPicker] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");

  useEffect(() => {
    if (currentUser) {
      setSettingsRole(currentUser.role);
      setSettingsStatusMsg(currentUser.customStatus || "");
      setSelectedStatus(currentUser.status);
    }
  }, [currentUser]);

  const handleViewChange = (view: string) => {
    dispatch(setActiveView(view));
    if (view === "teams") {
      dispatch(setActiveChatId(null));
    }
    if (view !== "chat" && view !== "teams") {
      dispatch(setActiveThreadParent(null));
    }
  };

  const handleSelectChat = (id: string) => {
    dispatch(setActiveChatId(id));
    dispatch(setActiveChannelId(null));
    dispatch(setActiveView("chat"));
    dispatch(markAsRead({ chatId: id }));
    fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: id }),
    }).catch(e => console.error("Failed to mark chat as read", e));
  };

  const handleSelectChannel = (teamId: string, channelId: string) => {
    dispatch(setActiveChannelId(channelId));
    dispatch(setActiveChatId(null));
    dispatch(setActiveTeamId(teamId));
    dispatch(setActiveView("teams"));
    dispatch(markAsRead({ channelId }));
    fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    }).catch(e => console.error("Failed to mark channel as read", e));
  };

  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    if (!currentUser) return;

    if (activeView === "chat" && activeChatId) {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, dmId: activeChatId }),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(addMessage({ chatId: activeChatId, message: data.message, isMine: true }));
      }
    } else if (activeView === "teams" && activeTeamId && activeChannelId) {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channelId: activeChannelId }),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(addMessage({ channelId: activeChannelId, message: data.message, isMine: true }));
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
    if (activeView === "chat" && activeChatId) {
      dispatch(deleteMessage({ chatId: activeChatId, messageId }));
    } else if (activeView === "teams" && activeTeamId && activeChannelId) {
      dispatch(deleteMessage({ channelId: activeChannelId, messageId }));
    }
  };

  const handleSendReply = (parentMessageId: string, content: string) => {
    if (!currentUser) return;
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
    dispatch(addReply(newReply));
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    await fetch(`/api/messages/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    dispatch(addReaction({
      messageId,
      emoji,
      userId: currentUser.id,
      chatId: activeView === "chat" ? activeChatId || undefined : undefined,
      channelId: activeView === "teams" ? activeChannelId || undefined : undefined,
    }));
  };

  const handleStartCall = async (isVideo: boolean) => {
      if (!currentUser) return;

      if (activeView === "teams" && activeChannel && activeTeam) {
        dispatch(setActiveMeeting({
          id: activeChannel.id,
          title: `# ${activeChannel.name}`,
          organizer: currentUser.name,
          date: new Date().toISOString().split("T")[0],
          startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime: "",
          description: "Channel Meeting",
          attendees: [currentUser.name],
          isLive: true,
          isVideo: isVideo
        }));
        
        // Broadcast the channel call to teammates
        fetch("/api/calls/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "INCOMING_CHANNEL_CALL",
            teamId: activeTeam.id,
            roomId: activeChannel.id,
            isVideo: isVideo,
            callerName: currentUser.name,
            payload: { channelName: activeChannel.name }
          })
        }).catch(err => console.error("Failed to broadcast channel call:", err));
        
        return;
      }
      
      if (!activeChatId) return; // Only allow calling in 1-1 chats
      
      const otherUser = activeChat?.participants.find(p => p.id !== currentUser.id);
      if (!otherUser) return;
  
      const roomId = `call_${currentUser.id}_${otherUser.id}_${Date.now()}`;
      
      dispatch(setActiveMeeting({
        id: roomId,
        title: `Call with ${otherUser.name}`,
        organizer: currentUser.name,
        date: new Date().toISOString().split("T")[0],
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: "",
        description: "1-on-1 Call",
        attendees: [currentUser.name, otherUser.name],
        isLive: true,
        isVideo: isVideo
      }));
  
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INCOMING_CALL",
          receiverId: otherUser.id,
          roomId,
          isVideo,
          callerName: currentUser.name,
        })
      });
  };

  const handleAcceptCall = async () => {
    if (!incomingCall || !currentUser) return;
    
    if (incomingCall.isChannelCall) {
      dispatch(setActiveMeeting({
        id: incomingCall.roomId,
        title: `# ${incomingCall.channelName || "Channel"}`,
        organizer: incomingCall.callerName,
        date: new Date().toISOString().split("T")[0],
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: "",
        description: "Channel Meeting",
        attendees: [currentUser.name, incomingCall.callerName],
        isLive: true,
        isVideo: incomingCall.isVideo
      }));
      setIncomingCall(null);
      return;
    }
    
    const receiverId = incomingCall.callerId;
    const roomId = incomingCall.roomId;
    const isVideo = incomingCall.isVideo;
    const callerName = incomingCall.callerName;

    try {
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ACCEPT_CALL",
          receiverId,
          roomId,
          callerName: currentUser.name,
          isVideo,
        })
      });
    } catch (err) {
      console.error("Failed to send ACCEPT_CALL handshake:", err);
    }

    dispatch(setActiveMeeting({
      id: roomId,
      title: `Call with ${callerName}`,
      organizer: callerName,
      date: new Date().toISOString().split("T")[0],
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: "",
      description: "1-on-1 Call",
      attendees: [currentUser.name, callerName],
      isLive: true,
      isVideo,
    }));
    
    setIncomingCall(null);
  };

  const handleRejectCall = async () => {
    if (!incomingCall || !currentUser) return;
    
    const receiverId = incomingCall.callerId;
    const roomId = incomingCall.roomId;
    setIncomingCall(null);

    await fetch("/api/calls/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "REJECT_CALL",
        receiverId,
        roomId,
      })
    });
  };

  const handleJoinMeeting = async (meeting: CalendarMeeting) => {
    if (meeting.roomName) {
      try {
        const res = await fetch("/api/livekit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: meeting.roomName }),
        });
        if (res.ok) {
          const data = await res.json();
          dispatch(setActiveMeeting({
            ...meeting,
            token: data.token,
            serverUrl: data.url,
          }));
          return;
        }
      } catch (e) {
        console.error("Failed to join meeting:", e);
      }
    }
    dispatch(setActiveMeeting(meeting));
  };

  const handleLeaveCall = async () => {
    if (!currentUser) return;
    
    const roomId = activeCall?.roomId || outgoingCall?.roomId || incomingCall?.roomId;
    const targetUserId = activeCall?.otherUserId || outgoingCall?.receiverId || incomingCall?.callerId;

    setIncomingCall(null);
    setOutgoingCall(null);
    setActiveCall(null);

    if (roomId && targetUserId) {
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "END_CALL",
          receiverId: targetUserId,
          roomId,
        })
      }).catch(err => console.error("Error sending END_CALL signal:", err));
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await dispatch(updateUser({
      status: selectedStatus,
      role: settingsRole,
      customStatus: settingsStatusMsg,
    }));
    setSaving(false);
    dispatch(setShowSettingsModal(false));
  };

  const handleDialCall = async (user: any, isVideo: boolean) => {
    if (!currentUser) return;
    
    const roomId = `call_${currentUser.id}_${user.id}_${Date.now()}`;
    
    setOutgoingCall({
      roomId,
      receiverName: user.name,
      isVideo,
      receiverId: user.id,
    });

    await fetch("/api/calls/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "INCOMING_CALL",
        receiverId: user.id,
        roomId,
        isVideo,
        callerName: currentUser.name,
      })
    });
  };

  const handleAddMeeting = async (meetDetails: Omit<CalendarMeeting, "id">) => {
    const startDateTime = `${meetDetails.date}T${meetDetails.startTime}:00`;
    const endDateTime = `${meetDetails.date}T${meetDetails.endTime}:00`;

    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: meetDetails.title,
        description: meetDetails.description,
        startTime: startDateTime,
        endTime: endDateTime,
        attendees: meetDetails.attendees,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Failed to create meeting");
    }

    const data = await res.json();
    const newMeet: CalendarMeeting = {
      id: data.event.id,
      ...meetDetails,
    };
    dispatch(addMeeting(newMeet));
  };

  const handleAddTask = async (taskDetails: { title: string; description: string; priority: string; dueDate: string; dueTime?: string }) => {
    const firstTeam = teams[0];

    const dueDateTime = taskDetails.dueTime
      ? `${taskDetails.dueDate}T${taskDetails.dueTime}:00`
      : `${taskDetails.dueDate}T12:00:00`;

    console.log("[dashboard handleAddTask] Submitting task:", taskDetails);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: taskDetails.title,
        description: taskDetails.description,
        priority: taskDetails.priority,
        dueDate: dueDateTime,
        teamId: firstTeam?.id || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Failed to create task");
    }

    const data = await res.json();
    const newTask: CalendarTask = {
      id: data.task.id,
      title: data.task.title,
      date: taskDetails.dueDate,
      time: taskDetails.dueTime,
      status: data.task.status,
      priority: data.task.priority,
      assigneeName: null,
    };
    dispatch(addTask(newTask));
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const res = await fetch(`/api/meetings/${meetingId}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      const newTask: CalendarTask = {
        id: data.task.id,
        title: data.task.title,
        date: taskDetails.dueDate,
        time: taskDetails.dueTime,
        status: data.task.status,
        priority: data.task.priority,
        assigneeName: null,
      };
      console.log("[dashboard handleAddTask] Task saved successfully, dispatching to Redux store:", newTask);
      dispatch(addTask(newTask));
    } else {
      console.error("[dashboard handleAddTask] Failed to save task:", res.statusText);
    }
  };

  const handleUploadFile = (name: string, type: FileItem["type"], size: string) => {
    const newFile: FileItem = {
      id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      type,
      size,
      uploadedBy: currentUser?.name || "You",
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      teamId: activeTeamId || "team-1",
    };
    dispatch(addFile(newFile));

    fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, size }),
    }).catch((err) => console.error("Error saving file:", err));
  };

  const handleDeleteFile = (fileId: string) => {
    dispatch(deleteFile(fileId));

    fetch("/api/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: fileId }),
    }).catch((err) => console.error("Error deleting file:", err));
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    dispatch(updateFile({ id: fileId, name: newName }));

    fetch("/api/files", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: fileId, name: newName }),
    }).catch((err) => console.error("Error renaming file:", err));
  };

  const handleNewChatTrigger = () => {
    setShowNewChatPicker(true);
  };

  const handleStartNewChat = async (otherUserId: string) => {
    if (!currentUser) return;
    setShowNewChatPicker(false);
    setNewChatSearch("");

    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId }),
    });

    if (res.ok) {
      const data = await res.json();
      const chat: Chat = {
        id: data.chat.id,
        name: data.chat.name,
        type: data.chat.type,
        participants: data.chat.participants,
        unreadCount: 0,
        messages: data.chat.messages.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName,
          senderAvatar: m.senderAvatar,
          content: m.content,
          timestamp: m.timestamp,
          reactions: m.reactions,
          replyCount: m.replyCount,
        })),
      };
      dispatch(addChat(chat));
      dispatch(setActiveChatId(chat.id));
      dispatch(setActiveView("chat"));
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div id="enterprise-workspace-canvas" className="w-full h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex overflow-hidden font-sans">
      <SidebarNav
        activeView={activeView}
        onViewChange={handleViewChange}
        currentUser={currentUser}
        onOpenSettings={() => dispatch(setShowSettingsModal(true))}
        theme={theme}
        onToggleTheme={() => dispatch(toggleTheme())}
        badges={badges}
      />

      {meetingRoomDetails ? (
        activeMeeting?.isVideo === false ? (
          <WorkspaceVoiceCall
            token={meetingRoomDetails.token}
            serverUrl={meetingRoomDetails.serverUrl}
            roomId={meetingRoomDetails.meetingId}
            channelName={activeMeeting.title?.replace(/^#\s*/, "") || activeChannel?.name}
            onLeave={() => {
              dispatch(setActiveMeeting(null));
              setMeetingRoomDetails(null);
            }}
            isHost={activeMeeting.organizer === currentUser?.name}
          />
        ) : (
          <MeetingRoom
            token={meetingRoomDetails.token}
            serverUrl={meetingRoomDetails.serverUrl}
            meetingId={meetingRoomDetails.meetingId}
          />
        )
      ) : activeCall ? (
        <CallWindow
          roomId={activeCall.roomId}
          isCaller={activeCall.isCaller}
          isVideo={activeCall.isVideo}
          onEndCall={handleLeaveCall}
          otherUserName={activeCall.otherUserName}
          otherUserId={activeCall.otherUserId}
        />
      ) : (
        <>
          <ListPanel
            activeView={activeView}
            chats={chats}
            teams={teams}
            activeChatId={activeChatId}
            activeChannelId={activeChannelId}
            files={files}
            currentUserId={currentUser.id}
            allUsers={allUsers}
            onSelectChat={handleSelectChat}
            onSelectChannel={handleSelectChannel}
            onSelectFileView={(v) => dispatch(setActiveFileView(v))}
            activeFileView={activeFileView}
            fileSearchQuery={fileSearchQuery}
            onSearchFile={(query) => dispatch(setFileSearchQuery(query))}
            onJoinMeeting={handleJoinMeeting}
            onNewChat={handleNewChatTrigger}
            onNewMeeting={() => dispatch(setActiveView("calendar"))}
            onDialCall={handleDialCall}
            meetings={meetings}
            tasks={tasks}
            selectedCalendarDate={selectedCalendarDate}
            onAddMeeting={handleAddMeeting}
            onAddTask={handleAddTask}
            onDeleteMeeting={handleDeleteMeeting}
            onDeleteTask={handleDeleteTask}
            onJoinMeeting={handleJoinMeeting}
            selectedMeetingId={selectedMeetingId}
          />

          <div id="main-content-canvas" className="flex-1 flex overflow-hidden min-w-0 h-full relative">
            {(activeView === "chat" || activeView === "teams") && (
              <ChatView
                currentUser={currentUser}
                activeChat={activeChat}
                activeTeam={activeTeam}
                activeChannel={activeChannel}
                onSendMessage={handleSendMessage}
                onOpenThread={(m) => dispatch(setActiveThreadParent(m))}
                onAddReaction={handleAddReaction}
                onStartCall={handleStartCall}
                onJoinMeeting={({ roomName }) => handleJoinMeeting({ roomName } as CalendarMeeting)}
                onDeleteMessage={handleDeleteMessage}
              />
            )}

            {activeView === "calendar" && (
              <CalendarView
                meetings={meetings}
                tasks={tasks}
                selectedDateStr={selectedCalendarDate}
                onDateSelect={setSelectedCalendarDate}
              />
            )}

            {activeView === "files" && (
              <FilesView
                files={files}
                activeFileView={activeFileView}
                fileSearchQuery={fileSearchQuery}
                onSearchFile={(query) => dispatch(setFileSearchQuery(query))}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
                onUploadFile={handleUploadFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
              />
            )}{activeView === "people" && (
              <PeopleView currentUserId={currentUser.id} />
            )}

            {activeView === "activity" && (
              <div className="flex-1 bg-[var(--bg-primary)] p-8 md:p-12 overflow-y-auto flex flex-col justify-start h-full">
                <div className="max-w-4xl w-full mx-auto space-y-8">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                      Welcome back, {currentUser.name}
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Here is an overview of your team&apos;s workspace activity today.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col justify-between h-[160px] group hover:border-gray-500 transition-all duration-200">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--text-secondary)] font-mono uppercase tracking-wider">Schedule</span>
                          <Calendar className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-3">{activitySummary.meetingsCount} Meetings</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">On your calendar</p>
                      </div>
                      <button
                        onClick={() => dispatch(setActiveView("calendar"))}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold text-left flex items-center gap-1 group/btn mt-4 cursor-pointer"
                      >
                        View Calendar &rarr;
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col justify-between h-[160px] group hover:border-gray-500 transition-all duration-200">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--text-secondary)] font-mono uppercase tracking-wider">Unreads</span>
                          <MessageSquare className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-3">
                          {activitySummary.unreadCount} Messages
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Awaiting your response</p>
                      </div>
                      <button
                        onClick={() => dispatch(setActiveView("chat"))}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold text-left flex items-center gap-1 group/btn mt-4 cursor-pointer"
                      >
                        Open Chats &rarr;
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col justify-between h-[160px] group hover:border-gray-500 transition-all duration-200">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--text-secondary)] font-mono uppercase tracking-wider">Shared Space</span>
                          <HardDrive className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-3">{activitySummary.filesCount} Shared Files</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">In your workspace</p>
                      </div>
                      <button
                        onClick={() => dispatch(setActiveView("files"))}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold text-left flex items-center gap-1 group/btn mt-4 cursor-pointer"
                      >
                        Access files &rarr;
                      </button>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Recent Live Activity</h3>
                    <div className="h-[1px] bg-[#374151]/50" />

                    <div className="space-y-3.5">
                      {activityEvents.length === 0 && (
                        <p className="text-xs text-[var(--text-secondary)]">No recent activity yet. Start collaborating to see events here.</p>
                      )}
                      {activityEvents.map((ev) => {
                        const colorMap: Record<string, string> = {
                          message_sent: "bg-indigo-500",
                          file_uploaded: "bg-emerald-500",
                          meeting_created: "bg-amber-500",
                          friend_accepted: "bg-rose-500",
                          status_changed: "bg-blue-500",
                          team_joined: "bg-violet-500",
                          channel_created: "bg-cyan-500",
                        };
                        const labelMap: Record<string, string> = {
                          message_sent: "sent a message",
                          file_uploaded: `uploaded "${ev.metadata?.fileName || "a file"}"`,
                          meeting_created: "created a meeting",
                          friend_accepted: `connected with ${ev.metadata?.friendName || "someone"}`,
                          status_changed: "updated their status",
                          team_joined: "joined a team",
                          channel_created: "created a channel",
                        };
                        const dotColor = colorMap[ev.type] || "bg-gray-500";
                        const label = labelMap[ev.type] || ev.type.replace(/_/g, " ");
                        const timeAgo = formatTimeAgo(ev.createdAt);
                        return (
                          <div key={ev.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                              <span className="text-[var(--text-primary)]">{ev.userName} {label}</span>
                            </div>
                            <span className="text-gray-500 font-mono">{timeAgo}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === "settings" && (
              <div className="flex-1 bg-[var(--bg-primary)] p-8 overflow-y-auto max-w-3xl mx-auto flex flex-col justify-center">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">General User Profile Preferences</h3>
                  <div className="h-[1px] bg-[#374151]/50" />
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--text-secondary)]">Username: <span className="text-[var(--text-primary)] font-bold">{currentUser.name}</span></p>
                    <p className="text-xs text-[var(--text-secondary)]">Role: <span className="text-[var(--text-primary)] font-bold">{currentUser.role}</span></p>
                    <p className="text-xs text-[var(--text-secondary)]">Status message: <span className="text-indigo-300 italic">{currentUser.customStatus || "Not set"}</span></p>
                  </div>
                  <button
                    onClick={() => dispatch(setShowSettingsModal(true))}
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
                onClose={() => dispatch(setActiveThreadParent(null))}
                onSendReply={handleSendReply}
                onAddReaction={handleAddReaction}
              />
            )}
          </div>
        </>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="h-12 bg-[var(--bg-tertiary)] px-4 flex items-center justify-between border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Edit Profile & Workspace Status</h3>
              <button
                onClick={() => dispatch(setShowSettingsModal(false))}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Presence Status</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["online", "busy", "away", "offline"] as UserStatus[]).map((st) => {
                    const active = selectedStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold uppercase border tracking-wider transition-all ${
                          active
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                            : "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Enterprise Title / Role</label>
                <input
                  type="text"
                  value={settingsRole}
                  onChange={(e) => setSettingsRole(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Custom status description</label>
                <input
                  type="text"
                  placeholder="Coding a beautiful Teams clone..."
                  value={settingsStatusMsg}
                  onChange={(e) => setSettingsStatusMsg(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--border-color)] flex-wrap">
                <button
                  type="button"
                  onClick={() => dispatch(setShowSettingsModal(false))}
                  className="flex-1 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#6366F1] hover:bg-[#5053e1] disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-950/40 flex items-center justify-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.cookie = "mock_userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    window.location.href = "/login";
                  }}
                  className="w-full mt-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewChatPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="h-12 bg-[var(--bg-tertiary)] px-4 flex items-center justify-between border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">New Chat</h3>
              <button onClick={() => { setShowNewChatPicker(false); setNewChatSearch(""); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-lg">&times;</button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-gray-500 text-xs rounded-xl pl-9 pr-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-3 pb-3 max-h-72 overflow-y-auto space-y-0.5">
              {allUsers
                .filter((u) => u.id !== currentUser?.id)
                .filter((u) => !newChatSearch || u.name.toLowerCase().includes(newChatSearch.toLowerCase()))
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartNewChat(u.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#374151] text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
                      {u.avatar || u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{u.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {incomingCall && !activeCall && (
        <IncomingCallModal 
          callerName={incomingCall.callerName}
          isVideo={incomingCall.isVideo}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          isChannelCall={incomingCall.isChannelCall}
          channelName={incomingCall.channelName}
        />
      )}

      {outgoingCall && !activeCall && (
        <OutgoingCallModal
          receiverName={outgoingCall.receiverName}
          isVideo={outgoingCall.isVideo}
          onCancel={handleLeaveCall}
        />
      )}
    </div>
  );
}
