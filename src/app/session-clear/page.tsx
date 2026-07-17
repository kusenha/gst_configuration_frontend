"use client";

import { useEffect } from "react";
import { AUTH_STORAGE_KEY } from "@/lib/api";

// Loaded in a hidden iframe by a sibling GST EDA app's logout flow so this
// app's own auth state gets cleared too, even if no configuration_frontend
// tab is open. Intentionally has no UI and does not call the backend — the
// initiating app already handled that.
export default function SessionClearPage() {
  useEffect(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return null;
}
