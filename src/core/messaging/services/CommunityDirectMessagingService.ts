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
  CommunityDirectMessage,
  CommunityDirectMessageCursor,
  CommunityDirectReportReason,
  CommunityDirectThreadCursor,
  CommunityDirectThreadPreview,
  CreateCommunityDirectThreadInput,
  SendCommunityDirectMessageInput,
} from "../communityDirectTypes";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const threadPreviewSchema = z.object({
  id: z.string().uuid(),
  community_id: z.string().uuid(),
  context_post_id: z.string().uuid().nullable(),
  post_title: z.string(),
  post_type: z.string(),
  post_image_url: z.string(),
  other_profile_id: z.string().uuid(),
  other_profile_name: z.string(),
  other_profile_avatar: z.string(),
  other_profile_verified: z.boolean(),
  last_message_at: z.string().datetime({ offset: true }),
  last_message_text: z.string(),
  unread_count: z.number().int().nonnegative(),
  blocked_by_me: z.boolean(),
  blocked_by_other: z.boolean(),
  closed_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
});

const messageSchema = z.object({
  id: z.string().uuid(),
  thread_id: z.string().uuid(),
  sender_profile_id: z.string().uuid(),
  body: z.string(),
  is_removed: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
});

function requireUuid(value: string, label: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`Invalid Community Direct Messaging ${label}`);
  }
}

function toThreadPreview(
  row: z.infer<typeof threadPreviewSchema>,
): CommunityDirectThreadPreview {
  return {
    id: row.id!,
    community_id: row.community_id!,
    context_post_id: row.context_post_id ?? null,
    post_title: row.post_title!,
    post_type: row.post_type!,
    post_image_url: row.post_image_url!,
    other_profile_id: row.other_profile_id!,
    other_profile_name: row.other_profile_name!,
    other_profile_avatar: row.other_profile_avatar!,
    other_profile_verified: row.other_profile_verified!,
    last_message_at: row.last_message_at!,
    last_message_text: row.last_message_text!,
    unread_count: row.unread_count!,
    blocked_by_me: row.blocked_by_me!,
    blocked_by_other: row.blocked_by_other!,
    closed_at: row.closed_at ?? null,
    created_at: row.created_at!,
  };
}

function toMessage(row: z.infer<typeof messageSchema>): CommunityDirectMessage {
  return {
    id: row.id!,
    thread_id: row.thread_id!,
    sender_profile_id: row.sender_profile_id!,
    body: row.body!,
    is_removed: row.is_removed!,
    created_at: row.created_at!,
  };
}

function requireCursor(
  cursor: { id: string; timestamp: string } | null,
  label: string,
): void {
  if (!cursor) return;
  if (
    !UUID_PATTERN.test(cursor.id) ||
    Number.isNaN(new Date(cursor.timestamp).getTime())
  ) {
    throw new Error(`Invalid Community Direct Messaging ${label} cursor`);
  }
}

