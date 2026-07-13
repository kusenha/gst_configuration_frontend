"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Mail } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, unwrapList } from "@/lib/api";
import type { EmailTemplate } from "@/lib/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch<EmailTemplate[] | { results: EmailTemplate[] }>("/email-templates/")
      .then((data) => setTemplates(unwrapList(data)))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Email templates"
        description="Branded HTML emails used by notification-service, keyed by event type (e.g. account.created)."
        action={
          <Link href="/templates/new">
            <Button>
              <Plus className="h-4 w-4" />
              New template
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Mail className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No email templates yet.</p>
            <Link href="/templates/new">
              <Button variant="outline" className="mt-2">
                Create your first template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link key={template.id} href={`/templates/${template.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{template.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{template.key}</p>
                    </div>
                    <Badge variant={template.isActive ? "success" : "outline"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-3 truncate text-sm text-muted-foreground">{template.subject}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: template.accentColor }}
                      />
                      <span className="text-xs text-muted-foreground">{template.accentColor}</span>
                    </div>
                    <Badge variant="outline">{template.service || "shared"}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
