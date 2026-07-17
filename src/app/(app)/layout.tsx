"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useAuth } from "@/store/auth";
import { useApps } from "@/store/apps";
import { useMounted } from "@/hooks/use-mounted";
import { AppAccessDenied } from "@/components/app-access-denied";
import { AppLauncher } from "@/components/app-launcher";
import { EDA_LOGIN_URL } from "@/lib/api";

const SESSION_POLL_MS = 45000;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuth((state) => state.user);
  const isAdmin = useAuth((state) => state.isAdmin());
  const hasAppAccess = useAuth((state) => state.hasAppAccess());
  const silentLogin = useAuth((state) => state.silentLogin);
  const logout = useAuth((state) => state.logout);
  const loadApps = useApps((state) => state.loadApps);
  const mounted = useMounted();
  const [ssoChecked, setSsoChecked] = useState(false);

  useEffect(() => {
    if (!mounted || isAdmin) return;
    let cancelled = false;
    void silentLogin().finally(() => {
      if (!cancelled) setSsoChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mounted, isAdmin, silentLogin]);

  const ready = isAdmin || ssoChecked;

  useEffect(() => {
    if (mounted && ready && !isAdmin) window.location.href = EDA_LOGIN_URL;
  }, [mounted, ready, isAdmin]);

  useEffect(() => {
    if (!user) return;
    void loadApps();
  }, [user, loadApps]);

  // Cross-app logout: another GST EDA app's logout clears the shared SSO
  // cookie server-side. This tab won't notice on its own since it keeps
  // using its already-issued local access token, so periodically re-check
  // the cookie is still valid and force a logout here too when it isn't.
  // Two consecutive failures are required before acting, so a single
  // transient network error doesn't bounce the user out.
  useEffect(() => {
    if (!isAdmin) return;
    const failures = { current: 0 };
    const id = window.setInterval(() => {
      void silentLogin().then(async (ok) => {
        if (ok) {
          failures.current = 0;
          return;
        }
        failures.current += 1;
        if (failures.current >= 2) {
          await logout();
          window.location.href = EDA_LOGIN_URL;
        }
      });
    }, SESSION_POLL_MS);
    return () => window.clearInterval(id);
  }, [isAdmin, silentLogin, logout]);

  if (!mounted || !ready || !isAdmin) {
    return (
      <div className="grid min-h-screen flex-1 place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasAppAccess) {
    return <AppAccessDenied />;
  }

  return (
    <div className="flex min-h-screen w-full flex-1 bg-muted/30">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      {/* Rendered here, not inside Topbar: the header's backdrop-blur
          establishes a containing block for position:fixed descendants,
          which broke this button's viewport-relative positioning. */}
      <AppLauncher />
      <Toaster richColors position="top-right" />
    </div>
  );
}
