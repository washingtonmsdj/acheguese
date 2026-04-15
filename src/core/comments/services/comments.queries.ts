// @ts-nocheck
/**
 * 💬 COMMENTS QUERIES - Operações de leitura (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import type { Comment } from "../types";

const TABLE = "comments";

/**
 * Busca comentários de um post
 */
export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getCommentsByPost",
      metadata: { postId },
    });
    return [];
  }
}

/**
 * Busca todos os comentários (usado para admin/moderação)
 */
export async function getAllComments(limit = 1000): Promise<Comment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    trackError(error as Error, {
      component: "comments.queries",
      action: "getAllComments",
    });
    return [];
  }
}

/**
 * Busca um comentário por ID
 */
export async function getCommentById(commentId: string): Promise<Comment | null> {
  try {
    const { data, error } = await (supabase as any)
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
    const { count, error } = await (supabase as any)
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

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
    const { count, error } = await (supabase as any)
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
    let query = (supabase as any)
      .from(TABLE)
      .select(
        "id, post_id, content, author_profile_id, created_at, updated_at, likes_count",
      )
      .eq("author_profile_id", authorProfileId)
      .order("created_at", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1,
      );
    }

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
    const { count, error } = await (supabase as any)
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
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select("id, content, author_profile_id, post_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

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
    const { count, error } = await (supabase as any)
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
