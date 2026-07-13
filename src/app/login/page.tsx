"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GstLogo } from "@/components/gst-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((state) => state.login);
  const isAdmin = useAuth((state) => state.isAdmin());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <GstLogo className="h-12 w-12" />
          <div>
            <p className="text-sm font-semibold">GST · Configuration</p>
            <p className="text-xs text-sidebar-foreground/60">Geological Survey of Tanzania</p>
          </div>
        </div>
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Internal Administration Console
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">
            System <span className="text-accent">Configuration</span>
          </h1>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Manage SMTP delivery, SMS gateways, branded email templates, and third-party
            integrations for every GST EDA service from one place.
          </p>
        </div>
        <p className="text-[11px] text-sidebar-foreground/50">
          © {new Date().getFullYear()} Geological Survey of Tanzania. All rights reserved.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <GstLogo className="h-10 w-10" />
            <div>
              <p className="text-sm font-bold">GST · Configuration</p>
            </div>
          </div>
          <h2 className="text-xl font-bold">Administrator sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your GST EDA administrator credentials. Access is restricted to administrator and
            super admin roles.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="GST-10000"
                className="mt-1.5"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
