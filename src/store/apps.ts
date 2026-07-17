import { create } from "zustand";
import type { AppLauncherEntry } from "@/lib/types";
import { apiFetchAuth } from "@/lib/api";

interface AppsState {
  apps: AppLauncherEntry[];
  loadApps: () => Promise<void>;
}

export const useApps = create<AppsState>((set) => ({
  apps: [],
  loadApps: async () => {
    try {
      const apps = await apiFetchAuth<AppLauncherEntry[]>("/apps/");
      set({ apps });
    } catch {
      // Non-critical: the launcher just stays empty/hidden if this fails.
    }
  },
}));

export const CURRENT_APP_KEY = "configuration-service";
