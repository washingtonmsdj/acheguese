import { supabase } from "@/integrations/supabase";
import type {
  ProfileLikeActivityRecord,
  ProfilePollVoteActivityRecord,
  ProfileSaveActivityRecord,
} from "./types";
import type { MentionRow } from "./profile.service.types";

export async function getUserMentionsQuery(
  userId: string,
  from: number,
  to: number,
): Promise<ProfileLikeActivityRecord[]> {
  const { data, error } = await (supabase as any)
    .from("community_post_mentions")
    .select(
      `
      id, rank, created_at,
      post:posts!inner (
        id, type, content, created_at, likes_count, comments_count,
        author:profiles!posts_author_id_fkey (id, name, avatar_url)
      )
    `,
    )
    .eq("mentioned_profile_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return [];
  return ((data as MentionRow[] | null) || []).map((mention) => ({
    id: mention.id,
    rank: mention.rank,
    created_at: mention.created_at,
    post: {
      id: mention.post.id,
      type: mention.post.type,
      content: mention.post.content,
      created_at: mention.post.created_at,
      likes_count: mention.post.likes_count,
      comments_count: mention.post.comments_count,
      author: mention.post.author,
    },
  }));
}

export async function getUserLikeActivityQuery(
  likerProfileId: string,
  from: number,
  to: number,
): Promise<ProfileLikeActivityRecord[]> {
  const { data, error } = await supabase
    .from("post_likes_new")
    .select(
      `id, created_at,
      post:posts!post_likes_new_post_id_fkey(
        id, type, content,
        author:profiles!posts_author_profile_id_fkey(id, name, avatar_url)
      )`,
    )
    .eq("liker_profile_id", likerProfileId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return [];
  return ((data ?? []) as unknown) as ProfileLikeActivityRecord[];
}

export async function getUserSaveActivityQuery(
  saverProfileId: string,
  from: number,
  to: number,
): Promise<ProfileSaveActivityRecord[]> {
  const { data, error } = await supabase
    .from("saved_posts_new")
    .select(
      `id, created_at,
      post:posts!saved_posts_new_post_id_fkey(
        id, type, content,
        author:profiles!posts_author_profile_id_fkey(id, name, avatar_url)
      )`,
    )
    .eq("saver_profile_id", saverProfileId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return [];
  return data || [];
}

export async function getUserPollVoteActivityQuery(
  userId: string,
  from: number,
  to: number,
): Promise<ProfilePollVoteActivityRecord[]> {
  const { data, error } = await (supabase as any)
    .from("community_poll_votes")
    .select(
      `
      id, option_id, created_at,
      poll:community_polls!inner(id, question, options, post_id)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return [];
  return ((data ?? []) as unknown) as ProfilePollVoteActivityRecord[];
}
