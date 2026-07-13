"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SlidersHorizontal, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiFetch, unwrapList } from "@/lib/api";
import type { ServiceSetting } from "@/lib/types";

const emptyForm = {
  service: "",
  key: "",
  valueText: "{}",
  description: "",
  isSecret: false,
};

export default function SettingsPage() {
  const [items, setItems] = useState<ServiceSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceSetting | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    void apiFetch<ServiceSetting[] | { results: ServiceSetting[] }>("/settings/")
      .then((data) => setItems(unwrapList(data)))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setPanelOpen(true);
  }

  function openEdit(item: ServiceSetting) {
    setEditing(item);
    setForm({
      service: item.service,
      key: item.key,
      valueText: item.isSecret ? "" : JSON.stringify(item.value ?? {}, null, 2),
      description: item.description,
      isSecret: item.isSecret,
    });
    setPanelOpen(true);
  }

  async function handleSave() {
    if (!form.service.trim() || !form.key.trim()) {
      toast.error("Service and key are required.");
      return;
    }
    let value: unknown = null;
    if (form.valueText.trim()) {
      try {
        value = JSON.parse(form.valueText);
      } catch {
        toast.error("Value must be valid JSON, e.g. a string in quotes, a number, or an object.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        service: form.service.trim().toLowerCase(),
        key: form.key.trim(),
        value,
        description: form.description,
        isSecret: form.isSecret,
      };
      if (editing) {
        await apiFetch(`/settings/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Setting updated");
      } else {
        await apiFetch("/settings/", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Setting created");
      }
      setPanelOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save setting");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: ServiceSetting) {
    if (!window.confirm(`Delete setting "${item.service}.${item.key}"?`)) return;
    try {
      await apiFetch(`/settings/${item.id}/`, { method: "DELETE" });
      toast.success("Setting deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete setting");
    }
  }

  return (
    <div>
      <PageHeader
        title="Service settings"
        description="A generic key/value store any service can read via GET /internal/settings/<service>/<key>/ — for config that doesn't fit SMTP, SMS, templates, or integrations."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New setting
          </Button>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No settings yet.</p>
            <Button variant="outline" className="mt-2" onClick={openCreate}>
              Add your first setting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => openEdit(item)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold">{item.key}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.service}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isSecret && <Badge variant="outline">Secret</Badge>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(item);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${item.key}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <pre className="mt-3 max-h-16 overflow-hidden truncate text-xs text-muted-foreground">
                  {item.isSecret ? "••••••••" : JSON.stringify(item.value)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setPanelOpen(false)}>
          <div
            className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit setting" : "New setting"}</h2>
              <button onClick={() => setPanelOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Service</Label>
                  <Input
                    className="mt-1.5 font-mono text-xs"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    placeholder="payroll-service"
                    disabled={!!editing}
                  />
                </div>
                <div>
                  <Label>Key</Label>
                  <Input
                    className="mt-1.5 font-mono text-xs"
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    placeholder="payday"
                    disabled={!!editing}
                  />
                </div>
              </div>
              <div>
                <Label>Value (JSON)</Label>
                <Textarea
                  className="mt-1.5 min-h-32 font-mono text-xs"
                  value={form.valueText}
                  onChange={(e) => setForm({ ...form, valueText: e.target.value })}
                  placeholder='{"dayOfMonth": 25}'
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input className="mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm font-medium">Secret (hide value in this UI)</span>
                <Switch checked={form.isSecret} onCheckedChange={(v) => setForm({ ...form, isSecret: v })} />
              </div>
              <Button className="w-full" disabled={saving} onClick={() => void handleSave()}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create setting"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
