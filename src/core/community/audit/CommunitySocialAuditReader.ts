import { z } from "zod";

import type {
  AuditEvent,
  AuditEventReader,
  AuditMetadata,
  AuditPage,
  AuditReadRequest,
} from "@/core/audit";
import { supabase } from "@/integrations/supabase";

const metadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

function isAuditAction(value: string): boolean {
  const segments = value.split(".");
  if (segments.length > 3) return false;

  return segments.every((segment) => {
    if (segment.length === 0) return false;
    const firstCode = segment.charCodeAt(0);
    if (firstCode < 97 || firstCode > 122) return false;

    for (let index = 1; index < segment.length; index += 1) {
      const code = segment.charCodeAt(index);
      const isLowercaseLetter = code >= 97 && code <= 122;
      const isDigit = code >= 48 && code <= 57;
      if (!isLowercaseLetter && !isDigit && code !== 95) return false;
    }

    return true;
  });
}

const auditRowSchema = z
  .object({
    id: z.string().uuid(),
    actor_user_id: z.string().uuid().nullable(),
    actor_profile_id: z.string().uuid().nullable(),
    action: z.string().min(1).max(80).refine(isAuditAction, {
      message: "Invalid community audit action",
    }),
    target_type: z.string().min(1).max(80),
    target_id: z.string().uuid(),
    location_id: z.string().uuid().nullable(),
    metadata: z.record(z.string(), metadataValueSchema),
    created_at: z.string().datetime({ offset: true }),
  })
  .strict();

const cursorSchema = z
  .object({
    occurredAt: z.string().datetime({ offset: true }),
    eventId: z.string().uuid(),
  })
  .strict();

function mapAuditEvent(row: z.infer<typeof auditRowSchema>): AuditEvent {
  return {
    id: row.id,
    source: "community.social",
    actor: {
      userId: row.actor_user_id,
      profileId: row.actor_profile_id,
    },
    action: row.action,
    target: {
      type: row.target_type,
      id: row.target_id,
    },
    territoryId: row.location_id,
    metadata: row.metadata as AuditMetadata,
    dataClass: "pseudonymous",
    retentionClass: "security",
    occurredAt: row.created_at,
  };
}

class CommunitySocialAuditReader implements AuditEventReader {
  async readPage(request: AuditReadRequest = {}): Promise<AuditPage> {
    const limit = Math.min(Math.max(Math.trunc(request.limit ?? 30), 1), 50);
    const cursor = request.cursor ? cursorSchema.parse(request.cursor) : null;

    const { data, error } = await supabase.rpc(
      "list_community_social_audit_events",
      {
        p_before_created_at: cursor?.occurredAt,
        p_before_id: cursor?.eventId,
        p_limit: limit + 1,
      },
    );

    if (error) throw error;

    const rows = z.array(auditRowSchema).parse(data ?? []);
    const hasNextPage = rows.length > limit;
    const visibleRows = hasNextPage ? rows.slice(0, limit) : rows;
    const items = visibleRows.map(mapAuditEvent);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor:
        hasNextPage && lastItem
          ? {
              occurredAt: lastItem.occurredAt,
              eventId: lastItem.id,
            }
          : null,
    };
  }
}

export const communitySocialAuditReader = new CommunitySocialAuditReader();
