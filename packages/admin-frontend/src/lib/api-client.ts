import { CONFIG } from "./config";
import { getStoredAdminToken } from "./auth-storage";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiFetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Builds full URL with query parameters
 */
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
 * Extract human-readable error message from backend error responses
 */
async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return `Request failed with status ${res.status}`;
    const json = JSON.parse(text);
    if (json.message) return json.message;
    if (json.error) return typeof json.error === "string" ? json.error : JSON.stringify(json.error);
    if (json.errors && Array.isArray(json.errors)) {
      return json.errors.map((e: any) => e.message || JSON.stringify(e)).join(", ");
    }
    return `Error ${res.status}: ${res.statusText}`;
  } catch {
    return `Error ${res.status}: ${res.statusText}`;
  }
}

/**
 * Client-side fetch wrapper for interactive UI components (browser execution).
 * Automatically injects stored access token and credentials: "include".
 */
export async function clientApiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { params, token: explicitToken, headers = {}, ...restOptions } = options;
  const token = explicitToken || getStoredAdminToken();
  const url = buildUrl(CONFIG.API_BASE_URL, endpoint, params);

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
    credentials: "include", // forwards cookies to backend
  });

  if (!res.ok) {
    const errorMessage = await parseErrorMessage(res);
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return { success: true, data: undefined as unknown as T };
  }

  return res.json();
}
