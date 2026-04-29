import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppUserRole } from "@/lib/authRoles";

type PermissionScope = "all" | "assigned" | "own" | "none";

export interface UserPermission {
  resource: string;
  actions: string[];
  scope: PermissionScope;
}

// Types (login returns `_id`; some paths use `userId`)
export interface AuthUser {
  userId?: string;
  _id?: string;
  name: string;
  email?: string;
  role: AppUserRole;
  permissions?: UserPermission[];
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Safe localStorage access
const getUserFromStorage = (): AuthUser | null => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("userInfo");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

// Initial state
const initialState: AuthState = {
  user: getUserFromStorage(),
  loading: false,
  error: null,
};

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("userInfo", JSON.stringify(action.payload));

        const expirationTime =
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000;

        localStorage.setItem("expirationTime", expirationTime.toString());
      }
    },

    logout: (state) => {
      state.user = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("expirationTime");
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;