"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Maximize2,
  Minimize2,
  Play,
  RotateCw,
  Search,
  Square,
  Terminal,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { DockerService } from "@/lib/types";

const POLL_MS = 5000;
const LOG_POLL_MS = 3000;
const SELF_KEY = "configuration-service";

const LABELS: Record<string, string> = {
  "auth-service": "Auth Service",
  "eda-service": "EDA Service",
  "configuration-service": "Configuration Service",
  "core-engine": "Core Engine",
  "notification-service": "Notification Service",
  "notification-consumer": "Notification Consumer",
  "api-gateway": "API Gateway",
};

function statusVariant(status: string): "success" | "destructive" | "outline" {
  if (status === "running") return "success";
  if (status === "exited" || status === "missing") return "destructive";
  return "outline";
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Not running";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `Up ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Up ${hours}h`;
  return `Up ${Math.round(hours / 24)}d`;
}

export default function InfrastructurePage() {
  const [services, setServices] = useState<DockerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [logsFor, setLogsFor] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      return apiFetch<DockerService[]>("/docker/services/")
        .then((data) => setServices(data))
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Failed to load service status");
        })
        .finally(() => setLoading(false));
    }
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  async function runAction(key: string, action: "start" | "stop" | "restart") {
    setPending((prev) => new Set(prev).add(key));
    try {
      const updated = await apiFetch<DockerService>(`/docker/services/${key}/${action}/`, {
        method: "POST",
      });
      setServices((prev) => prev.map((s) => (s.key === key ? updated : s)));
      toast.success(`${LABELS[key] ?? key}: ${action}ed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} ${key}`);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Infrastructure"
        description="Start, stop, and monitor the GST EDA app services running in Docker on this machine."
      />

      {loading ? (
        <div className="grid place-items-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const isSelf = service.key === SELF_KEY;
            const isPending = pending.has(service.key);
            const isRunning = service.status === "running";
            return (
              <Card key={service.key}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{LABELS[service.key] ?? service.key}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {service.containerName}
                      </p>
                    </div>
                    <Badge variant={statusVariant(service.status)}>{service.status}</Badge>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatRelative(service.startedAt)}
                    {service.shortId ? ` · ${service.shortId}` : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {isSelf ? (
                      <p className="text-[11px] text-muted-foreground">
                        This console can&apos;t stop or restart itself from here.
                      </p>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant={isRunning ? "outline" : "primary"}
                          disabled={isPending}
                          onClick={() => void runAction(service.key, isRunning ? "stop" : "start")}
                        >
                          {isRunning ? (
                            <Square className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                          {isRunning ? "Stop" : "Start"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => void runAction(service.key, "restart")}
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          Restart
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLogsFor(service.key)}
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {logsFor && (
        <LogsOverlay
          serviceKey={logsFor}
          label={LABELS[logsFor] ?? logsFor}
          onClose={() => setLogsFor(null)}
        />
      )}
    </div>
  );
}

const TAIL_OPTIONS = [100, 200, 500, 1000, 2000];

type LogLevel = "error" | "warn" | "info";

interface ParsedLine {
  raw: string;
  timestamp: Date | null;
  timeLabel: string;
  message: string;
  level: LogLevel;
}

// Docker's timestamps=True prefixes every line with an RFC3339Nano
// timestamp + a single space, e.g. "2026-07-17T06:23:30.186172133Z <line>".
const TIMESTAMP_PREFIX = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s(.*)$/;
// Django's dev-server access log ends each line in `"...HTTP/1.0" 200 718`.
const HTTP_STATUS = /"\s(\d{3})\s/;

function detectLevel(message: string): LogLevel {
  if (/\b(ERROR|CRITICAL|TRACEBACK|EXCEPTION)\b/i.test(message)) return "error";
  const statusMatch = message.match(HTTP_STATUS);
  if (statusMatch) {
    const code = Number(statusMatch[1]);
    if (code >= 500) return "error";
    if (code >= 400) return "warn";
  }
  if (/\bWARN(ING)?\b/i.test(message)) return "warn";
  return "info";
}

function parseLine(raw: string): ParsedLine {
  const match = raw.match(TIMESTAMP_PREFIX);
  const timestamp = match ? new Date(match[1]) : null;
  const message = match ? match[2] : raw;
  const timeLabel =
    timestamp && !Number.isNaN(timestamp.getTime())
      ? timestamp.toLocaleTimeString(undefined, {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) +
        "." +
        String(timestamp.getMilliseconds()).padStart(3, "0")
      : "";
  return { raw, timestamp, timeLabel, message, level: detectLevel(message) };
}

function highlightMatches(text: string, query: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let idx = lower.indexOf(q);
  if (idx === -1) return text;

  const parts: ReactNode[] = [];
  let start = 0;
  let key = 0;
  while (idx !== -1) {
    if (idx > start) parts.push(<span key={key++}>{text.slice(start, idx)}</span>);
    parts.push(
      <mark key={key++} className="rounded-sm bg-yellow-400/90 px-0.5 text-black">
        {text.slice(idx, idx + query.length)}
      </mark>,
    );
    start = idx + query.length;
    idx = lower.indexOf(q, start);
  }
  if (start < text.length) parts.push(<span key={key++}>{text.slice(start)}</span>);
  return parts;
}

const LEVEL_TEXT_CLASS: Record<LogLevel, string> = {
  error: "text-red-400",
  warn: "text-amber-300",
  info: "text-green-400",
};

function LogsOverlay({
  serviceKey,
  label,
  onClose,
}: {
  serviceKey: string;
  label: string;
  onClose: () => void;
}) {
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "warn" | "error">("all");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [tail, setTail] = useState(200);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    function load() {
      return apiFetch<{ lines: string[] }>(`/docker/services/${serviceKey}/logs/?tail=${tail}`)
        .then((data) => {
          if (!cancelled) setRawLines(data.lines);
        })
        .catch((err) => {
          if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load logs");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    void load();
    const id = window.setInterval(() => void load(), LOG_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [serviceKey, tail]);

  const parsed = useMemo(() => rawLines.map(parseLine), [rawLines]);

  const filtered = useMemo(() => {
    const from = fromTime ? new Date(fromTime) : null;
    const to = toTime ? new Date(toTime) : null;
    return parsed.filter((line) => {
      if (from && line.timestamp && line.timestamp < from) return false;
      if (to && line.timestamp && line.timestamp > to) return false;
      if (levelFilter === "error" && line.level !== "error") return false;
      if (levelFilter === "warn" && line.level === "info") return false;
      return true;
    });
  }, [parsed, fromTime, toTime, levelFilter]);

  const matchCount = useMemo(() => {
    if (!search) return 0;
    const q = search.toLowerCase();
    return filtered.filter((line) => line.message.toLowerCase().includes(q)).length;
  }, [filtered, search]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div
        className={cn(
          "flex w-full flex-col rounded-lg border bg-card shadow-xl transition-all",
          expanded ? "h-[calc(100vh-2rem)] max-w-none" : "h-[80vh] max-w-4xl",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-semibold">{label} — logs</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? "Collapse" : "Expand"}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          {search && (
            <span className="text-[11px] text-muted-foreground">
              {matchCount} match{matchCount === 1 ? "" : "es"}
            </span>
          )}

          <div className="flex items-center gap-1">
            {(["all", "warn", "error"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setLevelFilter(level)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  levelFilter === level
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {level === "all" ? "All" : level === "warn" ? "Warnings+" : "Errors"}
              </button>
            ))}
          </div>

          <Input
            type="datetime-local"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            className="h-8 w-[170px] text-xs"
            title="From"
          />
          <span className="text-[11px] text-muted-foreground">to</span>
          <Input
            type="datetime-local"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            className="h-8 w-[170px] text-xs"
            title="To"
          />

          <select
            value={tail}
            onChange={(e) => setTail(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TAIL_OPTIONS.map((n) => (
              <option key={n} value={n}>
                Last {n}
              </option>
            ))}
          </select>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-black"
        >
          {loading && rawLines.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">No log lines match the current filters.</p>
          ) : (
            <div className="font-mono text-[11px] leading-relaxed">
              {filtered.map((line, i) => {
                const isMatch = search && line.message.toLowerCase().includes(search.toLowerCase());
                const dim = search && !isMatch;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3 border-b border-white/5 px-4 py-1 hover:bg-white/5",
                      dim && "opacity-35",
                    )}
                  >
                    {line.timeLabel && (
                      <span className="shrink-0 select-none text-muted-foreground/70">
                        {line.timeLabel}
                      </span>
                    )}
                    <span className={cn("whitespace-pre-wrap break-all", LEVEL_TEXT_CLASS[line.level])}>
                      {highlightMatches(line.message, search)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
