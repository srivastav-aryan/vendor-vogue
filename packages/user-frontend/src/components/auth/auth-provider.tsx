"use client";

import * as React from "react";
import { useAuthStore } from "@/lib/store/auth-store";

/**
 * Initializes authentication state silently on mount.
 * Checks for valid refresh session and hydrates the user profile without UI blocking.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
