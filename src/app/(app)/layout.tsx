"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/store/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAdmin = useAuth((state) => state.isAdmin());
  const mounted = useMounted();

  useEffect(() => {
    if (mounted && !isAdmin) router.replace("/login");
  }, [mounted, isAdmin, router]);

  if (!mounted || !isAdmin) {
    return (
      <div className="grid min-h-screen flex-1 place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-1 bg-muted/30">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
