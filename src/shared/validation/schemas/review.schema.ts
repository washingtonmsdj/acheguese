/**
 * Schema de validação para Reviews
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

import { z } from "zod";
import { validationMessages } from "../messages/pt-BR";
import { ratingValidator } from "../validators/custom.validators";

/**
 * Schema para criar uma review
 */
export const CreateReviewSchema = z.object({
  business_id: z
    .string({ required_error: validationMessages.required })
    .uuid(validationMessages.string.uuid),

  rating: ratingValidator,

  comment: z.string().max(1000, validationMessages.string.max(1000)).optional(),

  images: z
    .array(z.string().url(validationMessages.string.url))
    .max(5, validationMessages.array.max(5))
    .optional(),
});

/**
 * Schema para atualizar uma review
 */
export const UpdateReviewSchema = z.object({
  rating: ratingValidator.optional(),

  comment: z.string().max(1000, validationMessages.string.max(1000)).optional(),

  images: z
    .array(z.string().url(validationMessages.string.url))
    .max(5, validationMessages.array.max(5))
    .optional(),
});

/**
 * Schema para buscar reviews
 */
export const GetReviewsSchema = z.object({
  business_id: z.string().uuid(validationMessages.string.uuid).optional(),
  reviewer_profile_id: z
    .string()
    .uuid(validationMessages.string.uuid)
    .optional(),
  rating: ratingValidator.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * Types inferidos dos schemas
 */
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type GetReviewsInput = z.infer<typeof GetReviewsSchema>;
