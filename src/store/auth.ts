import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetchAuth, AUTH_STORAGE_KEY, EDA_FRONTEND_URL, clearRemoteSession } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

const ADMIN_ROLES = new Set(["administrator", "super_admin"]);
const CURRENT_APP_KEY = "configuration-service";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  /** Attempts to establish a session from the shared SSO cookie set by a
   * login in another GST EDA app, without showing a login form. Resolves
   * true if a session was restored, false if there is none. */
  silentLogin: () => Promise<boolean>;
  /** Backend logout must be awaited before navigating away — a hard
   * cross-origin redirect fired right after calling this can cancel the
   * in-flight request, leaving the shared SSO cookie uncleared server-side
   * so a fresh tab silently re-authenticates via silentLogin(). */
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  hasAppAccess: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      async login(username, password) {
        const payload = await apiFetchAuth<{
          access?: string;
          refresh?: string;
          user: AuthUser;
        }>("/login/", {
          method: "POST",
          body: JSON.stringify({ username, password }),
          authRequired: false,
        });

        if (payload.user.mustChangePassword) {
          set({ user: null, accessToken: null, refreshToken: null });
          throw new Error("This account has a temporary password. Sign in to eda_frontend first to set a new password.");
        }

        if (!ADMIN_ROLES.has(payload.user.role)) {
          set({ user: null, accessToken: null, refreshToken: null });
          throw new Error("Only administrators can access the Configuration app.");
        }

        if (!payload.access || !payload.refresh) {
          throw new Error("Login response is missing access tokens.");
        }

        set({ user: payload.user, accessToken: payload.access, refreshToken: payload.refresh });
        return payload.user;
      },
      async silentLogin() {
        try {
          const payload = await apiFetchAuth<{ access: string; refresh: string; user: AuthUser }>(
            "/sso/session/",
            { method: "POST", authRequired: false },
          );
          if (payload.user.mustChangePassword || !ADMIN_ROLES.has(payload.user.role)) {
            return false;
          }
          set({ user: payload.user, accessToken: payload.access, refreshToken: payload.refresh });
          return true;
        } catch {
          return false;
        }
      },
      async logout() {
        try {
          await apiFetchAuth("/logout/", { method: "POST", authRequired: false });
        } catch {
          // Best-effort: local state is cleared regardless.
        }
        // eda_frontend's localStorage lives under its own origin — clear it
        // via a hidden iframe so its already-open tabs drop their auth state
        // too, instead of only silently re-authenticating later.
        await clearRemoteSession(EDA_FRONTEND_URL);
        set({ user: null, accessToken: null, refreshToken: null });
        // persist's own rewrite only nulls the stored fields, it doesn't drop
        // the key — remove it outright so no stale session data lingers.
        if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_STORAGE_KEY);
      },
      isAdmin() {
        const role = get().user?.role;
        return !!role && ADMIN_ROLES.has(role);
      },
      hasAppAccess() {
        const services = get().user?.services;
        return !services || services.includes(CURRENT_APP_KEY);
      },
    }),
    { name: AUTH_STORAGE_KEY },
  ),
);
