import { PostError } from "../types";
import { POST_FEED_CURSOR_POLICY } from "../config/postFeedPolicy";

export interface PostFeedCursor {
  createdAt: string;
  id?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= POST_FEED_CURSOR_POLICY.timestampCharacterCapacity &&
    Number.isFinite(Date.parse(value))
  );
}

function decodeBase64Cursor(value: string): unknown {
  if (
    value.length === 0 ||
    value.length > POST_FEED_CURSOR_POLICY.encodedCursorCharacterCapacity
  ) {
    throw new Error("invalid_cursor_length");
  }
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) {
    throw new Error("invalid_cursor_encoding");
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return JSON.parse(json);
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Decodes current opaque cursors and accepts the former timestamp-only forms
 * during the cache transition. New cursors always include the unique post id.
 */
export function decodePostFeedCursor(cursor: string): PostFeedCursor {
  try {
    if (isValidTimestamp(cursor)) {
      return { createdAt: cursor };
    }

    const decoded = decodeBase64Cursor(cursor);
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      throw new Error("invalid_cursor_shape");
    }

    const record = decoded as { created_at?: unknown; id?: unknown };
    if (!isValidTimestamp(record.created_at)) {
      throw new Error("invalid_cursor_timestamp");
    }
    if (
      record.id !== undefined &&
      (typeof record.id !== "string" || !UUID_PATTERN.test(record.id))
    ) {
      throw new Error("invalid_cursor_id");
    }

    return {
      createdAt: record.created_at,
      id: typeof record.id === "string" ? record.id : undefined,
    };
  } catch {
    throw new PostError("Invalid cursor", "INVALID_CURSOR", 400);
  }
}

export function encodePostFeedCursor(cursor: Required<PostFeedCursor>): string {
  return encodeBase64Url(
    JSON.stringify({ created_at: cursor.createdAt, id: cursor.id }),
  );
}

export function postFeedKeysetFilter(cursor: PostFeedCursor): string | null {
  if (!cursor.id) return null;
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
}
