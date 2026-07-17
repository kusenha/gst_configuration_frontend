"use client";

import { LayoutGrid, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GstLogo } from "@/components/gst-logo";
import { useAuth } from "@/store/auth";
import { useApps, CURRENT_APP_KEY } from "@/store/apps";
import { EDA_LOGIN_URL } from "@/lib/api";

export function AppAccessDenied() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const apps = useApps((s) => s.apps);
  const otherApps = apps.filter((app) => app.name !== CURRENT_APP_KEY && app.hasAccess);

  return (
    <div className="grid min-h-screen flex-1 place-items-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <GstLogo className="h-12 w-12" />
        </div>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-destructive/10">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-lg font-bold text-foreground">You don&apos;t have access to this app</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user ? `${user.username}, your` : "Your"} account hasn&apos;t been granted access to the
          Configuration console, even though you are signed in. Ask another administrator to grant
          it from the App Access screen.
        </p>

        {otherApps.length > 0 && (
          <div className="mt-6 border-t pt-5">
            <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" /> Apps you can open
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {otherApps.map((app) => (
                <a
                  key={app.id}
                  href={app.frontendUrl}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent/50"
                >
                  <span>{app.icon}</span>
                  {app.displayName}
                </a>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={async () => {
            await logout();
            window.location.href = EDA_LOGIN_URL;
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
