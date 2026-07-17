import { z } from "zod";
import { CANONICAL_POST_TYPES, type PostType } from "@/core/posts/postTypes";
import { COMMENT_LIMITS, POST_LIMITS } from "@/shared/constants/socialContent";
import { isPostImageReference } from "@/core/media/references/postImageReference";

const VALID_POST_TYPES = [...CANONICAL_POST_TYPES];

export const postImageReferenceSchema = z
  .string()
  .refine(isPostImageReference, "Referencia de imagem de post invalida");

const structuredContentPayloadSchema = z
  .record(z.unknown())
  .refine(
    (value) =>
      new TextEncoder().encode(JSON.stringify(value)).byteLength <=
      POST_LIMITS.MAX_CONTENT_PAYLOAD_BYTES,
    `Payload estruturado deve ter no maximo ${POST_LIMITS.MAX_CONTENT_PAYLOAD_BYTES} bytes`,
  );

export const createPostSchema = z.object({
  type: z.enum(VALID_POST_TYPES as [PostType, ...PostType[]], {
    errorMap: () => ({ message: "Tipo de post invalido" }),
  }),

  content: z
    .string()
    .min(POST_LIMITS.MIN_CONTENT_LENGTH, {
      message: `Conteudo deve ter no minimo ${POST_LIMITS.MIN_CONTENT_LENGTH} caracteres`,
    })
    .max(POST_LIMITS.MAX_CONTENT_LENGTH, {
      message: `Conteudo deve ter no maximo ${POST_LIMITS.MAX_CONTENT_LENGTH} caracteres`,
    })
    .trim(),

  images: z
    .array(postImageReferenceSchema)
    .max(POST_LIMITS.MAX_IMAGES, {
      message: `Maximo de ${POST_LIMITS.MAX_IMAGES} imagens permitidas`,
    })
    .optional()
    .default([]),

  tags: z
    .array(
      z
        .string()
        .min(1, "Tag nao pode ser vazia")
        .max(POST_LIMITS.MAX_TAG_LENGTH, {
          message: `Tag deve ter no maximo ${POST_LIMITS.MAX_TAG_LENGTH} caracteres`,
        })
        .regex(
          /^[\w\u00C0-\u017F]+$/,
          "Tag deve conter apenas letras, numeros e underscores",
        ),
    )
    .max(POST_LIMITS.MAX_TAGS, {
      message: `Maximo de ${POST_LIMITS.MAX_TAGS} tags permitidas`,
    })
    .optional()
    .default([]),

  city: z.string().min(1, "Cidade e obrigatoria"),
  neighborhood: z.string().min(1, "Bairro e obrigatorio"),
  street: z.string().optional(),

  poll: z
    .object({
      question: z.string().min(5, "Pergunta deve ter no minimo 5 caracteres"),
      options: z
        .array(z.string().min(1, "Opcao nao pode ser vazia"))
        .min(2, "Enquete deve ter no minimo 2 opcoes")
        .max(5, "Enquete deve ter no maximo 5 opcoes"),
      duration_hours: z.number().int().min(1).max(168).optional(),
    })
    .optional(),

  event_date: z.string().datetime().optional(),
  price: z.number().min(0).optional(),
  contact_info: z.string().optional(),
});

export const createPostMutationSchema = z.object({
  author_profile_id: z.string().uuid("Perfil autor invalido"),
  type: z.enum(CANONICAL_POST_TYPES),
  content: z
    .string()
    .trim()
    .min(POST_LIMITS.MIN_CONTENT_LENGTH)
    .max(POST_LIMITS.MAX_CONTENT_LENGTH),
  location_id: z.string().uuid("Territorio invalido"),
  reach: z.enum(["street", "neighborhood", "city"]).optional(),
  images: z
    .array(postImageReferenceSchema)
    .max(POST_LIMITS.MAX_IMAGES)
    .optional()
    .default([]),
  tags: z
    .array(z.string().trim().min(1).max(POST_LIMITS.MAX_TAG_LENGTH))
    .max(POST_LIMITS.MAX_TAGS)
    .optional()
    .default([]),
  content_intent: z
    .string()
    .trim()
    .max(POST_LIMITS.MAX_CONTENT_INTENT_LENGTH)
    .optional(),
  display_format: z
    .string()
    .trim()
    .max(POST_LIMITS.MAX_DISPLAY_FORMAT_LENGTH)
    .optional(),
  distribution_channels: z
    .array(
      z.string().trim().min(1).max(POST_LIMITS.MAX_DISTRIBUTION_CHANNEL_LENGTH),
    )
    .max(POST_LIMITS.MAX_DISTRIBUTION_CHANNELS)
    .optional()
    .default([]),
  content_payload: structuredContentPayloadSchema.optional(),
  image_url: z.never().optional(),
  video_url: z.never().optional(),
});

