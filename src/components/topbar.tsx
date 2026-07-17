"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Search, User, X } from "lucide-react";
import { useAuth } from "@/store/auth";
import { Sidebar } from "@/components/sidebar";
import { Input } from "@/components/ui/input";
import { AppLauncher } from "@/components/app-launcher";
import { EDA_LOGIN_URL } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  employee: "Employee",
  department_head: "Department Head",
  finance_officer: "Finance Officer",
  hr_officer: "HR Officer",
  administrator: "Administrator",
  super_admin: "Super Administrator",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  return useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((p, i) => ({
      label: p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + parts.slice(0, i + 1).join("/"),
    }));
  }, [pathname]);
}

export function Topbar() {
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);
  const crumbs = useBreadcrumbs();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials = user ? `${user.firstName?.[0] ?? user.username[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-md text-foreground/80 hover:bg-muted lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-3 grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:flex"
      >
        <Link href="/dashboard" className="hover:text-foreground">
          Home
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex min-w-0 items-center gap-1.5">
            <span>/</span>
            <span className={i === crumbs.length - 1 ? "truncate font-medium text-foreground" : "truncate"}>
              {c.label}
            </span>
          </span>
        ))}
      </nav>

      <div className="relative ml-auto hidden md:block">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." className="h-9 w-64 pl-8" />
      </div>

      <AppLauncher />

      <div className="relative" ref={accountRef}>
        <button
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border bg-card p-1 pr-3 text-left transition hover:bg-accent/40"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs font-semibold leading-tight">
              {user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username : "Guest"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground leading-tight">
              {user?.role ? ROLE_LABELS[user.role] ?? user.role : ""}
            </p>
          </div>
        </button>

        {accountOpen && (
          <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-lg">
            <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              My Account
            </p>
            <div className="my-1 h-px bg-border" />
            <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user?.username}
            </div>
            <button
              type="button"
              onClick={async () => {
                setAccountOpen(false);
                await logout();
                window.location.href = EDA_LOGIN_URL;
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
