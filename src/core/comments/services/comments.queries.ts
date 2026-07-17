/**
 * Comment queries — SSOT canônico
 *
 * Responsabilidade: Operações de leitura (buscar, listar, contar)
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import type { Comment, CommentWithReplies } from "../types";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";
import { createProfileSummary } from "@/core/profiles/views/ProfileSummary";

const TABLE = "comments";
const LIKES_TABLE = "comment_likes";

const supabaseTyped = supabase as unknown as AdminSupabaseClient;

interface CommentProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  verified?: boolean | null;
}

interface CommentLikeRow {
  liker_profile_id: string;
}

interface CommentReadRow {
  id: string;
  post_id: string;
  author_profile_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number | null;
  created_at: string;
  updated_at: string;
  profile?: CommentProfileRow | CommentProfileRow[] | null;
  viewer_likes?: CommentLikeRow[] | null;
}

function firstProfile(
  value: CommentReadRow["profile"],
): CommentProfileRow | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toComment(row: CommentReadRow): CommentWithReplies {
  const profile = firstProfile(row.profile);
  return {
    id: row.id,
    post_id: row.post_id,
    author_profile_id: row.author_profile_id,
    content: row.content,
    parent_id: row.parent_id,
    likes_count: Math.max(0, row.likes_count ?? 0),
    is_liked: Boolean(row.viewer_likes?.length),
    created_at: row.created_at,
    updated_at: row.updated_at,
    profile: profile
      ? createProfileSummary({
          id: profile.id,
          displayName: profile.name?.trim() || "Usuario",
          avatarUrl: profile.avatar_url,
          verified: Boolean(profile.verified),
        })
      : undefined,
    replies: [],
  };
}

function buildCommentTree(rows: CommentReadRow[]): CommentWithReplies[] {
  const commentsById = new Map<string, CommentWithReplies>();
  rows.forEach((row) => commentsById.set(row.id, toComment(row)));

  const roots: CommentWithReplies[] = [];
  rows.forEach((row) => {
    const comment = commentsById.get(row.id);
    if (!comment) return;

    const parent = row.parent_id ? commentsById.get(row.parent_id) : null;
    if (parent) parent.replies.push(comment);
    else roots.push(comment);
  });

  const oldestFirst = (left: CommentWithReplies, right: CommentWithReplies) =>
    left.created_at.localeCompare(right.created_at);
  const sortReplies = (items: CommentWithReplies[]) => {
    items.sort(oldestFirst);
    items.forEach((item) => sortReplies(item.replies));
  };
  roots.forEach((root) => sortReplies(root.replies));

  return roots.sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  );
}

function boundedInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}

/**
 * Busca comentários de um post
 */
export async function getCommentsByPost(
  postId: string,
  limit = 50,
): Promise<CommentWithReplies[]> {
  try {
    const { data, error } = await supabaseTyped
      .from(TABLE)
      .select(
        `
          id,
          post_id,
          author_profile_id,
          content,
          parent_id,
          likes_count,
          created_at,
          updated_at,
          profile:profiles!comments_author_profile_id_fkey(id,name,avatar_url,verified),
          viewer_likes:comment_likes!comment_likes_comment_id_fkey(liker_profile_id)
        `,
      )
      .eq("post_id", postId)
      .eq("is_removed", false)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true })
      .limit(boundedInteger(limit, 1, 100));

    if (error) throw error;
    return buildCommentTree((data ?? []) as unknown as CommentReadRow[]);
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getCommentsByPost",
      metadata: { postId, limit },
    });
    return [];
  }
}

/**
 * Busca um comentário por ID
 */
export async function getCommentById(commentId: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabaseTyped
      .from(TABLE)
      .select("*")
      .eq("id", commentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getCommentById",
      metadata: { commentId },
    });
    return null;
  }
}

/**
 * Conta comentários de um post
 */
export async function getCommentsCount(postId: string): Promise<number> {
  try {
    const { count, error } = await supabaseTyped
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("is_removed", false)
      .eq("is_hidden", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getCommentsCount",
      metadata: { postId },
    });
    return 0;
  }
}

/**
 * Conta comentários de um autor
 */
export async function getCommentCountByAuthor(authorProfileId: string): Promise<number> {
  try {
    const { count, error } = await supabaseTyped
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("author_profile_id", authorProfileId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getCommentCountByAuthor",
      metadata: { authorProfileId },
    });
    return 0;
  }
}

/**
 * Busca comentários de um autor
 */
export async function getCommentsByAuthor(
  authorProfileId: string,
  options?: { limit?: number; offset?: number },
): Promise<Comment[]> {
  try {
    const limit = boundedInteger(options?.limit ?? 20, 1, 100);
    const requestedOffset = options?.offset ?? 0;
    if (Number.isFinite(requestedOffset) && requestedOffset > 10_000) return [];
    const offset = boundedInteger(requestedOffset, 0, 10_000);

    const query = supabaseTyped
      .from(TABLE)
      .select(
        "id, post_id, content, author_profile_id, created_at, updated_at, likes_count",
      )
      .eq("author_profile_id", authorProfileId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getCommentsByAuthor",
      metadata: { authorProfileId, options },
    });
    return [];
  }
}

// ============================================================================
// 📊 ESTATÍSTICAS ADMINISTRATIVAS
// ============================================================================

/**
 * 📊 OBTER CONTAGEM TOTAL DE COMENTÁRIOS
 * ✅ SSOT para contagem de comentários no dashboard admin
 */
export async function getTotalCommentsCount(): Promise<number> {
  try {
    const { count, error } = await supabaseTyped
      .from(TABLE)
      .select("*", { count: "exact", head: true });

    if (error) {
      trackError(error, {
        component: "comments.queries",
        action: "getTotalCommentsCount",
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getTotalCommentsCount",
    });
    return 0;
  }
}

/**
 * 📋 OBTER COMENTÁRIOS RECENTES
 * ✅ SSOT para atividade recente de comentários
 */
export async function getRecentComments(limit = 10): Promise<any[]> {
  try {
    const boundedLimit = boundedInteger(limit, 1, 50);
    const { data, error } = await supabaseTyped
      .from(TABLE)
      .select("id, content, author_profile_id, post_id, created_at")
      .order("created_at", { ascending: false })
      .limit(boundedLimit);

    if (error) {
      trackError(error, {
        component: "comments.queries",
        action: "getRecentComments",
        metadata: { limit },
      });
      return [];
    }

    return data || [];
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getRecentComments",
    });
    return [];
  }
}

/**
 * 📅 OBTER COMENTÁRIOS CRIADOS EM UM PERÍODO
 * ✅ SSOT para atividade de comentários por período
 */
export async function getCommentsCreatedInPeriod(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  try {
    const { count, error } = await supabaseTyped
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      trackError(error, {
        component: "comments.queries",
        action: "getCommentsCreatedInPeriod",
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getCommentsCreatedInPeriod",
    });
    return 0;
  }
}
