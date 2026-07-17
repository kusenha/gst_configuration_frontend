"use client";

import { useEffect } from "react";
import { EDA_LOGIN_URL, AUTH_STORAGE_KEY } from "@/lib/api";

// configuration_frontend has no login form of its own — eda_frontend hosts the
// single shared GST login page. This route only exists so a stray bookmark or
// link to /login lands somewhere correct instead of 404ing.
export default function LoginRedirectPage() {
  useEffect(() => {
    // Landing here should always mean a clean slate, regardless of how the
    // tab got here — drop any locally cached token before redirecting.
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.replace(EDA_LOGIN_URL);
  }, []);

  return (
    <div className="grid min-h-screen flex-1 place-items-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
