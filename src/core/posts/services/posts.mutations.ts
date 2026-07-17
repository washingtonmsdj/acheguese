/**
 * Post write operations.
 */

import { supabase } from "@/integrations/supabase";
import type { Database, Json } from "@/integrations/supabase";
import { EntityStatus, LocationType } from "@/shared/types/enums";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { ZodError } from "zod";
import type { CreatePostData, Post, UpdatePostData } from "../types";
import { PostError } from "../types";
import * as queries from "./posts.queries";
import {
  createPostMutationSchema,
  updatePostSchema,
} from "../schemas/postSchemas";

type DbPostRow = Database["public"]["Tables"]["posts"]["Row"];
type DbPostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type DbPostUpdate = Database["public"]["Tables"]["posts"]["Update"];

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  delete: () => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
  maybeSingle: () => Promise<QueryResult<TRow>>;
}

interface PostsMutationDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

type CreatePostPayload = { author_profile_id: string } & CreatePostData;

type PostUpdatePayload = Pick<DbPostUpdate, "content" | "updated_at">;

interface LocationValidationRow {
  id: string;
  type: string;
  status: string;
}

interface PostMutationSelectRow extends DbPostRow {
  author_profile?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    verified?: boolean | null;
  } | null;
  location?: {
    id: string;
    name: string;
    type: string;
    parent_id: string | null;
  } | null;
}

interface PostAuthorRow {
  author_profile_id: string;
}

interface PostShareEventRow {
  id: string;
}

const postsMutationDb = supabase as unknown as PostsMutationDbClient;

export type CreatePostTerritoryPolicy = {
  allowedLocationTypes?: readonly LocationType[];
  invalidLocationTypeCode?: string;
};

export const CREATE_POST_LOCATION_REQUIRED_CODE = "LOCATION_REQUIRED";

const DEFAULT_CREATE_POST_TERRITORY_POLICY: Required<CreatePostTerritoryPolicy> =
  {
    allowedLocationTypes: [
      LocationType.CITY,
      LocationType.DISTRICT,
      LocationType.NEIGHBORHOOD,
    ],
    invalidLocationTypeCode: "INVALID_LOCATION_TYPE",
  };

function buildCreatePostInsert(data: CreatePostPayload): DbPostInsert {
  return {
    author_profile_id: data.author_profile_id,
    content: data.content,
    type: data.type,
    location_id: data.location_id,
    reach: data.reach ?? "neighborhood",
    images: (data.images ?? []) as unknown as Json,
    tags: (data.tags ?? []) as unknown as Json,
    content_intent: data.content_intent ?? null,
    display_format: data.display_format ?? null,
    distribution_channels: data.distribution_channels ?? [],
    content_payload: (data.content_payload ?? null) as unknown as Json,
    is_published: true,
  };
}

function buildUpdatePostPayload(validatedContent: string): PostUpdatePayload {
  return {
    content: validatedContent,
    updated_at: new Date().toISOString(),
  };
}

function isAllowedLocationType(
  locationType: string,
  policy: Required<CreatePostTerritoryPolicy>,
): boolean {
  return policy.allowedLocationTypes.includes(locationType as LocationType);
}

