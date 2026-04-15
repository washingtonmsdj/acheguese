export type ActivityType =
  | "post_created"
  | "comment_created"
  | "post_liked"
  | "comment_liked"
  | "post_saved"
  | "poll_voted"
  | "alert_confirmed"
  | "mention_received";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  created_at: string;
  metadata?: ActivityMetadata;
  metadate?: ActivityMetadata;
}

export type ActivityMetadata =
  | PostCreatedMetadate
  | CommentCreatedMetadate
  | PostLikedMetadate
  | CommentLikedMetadate
  | PostSavedMetadate
  | PollVotedMetadate
  | AlertConfirmedMetadate
  | MentionReceivedMetadate;

export type ActivityMetadate = ActivityMetadata;

export interface PostCreatedMetadate {
  post_id: string;
  post_type: string;
  post_content: string;
  likes_count: number;
  comments_count: number;
}

export interface CommentCreatedMetadate {
  comment_id: string;
  post_id: string;
  post_type: string;
  comment_content: string;
  likes_count: number;
}

export interface PostLikedMetadate {
  post_id: string;
  post_type: string;
  post_content: string;
  author_profile_id: string;
  author_name: string;
  author_avatar: string;
}

export interface CommentLikedMetadate {
  comment_id: string;
  post_id: string;
  comment_content: string;
  author_profile_id: string;
  author_name: string;
  author_avatar: string;
}

export interface PostSavedMetadate {
  post_id: string;
  post_type: string;
  post_content: string;
  author_profile_id: string;
  author_name: string;
  author_avatar: string;
}

export interface PollVotedMetadate {
  poll_id: string;
  post_id: string;
  question: string;
  option_text: string;
}

export interface AlertConfirmedMetadate {
  post_id: string;
  alert_content: string;
  confirmations_count: number;
}

export interface MentionReceivedMetadate {
  post_id: string;
  post_type: string;
  post_content: string;
  author_profile_id: string;
  author_name: string;
  author_avatar: string;
  rank?: number;
}

export interface ActivityFilters {
  types?: ActivityType[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ActivityStats {
  total_posts: number;
  total_comments: number;
  total_likes_given: number;
  total_likes_received: number;
  total_saves: number;
  total_poll_votes: number;
  total_alert_confirmations: number;
  total_mentions: number;
}
