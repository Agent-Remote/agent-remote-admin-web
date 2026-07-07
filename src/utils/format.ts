export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function shortId(value: string | null | undefined): string {
  if (!value) return "-";
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

export function tagsText(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "-";
}

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
