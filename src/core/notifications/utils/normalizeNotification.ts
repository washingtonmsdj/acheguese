import type { Notification, NotificationMetadata, NotificationPriority } from "../types";

const PRIORITIES = new Set<NotificationPriority>(["low", "medium", "high", "urgent"]);

function normalizePriority(value: unknown): NotificationPriority {
  return typeof value === "string" && PRIORITIES.has(value as NotificationPriority)
    ? (value as NotificationPriority)
    : "medium";
}

function normalizeMetadata(value: unknown, legacyValue: unknown): NotificationMetadata {
  const candidate = value ?? legacyValue;
  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    return candidate as NotificationMetadata;
  }
  return {};
}

export function normalizeNotification(record: Record<string, unknown>): Notification {
  return {
    id: String(record.id ?? ""),
    user_id: String(record.user_id ?? ""),
    type: typeof record.type === "string" ? record.type : "system",
    title: typeof record.title === "string" ? record.title : "",
    message: typeof record.message === "string" ? record.message : "",
    read: Boolean(record.read ?? record.is_read ?? false),
    priority: normalizePriority(record.priority),
    metadata: normalizeMetadata(record.metadata, record.data),
    created_at: typeof record.created_at === "string" ? record.created_at : "",
    updated_at: typeof record.updated_at === "string" ? record.updated_at : "",
    deleted_at: typeof record.deleted_at === "string" ? record.deleted_at : null,
    read_at: typeof record.read_at === "string" ? record.read_at : null,
  };
}
