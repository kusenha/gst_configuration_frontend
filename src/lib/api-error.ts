const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
  400: "We couldn't process that request. Please check the details and try again.",
  401: "You need to sign in to continue.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with existing data. Please refresh and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again shortly.",
  502: "Something went wrong on our end. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The server took too long to respond. Please try again.",
};

function fallbackMessageForStatus(status: number): string {
  return (
    STATUS_FALLBACK_MESSAGES[status] ?? `Something went wrong. Please try again. (Error ${status})`
  );
}

function humanizeFieldName(field: string): string {
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  if (!spaced) return "";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function flattenErrorValue(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenErrorValue);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(flattenErrorValue);
  }
  return [];
}

export function extractApiErrorMessage(status: number, rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return fallbackMessageForStatus(status);

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return trimmed.length < 200 ? trimmed : fallbackMessageForStatus(status);
  }

  if (typeof parsed === "string" && parsed.trim()) return parsed;

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;

    if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
    if (record.detail !== undefined) {
      const messages = flattenErrorValue(record.detail);
      if (messages.length) return messages.join(" ");
    }

    const fieldMessages = Object.entries(record)
      .filter(([key]) => key !== "detail")
      .flatMap(([key, value]) => {
        const messages = flattenErrorValue(value);
        if (!messages.length) return [];
        const label = humanizeFieldName(key);
        return [label ? `${label}: ${messages.join(" ")}` : messages.join(" ")];
      });

    if (fieldMessages.length) return fieldMessages.join(" ");
  }

  return fallbackMessageForStatus(status);
}
