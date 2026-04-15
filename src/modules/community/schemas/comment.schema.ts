/**
 * Schema de validação para Comentários
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

import { z } from "zod";
import { validationMessages } from "@/shared/validation/messages/pt-BR";

/**
 * Schema para criar um comentário
 */
export const CreateCommentSchema = z.object({
  post_id: z
    .string({ required_error: validationMessages.required })
    .uuid(validationMessages.string.uuid),

  content: z
    .string({ required_error: validationMessages.required })
    .min(1, validationMessages.fields.content.empty)
    .max(2000, validationMessages.fields.content.tooLong),

  parent_comment_id: z.string().uuid(validationMessages.string.uuid).optional(),
});

/**
 * Schema para atualizar um comentário
 */
export const UpdateCommentSchema = z.object({
  content: z
    .string()
    .min(1, validationMessages.fields.content.empty)
    .max(2000, validationMessages.fields.content.tooLong),
});

/**
 * Schema para buscar comentários
 */
export const GetCommentsSchema = z.object({
  post_id: z.string().uuid(validationMessages.string.uuid),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Types inferidos dos schemas
 */
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
export type GetCommentsInput = z.infer<typeof GetCommentsSchema>;
