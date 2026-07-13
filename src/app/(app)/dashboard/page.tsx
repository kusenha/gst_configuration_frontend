"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, FileText, Plug, Network, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, unwrapList } from "@/lib/api";
import type { EmailTemplate, ExternalIntegration, Service, SmsConfig, SmtpConfig } from "@/lib/types";

export default function DashboardPage() {
  const [smtp, setSmtp] = useState<SmtpConfig | null>(null);
  const [sms, setSms] = useState<SmsConfig | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [integrations, setIntegrations] = useState<ExternalIntegration[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      apiFetch<SmtpConfig>("/smtp/"),
      apiFetch<SmsConfig>("/sms/"),
      apiFetch<EmailTemplate[] | { results: EmailTemplate[] }>("/email-templates/"),
      apiFetch<ExternalIntegration[] | { results: ExternalIntegration[] }>("/integrations/"),
      apiFetch<Service[] | { results: Service[] }>("/services/"),
    ]).then(([smtpRes, smsRes, templatesRes, integrationsRes, servicesRes]) => {
      if (cancelled) return;
      if (smtpRes.status === "fulfilled") setSmtp(smtpRes.value);
      if (smsRes.status === "fulfilled") setSms(smsRes.value);
      if (templatesRes.status === "fulfilled") setTemplates(unwrapList(templatesRes.value));
      if (integrationsRes.status === "fulfilled") setIntegrations(unwrapList(integrationsRes.value));
      if (servicesRes.status === "fulfilled") setServices(unwrapList(servicesRes.value));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeServiceCount = services.filter((s) => s.lastSeenAt).length;

  const cards = [
    {
      href: "/services",
      icon: Network,
      title: "Services",
      status: `${services.length} registered`,
      ok: activeServiceCount > 0,
      detail: `${activeServiceCount} have called in`,
    },
    {
      href: "/smtp",
      icon: Mail,
      title: "SMTP",
      status: smtp?.enabled ? "Enabled" : "Disabled",
      ok: !!smtp?.enabled,
      detail: smtp?.host || "Not configured",
    },
    {
      href: "/sms",
      icon: MessageSquare,
      title: "SMS Gateway",
      status: sms?.enabled ? "Enabled" : "Disabled",
      ok: !!sms?.enabled,
      detail: sms?.provider || "Not configured",
    },
    {
      href: "/templates",
      icon: FileText,
      title: "Email Templates",
      status: `${templates.length} template${templates.length === 1 ? "" : "s"}`,
      ok: templates.some((t) => t.isActive),
      detail: `${templates.filter((t) => t.isActive).length} active`,
    },
    {
      href: "/integrations",
      icon: Plug,
      title: "Integrations",
      status: `${integrations.length} integration${integrations.length === 1 ? "" : "s"}`,
      ok: integrations.some((i) => i.isActive),
      detail: `${integrations.filter((i) => i.isActive).length} active`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Configuration overview"
        description="Central control for SMTP, SMS, branded email templates, and third-party integrations across every service — any service can register itself and use this API, not just EDA."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={card.ok ? "success" : "outline"}>{card.status}</Badge>
                </div>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {loading ? "Loading…" : card.detail}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Manage <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
