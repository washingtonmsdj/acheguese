export interface CommunityDirectThreadPreview {
  id: string;
  community_id: string;
  context_post_id: string | null;
  post_title: string;
  post_type: string;
  post_image_url: string;
  other_profile_id: string;
  other_profile_name: string;
  other_profile_avatar: string;
  other_profile_verified: boolean;
  last_message_at: string;
  last_message_text: string;
  unread_count: number;
  blocked_by_me: boolean;
  blocked_by_other: boolean;
  closed_at: string | null;
  created_at: string;
}

export interface CommunityDirectMessage {
  id: string;
  thread_id: string;
  sender_profile_id: string;
  body: string;
  is_removed: boolean;
  created_at: string;
}

export interface CommunityDirectThreadCursor {
  lastMessageAt: string;
  id: string;
}

export interface CommunityDirectMessageCursor {
  createdAt: string;
  id: string;
}

export interface CreateCommunityDirectThreadInput {
  profileId: string;
  communityId: string;
  postId: string;
  recipientProfileId: string;
}

export interface SendCommunityDirectMessageInput {
  profileId: string;
  threadId: string;
  body: string;
}

export type CommunityDirectReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "scam"
  | "privacy"
  | "other";
