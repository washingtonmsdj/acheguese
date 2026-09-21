import { z } from "zod";

import { supabase } from "@/integrations/supabase";
import { realtimeService, type RealtimeSubscription } from "@/core/realtime";
import { trackError } from "@/shared/utils/errorTracking";
import type {
  ConversationInboxPort,
  ConversationInboxQuery,
  CursorPage,
  MessagePageQuery,
  PaginatedMessageThreadPort,
} from "../contracts";
import type {
  BusinessDirectMessage,
  BusinessDirectMessageCursor,
  BusinessDirectReportReason,
  BusinessDirectThreadCursor,
  BusinessDirectThreadPreview,
  CreateBusinessDirectThreadInput,
  SendBusinessDirectMessageInput,
} from "../businessDirectTypes";

const uuidSchema = z.string().uuid();

const threadPreviewSchema = z.object({
  id: uuidSchema,
  business_id: uuidSchema,
  business_name: z.string(),
  business_slug: z.string(),
  business_profile_id: uuidSchema,
  business_avatar_url: z.string(),
  customer_profile_id: uuidSchema,
  customer_name: z.string(),
  customer_avatar_url: z.string(),
  counterparty_profile_id: uuidSchema,
  counterparty_name: z.string(),
  counterparty_avatar_url: z.string(),
  participant_role: z.enum(["customer", "business"]),
  last_message_at: z.string().datetime({ offset: true }),
  last_message_text: z.string(),
  unread_count: z.number().int().nonnegative(),
  blocked_by_me: z.boolean(),
  blocked_by_other: z.boolean(),
  closed_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
}).required();

const messageSchema = z.object({
  id: uuidSchema,
  thread_id: uuidSchema,
  sender_profile_id: uuidSchema,
  body: z.string(),
  is_removed: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
}).required();

function requireUuid(value: string, label: string): void {
  if (!uuidSchema.safeParse(value).success) {
    throw new Error(`Invalid Business Direct Messaging ${label}`);
  }
}

function requireTimestamp(value: string, label: string): void {
  if (Number.isNaN(new Date(value).getTime())) {
    throw new Error(`Invalid Business Direct Messaging ${label}`);
  }
}

function toPreview(
  row: z.infer<typeof threadPreviewSchema>,
): BusinessDirectThreadPreview {
  return row;
}

function toMessage(
  row: z.infer<typeof messageSchema>,
): BusinessDirectMessage {
  return row;
}

