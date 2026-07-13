"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import type { SmtpConfig } from "@/lib/types";

const ENCRYPTIONS: SmtpConfig["encryption"][] = ["tls", "ssl", "none"];

export default function SmtpPage() {
  const [config, setConfig] = useState<SmtpConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<SmtpConfig["encryption"]>("tls");
  const [fromAddress, setFromAddress] = useState("");
  const [fromName, setFromName] = useState("");

  useEffect(() => {
    void apiFetch<SmtpConfig>("/smtp/")
      .then((data) => {
        setConfig(data);
        setEnabled(data.enabled);
        setHost(data.host);
        setPort(data.port);
        setUsername(data.username);
        setEncryption(data.encryption);
        setFromAddress(data.fromAddress);
        setFromName(data.fromName);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load SMTP settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(nextEnabled?: boolean) {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: nextEnabled ?? enabled,
        host,
        port,
        username,
        encryption,
        fromAddress,
        fromName,
      };
      if (password) payload.password = password;

      const updated = await apiFetch<SmtpConfig>("/smtp/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setConfig(updated);
      setPassword("");
      if (nextEnabled !== undefined) setEnabled(nextEnabled);
      toast.success("SMTP settings saved");
    } catch (err) {
      if (nextEnabled !== undefined) setEnabled(!nextEnabled);
      toast.error(err instanceof Error ? err.message : "Failed to save SMTP settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail.trim()) {
      toast.error("Enter an email address to send the test to.");
      return;
    }
    setTesting(true);
    try {
      await apiFetch("/smtp/test/", {
        method: "POST",
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      toast.success(`Test email sent to ${testEmail.trim()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test email");
    } finally {
      setTesting(false);
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
        title="SMTP"
        description="Mail server used by notification-service to deliver account, request, and reminder emails."
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Enable SMTP</CardTitle>
            <CardDescription>Turn on outbound email delivery for the whole platform.</CardDescription>
          </div>
          <Switch checked={enabled} disabled={saving} onCheckedChange={(v) => void handleSave(v)} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SMTP host</Label>
            <Input className="mt-1.5" value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Port</Label>
              <Input
                className="mt-1.5"
                type="number"
                value={port}
                onChange={(e) => setPort(Math.max(1, Number(e.target.value) || 587))}
              />
            </div>
            <div>
              <Label>Encryption</Label>
              <select
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={encryption}
                onChange={(e) => setEncryption(e.target.value as SmtpConfig["encryption"])}
              >
                {ENCRYPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Username</Label>
            <Input className="mt-1.5" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label>Password{config?.hasPassword ? " (leave blank to keep existing)" : ""}</Label>
            <Input
              className="mt-1.5"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={config?.hasPassword ? "********" : "App password"}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              You can paste a Gmail-style app password with spaces (e.g. &ldquo;rtgy ldcd kvsb
              ircf&rdquo;) — spaces are removed automatically.
            </p>
          </div>
          <div>
            <Label>From address</Label>
            <Input className="mt-1.5" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="no-reply@gst.go.tz" />
          </div>
          <div>
            <Label>From name</Label>
            <Input className="mt-1.5" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="GST EDA System" />
          </div>
          <Button className="w-full" disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Saving…" : "Save SMTP settings"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Send a test email</CardTitle>
          <CardDescription>Round-trips through notification-service to confirm delivery works.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button variant="outline" disabled={testing} onClick={() => void handleSendTest()}>
            <Send className="h-4 w-4" />
            {testing ? "Sending…" : "Send test"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
