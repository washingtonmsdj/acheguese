/**
 * Schema de validação para Profiles
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

import { z } from "zod";
import { validationMessages } from "../messages/pt-BR";
import {
  usernameValidator,
  phoneValidator,
} from "../validators/custom.validators";

/**
 * Schema para criar um profile
 */
export const CreateProfileSchema = z.object({
  name: z
    .string({ required_error: validationMessages.required })
    .min(2, validationMessages.string.min(2))
    .max(100, validationMessages.string.max(100)),

  username: usernameValidator.optional(),

  bio: z.string().max(500, validationMessages.string.max(500)).optional(),
  short_bio: z.string().max(280, validationMessages.string.max(280)).optional(),

  avatar_url: z
    .string()
    .url(validationMessages.string.url)
    .optional()
    .or(z.literal("")),

  city: z
    .string({ required_error: validationMessages.fields.city.required })
    .min(2, validationMessages.string.min(2)),

  main_territory_location_id: z.string().uuid().optional(),

  phone: phoneValidator.optional(),

  profile_type: z
    .enum(["personal", "driver", "business", "professional"])
    .default("personal"),
});

/**
 * Schema para atualizar um profile
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, validationMessages.string.min(2))
    .max(100, validationMessages.string.max(100))
    .optional(),

  username: usernameValidator.optional(),

  bio: z.string().max(500, validationMessages.string.max(500)).optional(),
  short_bio: z.string().max(280, validationMessages.string.max(280)).optional(),

  avatar_url: z
    .string()
    .url(validationMessages.string.url)
    .optional()
    .or(z.literal("")),

  city: z.string().min(2, validationMessages.string.min(2)).optional(),
  main_territory_location_id: z.string().uuid().optional(),

  phone: phoneValidator.optional(),
});

/**
 * Schema para buscar profiles
 */
export const GetProfilesSchema = z.object({
  city: z.string().optional(),
  profile_type: z
    .enum(["personal", "driver", "business", "professional"])
    .optional(),
  verified: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * Types inferidos dos schemas
 */
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type GetProfilesInput = z.infer<typeof GetProfilesSchema>;
