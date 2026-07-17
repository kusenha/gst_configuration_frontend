"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { useApps, CURRENT_APP_KEY } from "@/store/apps";
import { cn } from "@/lib/utils";

export function AppLauncher() {
  const apps = useApps((s) => s.apps);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (apps.length <= 1) return null;

  return (
    <>
      {/* Fixed to the upper-right corner, rendered outside the topbar (its
          backdrop-blur creates a containing block that breaks position:fixed
          descendants) — always floats clear of the navbar and page content. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="App launcher"
        className="fixed right-6 top-16 z-40 grid h-12 w-12 place-items-center rounded-full bg-accent/75 text-accent-foreground shadow-lg shadow-accent/30 backdrop-blur-sm transition-transform hover:scale-105 hover:bg-accent/90 active:scale-95"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-base font-semibold">GST EDA Platform</p>
            <p className="text-xs text-muted-foreground">Switch between the apps you have access to.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 overflow-y-auto p-5">
          {apps.map((app) => {
            const isCurrent = app.name === CURRENT_APP_KEY;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (isCurrent) return;
                  if (!app.hasAccess) {
                    toast.error(`You don't have access to ${app.displayName}. Contact an administrator.`);
                    return;
                  }
                  window.location.href = app.frontendUrl;
                }}
                className={cn(
                  "flex flex-col items-center gap-2.5 rounded-xl border p-5 text-center transition-colors",
                  isCurrent
                    ? "border-primary/30 bg-primary/10"
                    : app.hasAccess
                      ? "cursor-pointer border-transparent hover:border-border hover:bg-accent/50"
                      : "cursor-not-allowed border-transparent opacity-45",
                )}
              >
                <span
                  className="relative grid h-16 w-16 place-items-center rounded-2xl text-3xl"
                  style={{ backgroundColor: `${app.color || "#005A9C"}1F` }}
                >
                  {app.icon || "🔷"}
                  {!app.hasAccess && !isCurrent && (
                    <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-muted-foreground/80">
                      <Lock className="h-3 w-3 text-background" />
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium leading-tight text-foreground">
                  {app.displayName}
                </span>
                {isCurrent && <span className="text-[11px] font-medium text-primary">Current app</span>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
