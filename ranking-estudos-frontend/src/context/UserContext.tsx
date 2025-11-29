import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "../api/types";

interface UserContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = "ranking_estudos_user";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUserState(parsed);
      } catch {
        // ignora erro de parse
      }
    }
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
