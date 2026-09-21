import { businessDirectMessagingService } from "../services/BusinessDirectMessagingService";
import type {
  MessagingInboxMessage,
  MessagingInboxProvider,
  MessagingInboxThread,
  MessagingMessageCursor,
  MessagingThreadCursor,
} from "../inboxTypes";

export const businessMessagingProvider: MessagingInboxProvider = {
  id: "business",
  label: "Empresas",

  async listThreads(query) {
    const page = await businessDirectMessagingService.listConversationPreviews({
      profileId: query.profileId,
      limit: query.limit,
      cursor: query.cursor
        ? {
            lastMessageAt: query.cursor.lastMessageAt,
            id: query.cursor.id,
          }
        : null,
      search: query.search,
    });

    return {
      items: page.items.map<MessagingInboxThread>((thread) => ({
        providerId: "business",
        threadId: thread.id,
        title: thread.counterparty_name,
        subtitle:
          thread.participant_role === "business"
            ? "Cliente"
            : thread.business_name,
        avatarUrl: thread.counterparty_avatar_url || null,
        counterpartyProfileId: thread.counterparty_profile_id,
        lastMessageAt: thread.last_message_at,
        lastMessageText: thread.last_message_text,
        unreadCount: thread.unread_count,
        blockedByMe: thread.blocked_by_me,
        blockedByOther: thread.blocked_by_other,
        closedAt: thread.closed_at,
      })),
      nextCursor: page.nextCursor
        ? {
            lastMessageAt: page.nextCursor.lastMessageAt,
            id: page.nextCursor.id,
          } satisfies MessagingThreadCursor
        : null,
    };
  },

  async listMessagePage(query) {
    const page = await businessDirectMessagingService.listMessagePage({
      profileId: query.profileId,
      threadId: query.threadId,
      limit: query.limit,
      cursor: query.cursor
        ? {
            createdAt: query.cursor.createdAt,
            id: query.cursor.id,
          }
        : null,
    });

    return {
      items: page.items.map<MessagingInboxMessage>((message) => ({
        providerId: "business",
        id: message.id,
        threadId: message.thread_id,
        senderProfileId: message.sender_profile_id,
        body: message.body,
        isRemoved: message.is_removed,
        createdAt: message.created_at,
      })),
      nextCursor: page.nextCursor
        ? {
            createdAt: page.nextCursor.createdAt,
            id: page.nextCursor.id,
          } satisfies MessagingMessageCursor
        : null,
    };
  },

  async sendMessage(input) {
    const message = await businessDirectMessagingService.sendMessage({
      profileId: input.profileId,
      threadId: input.threadId,
      body: input.body,
    });

    return {
      providerId: "business",
      id: message.id,
      threadId: message.thread_id,
      senderProfileId: message.sender_profile_id,
      body: message.body,
      isRemoved: message.is_removed,
      createdAt: message.created_at,
    };
  },

  markThreadRead(profileId, threadId) {
    return businessDirectMessagingService.markThreadRead(profileId, threadId);
  },

  subscribeToThread(threadId, callback) {
    return businessDirectMessagingService.subscribeToThread(
      threadId,
      (message) =>
        callback({
          providerId: "business",
          id: message.id,
          threadId: message.thread_id,
          senderProfileId: message.sender_profile_id,
          body: message.body,
          isRemoved: message.is_removed,
          createdAt: message.created_at,
        }),
    );
  },
};
