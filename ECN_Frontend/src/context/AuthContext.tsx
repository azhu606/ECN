import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  anonymousId: string;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [anonymousId, setAnonymousId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem('ecn_anonymous_id');
      if (existing) return existing;
      // prefer crypto.randomUUID when available
      const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `anon_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('ecn_anonymous_id', id);
      return id;
    } catch (e) {
      return `anon_${Math.random().toString(36).slice(2, 10)}`;
    }
  });

  useEffect(() => {
    // Placeholder: try to hydrate user from a global injected value or localStorage
    try {
      const ls = localStorage.getItem('ecn_user');
      if (ls) {
        setUser(JSON.parse(ls));
        return;
      }

      // Some backends may inject window.__ECN_USER__ at build/runtime
      const win = window as any;
      if (win && win.__ECN_USER__) {
        setUser(win.__ECN_USER__);
        localStorage.setItem('ecn_user', JSON.stringify(win.__ECN_USER__));
      }
    } catch (err) {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, anonymousId, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
