import type {
  Notification,
  NotificationCategory,
  NotificationMetadata,
  NotificationPriority,
} from "../types";

const PRIORITIES = new Set<NotificationPriority>(["low", "medium", "high", "urgent"]);
const CATEGORIES = new Set<NotificationCategory>([
  "transactional",
  "social",
  "system",
  "marketing",
]);

function normalizePriority(value: unknown): NotificationPriority {
  return typeof value === "string" && PRIORITIES.has(value as NotificationPriority)
    ? (value as NotificationPriority)
    : "medium";
}

function normalizeCategory(value: unknown): NotificationCategory {
  return typeof value === "string" && CATEGORIES.has(value as NotificationCategory)
    ? (value as NotificationCategory)
    : "social";
}

function normalizeMetadata(value: unknown, alternateValue: unknown): NotificationMetadata {
  const candidate = value ?? alternateValue;
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
    category: normalizeCategory(record.category),
    title: typeof record.title === "string" ? record.title : "",
    message: typeof record.message === "string" ? record.message : "",
    read: record.read === true || record.is_read === true,
    priority: normalizePriority(record.priority),
    metadata: normalizeMetadata(record.metadata, record.data),
    action_url: typeof record.action_url === "string" ? record.action_url : undefined,
    action_label:
      typeof record.action_label === "string" ? record.action_label : undefined,
    created_at: typeof record.created_at === "string" ? record.created_at : "",
    updated_at:
      typeof record.updated_at === "string" ? record.updated_at : undefined,
    deleted_at: typeof record.deleted_at === "string" ? record.deleted_at : null,
    read_at: typeof record.read_at === "string" ? record.read_at : undefined,
  };
}
