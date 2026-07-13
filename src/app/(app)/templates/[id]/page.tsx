"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Save, Send, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import type { EmailTemplate } from "@/lib/types";

const emptyTemplate = {
  service: "",
  key: "",
  name: "",
  channel: "email",
  subject: "",
  bodyText: "{{ body }}",
  bodyHtml: "",
  accentColor: "#005A9C",
  backgroundColor: "#F4F6F8",
  logoUrl: "",
  headerText: "",
  footerText: "",
  isActive: true,
};

export default function TemplateEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<typeof emptyTemplate>(emptyTemplate);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    void apiFetch<EmailTemplate>(`/email-templates/${params.id}/`)
      .then((data) => {
        setTemplateId(data.id);
        setForm({
          service: data.service,
          key: data.key,
          name: data.name,
          channel: data.channel,
          subject: data.subject,
          bodyText: data.bodyText,
          bodyHtml: data.bodyHtml,
          accentColor: data.accentColor,
          backgroundColor: data.backgroundColor,
          logoUrl: data.logoUrl,
          headerText: data.headerText,
          footerText: data.footerText,
          isActive: data.isActive,
        });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load template"))
      .finally(() => setLoading(false));
  }, [isNew, params.id]);

  function update<K extends keyof typeof emptyTemplate>(key: K, value: (typeof emptyTemplate)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.key.trim() || !form.name.trim() || !form.subject.trim()) {
      toast.error("Key, name, and subject are required.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await apiFetch<EmailTemplate>("/email-templates/", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Template created");
        router.replace(`/templates/${created.id}`);
      } else {
        const updated = await apiFetch<EmailTemplate>(`/email-templates/${templateId}/`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        setTemplateId(updated.id);
        toast.success("Template saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!templateId) return;
    if (!window.confirm(`Delete template "${form.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiFetch(`/email-templates/${templateId}/`, { method: "DELETE" });
      toast.success("Template deleted");
      router.replace("/templates");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete template");
      setDeleting(false);
    }
  }

  async function handlePreview() {
    if (!templateId) {
      toast.error("Save the template before previewing.");
      return;
    }
    setPreviewing(true);
    try {
      const result = await apiFetch<{ bodyHtml: string }>(`/email-templates/${templateId}/preview/`, {
        method: "POST",
        body: JSON.stringify({ context: {} }),
      });
      setPreviewHtml(result.bodyHtml);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to render preview");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSendTest() {
    if (!templateId) {
      toast.error("Save the template before sending a test.");
      return;
    }
    if (!testEmail.trim()) {
      toast.error("Enter an email address to send the test to.");
      return;
    }
    setTesting(true);
    try {
      await apiFetch(`/email-templates/${templateId}/send-test/`, {
        method: "POST",
        body: JSON.stringify({ email: testEmail.trim(), context: {} }),
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
    <div>
      <PageHeader
        title={isNew ? "New email template" : form.name || "Edit template"}
        description="The bodyHtml field is sent to recipients as-is with {{ subject }} and {{ body }} substituted at send time."
        action={
          !isNew && (
            <Button variant="destructive" size="sm" disabled={deleting} onClick={() => void handleDelete()}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Key must match the event type sent by the calling service. Leave the owning service
                blank to share this template across every service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Owning service (optional)</Label>
                  <Input
                    className="mt-1.5 font-mono text-xs"
                    value={form.service}
                    onChange={(e) => update("service", e.target.value)}
                    placeholder="eda-service, or blank for shared"
                  />
                </div>
                <div>
                  <Label>Key</Label>
                  <Input className="mt-1.5 font-mono text-xs" value={form.key} onChange={(e) => update("key", e.target.value)} placeholder="account.created" />
                </div>
              </div>
              <div>
                <Label>Name</Label>
                <Input className="mt-1.5" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Account Created" />
              </div>
              <div>
                <Label>Subject</Label>
                <Input className="mt-1.5" value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Your GST EDA account is ready" />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm font-medium">Active</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => update("isActive", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Colors and header/footer copy for the HTML envelope.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Accent color</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => update("accentColor", e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded-md border border-input"
                    />
                    <Input value={form.accentColor} onChange={(e) => update("accentColor", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Background color</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      value={form.backgroundColor}
                      onChange={(e) => update("backgroundColor", e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded-md border border-input"
                    />
                    <Input value={form.backgroundColor} onChange={(e) => update("backgroundColor", e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <Label>Header text</Label>
                <Input className="mt-1.5" value={form.headerText} onChange={(e) => update("headerText", e.target.value)} placeholder="Welcome to GST EDA" />
              </div>
              <div>
                <Label>Footer text</Label>
                <Input className="mt-1.5" value={form.footerText} onChange={(e) => update("footerText", e.target.value)} placeholder="Automated message, please do not reply." />
              </div>
              <div>
                <Label>Logo URL (optional)</Label>
                <Input className="mt-1.5" value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Use {"{{ subject }}"} and {"{{ body }}"} as placeholders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Plain text body</Label>
                <Textarea className="mt-1.5 font-mono text-xs" rows={3} value={form.bodyText} onChange={(e) => update("bodyText", e.target.value)} />
              </div>
              <div>
                <Label>HTML body</Label>
                <Textarea className="mt-1.5 min-h-64 font-mono text-xs" value={form.bodyHtml} onChange={(e) => update("bodyHtml", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" disabled={saving} onClick={() => void handleSave()}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : isNew ? "Create template" : "Save changes"}
          </Button>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Live preview</CardTitle>
                <CardDescription>Renders bodyHtml with sample data.</CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled={previewing} onClick={() => void handlePreview()}>
                <Eye className="h-4 w-4" />
                {previewing ? "Rendering…" : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent>
              {previewHtml ? (
                <iframe title="Email preview" srcDoc={previewHtml} className="h-96 w-full rounded-md border bg-white" />
              ) : (
                <div className="grid h-96 place-items-center rounded-md border border-dashed text-sm text-muted-foreground">
                  {isNew ? "Save the template to preview it." : "Click Refresh to render the preview."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send a test email</CardTitle>
              <CardDescription>Sends this template through notification-service.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" />
              <Button variant="outline" disabled={testing} onClick={() => void handleSendTest()}>
                <Send className="h-4 w-4" />
                {testing ? "Sending…" : "Send test"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
