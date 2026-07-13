import { extractApiErrorMessage } from "@/lib/api-error";

export const AUTH_API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? "http://127.0.0.1:8882/api/auth";
export const CONFIG_API_BASE_URL =
  process.env.NEXT_PUBLIC_CONFIG_API_BASE_URL ?? "http://127.0.0.1:8882/api/config";

const AUTH_STORAGE_KEY = "gst-config-auth";

interface ApiRequestInit extends RequestInit {
  authRequired?: boolean;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function clearAuthState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.replace("/login");
}

async function request<T>(baseUrl: string, path: string, init: ApiRequestInit): Promise<T> {
  const { authRequired = true, ...requestInit } = init;
  const headers = new Headers(requestInit.headers ?? {});
  const body = requestInit.body;
  if (!headers.has("Content-Type") && body && typeof body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (authRequired && !token) {
    clearAuthState();
    redirectToLogin();
    throw new Error("Authentication required");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, { ...requestInit, headers });
  } catch {
    throw new Error("The service is temporarily unreachable. Please try again shortly.");
  }

  if (authRequired && (res.status === 401 || res.status === 403)) {
    clearAuthState();
    redirectToLogin();
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(extractApiErrorMessage(res.status, text));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  return request<T>(CONFIG_API_BASE_URL, path, init);
}

export function apiFetchAuth<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  return request<T>(AUTH_API_BASE_URL, path, init);
}

/** DRF's ModelViewSet list endpoints are paginated ({count, next, previous, results}); plain
 * APIViews (like /services/) are not. This normalizes either shape to a bare array. */
export function unwrapList<T>(payload: T[] | { results: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.results;
}

export { AUTH_STORAGE_KEY };
