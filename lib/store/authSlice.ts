import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { User, UserStatus } from "@/lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async () => {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Unauthorized");
  const data = await res.json();
  const u = data.user;
  const statusMap: Record<string, UserStatus> = {
    AVAILABLE: "online", BUSY: "busy", AWAY: "away", OFFLINE: "offline",
  };
  return {
    id: u.id,
    name: u.name || u.email,
    avatar: (u.name || u.email).charAt(0).toUpperCase(),
    role: u.role || "",
    status: statusMap[u.status] || "offline",
    email: u.email,
    customStatus: u.customStatus || "",
  } as User;
});

export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (payload: { status?: string; role?: string; customStatus?: string }) => {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const u = data.user;
    const statusMap: Record<string, UserStatus> = {
      AVAILABLE: "online", BUSY: "busy", AWAY: "away", OFFLINE: "offline",
    };
    return {
      id: u.id,
      name: u.name || u.email,
      avatar: (u.name || u.email).charAt(0).toUpperCase(),
      role: u.role || "",
      status: statusMap[u.status] || "offline",
      email: u.email,
      customStatus: u.customStatus || "",
    } as User;
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load user";
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
