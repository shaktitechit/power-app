import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
interface User {
  userId: string;
  name: string;
  role: "admin" | "auditor";
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Safe localStorage access
const getUserFromStorage = (): User | null => {
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
    setCredentials: (state, action: PayloadAction<User>) => {
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