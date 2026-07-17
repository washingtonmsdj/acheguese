export interface CursorPage<TItem, TCursor> {
  items: TItem[];
  nextCursor: TCursor | null;
}

export interface ConversationInboxQuery<TCursor> {
  profileId: string;
  limit?: number;
  cursor?: TCursor | null;
  search?: string;
}

export interface ConversationInboxPort<TPreview, TCursor> {
  listConversationPreviews(
    query: ConversationInboxQuery<TCursor>,
  ): Promise<CursorPage<TPreview, TCursor>>;
}

export interface MessageThreadPort<TMessage, TSendInput> {
  listMessages(threadId: string): Promise<TMessage[]>;
  sendMessage(input: TSendInput): Promise<TMessage | null>;
  markMessagesAsRead(threadId: string): Promise<void>;
}

export interface MessagePageQuery<TCursor> {
  profileId: string;
  threadId: string;
  limit?: number;
  cursor?: TCursor | null;
}

export interface PaginatedMessageThreadPort<TMessage, TCursor> {
  listMessagePage(
    query: MessagePageQuery<TCursor>,
  ): Promise<CursorPage<TMessage, TCursor>>;
}
