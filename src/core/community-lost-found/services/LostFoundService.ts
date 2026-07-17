import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { COMMUNITY_RUNTIME_LIMITS } from "@/shared/constants/communityRuntime";
import type { TerritoryFilter } from "@/core/location";
import { mediaService } from "@/core/media/services/MediaService";

type QueryResult<T> = Promise<{
  data: T;
  error: { code?: string; message?: string } | null;
}>;

interface QueryBuilder<TRow> {
  select(columns?: string): QueryBuilder<TRow>;
  insert(values: unknown): QueryBuilder<TRow>;
  update(values: unknown): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  in(column: string, values: readonly unknown[]): QueryBuilder<TRow>;
  or(filters: string): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  limit(value: number): QueryBuilder<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  single(): QueryResult<TRow>;
  then<
    TResult1 = {
      data: TRow[];
      error: { code?: string; message?: string } | null;
    },
    TResult2 = never,
  >(
    onfulfilled?:
      | ((value: {
          data: TRow[];
          error: { code?: string; message?: string } | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface LostFoundDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

const lostFoundDb = supabase as unknown as LostFoundDbClient;

export interface LostFoundPost {
  id: string;
  autor_id: string;
  tipo: "perdido" | "achado";
  titulo: string;
  descricao: string;
  categoria: string;
  local_perdido?: string;
  data_perdido?: string;
  imagens?: string[];
  location_id?: string | null;
  resolvido: boolean;
  created_at: string;
  updated_at: string;
}

export interface LostFoundPageCursor {
  createdAt: string;
  id: string;
}

export interface LostFoundPage {
  items: LostFoundPost[];
  nextCursor: LostFoundPageCursor | null;
}

export interface LostFoundComment {
  id: string;
  post_id: string;
  autor_id: string;
  conteudo: string;
  texto?: string;
  created_at: string;
}

export type CreateLostFoundPostInput = Omit<
  LostFoundPost,
  "id" | "autor_id" | "resolvido" | "created_at" | "updated_at"
>;

const LOST_FOUND_POST_SELECT = [
  "id",
  "autor_id",
  "tipo",
  "titulo",
  "descricao",
  "categoria",
  "local_perdido",
  "data_perdido",
  "imagens",
  "location_id",
  "resolvido",
  "created_at",
  "updated_at",
].join(",");

const LOST_FOUND_COMMENT_SELECT = "id,post_id,autor_id,conteudo,created_at";

const DEFAULT_PAGE_SIZE = COMMUNITY_RUNTIME_LIMITS.LOST_FOUND_DEFAULT_PAGE_SIZE;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeCursor(
  cursor: LostFoundPageCursor | null,
): LostFoundPageCursor | null {
  if (!cursor) return null;
  if (!UUID_PATTERN.test(cursor.id))
    throw new Error("invalid_lost_found_cursor");

  const timestamp = new Date(cursor.createdAt);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("invalid_lost_found_cursor");
  }

  return { createdAt: timestamp.toISOString(), id: cursor.id };
}

class LostFoundServiceClass {
  async getPostById(id: string): Promise<LostFoundPost | null> {
    try {
      const { data, error } = await lostFoundDb
        .from<LostFoundPost>("lost_found_posts")
        .select(LOST_FOUND_POST_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("LostFoundService.getPostById", error);
      return null;
    }
  }

  async createPost(
    postData: CreateLostFoundPostInput,
  ): Promise<LostFoundPost | null> {
    try {
      const { data, error } = await lostFoundDb
        .from<LostFoundPost>("lost_found_posts")
        .insert([postData])
        .select(LOST_FOUND_POST_SELECT)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("LostFoundService.createPost", error);
      return null;
    }
  }

  async createPostWithImage(
    postData: Omit<CreateLostFoundPostInput, "imagens">,
    ownerProfileId: string,
    imageFile: File | null,
  ): Promise<LostFoundPost | null> {
    if (!imageFile) return this.createPost({ ...postData, imagens: [] });

    try {
      const asset = await mediaService.uploadMediaAsset(
        ownerProfileId,
        imageFile,
        "post_image",
      );
      const createdPost = await this.createPost({
        ...postData,
        imagens: [asset.reference],
      });
      if (!createdPost) throw new Error("lost_found_post_insert_failed");
      return createdPost;
    } catch (error) {
      logger.error("LostFoundService.createPostWithImage", error);
      return null;
    }
  }

  async toggleResolved(postId: string): Promise<boolean> {
    try {
      const current = await this.getPostById(postId);
      if (!current) return false;
      const { error } = await lostFoundDb
        .from<LostFoundPost>("lost_found_posts")
        .update({ resolvido: !current.resolvido })
        .eq("id", postId);
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("LostFoundService.toggleResolved", error);
      return false;
    }
  }

  async getComments(postId: string): Promise<LostFoundComment[]> {
    try {
      const { data, error } = await lostFoundDb
        .from<LostFoundComment>("lost_found_comments")
        .select(LOST_FOUND_COMMENT_SELECT)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(COMMUNITY_RUNTIME_LIMITS.LOST_FOUND_COMMENTS_MAX);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("LostFoundService.getComments", error);
      return [];
    }
  }

  async createComment(
    commentData: Pick<LostFoundComment, "post_id" | "conteudo">,
  ): Promise<LostFoundComment | null> {
    try {
      const { data, error } = await lostFoundDb
        .from<LostFoundComment>("lost_found_comments")
        .insert([commentData])
        .select(LOST_FOUND_COMMENT_SELECT)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("LostFoundService.createComment", error);
      return null;
    }
  }

  async getPostsPage(
    filters: {
      tipo?: LostFoundPost["tipo"] | "todos";
      categoria?: string;
      territoryFilter?: TerritoryFilter;
    } = {},
    cursor: LostFoundPageCursor | null = null,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<LostFoundPage> {
    try {
      const boundedLimit = Math.min(
        Math.max(limit, 1),
        COMMUNITY_RUNTIME_LIMITS.LOST_FOUND_PAGE_SIZE_MAX,
      );
      const normalizedCursor = normalizeCursor(cursor);
      let query = lostFoundDb
        .from<LostFoundPost>("lost_found_posts")
        .select(LOST_FOUND_POST_SELECT)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(boundedLimit + 1);

      if (normalizedCursor) {
        query = query.or(
          `created_at.lt.${normalizedCursor.createdAt},and(created_at.eq.${normalizedCursor.createdAt},id.lt.${normalizedCursor.id})`,
        );
      }

      if (filters.tipo && filters.tipo !== "todos")
        query = query.eq("tipo", filters.tipo);
      if (filters.categoria && filters.categoria !== "todos")
        query = query.eq("categoria", filters.categoria);
      if (filters.territoryFilter?.scope === "location") {
        query = query.eq("location_id", filters.territoryFilter.location_id);
      } else if (
        filters.territoryFilter?.scope === "group" &&
        filters.territoryFilter.location_ids.length > 0
      ) {
        query = query.in("location_id", filters.territoryFilter.location_ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      const rows = data ?? [];
      const items = rows.slice(0, boundedLimit);
      const lastItem = items.at(-1);

      return {
        items,
        nextCursor:
          rows.length > boundedLimit && lastItem
            ? { createdAt: lastItem.created_at, id: lastItem.id }
            : null,
      };
    } catch (error) {
      logger.error("LostFoundService.getPostsPage", error);
      throw error;
    }
  }
}

export const lostFoundService = new LostFoundServiceClass();
export { lostFoundService as LostFoundService };
