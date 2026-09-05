export const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export interface GroupMessageItem {
  id: string;
  content?: string | null;
  message_type?: "text" | "image" | "audio" | "poll" | "system";
  media_url?: string | null;
  media_mime_type?: string | null;
  audio_duration_seconds?: number | null;
  created_at: string;
  sender_profile_id?: string | null;
  user_id?: string | null;
  profile?: { name?: string | null; avatar_url?: string | null } | null;
  metadata?: {
    reply_to_message_id?: string;
  } | null;
  likes_count?: number;
  is_liked?: boolean;
}

export interface GroupMemberItem {
  member_profile_id: string;
  role: string;
  profile?: { name?: string | null; avatar_url?: string | null } | null;
}
