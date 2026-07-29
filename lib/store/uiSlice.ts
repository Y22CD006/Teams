import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Message, CalendarMeeting } from "@/lib/types";

interface UiState {
  theme: "dark" | "light";
  activeView: string;
  activeChatId: string | null;
  activeTeamId: string | null;
  activeChannelId: string | null;
  activeThreadParent: Message | null;
  activeMeeting: CalendarMeeting | null;
  activeFileView: string;
  fileSearchQuery: string;
  selectedMeetingId: string | null;
  showSettingsModal: boolean;
}

const initialState: UiState = {
  theme: "dark",
  activeView: "chat",
  activeChatId: null,
  activeTeamId: null,
  activeChannelId: null,
  activeThreadParent: null,
  activeMeeting: null,
  activeFileView: "f-recents",
  fileSearchQuery: "",
  selectedMeetingId: null,
  showSettingsModal: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<"dark" | "light">) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    setActiveView(state, action: PayloadAction<string>) {
      state.activeView = action.payload;
    },
    setActiveChatId(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload;
    },
    setActiveTeamId(state, action: PayloadAction<string | null>) {
      state.activeTeamId = action.payload;
    },
    setActiveChannelId(state, action: PayloadAction<string | null>) {
      state.activeChannelId = action.payload;
    },
    setActiveThreadParent(state, action: PayloadAction<Message | null>) {
      state.activeThreadParent = action.payload;
    },
    setActiveMeeting(state, action: PayloadAction<CalendarMeeting | null>) {
      state.activeMeeting = action.payload;
    },
    setActiveFileView(state, action: PayloadAction<string>) {
      state.activeFileView = action.payload;
    },
    setFileSearchQuery(state, action: PayloadAction<string>) {
      state.fileSearchQuery = action.payload;
    },
    setSelectedMeetingId(state, action: PayloadAction<string | null>) {
      state.selectedMeetingId = action.payload;
    },
    setShowSettingsModal(state, action: PayloadAction<boolean>) {
      state.showSettingsModal = action.payload;
    },
  },
});

export const {
  setTheme, toggleTheme,
  setActiveView, setActiveChatId, setActiveTeamId, setActiveChannelId,
  setActiveThreadParent, setActiveMeeting, setActiveFileView, setFileSearchQuery,
  setSelectedMeetingId, setShowSettingsModal,
} = uiSlice.actions;
export default uiSlice.reducer;
