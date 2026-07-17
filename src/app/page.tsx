"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import { useMounted } from "@/hooks/use-mounted";
import { EDA_LOGIN_URL } from "@/lib/api";

export default function RootPage() {
  const router = useRouter();
  const isAdmin = useAuth((state) => state.isAdmin());
  const silentLogin = useAuth((state) => state.silentLogin);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    if (isAdmin) {
      router.replace("/dashboard");
      return;
    }
    void silentLogin().then((restored) => {
      if (restored) {
        router.replace("/dashboard");
      } else {
        window.location.href = EDA_LOGIN_URL;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAdmin]);

  return (
    <div className="grid min-h-screen flex-1 place-items-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
