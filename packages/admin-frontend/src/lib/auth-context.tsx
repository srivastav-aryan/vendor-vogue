"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminUser,
  clearAdminSession,
  getStoredAdminToken,
  getStoredAdminUser,
  saveAdminSession,
} from "./auth-storage";
import { clientApiFetch } from "./api-client";

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hydrate state from browser cookies/localStorage
    const storedToken = getStoredAdminToken();
    const storedUser = getStoredAdminUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: AdminUser) => {
    saveAdminSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      // Call backend logout to invalidate refresh session cookie
      await clientApiFetch("/api/auth/logout", {
        method: "POST",
      }).catch(() => {
        // Continue even if backend call fails
      });
    } finally {
      clearAdminSession();
      setToken(null);
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
