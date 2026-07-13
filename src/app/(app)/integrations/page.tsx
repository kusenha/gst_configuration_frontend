"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plug, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiFetch, unwrapList } from "@/lib/api";
import type { ExternalIntegration } from "@/lib/types";

const emptyForm = {
  service: "",
  name: "",
  category: "",
  baseUrl: "",
  apiKey: "",
  apiSecret: "",
  notes: "",
  isActive: true,
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<ExternalIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<ExternalIntegration | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    void apiFetch<ExternalIntegration[] | { results: ExternalIntegration[] }>("/integrations/")
      .then((data) => setIntegrations(unwrapList(data)))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load integrations"))
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

  function openEdit(item: ExternalIntegration) {
    setEditing(item);
    setForm({
      service: item.service,
      name: item.name,
      category: item.category,
      baseUrl: item.baseUrl,
      apiKey: "",
      apiSecret: "",
      notes: item.notes,
      isActive: item.isActive,
    });
    setPanelOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        service: form.service.trim().toLowerCase(),
        name: form.name,
        category: form.category,
        baseUrl: form.baseUrl,
        notes: form.notes,
        isActive: form.isActive,
      };
      if (form.apiKey) payload.apiKey = form.apiKey;
      if (form.apiSecret) payload.apiSecret = form.apiSecret;

      if (editing) {
        await apiFetch(`/integrations/${editing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Integration updated");
      } else {
        await apiFetch("/integrations/", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Integration created");
      }
      setPanelOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save integration");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: ExternalIntegration) {
    if (!window.confirm(`Delete integration "${item.name}"?`)) return;
    try {
      await apiFetch(`/integrations/${item.id}/`, { method: "DELETE" });
      toast.success("Integration deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete integration");
    }
  }

  return (
    <div>
      <PageHeader
        title="External integrations"
        description="Generic credential store for third-party APIs — payment gateways, government registries, or anything else."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New integration
          </Button>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Plug className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No integrations configured yet.</p>
            <Button variant="outline" className="mt-2" onClick={openCreate}>
              Add your first integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => (
            <Card key={item.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => openEdit(item)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.name}</p>
                    {item.category && <p className="truncate text-xs text-muted-foreground">{item.category}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.isActive ? "success" : "outline"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(item);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {item.baseUrl && <p className="mt-3 truncate text-xs text-muted-foreground">{item.baseUrl}</p>}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="outline">{item.service || "shared"}</Badge>
                  {item.hasApiKey && <Badge variant="outline">Key set</Badge>}
                  {item.hasApiSecret && <Badge variant="outline">Secret set</Badge>}
                </div>
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
              <h2 className="text-lg font-semibold">{editing ? "Edit integration" : "New integration"}</h2>
              <button onClick={() => setPanelOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Owning service (optional)</Label>
                <Input
                  className="mt-1.5 font-mono text-xs"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  placeholder="payroll-service, or blank for shared"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Payment Gateway" />
              </div>
              <div>
                <Label>Category</Label>
                <Input className="mt-1.5" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="payment, geocoding, registry…" />
              </div>
              <div>
                <Label>Base URL</Label>
                <Input className="mt-1.5" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.example.com" />
              </div>
              <div>
                <Label>API key{editing?.hasApiKey ? " (leave blank to keep existing)" : ""}</Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={editing?.hasApiKey ? "********" : "API key"}
                />
              </div>
              <div>
                <Label>API secret{editing?.hasApiSecret ? " (leave blank to keep existing)" : ""}</Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  value={form.apiSecret}
                  onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
                  placeholder={editing?.hasApiSecret ? "********" : "API secret"}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea className="mt-1.5" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm font-medium">Active</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
              <Button className="w-full" disabled={saving} onClick={() => void handleSave()}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create integration"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
