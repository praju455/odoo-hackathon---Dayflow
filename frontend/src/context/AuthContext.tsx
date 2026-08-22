"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "EMPLOYEE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  loginId: string;
  role: UserRole;
  mustChangePassword: boolean;
  // These fields are NOT returned by POST /api/auth/login (confirmed from auth.js).
  // They are populated later if fetched via GET /api/users/me.
  companyId?: string;
  department?: string;
  jobTitle?: string;
  profilePictureUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;            // true while reading localStorage on mount
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void; // used after password-change clears the flag
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "dayflow_token";
const USER_KEY  = "dayflow_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState]   = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on first mount (client-side only)
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setTokenState(storedToken);
        setUserState(JSON.parse(storedUser) as AuthUser);
      }
    } catch {
      // Corrupt storage — just start fresh
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setTokenState(newToken);
    setUserState(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUserState(null);
  }, []);

  // Update the in-memory user AND keep localStorage in sync (e.g. after password change)
  const setUser = useCallback((updated: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUserState(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
