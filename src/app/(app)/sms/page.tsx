"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import type { SmsConfig } from "@/lib/types";

export default function SmsPage() {
  const [config, setConfig] = useState<SmsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [senderId, setSenderId] = useState("");

  useEffect(() => {
    void apiFetch<SmsConfig>("/sms/")
      .then((data) => {
        setConfig(data);
        setEnabled(data.enabled);
        setProvider(data.provider);
        setBaseUrl(data.baseUrl);
        setSenderId(data.senderId);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load SMS settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(nextEnabled?: boolean) {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: nextEnabled ?? enabled,
        provider,
        baseUrl,
        senderId,
      };
      if (apiKey) payload.apiKey = apiKey;
      if (apiSecret) payload.apiSecret = apiSecret;

      const updated = await apiFetch<SmsConfig>("/sms/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setConfig(updated);
      setApiKey("");
      setApiSecret("");
      if (nextEnabled !== undefined) setEnabled(nextEnabled);
      toast.success("SMS settings saved");
    } catch (err) {
      if (nextEnabled !== undefined) setEnabled(!nextEnabled);
      toast.error(err instanceof Error ? err.message : "Failed to save SMS settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="SMS Gateway"
        description="Credentials for an SMS provider, stored centrally and ready for notification-service to use once SMS sending is wired up."
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Enable SMS</CardTitle>
            <CardDescription>Marks the gateway as ready to use for outbound SMS.</CardDescription>
          </div>
          <Switch checked={enabled} disabled={saving} onCheckedChange={(v) => void handleSave(v)} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Input className="mt-1.5" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. africastalking, twilio, custom" />
          </div>
          <div>
            <Label>Base URL</Label>
            <Input className="mt-1.5" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.provider.com/v1/sms" />
          </div>
          <div>
            <Label>Sender ID</Label>
            <Input className="mt-1.5" value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="GST-EDA" />
          </div>
          <div>
            <Label>API key{config?.hasApiKey ? " (leave blank to keep existing)" : ""}</Label>
            <Input
              className="mt-1.5"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.hasApiKey ? "********" : "API key"}
            />
          </div>
          <div>
            <Label>API secret{config?.hasApiSecret ? " (leave blank to keep existing)" : ""}</Label>
            <Input
              className="mt-1.5"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder={config?.hasApiSecret ? "********" : "API secret"}
            />
          </div>
          <Button className="w-full" disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Saving…" : "Save SMS settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
