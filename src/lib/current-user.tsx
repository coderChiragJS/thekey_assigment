"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_USERS, type Auth, type DemoUser } from "./demo-users";

interface CurrentUserValue {
  user: DemoUser;
  auth: Auth;
  users: DemoUser[];
  setUserId: (id: string) => void;
}

const CurrentUserContext = createContext<CurrentUserValue | null>(null);
const STORAGE_KEY = "forum.currentUserId";

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && DEMO_USERS.some((u) => u.id === stored)) return stored;
    }
    return DEMO_USERS[0]!.id;
  });

  const setUserId = useCallback((id: string) => {
    setUserIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const value = useMemo<CurrentUserValue>(() => {
    const user = DEMO_USERS.find((u) => u.id === userId) ?? DEMO_USERS[0]!;
    return {
      user,
      auth: { userId: user.id, role: user.role },
      users: DEMO_USERS,
      setUserId,
    };
  }, [userId, setUserId]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return ctx;
}
