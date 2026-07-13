"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Network } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, unwrapList } from "@/lib/api";
import type { Service } from "@/lib/types";

function formatRelative(iso: string | null): string {
  if (!iso) return "Never called in";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch<Service[] | { results: Service[] }>("/services/")
      .then((data) => setServices(unwrapList(data)))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load services"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Services"
        description="Every service that has ever read or written its own configuration here, registered automatically — no code change needed to onboard a new one. Templates, integrations, and settings can be scoped to any of these names."
      />

      {loading ? (
        <div className="grid place-items-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Network className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No services registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{service.displayName || service.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{service.name}</p>
                  </div>
                  <Badge variant={service.lastSeenAt ? "success" : "outline"}>
                    {service.lastSeenAt ? "Active" : "Known"}
                  </Badge>
                </div>
                {service.description && (
                  <p className="mt-2 text-xs text-muted-foreground">{service.description}</p>
                )}
                <p className="mt-3 text-[11px] text-muted-foreground">{formatRelative(service.lastSeenAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
