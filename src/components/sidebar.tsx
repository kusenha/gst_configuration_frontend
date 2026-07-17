"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  MessageSquare,
  FileText,
  Plug,
  LogOut,
  Network,
  Server,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";
import { GstLogo } from "@/components/gst-logo";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/infrastructure", label: "Infrastructure", icon: Server },
  { href: "/services", label: "Services", icon: Network },
  { href: "/access", label: "App Access", icon: ShieldCheck },
  { href: "/smtp", label: "SMTP", icon: Mail },
  { href: "/sms", label: "SMS Gateway", icon: MessageSquare },
  { href: "/templates", label: "Email Templates", icon: FileText },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Service Settings", icon: SlidersHorizontal },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <GstLogo className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">GST · Configuration</p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">Admin console</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-xs font-medium">{user?.username}</p>
        <p className="truncate text-[11px] text-sidebar-foreground/50">{user?.role}</p>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
