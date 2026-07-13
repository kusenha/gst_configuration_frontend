"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function RootPage() {
  const router = useRouter();
  const isAdmin = useAuth((state) => state.isAdmin());
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    router.replace(isAdmin ? "/dashboard" : "/login");
  }, [mounted, isAdmin, router]);

  return (
    <div className="grid min-h-screen flex-1 place-items-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
