export interface BusinessDirectThreadPreview {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  business_profile_id: string;
  business_avatar_url: string;
  customer_profile_id: string;
  customer_name: string;
  customer_avatar_url: string;
  counterparty_profile_id: string;
  counterparty_name: string;
  counterparty_avatar_url: string;
  participant_role: "customer" | "business";
  last_message_at: string;
  last_message_text: string;
  unread_count: number;
  blocked_by_me: boolean;
  blocked_by_other: boolean;
  closed_at: string | null;
  created_at: string;
}

export interface BusinessDirectMessage {
  id: string;
  thread_id: string;
  sender_profile_id: string;
  body: string;
  is_removed: boolean;
  created_at: string;
}

export interface BusinessDirectThreadCursor {
  lastMessageAt: string;
  id: string;
}

export interface BusinessDirectMessageCursor {
  createdAt: string;
  id: string;
}

export interface CreateBusinessDirectThreadInput {
  profileId: string;
  businessId: string;
}

export interface SendBusinessDirectMessageInput {
  profileId: string;
  threadId: string;
  body: string;
}

export type BusinessDirectReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "scam"
  | "privacy"
  | "other";
