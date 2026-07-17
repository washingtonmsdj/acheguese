import { supabase } from "@/integrations/supabase";
import type {
  ProfileLikeActivityRecord,
  ProfilePollVoteActivityRecord,
  ProfileSaveActivityRecord,
} from "@/core/profiles/views/ProfileActivityRecords";

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  range: (from: number, to: number) => QueryBuilder<TRow>;
}

interface ProfileActivityDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const profileActivityDb = supabase as unknown as ProfileActivityDbClient;

type PollVoteActivityRow = ProfilePollVoteActivityRecord;
type LikeActivityRow = ProfileLikeActivityRecord;
type SaveActivityRow = ProfileSaveActivityRecord;

export async function getUserLikeActivityQuery(
  likerProfileId: string,
  from: number,
  to: number,
): Promise<ProfileLikeActivityRecord[]> {
  const { data, error } = await profileActivityDb
    .from<LikeActivityRow>("post_likes_new")
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
  return data ?? [];
}

export async function getUserSaveActivityQuery(
  saverProfileId: string,
  from: number,
  to: number,
): Promise<ProfileSaveActivityRecord[]> {
  const { data, error } = await profileActivityDb
    .from<SaveActivityRow>("saved_posts_new")
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
  return data ?? [];
}

export async function getUserPollVoteActivityQuery(
  userId: string,
  from: number,
  to: number,
): Promise<ProfilePollVoteActivityRecord[]> {
  const { data, error } = await profileActivityDb
    .from<PollVoteActivityRow>("community_poll_votes")
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
  return data ?? [];
}
