/**
 * Schemas de Validação para Posts da Comunidade - SSOT
 *
 * Usa Zod para validação type-safe de dados de posts
 * Consolidado de múltiplos schemas duplicados
 *
 * @version 2.0.0
 */

import { z } from "zod";
import { POST_TYPE_CONFIG, type PostType } from "@/shared/constants/postTypeConfig";

// Constantes de limites
const POST_LIMITS = {
  MIN_CONTENT_LENGTH: 10,
  MAX_CONTENT_LENGTH: 5000,
  MAX_IMAGES: 4,
  MAX_TAGS: 5,
  MAX_TAG_LENGTH: 30,
} as const;

// Tipos de post válidos (extraídos do config)
const VALID_POST_TYPES = Object.keys(POST_TYPE_CONFIG) as PostType[];

// Schema para criação de post
export const createPostSchema = z.object({
  type: z.enum(VALID_POST_TYPES as [PostType, ...PostType[]], {
    errorMap: () => ({ message: "Tipo de post inválido" }),
  }),

  content: z
    .string()
    .min(POST_LIMITS.MIN_CONTENT_LENGTH, {
      message: `Conteúdo deve ter no mínimo ${POST_LIMITS.MIN_CONTENT_LENGTH} caracteres`,
    })
    .max(POST_LIMITS.MAX_CONTENT_LENGTH, {
      message: `Conteúdo deve ter no máximo ${POST_LIMITS.MAX_CONTENT_LENGTH} caracteres`,
    })
    .trim(),

  images: z
    .array(z.string().url("URL de imagem inválida"))
    .max(POST_LIMITS.MAX_IMAGES, {
      message: `Máximo de ${POST_LIMITS.MAX_IMAGES} imagens permitidas`,
    })
    .optional()
    .default([]),

  tags: z
    .array(
      z
        .string()
        .min(1, "Tag não pode ser vazia")
        .max(POST_LIMITS.MAX_TAG_LENGTH, {
          message: `Tag deve ter no máximo ${POST_LIMITS.MAX_TAG_LENGTH} caracteres`,
        })
        .regex(
          /^[\w\u00C0-\u017F]+$/,
          "Tag deve conter apenas letras, números e underscores",
        ),
    )
    .max(POST_LIMITS.MAX_TAGS, {
      message: `Máximo de ${POST_LIMITS.MAX_TAGS} tags permitidas`,
    })
    .optional()
    .default([]),

  city: z.string().min(1, "Cidade é obrigatória"),

  neighborhood: z.string().min(1, "Bairro é obrigatório"),

  street: z.string().optional(),

  // Campos específicos para enquetes
  poll: z
    .object({
      question: z.string().min(5, "Pergunta deve ter no mínimo 5 caracteres"),
      options: z
        .array(z.string().min(1, "Opção não pode ser vazia"))
        .min(2, "Enquete deve ter no mínimo 2 opções")
        .max(5, "Enquete deve ter no máximo 5 opções"),
      duration_hours: z.number().int().min(1).max(168).optional(), // 1 hora a 7 dias
    })
    .optional(),

  // Campos específicos para eventos
  event_date: z.string().datetime().optional(),

  // Campos específicos para desapego
  price: z.number().min(0).optional(),
  contact_info: z.string().optional(),

  mentioned_profiles: z
    .array(z.string().uuid("ID de perfil inválido"))
    .optional()
    .default([]),
});

// Schema para atualização de post
export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().uuid("ID de post inválido"),
});

// Schema para comentário
export const createCommentSchema = z.object({
  post_id: z.string().uuid("ID de post inválido"),

  content: z
    .string()
    .min(1, "Comentário não pode ser vazio")
    .max(1000, "Comentário deve ter no máximo 1000 caracteres")
    .trim(),

  parent_comment_id: z
    .string()
    .uuid("ID de comentário pai inválido")
    .optional(),

  mentioned_profiles: z
    .array(z.string().uuid("ID de perfil inválido"))
    .optional()
    .default([]),
});

// Schema para filtros de feed
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

// Schema para reação (like)
export const reactionSchema = z.object({
  post_id: z.string().uuid("ID de post inválido"),
  type: z
    .enum(["like", "love", "support", "celebrate"] as const)
    .optional()
    .default("like"),
});

// Schema para denúncia
export const reportSchema = z.object({
  post_id: z.string().uuid("ID de post inválido"),

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
      errorMap: () => ({ message: "Motivo de denúncia inválido" }),
    },
  ),

  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
});

// Schema para confirmação de alerta
export const alertConfirmationSchema = z.object({
  post_id: z.string().uuid("ID de post inválido"),

  comment: z
    .string()
    .max(200, "Comentário deve ter no máximo 200 caracteres")
    .optional(),
});

// Tipos inferidos dos schemas
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type FeedFilters = z.infer<typeof feedFiltersSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type AlertConfirmationInput = z.infer<typeof alertConfirmationSchema>;

// Funções auxiliares de validação
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

// Validação segura (retorna erro ao invés de throw)
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
