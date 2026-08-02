"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type UserState =
  | { state: "logged_out" }
  | { state: "not_in_server"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "whitelisted"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "needs_apply"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "needs_checkin"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "banned"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "blacklisted"; user: { id: string; username: string; avatar: string }; isStaff: boolean };

interface AuthContextType {
  status: UserState;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  status: { state: "logged_out" },
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<UserState>({ state: "logged_out" });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ state: "logged_out" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchStatus();
    };
    const onFocus = () => fetchStatus();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchStatus]);

  return (
    <AuthContext.Provider value={{ status, loading, refresh: fetchStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
