/**
 * Notification types
 */
export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "mention"
  | "system"
  | "alert"
  | "message";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  sender_profile_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  target_id?: string;
  target_type?: string;
  data?: Record<string, unknown>;
}
