import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { Chat, Team, CalendarMeeting, CalendarTask, FileItem, ThreadReply, User, Message } from "@/lib/types";

interface DataState {
  chats: Chat[];
  teams: Team[];
  meetings: CalendarMeeting[];
  tasks: CalendarTask[];
  files: FileItem[];
  threadReplies: ThreadReply[];
  allUsers: User[];
  loading: boolean;
}

export const initialMockFiles: FileItem[] = [
  {
    id: "f-101",
    name: "apollo-design-system-spec-v3.pdf",
    type: "pdf",
    size: "4.2 MB",
    uploadedBy: "You",
    uploadedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    teamId: "team-1",
  },
  {
    id: "f-102",
    name: "sprint-roadmap-q3-financials.xlsx",
    type: "xls",
    size: "1.8 MB",
    uploadedBy: "Sarah Jenkins",
    uploadedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    teamId: "team-1",
  },
  {
    id: "f-103",
    name: "apollo-tokens-config.json",
    type: "code",
    size: "84.0 KB",
    uploadedBy: "You",
    uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "f-104",
    name: "q2-revenue-projections.csv",
    type: "xls",
    size: "520.0 KB",
    uploadedBy: "Marcus Chen",
    uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    teamId: "team-2",
  },
  {
    id: "f-105",
    name: "auth-middleware-jwt.ts",
    type: "code",
    size: "14.2 KB",
    uploadedBy: "Elena Rostova",
    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    teamId: "team-1",
  },
  {
    id: "f-106",
    name: "cloud-infrastructure-architecture.pdf",
    type: "pdf",
    size: "8.5 MB",
    uploadedBy: "David Kim",
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    teamId: "team-2",
  },
  {
    id: "f-107",
    name: "devops-k8s-prod-deployment.yaml",
    type: "code",
    size: "32.1 KB",
    uploadedBy: "You",
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    teamId: "team-1",
  },
  {
    id: "f-108",
    name: "security-audit-report-2026.pdf",
    type: "pdf",
    size: "6.1 MB",
    uploadedBy: "Sarah Jenkins",
    uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    teamId: "team-1",
  },
  {
    id: "f-109",
    name: "employee-onboarding-handbook.docx",
    type: "doc",
    size: "2.4 MB",
    uploadedBy: "You",
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "f-110",
    name: "database-schema-migrations.sql",
    type: "code",
    size: "45.0 KB",
    uploadedBy: "Marcus Chen",
    uploadedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    teamId: "team-1",
  },
  {
    id: "f-111",
    name: "marketing-campaign-metrics-2026.xlsx",
    type: "xls",
    size: "3.1 MB",
    uploadedBy: "You",
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    teamId: "team-2",
  },
  {
    id: "f-112",
    name: "app-layout-component-tree.md",
    type: "code",
    size: "18.5 KB",
    uploadedBy: "Elena Rostova",
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    teamId: "team-1",
  },
];

const initialState: DataState = {
  chats: [],
  teams: [],
  meetings: [],
  tasks: [],
  files: initialMockFiles,
  threadReplies: [],
  allUsers: [],
  loading: true,
};

