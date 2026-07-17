/** Canonical owner for post likes and saved posts. */

import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { COMMUNITY_RUNTIME_LIMITS } from "@/shared/constants/communityRuntime";
import { trackError } from "@/shared/utils/errorTracking";
import type { SavedPost } from "../types";

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  select(
    columns?: string,
    options?: { count?: "exact" | "planned" | "estimated"; head?: boolean },
  ): QueryBuilder<TRow>;
  insert(values: Partial<TRow> | Array<Partial<TRow>>): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  in(column: string, values: readonly unknown[]): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  range(from: number, to: number): QueryBuilder<TRow>;
  single(): QueryResult<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  then<TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null; count?: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((
          value: {
            data: TRow[];
            error: { code?: string; message?: string } | null;
            count?: number | null;
          },
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface SocialDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

type PostLikeRow = Database["public"]["Tables"]["post_likes_new"]["Row"];
type SavedPostRow = Database["public"]["Tables"]["saved_posts_new"]["Row"];

function boundedPageValue(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}

function normalizePostIds(postIds: string[]): string[] {
  return [...new Set(postIds.filter((postId) => typeof postId === "string"))].slice(
    0,
    COMMUNITY_RUNTIME_LIMITS.POST_ID_BATCH_SIZE,
  );
}

export class PostEngagementService {
  private static readonly db = supabase as unknown as SocialDbClient;
  // ============================================================================
  // POST LIKES - Curtidas de Posts
  // ============================================================================

  /**
   * Curtir um post usando profile ativo
   */
  static async likePost(
    postId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { error } = await this.db.from<PostLikeRow>("post_likes_new").insert({
        post_id: postId,
        liker_profile_id: activeProfile.id,
      });

      if (error) {
        // Ignorar erro de duplicata (ja curtiu)
        if (error.code === "23505") {
          return { success: true };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "PostEngagementService",
        action: "likePost",
        metadata: { postId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Descurtir um post usando profile ativo
   */
  static async unlikePost(
    postId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { error } = await this.db
        .from<PostLikeRow>("post_likes_new")
        .delete()
        .eq("post_id", postId)
        .eq("liker_profile_id", activeProfile.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "PostEngagementService",
        action: "unlikePost",
        metadata: { postId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Verificar se profile curtiu um post
   */
  static async hasLikedPost(postId: string): Promise<boolean> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { data, error } = await this.db
        .from<Pick<PostLikeRow, "id">>("post_likes_new")
        .select("id")
        .eq("post_id", postId)
        .eq("liker_profile_id", activeProfile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return !!data;
    } catch (error) {
      trackError(error as Error, {
        component: "PostEngagementService",
        action: "hasLikedPost",
        metadata: { postId },
      });
      return false;
    }
  }

  /**
   * Buscar likes de multiplos posts para um profile
   */
  static async getLikesForPosts(
    postIds: string[],
  ): Promise<Set<string>> {
    try {
      const selectedPostIds = normalizePostIds(postIds);
      if (selectedPostIds.length === 0) return new Set();

      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { data, error } = await this.db
        .from<Pick<PostLikeRow, "post_id">>("post_likes_new")
        .select("post_id")
        .eq("liker_profile_id", activeProfile.id)
        .in("post_id", selectedPostIds);

      if (error) throw error;

      return new Set(data?.map((like) => like.post_id) || []);
    } catch (error) {
      trackError(error as Error, {
        component: "PostEngagementService",
        action: "getLikesForPosts",
        metadata: { postIds: postIds.length },
      });
      return new Set();
    }
  }

  // ============================================================================
  // SAVED POSTS - Posts Salvos
  // ============================================================================

  /**
   * Salvar um post usando profile ativo
   */
  static async savePost(
    postId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { error } = await this.db.from<SavedPostRow>("saved_posts_new").insert({
        post_id: postId,
        saver_profile_id: activeProfile.id,
      });

      if (error) {
        // Ignorar erro de duplicata (ja salvou)
        if (error.code === "23505") {
          return { success: true };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "PostEngagementService",
        action: "savePost",
        metadata: { postId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Remover post dos salvos usando profile ativo
   */
  static async unsavePost(
    postId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { error } = await this.db
        .from<SavedPostRow>("saved_posts_new")
        .delete()
        .eq("post_id", postId)
        .eq("saver_profile_id", activeProfile.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "PostEngagementService",
        action: "unsavePost",
        metadata: { postId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Verificar se profile salvou um post
   */
  static async hasSavedPost(postId: string): Promise<boolean> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { data, error } = await this.db
        .from<Pick<SavedPostRow, "id">>("saved_posts_new")
        .select("id")
        .eq("post_id", postId)
        .eq("saver_profile_id", activeProfile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return !!data;
    } catch (error) {
      trackError(error as Error, {
        component: "PostEngagementService",
        action: "hasSavedPost",
        metadata: { postId },
      });
      return false;
    }
  }

  /**
   * Buscar posts salvos de multiplos posts para um profile
   */
  static async getSavedForPosts(
    postIds: string[],
  ): Promise<Set<string>> {
    try {
      const selectedPostIds = normalizePostIds(postIds);
      if (selectedPostIds.length === 0) return new Set();

      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { data, error } = await this.db
        .from<Pick<SavedPostRow, "post_id">>("saved_posts_new")
        .select("post_id")
        .eq("saver_profile_id", activeProfile.id)
        .in("post_id", selectedPostIds);

      if (error) throw error;

      return new Set(data?.map((saved) => saved.post_id) || []);
    } catch (error) {
      trackError(error as Error, {
        component: "PostEngagementService",
        action: "getSavedForPosts",
        metadata: { postIds: postIds.length },
      });
      return new Set();
    }
  }

  /**
   * Buscar posts salvos por um profile (paginado)
   */
  static async getSavedPosts(
    limit: number = 20,
    offset: number = 0,
  ): Promise<SavedPost[]> {
    try {
      const boundedLimit = boundedPageValue(
        limit,
        1,
        COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_SIZE,
      );
      const boundedOffset = boundedPageValue(
        offset,
        0,
        COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_OFFSET_MAX,
      );
      if (offset > COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_OFFSET_MAX) return [];
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { data, error } = await this.db
        .from<SavedPost>("saved_posts_new")
        .select("*")
        .eq("saver_profile_id", activeProfile.id)
        .order("created_at", { ascending: false })
        .range(boundedOffset, boundedOffset + boundedLimit - 1);

      if (error) throw error;

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "PostEngagementService",
        action: "getSavedPosts",
        metadata: { limit, offset },
      });
      return [];
    }
  }

}
