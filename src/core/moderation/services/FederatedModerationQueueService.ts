import { z } from "zod";

import { supabase } from "@/integrations/supabase";

export const FEDERATED_MODERATION_DOMAINS = [
  "community_content",
  "classified",
  "vaga",
  "review",
  "ride",
  "group_message",
  "community_direct",
  "community_alert",
  "community_issue",
  "business_profile",
] as const;

export const FEDERATED_MODERATION_STATES = [
  "open",
  "resolved",
  "dismissed",
] as const;

export type FederatedModerationDomain =
  (typeof FEDERATED_MODERATION_DOMAINS)[number];
export type FederatedModerationState =
  (typeof FEDERATED_MODERATION_STATES)[number];

export interface FederatedModerationCursor {
  createdAt: string;
  domain: FederatedModerationDomain;
  reportId: string;
}

export interface FederatedModerationItem {
  domain: FederatedModerationDomain;
  reportId: string;
  targetType: string;
  targetId: string;
  reasonCode: string;
  queueState: FederatedModerationState;
  sourceStatus: string;
  createdAt: string;
  reportCount: number;
}

export interface FederatedModerationPage {
  items: FederatedModerationItem[];
  nextCursor: FederatedModerationCursor | null;
}

const rowSchema = z.object({
  domain: z.enum(FEDERATED_MODERATION_DOMAINS),
  report_id: z.string().uuid(),
  target_type: z.string().min(1).max(80),
  target_id: z.string().uuid(),
  reason_code: z.string().min(1).max(120),
  queue_state: z.enum(FEDERATED_MODERATION_STATES),
  source_status: z.string().min(1).max(80),
  created_at: z.string().datetime({ offset: true }),
  report_count: z.number().int().positive(),
});

const cursorSchema = z.object({
  createdAt: z.string().datetime({ offset: true }),
  domain: z.enum(FEDERATED_MODERATION_DOMAINS),
  reportId: z.string().uuid(),
});

function mapRow(row: z.infer<typeof rowSchema>): FederatedModerationItem {
  return {
    domain: row.domain,
    reportId: row.report_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reasonCode: row.reason_code,
    queueState: row.queue_state,
    sourceStatus: row.source_status,
    createdAt: row.created_at,
    reportCount: row.report_count,
  };
}

class FederatedModerationQueueServiceClass {
  async listPage(input: {
    state?: FederatedModerationState;
    domain?: FederatedModerationDomain;
    cursor?: FederatedModerationCursor | null;
    limit?: number;
  } = {}): Promise<FederatedModerationPage> {
    const limit = Math.min(Math.max(Math.trunc(input.limit ?? 30), 1), 50);
    const cursor = input.cursor ? cursorSchema.parse(input.cursor) : null;

    const { data, error } = await supabase.rpc(
      "list_federated_moderation_queue",
      {
        p_queue_state: input.state ?? "open",
        p_domain: input.domain,
        p_before_created_at: cursor?.createdAt,
        p_before_domain: cursor?.domain,
        p_before_report_id: cursor?.reportId,
        p_limit: limit + 1,
      },
    );

    if (error) throw error;

    const parsedRows = z.array(rowSchema).parse(data ?? []);
    const hasNextPage = parsedRows.length > limit;
    const visibleRows = hasNextPage ? parsedRows.slice(0, limit) : parsedRows;
    const items = visibleRows.map(mapRow);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor:
        hasNextPage && lastItem
          ? {
              createdAt: lastItem.createdAt,
              domain: lastItem.domain,
              reportId: lastItem.reportId,
            }
          : null,
    };
  }
}

export const federatedModerationQueueService =
  new FederatedModerationQueueServiceClass();
