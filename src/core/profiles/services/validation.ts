/**
 * Profile Validation Schemas
 *
 * Schemas Zod para validação de dados de profile
 */

import { z } from "zod";

/**
 * Regex para username válido
 * - Apenas lowercase, números e underscore
 * - 3-30 caracteres
 * - Deve começar com letra
 */
const usernameRegex = /^[a-z][a-z0-9_]{2,29}$/;

/**
 * Schema para ProfileType
 */
export const profileTypeSchema = z.enum(["personal", "company", "service"]);

/**
 * Schema para CreateProfileData
 */
export const createProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),

  username: z
    .string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(30, "Username deve ter no máximo 30 caracteres")
    .regex(
      usernameRegex,
      "Username deve começar com letra e conter apenas letras minúsculas, números e underscore",
    )
    .trim()
    .toLowerCase(),

  type: profileTypeSchema,

  bio: z
    .string()
    .max(500, "Bio deve ter no máximo 500 caracteres")
    .trim()
    .optional(),

  city: z
    .string()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .trim()
    .optional(),

  neighborhood: z
    .string()
    .max(100, "Bairro deve ter no máximo 100 caracteres")
    .trim()
    .optional(),

  street: z
    .string()
    .max(200, "Rua deve ter no máximo 200 caracteres")
    .trim()
    .optional(),
});

/**
 * Schema para UpdateProfileData
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim()
    .optional(),

  username: z
    .string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(30, "Username deve ter no máximo 30 caracteres")
    .regex(
      usernameRegex,
      "Username deve começar com letra e conter apenas letras minúsculas, números e underscore",
    )
    .trim()
    .toLowerCase()
    .optional(),

  bio: z
    .string()
    .max(500, "Bio deve ter no máximo 500 caracteres")
    .trim()
    .optional(),

  avatar_url: z.string().url("Avatar URL deve ser uma URL válida").optional(),

  cover_url: z.string().url("Cover URL deve ser uma URL válida").optional(),

  city: z
    .string()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .trim()
    .optional(),

  neighborhood: z
    .string()
    .max(100, "Bairro deve ter no máximo 100 caracteres")
    .trim()
    .optional(),

  street: z
    .string()
    .max(200, "Rua deve ter no máximo 200 caracteres")
    .trim()
    .optional(),
});

/**
 * Tipo inferido do schema de criação
 */
export type CreateProfileInput = z.infer<typeof createProfileSchema>;

/**
 * Tipo inferido do schema de atualização
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Valida dados de criação de profile
 *
 * @param date - Dados para validate
 * @returns Dados validados ou lança erro
 */
export function validateCreateProfile(date: unknown): CreateProfileInput {
  return createProfileSchema.parse(date);
}

/**
 * Valida dados de atualização de profile
 *
 * @param date - Dados para validate
 * @returns Dados validados ou lança erro
 */
export function validateUpdateProfile(date: unknown): UpdateProfileInput {
  return updateProfileSchema.parse(date);
}

/**
 * Valida dados de criação de profile (safe)
 * Retorna objeto com success/error ao invés de lançar exceção
 *
 * @param date - Dados para validate
 * @returns Resultado da validação
 */
export function safeValidateCreateProfile(date: unknown) {
  return createProfileSchema.safeParse(date);
}

/**
 * Valida dados de atualização de profile (safe)
 * Retorna objeto com success/error ao invés de lançar exceção
 *
 * @param date - Dados para validate
 * @returns Resultado da validação
 */
export function safeValidateUpdateProfile(date: unknown) {
  return updateProfileSchema.safeParse(date);
}