export const updatePostSchema = z
  .object({
    id: z.string().uuid("ID de post invalido"),
    content: z
      .string()
      .trim()
      .min(POST_LIMITS.MIN_CONTENT_LENGTH)
      .max(POST_LIMITS.MAX_CONTENT_LENGTH),
  })
  .strict();

export const createCommentSchema = z.object({
  post_id: z.string().uuid("ID de post invalido"),
  content: z
    .string()
    .min(COMMENT_LIMITS.MIN_CONTENT_LENGTH, "Comentario nao pode ser vazio")
    .max(
      COMMENT_LIMITS.MAX_CONTENT_LENGTH,
      `Comentario deve ter no maximo ${COMMENT_LIMITS.MAX_CONTENT_LENGTH} caracteres`,
    )
    .trim(),
  parent_comment_id: z
    .string()
    .uuid("ID de comentario pai invalido")
    .optional(),
});

export const feedFiltersSchema = z.object({
  type: z
    .enum(["all", ...VALID_POST_TYPES] as ["all", ...PostType[]])
    .optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  tag: z.string().optional(),
  sort: z
    .enum(["recent", "popular", "most_commented"] as const)
    .optional()
    .default("recent"),
  limit: z.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

export const reactionSchema = z.object({
  post_id: z.string().uuid("ID de post invalido"),
  type: z
    .enum(["like", "love", "support", "celebrate"] as const)
    .optional()
    .default("like"),
});

export const reportSchema = z.object({
  post_id: z.string().uuid("ID de post invalido"),
  reason: z.enum(
    [
      "spam",
      "harassment",
      "hate_speech",
      "violence",
      "misinformation",
      "inappropriate_content",
      "other",
    ] as const,
    {
      errorMap: () => ({ message: "Motivo de denuncia invalido" }),
    },
  ),
  description: z
    .string()
    .min(10, "Descricao deve ter no minimo 10 caracteres")
    .max(500, "Descricao deve ter no maximo 500 caracteres")
    .optional(),
});

export const alertConfirmationSchema = z.object({
  post_id: z.string().uuid("ID de post invalido"),
  comment: z
    .string()
    .max(200, "Comentario deve ter no maximo 200 caracteres")
    .optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type FeedFilters = z.infer<typeof feedFiltersSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type AlertConfirmationInput = z.infer<typeof alertConfirmationSchema>;

export function validateCreatePost(data: unknown): CreatePostInput {
  return createPostSchema.parse(data);
}

export function validateUpdatePost(data: unknown): UpdatePostInput {
  return updatePostSchema.parse(data);
}

export function validateCreateComment(data: unknown): CreateCommentInput {
  return createCommentSchema.parse(data);
}

export function validateFeedFilters(data: unknown): FeedFilters {
  return feedFiltersSchema.parse(data);
}

export function validateReaction(data: unknown): ReactionInput {
  return reactionSchema.parse(data);
}

export function validateReport(data: unknown): ReportInput {
  return reportSchema.parse(data);
}

export function validateAlertConfirmation(
  data: unknown,
): AlertConfirmationInput {
  return alertConfirmationSchema.parse(data);
}

export function safeValidateCreatePost(data: unknown) {
  return createPostSchema.safeParse(data);
}

export function safeValidateUpdatePost(data: unknown) {
  return updatePostSchema.safeParse(data);
}

export function safeValidateCreateComment(data: unknown) {
  return createCommentSchema.safeParse(data);
}

export function safeValidateFeedFilters(data: unknown) {
  return feedFiltersSchema.safeParse(data);
}
