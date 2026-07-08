import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { Chat, Team, CalendarMeeting, FileItem, ThreadReply, User, Message } from "@/lib/types";

interface DataState {
  chats: Chat[];
  teams: Team[];
  meetings: CalendarMeeting[];
  files: FileItem[];
  threadReplies: ThreadReply[];
  allUsers: User[];
  loading: boolean;
}

const initialState: DataState = {
  chats: [],
  teams: [],
  meetings: [],
  files: [],
  threadReplies: [],
  allUsers: [],
  loading: true,
};

export const fetchAllData = createAsyncThunk("data/fetchAll", async () => {
  const [teamsRes, chatsRes, meetingsRes, filesRes, usersRes] = await Promise.all([
    fetch("/api/teams"),
    fetch("/api/chats"),
    fetch("/api/meetings"),
    fetch("/api/files"),
    fetch("/api/users"),
  ]);

  const [teams, chats, meetings, files, users] = await Promise.all([
    teamsRes.ok ? teamsRes.json() : { teams: [] },
    chatsRes.ok ? chatsRes.json() : { chats: [] },
    meetingsRes.ok ? meetingsRes.json() : { meetings: [] },
    filesRes.ok ? filesRes.json() : { files: [] },
    usersRes.ok ? usersRes.json() : { users: [] },
  ]);

  return {
    teams: teams.teams,
    chats: chats.chats,
    meetings: meetings.meetings,
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
    }>) {
      const { chatId, channelId, message } = action.payload;
      if (chatId) {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) chat.messages.push(message);
      }
      if (channelId) {
        for (const team of state.teams) {
          for (const ch of team.channels) {
            if (ch.id === channelId) {
              ch.messages.push(message);
            }
          }
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllData.pending, (state) => { state.loading = true; })
      .addCase(fetchAllData.fulfilled, (state, action) => {
        state.teams = action.payload.teams;
        state.chats = action.payload.chats;
        state.meetings = action.payload.meetings;
        state.files = action.payload.files;
        state.allUsers = action.payload.users;
        state.loading = false;
      })
      .addCase(fetchAllData.rejected, (state) => { state.loading = false; });
  },
});

export const {
  setChats, setTeams, addChat, addTeam, addChannel,
  addMessage, addReaction, deleteMessage, addReply,
  removeTeam, removeChannel,
} = dataSlice.actions;
export default dataSlice.reducer;