export const fetchAllData = createAsyncThunk("data/fetchAll", async () => {
  const [teamsRes, chatsRes, meetingsRes, tasksRes, filesRes, usersRes] = await Promise.all([
    fetch("/api/teams"),
    fetch("/api/chats"),
    fetch("/api/meetings"),
    fetch("/api/tasks"),
    fetch("/api/files"),
    fetch("/api/users"),
  ]);

  const [teams, chats, meetings, tasks, files, users] = await Promise.all([
    teamsRes.ok ? teamsRes.json() : { teams: [] },
    chatsRes.ok ? chatsRes.json() : { chats: [] },
    meetingsRes.ok ? meetingsRes.json() : { meetings: [] },
    tasksRes.ok ? tasksRes.json() : { tasks: [] },
    filesRes.ok ? filesRes.json() : { files: [] },
    usersRes.ok ? usersRes.json() : { users: [] },
  ]);

  return {
    teams: teams.teams,
    chats: chats.chats,
    meetings: meetings.meetings,
    tasks: tasks.tasks,
    files: files.files,
    users: users.users,
  };
});

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setChats(state, action: PayloadAction<Chat[]>) {
      state.chats = action.payload;
    },
    setTeams(state, action: PayloadAction<Team[]>) {
      state.teams = action.payload;
    },
    addChat(state, action: PayloadAction<Chat>) {
      state.chats.unshift(action.payload);
    },
    addTeam(state, action: PayloadAction<Team>) {
      state.teams.push(action.payload);
    },
    addChannel(state, action: PayloadAction<{ teamId: string; channel: Team["channels"][0] }>) {
      const team = state.teams.find((t) => t.id === action.payload.teamId);
      if (team) team.channels.push(action.payload.channel);
    },
    addMessage(state, action: PayloadAction<{
      chatId?: string; channelId?: string; teamId?: string;
      message: Message;
      isMine?: boolean;
    }>) {
      const { chatId, channelId, message, isMine } = action.payload;
      if (chatId) {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat && !chat.messages.some(m => m.id === message.id)) {
          chat.messages.push(message);
          if (!isMine) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
          }
        }
      }
      if (channelId) {
        for (const team of state.teams) {
          for (const ch of team.channels) {
            if (ch.id === channelId && !ch.messages.some(m => m.id === message.id)) {
              ch.messages.push(message);
              if (!isMine) {
                ch.unreadCount = (ch.unreadCount || 0) + 1;
              }
            }
          }
        }
      }
    },
    markAsRead(state, action: PayloadAction<{ chatId?: string; channelId?: string }>) {
      const { chatId, channelId } = action.payload;
      if (chatId) {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) chat.unreadCount = 0;
      }
      if (channelId) {
        for (const team of state.teams) {
          const ch = team.channels.find(c => c.id === channelId);
          if (ch) ch.unreadCount = 0;
        }
      }
    },
    addReaction(state, action: PayloadAction<{
      messageId: string; chatId?: string; channelId?: string;
      emoji: string; userId: string;
    }>) {
      const apply = (msgs: Message[]) =>
        msgs.map((m) => {
          if (m.id !== action.payload.messageId) return m;
          const existing = m.reactions.find((r) => r.emoji === action.payload.emoji);
          if (existing) {
            if (existing.users.includes(action.payload.userId)) {
              const filtered = existing.users.filter((uid) => uid !== action.payload.userId);
              return {
                ...m,
                reactions: filtered.length === 0
                  ? m.reactions.filter((r) => r.emoji !== action.payload.emoji)
                  : m.reactions.map((r) =>
                      r.emoji === action.payload.emoji
                        ? { ...r, count: r.count - 1, users: filtered }
                        : r
                    ),
              };
            }
            return {
              ...m,
              reactions: m.reactions.map((r) =>
                r.emoji === action.payload.emoji
                  ? { ...r, count: r.count + 1, users: [...r.users, action.payload.userId] }
                  : r
              ),
            };
          }
          return {
            ...m,
            reactions: [...m.reactions, { emoji: action.payload.emoji, count: 1, users: [action.payload.userId] }],
          };
        });

      if (action.payload.chatId) {
        const chat = state.chats.find((c) => c.id === action.payload.chatId);
        if (chat) chat.messages = apply(chat.messages);
      }
      if (action.payload.channelId) {
        for (const team of state.teams) {
          for (const ch of team.channels) {
            if (ch.id === action.payload.channelId) {
              ch.messages = apply(ch.messages);
            }
          }
        }
      }
    },
    deleteMessage(state, action: PayloadAction<{ chatId?: string; channelId?: string; messageId: string }>) {
      const { chatId, channelId, messageId } = action.payload;
      if (chatId) {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) chat.messages = chat.messages.filter((m) => m.id !== messageId);
      }
      if (channelId) {
        for (const team of state.teams) {
          for (const ch of team.channels) {
            if (ch.id === channelId) {
              ch.messages = ch.messages.filter((m) => m.id !== messageId);
            }
          }
        }
      }
    },
    addReply(state, action: PayloadAction<ThreadReply>) {
      state.threadReplies.push(action.payload);
    },
    removeTeam(state, action: PayloadAction<string>) {
      state.teams = state.teams.filter((t) => t.id !== action.payload);
    },
    removeChannel(state, action: PayloadAction<{ teamId: string; channelId: string }>) {
      const team = state.teams.find((t) => t.id === action.payload.teamId);
      if (team) team.channels = team.channels.filter((ch) => ch.id !== action.payload.channelId);
    },
    addMeeting(state, action: PayloadAction<CalendarMeeting>) {
      state.meetings.push(action.payload);
    },
    addTask(state, action: PayloadAction<CalendarTask>) {
      state.tasks.push(action.payload);
    },
    updateTaskStatus(state, action: PayloadAction<{ taskId: string; status: string }>) {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) task.status = action.payload.status;
    },
    deleteTask(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    },
    setFiles(state, action: PayloadAction<FileItem[]>) {
      state.files = action.payload;
    },
    addFile(state, action: PayloadAction<FileItem>) {
      state.files.unshift(action.payload);
    },
    deleteFile(state, action: PayloadAction<string>) {
      state.files = state.files.filter((f) => f.id !== action.payload);
    },
    updateFile(state, action: PayloadAction<{ id: string; name?: string; type?: FileItem['type']; size?: string }>) {
      const f = state.files.find((file) => file.id === action.payload.id);
      if (f) {
        if (action.payload.name !== undefined) f.name = action.payload.name;
        if (action.payload.type !== undefined) f.type = action.payload.type;
        if (action.payload.size !== undefined) f.size = action.payload.size;
        f.lastModified = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllData.pending, (state) => { state.loading = true; })
      .addCase(fetchAllData.fulfilled, (state, action) => {
        state.teams = action.payload.teams;
        state.chats = action.payload.chats;
        state.meetings = action.payload.meetings;
        state.tasks = action.payload.tasks;
        const dbFiles = action.payload.files || [];
        const existingIds = new Set(dbFiles.map((f: any) => f.id));
        const nonDuplicateMocks = initialMockFiles.filter(f => !existingIds.has(f.id));
        state.files = [...dbFiles, ...nonDuplicateMocks];
        state.allUsers = action.payload.users;
        state.loading = false;
      })
      .addCase(fetchAllData.rejected, (state) => { state.loading = false; });
  },
});

export const {
  setChats, setTeams, addChat, addTeam, addChannel,
  addMessage, markAsRead, addReaction, deleteMessage, addReply,
  removeTeam, removeChannel,
  addMeeting, addTask, updateTaskStatus, deleteTask,
  setFiles, addFile, deleteFile, updateFile,
} = dataSlice.actions;
export default dataSlice.reducer;
