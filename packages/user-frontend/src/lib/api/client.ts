"use client";

import { env } from "@/lib/env";

/**
 * Standard API Error wrapper with status code and payload details.
 */
export class ApiClientError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

/**
 * Subscribe a failed request callback to retry when token refresh finishes.
 */
function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Notify all pending requests of new token or refresh failure.
 */
function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Sets the current in-memory access token.
 */
export function setClientAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Gets the current in-memory access token.
 */
export function getClientAccessToken(): string | null {
  return accessToken;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Core HTTP client for client-side API requests.
 * Automatically injects Bearer token, handles silent refresh on 401s,
 * and maintains cookie credentials for session continuity.
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  let url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.append(k, String(v));
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // essential for HTTP-only refresh cookies
  };

  const response = await fetch(url, fetchOptions);

  // If response is 401 and request was not already a refresh or skipAuth attempt
  if (response.status === 401 && !options.skipAuth && !endpoint.includes("/api/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!refreshResponse.ok) {
          throw new Error("Session expired");
        }

        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData?.data?.accessToken || null;

        setClientAccessToken(newAccessToken);
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        if (!newAccessToken) {
          throw new Error("No token returned on refresh");
        }

        // Retry current failed request with new token
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        const retryRes = await fetch(url, { ...fetchOptions, headers });
        if (!retryRes.ok) {
          const errData = await retryRes.json().catch(() => ({}));
          throw new ApiClientError(
            errData.message || `Request failed with status ${retryRes.status}`,
            retryRes.status,
            errData
          );
        }
        return retryRes.json();
      } catch (refreshErr) {
        isRefreshing = false;
        setClientAccessToken(null);
        onTokenRefreshed(null);
        throw new ApiClientError("Authentication expired", 401);
      }
    }

    // If refresh is already in progress, wait for completion
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken) => {
        if (!newToken) {
          return reject(new ApiClientError("Authentication expired", 401));
        }
        headers.set("Authorization", `Bearer ${newToken}`);
        fetch(url, { ...fetchOptions, headers })
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              return reject(
                new ApiClientError(
                  errData.message || `Request failed with status ${res.status}`,
                  res.status,
                  errData
                )
              );
            }
            return resolve(res.json());
          })
          .catch(reject);
      });
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiClientError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Convenience helper methods
 */
apiClient.get = <T = any>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, { ...options, method: "GET" });

apiClient.post = <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

apiClient.put = <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

apiClient.delete = <T = any>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, { ...options, method: "DELETE" });
