"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiFetchAuth } from "@/lib/api";
import { useApps } from "@/store/apps";
import type { DirectoryUser } from "@/lib/types";

export default function AppAccessPage() {
  const apps = useApps((s) => s.apps);
  const loadApps = useApps((s) => s.loadApps);
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadApps();
    void apiFetchAuth<DirectoryUser[]>("/users/")
      .then(setUsers)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }, [loadApps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.checkNumber.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [users, query]);

  const selected = users.find((u) => u.id === selectedId) ?? null;

  async function toggleAccess(appName: string, granted: boolean) {
    if (!selected) return;
    const current = new Set(selected.services ?? []);
    if (granted) current.add(appName);
    else current.delete(appName);
    const nextServices = Array.from(current);

    setSaving(true);
    try {
      const updated = await apiFetchAuth<DirectoryUser>(`/users/${selected.id}/assign-services/`, {
        method: "POST",
        body: JSON.stringify({ services: nextServices }),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(`App access updated for ${updated.firstName} ${updated.lastName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update app access");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="App Access"
        description="Grant or revoke which GST EDA apps a user can open — independent of their role or permissions. A user can hold every permission an app defines and still be denied the app itself until it's granted here."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, check number, email…"
                className="pl-8"
              />
            </div>
            <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-md border">
              {loading ? (
                <div className="grid place-items-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Users className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No matching users.</p>
                </div>
              ) : (
                filtered.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedId(u.id)}
                    className={`flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-left text-sm last:border-0 transition-colors hover:bg-muted/60 ${
                      selectedId === u.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.checkNumber} · {u.role}
                      </p>
                    </div>
                    <Badge variant="outline">{(u.services ?? []).length}</Badge>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {!selected ? (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a user on the left to manage their app access.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold">
                  {selected.firstName} {selected.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.checkNumber} · {selected.email} · {selected.role}
                </p>

                <div className="mt-5 space-y-3">
                  {apps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No launcher apps configured yet.</p>
                  ) : (
                    apps.map((app) => {
                      const granted = (selected.services ?? []).includes(app.name);
                      return (
                        <div
                          key={app.id}
                          className="flex items-center justify-between gap-3 rounded-md border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="grid h-9 w-9 place-items-center rounded-lg text-lg"
                              style={{ backgroundColor: `${app.color || "#005A9C"}1F` }}
                            >
                              {app.icon || "🔷"}
                            </span>
                            <div>
                              <Label className="text-sm font-medium">{app.displayName}</Label>
                              <p className="text-xs text-muted-foreground">{app.name}</p>
                            </div>
                          </div>
                          <Switch
                            checked={granted}
                            disabled={saving}
                            onCheckedChange={(value) => void toggleAccess(app.name, value)}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
