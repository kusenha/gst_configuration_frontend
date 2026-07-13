import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetchAuth, AUTH_STORAGE_KEY } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

const ADMIN_ROLES = new Set(["administrator", "super_admin"]);

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  isAdmin: () => boolean;
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
      logout() {
        set({ user: null, accessToken: null, refreshToken: null });
      },
      isAdmin() {
        const role = get().user?.role;
        return !!role && ADMIN_ROLES.has(role);
      },
    }),
    { name: AUTH_STORAGE_KEY },
  ),
);
