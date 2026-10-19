import { CONFIG } from "./config";

export interface AdminUser {
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  permissions: string[];
}

/**
 * Get cookie value by name in browser context
 */
export function getBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Set cookie value in browser context
 */
export function setBrowserCookie(name: string, value: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Delete cookie in browser context
 */
export function deleteBrowserCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Save auth session to browser cookies and localStorage
 */
export function saveAdminSession(token: string, user: AdminUser) {
  setBrowserCookie(CONFIG.TOKEN_COOKIE_NAME, token);
  setBrowserCookie(CONFIG.USER_COOKIE_NAME, JSON.stringify(user));
  if (typeof window !== "undefined") {
    localStorage.setItem(CONFIG.TOKEN_COOKIE_NAME, token);
    localStorage.setItem(CONFIG.USER_COOKIE_NAME, JSON.stringify(user));
  }
}

/**
 * Clear auth session
 */
export function clearAdminSession() {
  deleteBrowserCookie(CONFIG.TOKEN_COOKIE_NAME);
  deleteBrowserCookie(CONFIG.USER_COOKIE_NAME);
  if (typeof window !== "undefined") {
    localStorage.removeItem(CONFIG.TOKEN_COOKIE_NAME);
    localStorage.removeItem(CONFIG.USER_COOKIE_NAME);
  }
}

/**
 * Get stored admin user in browser context
 */
export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const cookieUser = getBrowserCookie(CONFIG.USER_COOKIE_NAME);
  if (cookieUser) {
    try {
      return JSON.parse(cookieUser);
    } catch {
      // fallback to localStorage
    }
  }
  const localUser = localStorage.getItem(CONFIG.USER_COOKIE_NAME);
  if (localUser) {
    try {
      return JSON.parse(localUser);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get stored admin token in browser context
 */
export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return getBrowserCookie(CONFIG.TOKEN_COOKIE_NAME) || localStorage.getItem(CONFIG.TOKEN_COOKIE_NAME);
}