export class CommunityDirectMessagingService
  implements
    ConversationInboxPort<
      CommunityDirectThreadPreview,
      CommunityDirectThreadCursor
    >,
    PaginatedMessageThreadPort<
      CommunityDirectMessage,
      CommunityDirectMessageCursor
    >
{
  async createOrGetThread(
    input: CreateCommunityDirectThreadInput,
  ): Promise<string> {
    requireUuid(input.profileId, "Profile ID");
    requireUuid(input.communityId, "Community ID");
    requireUuid(input.postId, "Post ID");
    requireUuid(input.recipientProfileId, "recipient Profile ID");

    const { data, error } = await supabase.rpc(
      "create_community_direct_thread",
      {
        p_profile_id: input.profileId,
        p_community_id: input.communityId,
        p_post_id: input.postId,
        p_recipient_profile_id: input.recipientProfileId,
      },
    );
    if (error) {
      trackError(error, {
        component: "CommunityDirectMessagingService",
        action: "createOrGetThread",
      });
      throw error;
    }
    if (!data || !UUID_PATTERN.test(data)) {
      throw new Error("Invalid Community Direct Messaging thread response");
    }
    return data;
  }

  async listConversationPreviews(
    query: ConversationInboxQuery<CommunityDirectThreadCursor>,
  ): Promise<
    CursorPage<CommunityDirectThreadPreview, CommunityDirectThreadCursor>
  > {
    requireUuid(query.profileId, "Profile ID");
    const limit = Math.min(Math.max(query.limit ?? 30, 1), 50);
    const search = query.search?.trim() || null;
    if (search && search.length > 100) {
      throw new Error(
        "Community Direct Messaging search exceeds 100 characters",
      );
    }
    requireCursor(
      query.cursor
        ? {
            id: query.cursor.id,
            timestamp: query.cursor.lastMessageAt,
          }
        : null,
      "thread",
    );

    const { data, error } = await supabase.rpc(
      "list_community_direct_thread_previews",
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
        component: "CommunityDirectMessagingService",
        action: "listConversationPreviews",
      });
      throw error;
    }

    const parsed = z.array(threadPreviewSchema).safeParse(data ?? []);
    if (!parsed.success) {
      trackError(parsed.error, {
        component: "CommunityDirectMessagingService",
        action: "validateConversationPreviews",
      });
      throw new Error("Invalid Community Direct Messaging inbox response");
    }

    const hasNextPage = parsed.data.length > limit;
    const items = (hasNextPage ? parsed.data.slice(0, limit) : parsed.data).map(
      toThreadPreview,
    );
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
    query: MessagePageQuery<CommunityDirectMessageCursor>,
  ): Promise<CursorPage<CommunityDirectMessage, CommunityDirectMessageCursor>> {
    requireUuid(query.profileId, "Profile ID");
    requireUuid(query.threadId, "thread ID");
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 50);
    requireCursor(
      query.cursor
        ? { id: query.cursor.id, timestamp: query.cursor.createdAt }
        : null,
      "message",
    );

    const { data, error } = await supabase.rpc(
      "list_community_direct_messages",
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
        component: "CommunityDirectMessagingService",
        action: "listMessagePage",
      });
      throw error;
    }

    const parsed = z.array(messageSchema).safeParse(data ?? []);
    if (!parsed.success) {
      trackError(parsed.error, {
        component: "CommunityDirectMessagingService",
        action: "validateMessagePage",
      });
      throw new Error("Invalid Community Direct Messaging message response");
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
    input: SendCommunityDirectMessageInput,
  ): Promise<CommunityDirectMessage> {
    requireUuid(input.profileId, "Profile ID");
    requireUuid(input.threadId, "thread ID");
    const body = input.body.trim();
    if (!body || body.length > 4000) {
      throw new Error("Invalid Community Direct Messaging message body");
    }

    const { data, error } = await supabase.rpc(
      "send_community_direct_message",
      {
        p_profile_id: input.profileId,
        p_thread_id: input.threadId,
        p_body: body,
      },
    );
    if (error) {
      trackError(error, {
        component: "CommunityDirectMessagingService",
        action: "sendMessage",
        metadata: { threadId: input.threadId },
      });
      throw error;
    }

    const parsed = z.array(messageSchema).safeParse(data ?? []);
    const message =
      parsed.success && parsed.data[0] ? toMessage(parsed.data[0]) : undefined;
    if (!message) {
      if (!parsed.success) {
        trackError(parsed.error, {
          component: "CommunityDirectMessagingService",
          action: "validateSentMessage",
        });
      }
      throw new Error("Invalid Community Direct Messaging send response");
    }
    return message;
  }

  async markThreadRead(profileId: string, threadId: string): Promise<void> {
    requireUuid(profileId, "Profile ID");
    requireUuid(threadId, "thread ID");
    const { error } = await supabase.rpc("mark_community_direct_thread_read", {
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
      "set_community_direct_thread_blocked",
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
    reason: CommunityDirectReportReason;
    description?: string;
  }): Promise<string> {
    requireUuid(input.profileId, "Profile ID");
    requireUuid(input.threadId, "thread ID");
    if (input.messageId) requireUuid(input.messageId, "message ID");
    if (input.description && input.description.length > 1000) {
      throw new Error(
        "Community Direct Messaging report exceeds 1000 characters",
      );
    }

    const { data, error } = await supabase.rpc(
      "report_community_direct_thread",
      {
        p_profile_id: input.profileId,
        p_thread_id: input.threadId,
        p_message_id: input.messageId ?? null,
        p_reason: input.reason,
        p_description: input.description?.trim() || null,
      },
    );
    if (error) {
      trackError(error, {
        component: "CommunityDirectMessagingService",
        action: "reportThread",
        metadata: { threadId: input.threadId, reason: input.reason },
      });
      throw error;
    }
    if (!data || !UUID_PATTERN.test(data)) {
      throw new Error("Invalid Community Direct Messaging report response");
    }
    return data;
  }

  subscribeToMessages(
    threadId: string,
    callback: (message: CommunityDirectMessage) => void,
  ): RealtimeSubscription {
    requireUuid(threadId, "thread ID");
    return realtimeService.subscribeToCommunityDirectMessages(
      threadId,
      (row) => {
        const parsed = messageSchema.safeParse(row);
        if (parsed.success) callback(toMessage(parsed.data));
      },
    );
  }
}

export const communityDirectMessagingService =
  new CommunityDirectMessagingService();