export class BusinessDirectMessagingService
  implements
    ConversationInboxPort<BusinessDirectThreadPreview, BusinessDirectThreadCursor>,
    PaginatedMessageThreadPort<BusinessDirectMessage, BusinessDirectMessageCursor>
{
  async createOrGetThread(
    input: CreateBusinessDirectThreadInput,
  ): Promise<string> {
    requireUuid(input.profileId, "Profile ID");
    requireUuid(input.businessId, "Business ID");

    const { data, error } = await supabase.rpc(
      "create_business_direct_thread",
      {
        p_profile_id: input.profileId,
        p_business_id: input.businessId,
      },
    );

    if (error) {
      trackError(error, {
        component: "BusinessDirectMessagingService",
        action: "createOrGetThread",
      });
      throw error;
    }

    const parsed = uuidSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid Business Direct Messaging thread response");
    }
    return parsed.data;
  }

  async listConversationPreviews(
    query: ConversationInboxQuery<BusinessDirectThreadCursor>,
  ): Promise<CursorPage<BusinessDirectThreadPreview, BusinessDirectThreadCursor>> {
    requireUuid(query.profileId, "Profile ID");

    const limit = Math.min(Math.max(query.limit ?? 30, 1), 50);
    const search = query.search?.trim() || null;
    if (search && search.length > 100) {
      throw new Error("Business Direct Messaging search exceeds 100 characters");
    }
    if (query.cursor) {
      requireUuid(query.cursor.id, "thread cursor ID");
      requireTimestamp(query.cursor.lastMessageAt, "thread cursor timestamp");
    }

    const { data, error } = await supabase.rpc(
      "list_business_direct_thread_previews",
      {
        p_profile_id: query.profileId,
        p_limit: limit + 1,
        p_cursor_last_message_at: query.cursor?.lastMessageAt ?? null,
        p_cursor_id: query.cursor?.id ?? null,
        p_search: search,
      },
    );

    if (error) {
      trackError(error, {
        component: "BusinessDirectMessagingService",
        action: "listConversationPreviews",
      });
      throw error;
    }

    const parsed = z.array(threadPreviewSchema).safeParse(data ?? []);
    if (!parsed.success) {
      trackError(parsed.error, {
        component: "BusinessDirectMessagingService",
        action: "validateConversationPreviews",
      });
      throw new Error("Invalid Business Direct Messaging inbox response");
    }

    const hasNextPage = parsed.data.length > limit;
    const rows = hasNextPage ? parsed.data.slice(0, limit) : parsed.data;
    const items = rows.map(toPreview);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor:
        hasNextPage && lastItem
          ? { lastMessageAt: lastItem.last_message_at, id: lastItem.id }
          : null,
    };
  }

  async listMessagePage(
    query: MessagePageQuery<BusinessDirectMessageCursor>,
  ): Promise<CursorPage<BusinessDirectMessage, BusinessDirectMessageCursor>> {
    requireUuid(query.profileId, "Profile ID");
    requireUuid(query.threadId, "thread ID");

    const limit = Math.min(Math.max(query.limit ?? 50, 1), 50);
    if (query.cursor) {
      requireUuid(query.cursor.id, "message cursor ID");
      requireTimestamp(query.cursor.createdAt, "message cursor timestamp");
    }

    const { data, error } = await supabase.rpc(
      "list_business_direct_messages",
      {
        p_profile_id: query.profileId,
        p_thread_id: query.threadId,
        p_limit: limit + 1,
        p_cursor_created_at: query.cursor?.createdAt ?? null,
        p_cursor_id: query.cursor?.id ?? null,
      },
    );

    if (error) {
      trackError(error, {
        component: "BusinessDirectMessagingService",
        action: "listMessagePage",
      });
      throw error;
    }

    const parsed = z.array(messageSchema).safeParse(data ?? []);
    if (!parsed.success) {
      trackError(parsed.error, {
        component: "BusinessDirectMessagingService",
        action: "validateMessagePage",
      });
      throw new Error("Invalid Business Direct Messaging message response");
    }

    const hasNextPage = parsed.data.length > limit;
    const newestFirst = (
      hasNextPage ? parsed.data.slice(0, limit) : parsed.data
    ).map(toMessage);
    const oldestItem = newestFirst.at(-1);

    return {
      items: [...newestFirst].reverse(),
      nextCursor:
        hasNextPage && oldestItem
          ? { createdAt: oldestItem.created_at, id: oldestItem.id }
          : null,
    };
  }

  async sendMessage(
    input: SendBusinessDirectMessageInput,
  ): Promise<BusinessDirectMessage> {
    requireUuid(input.profileId, "Profile ID");
    requireUuid(input.threadId, "thread ID");

    const body = input.body.trim();
    if (!body || body.length > 4000) {
      throw new Error("Invalid Business Direct Messaging message body");
    }

    const { data, error } = await supabase.rpc(
      "send_business_direct_message",
      {
        p_profile_id: input.profileId,
        p_thread_id: input.threadId,
        p_body: body,
      },
    );

    if (error) {
      trackError(error, {
        component: "BusinessDirectMessagingService",
        action: "sendMessage",
        metadata: { threadId: input.threadId },
      });
      throw error;
    }

    const parsed = z.array(messageSchema).safeParse(data ?? []);
    const message =
      parsed.success && parsed.data[0] ? toMessage(parsed.data[0]) : null;
    if (!message) {
      if (!parsed.success) {
        trackError(parsed.error, {
          component: "BusinessDirectMessagingService",
          action: "validateSentMessage",
        });
      }
      throw new Error("Invalid Business Direct Messaging send response");
    }
    return message;
  }

  async markThreadRead(profileId: string, threadId: string): Promise<void> {
    requireUuid(profileId, "Profile ID");
    requireUuid(threadId, "thread ID");

    const { error } = await supabase.rpc("mark_business_direct_thread_read", {
      p_profile_id: profileId,
      p_thread_id: threadId,
    });
    if (error) throw error;
  }

  async setThreadBlocked(
    profileId: string,
    threadId: string,
    blocked: boolean,
    reason = "user_blocked",
  ): Promise<void> {
    requireUuid(profileId, "Profile ID");
    requireUuid(threadId, "thread ID");

    const { error } = await supabase.rpc(
      "set_business_direct_thread_blocked",
      {
        p_profile_id: profileId,
        p_thread_id: threadId,
        p_blocked: blocked,
        p_reason: blocked ? reason : null,
      },
    );
    if (error) throw error;
  }

  async reportThread(input: {
    profileId: string;
    threadId: string;
    messageId?: string;
    reason: BusinessDirectReportReason;
    description?: string;
  }): Promise<string> {
    requireUuid(input.profileId, "Profile ID");
    requireUuid(input.threadId, "thread ID");
    if (input.messageId) requireUuid(input.messageId, "message ID");
    if (input.description && input.description.length > 1000) {
      throw new Error("Business Direct Messaging report exceeds 1000 characters");
    }

    const { data, error } = await supabase.rpc(
      "report_business_direct_thread",
      {
        p_profile_id: input.profileId,
        p_thread_id: input.threadId,
        p_message_id: input.messageId ?? null,
        p_reason: input.reason,
        p_description: input.description?.trim() || null,
      },
    );
    if (error) throw error;

    const parsed = uuidSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid Business Direct Messaging report response");
    }
    return parsed.data;
  }

  subscribeToThread(
    threadId: string,
    callback: (message: BusinessDirectMessage) => void,
  ): RealtimeSubscription {
    requireUuid(threadId, "thread ID");

    return realtimeService.subscribeToBusinessDirectMessages(
      threadId,
      (row) => {
        const parsed = messageSchema.safeParse(row);
        if (parsed.success) callback(toMessage(parsed.data));
      },
    );
  }
}

export const businessDirectMessagingService =
  new BusinessDirectMessagingService();
