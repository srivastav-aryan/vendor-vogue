import "server-only";
import { cookies } from "next/headers";
import { CONFIG } from "./config";
import { ApiResponse } from "./api-client";

export interface ServerFetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

function buildUrl(baseUrl: string, endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(cleanEndpoint, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Server-side fetch wrapper for React Server Components (RSC) and Server Actions.
 * Safely extracts authentication tokens from HTTP-only or request cookies.
 */
export async function serverApiFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers = {}, ...restOptions } = options;
  const cookieStore = await cookies();
  const token = cookieStore.get(CONFIG.TOKEN_COOKIE_NAME)?.value;

  const url = buildUrl(CONFIG.API_INTERNAL_URL, endpoint, params);

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type") && !(restOptions.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });

  if (!res.ok) {
    let message = `Server request to ${endpoint} failed (${res.status})`;
    try {
      const json = await res.json();
      if (json.message) message = json.message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return { success: true, data: undefined as unknown as T };
  }

  return res.json();
}
