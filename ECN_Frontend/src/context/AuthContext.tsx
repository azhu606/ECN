import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  
  // functions you MUST expose
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load user from localStorage on page load
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ecn_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsLoggedIn(true);
      }
    } catch {
      console.warn("Failed to parse stored user");
    }
  }, []);

  const login = (user: User) => {
    setUser(user);
    setIsLoggedIn(true);
    localStorage.setItem("ecn_user", JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("ecn_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
