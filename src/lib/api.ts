import { extractApiErrorMessage } from "@/lib/api-error";

// "localhost", not "127.0.0.1": the SSO session cookie is host-scoped, and
// must match the hostname every GST EDA app's browser tab and API calls use
// consistently, or the browser will silently refuse to send it cross-app.
export const AUTH_API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? "http://localhost:8882/api/auth";
export const CONFIG_API_BASE_URL =
  process.env.NEXT_PUBLIC_CONFIG_API_BASE_URL ?? "http://localhost:8882/api/config";

export const EDA_FRONTEND_URL =
  process.env.NEXT_PUBLIC_EDA_FRONTEND_URL ?? "http://localhost:8081";
// configuration_frontend has no login form of its own — eda_frontend hosts the single
// shared GST login page, and configuration_frontend hard-redirects there when unauthenticated.
export const EDA_LOGIN_URL = `${EDA_FRONTEND_URL}/login`;

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
  window.location.href = EDA_LOGIN_URL;
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
  // credentials: "include" so the browser sends/stores the HttpOnly SSO
  // session cookie auth_service sets on login, enabling silent single-sign-on
  // from another GST EDA app that shares this same gateway host.
  return request<T>(AUTH_API_BASE_URL, path, { credentials: "include", ...init });
}

/** DRF's ModelViewSet list endpoints are paginated ({count, next, previous, results}); plain
 * APIViews (like /services/) are not. This normalizes either shape to a bare array. */
export function unwrapList<T>(payload: T[] | { results: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.results;
}

export { AUTH_STORAGE_KEY };

/**
 * A sibling GST EDA app's localStorage lives under its own origin, which this
 * app has no direct access to — clearing it here does nothing. Loading a
 * hidden iframe of that app's /session-clear route lets its own JS run in
 * its own origin and drop its own auth state, so logging out here also logs
 * out the sibling app's already-open tabs (front-channel logout, same idea
 * OIDC uses for federated logout across relying parties).
 */
export function clearRemoteSession(baseUrl: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      iframe.remove();
      resolve();
    };
    iframe.onload = finish;
    iframe.onerror = finish;
    setTimeout(finish, 1500);
    iframe.src = `${baseUrl}/session-clear`;
    document.body.appendChild(iframe);
  });
}
