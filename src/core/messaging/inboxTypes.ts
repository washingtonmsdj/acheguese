import type { RealtimeSubscription } from "@/core/realtime";
import type { CursorPage } from "./contracts";

export type MessagingProviderId =
  | "business"
  | "classifieds"
  | "community";

export interface MessagingThreadCursor {
  lastMessageAt: string;
  id: string;
}

export interface MessagingMessageCursor {
  createdAt: string;
  id: string;
}

export interface MessagingInboxThread {
  providerId: MessagingProviderId;
  threadId: string;
  title: string;
  subtitle: string | null;
  avatarUrl: string | null;
  counterpartyProfileId: string;
  lastMessageAt: string;
  lastMessageText: string;
  unreadCount: number;
  blockedByMe: boolean;
  blockedByOther: boolean;
  closedAt: string | null;
}

export interface MessagingInboxMessage {
  providerId: MessagingProviderId;
  id: string;
  threadId: string;
  senderProfileId: string;
  body: string;
  isRemoved: boolean;
  createdAt: string;
}

export interface MessagingInboxQuery {
  profileId: string;
  limit?: number;
  cursor?: MessagingThreadCursor | null;
  search?: string;
}

export interface MessagingMessagePageQuery {
  profileId: string;
  threadId: string;
  limit?: number;
  cursor?: MessagingMessageCursor | null;
}

export interface MessagingSendInput {
  profileId: string;
  threadId: string;
  body: string;
}

export interface MessagingInboxProvider {
  readonly id: MessagingProviderId;
  readonly label: string;

  listThreads(
    query: MessagingInboxQuery,
  ): Promise<CursorPage<MessagingInboxThread, MessagingThreadCursor>>;

  listMessagePage(
    query: MessagingMessagePageQuery,
  ): Promise<CursorPage<MessagingInboxMessage, MessagingMessageCursor>>;

  sendMessage(input: MessagingSendInput): Promise<MessagingInboxMessage>;

  markThreadRead(profileId: string, threadId: string): Promise<void>;

  subscribeToThread(
    threadId: string,
    callback: (message: MessagingInboxMessage) => void,
  ): RealtimeSubscription;
}