export async function createPost(
  data: CreatePostPayload,
  policy: CreatePostTerritoryPolicy = DEFAULT_CREATE_POST_TERRITORY_POLICY,
): Promise<Post> {
  try {
    if (!data.location_id) {
      throw new PostError(
        "location_id e obrigatorio",
        CREATE_POST_LOCATION_REQUIRED_CODE,
      );
    }

    const validatedInput = createPostMutationSchema.parse(
      data,
    ) as CreatePostPayload;
    data = validatedInput;

    const { data: location, error: locationError } = await postsMutationDb
      .from<LocationValidationRow>("locations")
      .select("id, type, status")
      .eq("id", data.location_id)
      .single();

    if (locationError || !location) {
      logger.error("[posts.mutations] Location not found:", {
        location_id: data.location_id,
        error: locationError?.message,
      });
      throw new PostError("Localizacao invalida", "INVALID_LOCATION");
    }

    const resolvedPolicy = {
      allowedLocationTypes:
        policy.allowedLocationTypes ??
        DEFAULT_CREATE_POST_TERRITORY_POLICY.allowedLocationTypes,
      invalidLocationTypeCode:
        policy.invalidLocationTypeCode ??
        DEFAULT_CREATE_POST_TERRITORY_POLICY.invalidLocationTypeCode,
    };

    if (!isAllowedLocationType(location.type, resolvedPolicy)) {
      logger.error("[posts.mutations] Invalid location type:", {
        location_id: data.location_id,
        type: location.type,
      });
      throw new PostError(
        "Posts so podem ser criados em cidades ou bairros",
        resolvedPolicy.invalidLocationTypeCode,
      );
    }

    if (location.status !== EntityStatus.ACTIVE) {
      logger.error("[posts.mutations] Inactive location:", {
        location_id: data.location_id,
        status: location.status,
      });
      throw new PostError("Localizacao inativa", "INACTIVE_LOCATION");
    }

    const { data: post, error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .insert(buildCreatePostInsert(data))
      .select(
        `
          id,
          author_profile_id,
          content,
          type,
          location_id,
          reach,
          images,
          tags,
          content_intent,
          display_format,
          distribution_channels,
          content_payload,
          likes_count,
          comments_count,
          confirmations_count,
          is_verified,
          is_published,
          created_at,
          updated_at,
          author_profile:profiles!author_profile_id(
            id,
            name,
            avatar_url,
            verified
          ),
          location:locations(
            id,
            name,
            type,
            parent_id
          )
        `,
      )
      .single();

    if (error) {
      logger.error("[posts.mutations] Insert error:", {
        error: error.message,
        code: error.code,
      });
      throw new PostError(error.message, error.code || "CREATE_FAILED");
    }

    return post as unknown as Post;
  } catch (error) {
    if (error instanceof PostError) throw error;

    if (error instanceof ZodError) {
      if (error.issues.some((issue) => issue.path[0] === "location_id")) {
        throw new PostError("Localizacao invalida", "INVALID_LOCATION");
      }
      throw new PostError("Dados do post invalidos", "INVALID_POST_INPUT");
    }

    logger.error("[posts.mutations] Error creating post:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "createPost",
      metadata: {
        author_profile_id: data.author_profile_id,
        type: data.type,
        location_id: data.location_id,
      },
    });
    throw new PostError("Erro inesperado ao criar post", "UNKNOWN_ERROR");
  }
}

export async function updatePost(
  postId: string,
  data: UpdatePostData,
): Promise<Post> {
  try {
    const validatedData = updatePostSchema.parse({
      id: postId,
      content: data.content,
    });

    const { data: post, error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update(buildUpdatePostPayload(validatedData.content))
      .eq("id", postId)
      .select(
        `
          *,
          author_profile:profiles!author_profile_id(id, name, avatar_url),
          location:locations(id, name, type, parent_id)
        `,
      )
      .single();

    if (error) {
      throw new PostError(error.message, error.code || "UPDATE_FAILED");
    }

    return post as unknown as Post;
  } catch (error) {
    if (error instanceof PostError) throw error;

    const { handleValidationError } = await import("@/shared/validation");
    const validationMessage = handleValidationError(error);
    if (validationMessage !== "Erro de validacao desconhecido") {
      throw new PostError(validationMessage, "VALIDATION_ERROR", 400);
    }

    logger.error("[posts.mutations] Error updating post:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "updatePost",
      metadata: { postId },
    });
    throw new PostError("Erro ao atualizar post", "UPDATE_ERROR");
  }
}

export async function deletePost(postId: string): Promise<void> {
  try {
    const { error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update({ is_published: false })
      .eq("id", postId);

    if (error) {
      throw new PostError(error.message, error.code || "DELETE_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.mutations] Error deleting post:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "deletePost",
      metadata: { postId },
    });
    throw new PostError("Erro ao deletar post", "DELETE_ERROR");
  }
}

export async function deletePostByAuthor(
  postId: string,
  authorProfileId: string,
): Promise<void> {
  try {
    const { data: post, error: fetchError } = await postsMutationDb
      .from<PostAuthorRow>("posts")
      .select("author_profile_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      throw new PostError("Post nao encontrado", "NOT_FOUND");
    }

    if (post.author_profile_id !== authorProfileId) {
      throw new PostError(
        "Voce nao tem permissao para deletar este post",
        "FORBIDDEN",
      );
    }

    const { error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update({ is_published: false })
      .eq("id", postId)
      .eq("author_profile_id", authorProfileId);

    if (error) {
      throw new PostError(error.message, error.code || "DELETE_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.mutations] Error deleting post by author:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "deletePostByAuthor",
      metadata: { postId, authorProfileId },
    });
    throw new PostError("Erro ao deletar post", "DELETE_ERROR");
  }
}

export async function recordPostShare(
  postId: string,
): Promise<void> {
  try {
    const activeProfile = await profileService.getRequiredActiveProfile();
    const { error } = await postsMutationDb
      .from<PostShareEventRow>("post_share_events")
      .insert({ post_id: postId, sharer_profile_id: activeProfile.id });

    if (error && error.code !== "23505") {
      throw new PostError(error.message, error.code || "SHARE_RECORD_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    trackError(error as Error, {
      component: "posts.mutations",
      action: "recordPostShare",
      metadata: { postId },
    });
    throw new PostError(
      "Erro ao registrar compartilhamento",
      "SHARE_RECORD_ERROR",
    );
  }
}
