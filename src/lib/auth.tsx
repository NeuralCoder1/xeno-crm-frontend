"use client";

import { createContext, useContext, useState, useCallback, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

function getTokenSnapshot(): string | null {
  return localStorage.getItem("xeno_token");
}
function getServerSnapshot(): string | null {
  return null;
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const externalToken = useSyncExternalStore(subscribe, getTokenSnapshot, getServerSnapshot);
  const [internalToken, setInternalToken] = useState<string | null>(null);
  const token = internalToken ?? externalToken;

  const login = useCallback((t: string) => {
    localStorage.setItem("xeno_token", t);
    setInternalToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("xeno_token");
    setInternalToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    router.replace("/login");
  }

  return isAuthenticated;
}
