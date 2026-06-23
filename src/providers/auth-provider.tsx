"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { login as loginRequest } from "@/lib/auth/auth-api";
import { type Session, sessionFromToken } from "@/lib/auth/jwt";
import { persistToken, removeToken } from "@/lib/auth/token";

type AuthContextValue = {
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  /** Session resolved on the server from the token cookie (avoids a flash). */
  initialSession: Session | null;
  children: ReactNode;
};

export function AuthProvider({
  initialSession,
  children,
}: Readonly<AuthProviderProps>) {
  const [session, setSession] = useState<Session | null>(initialSession);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, expiresIn } = await loginRequest(email, password);
    const nextSession = sessionFromToken(accessToken);
    if (!nextSession) {
      throw new Error("O token recebido é inválido.");
    }
    persistToken(accessToken, expiresIn);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: session !== null, login, logout }),
    [session, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
