"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Lock } from "lucide-react";
import { toast } from "sonner";
import { useApps, CURRENT_APP_KEY } from "@/store/apps";

export function AppLauncher() {
  const apps = useApps((s) => s.apps);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (apps.length <= 1) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="App launcher"
        className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-50 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            GST EDA Platform
          </p>
          <div className="grid grid-cols-3 gap-2">
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
                  className={`flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition-colors ${
                    isCurrent
                      ? "bg-primary/10"
                      : app.hasAccess
                        ? "cursor-pointer hover:bg-accent/50"
                        : "cursor-not-allowed opacity-45"
                  }`}
                >
                  <span
                    className="relative grid h-10 w-10 place-items-center rounded-xl text-xl"
                    style={{ backgroundColor: `${app.color || "#005A9C"}1F` }}
                  >
                    {app.icon || "🔷"}
                    {!app.hasAccess && !isCurrent && (
                      <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-muted-foreground/80">
                        <Lock className="h-2.5 w-2.5 text-background" />
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-medium leading-tight text-foreground">
                    {app.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
