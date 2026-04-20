/**
 * Schema de validação para Users
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

import { z } from "zod";
import { validationMessages } from "../messages/pt-BR";
import { strongPasswordValidator } from "../validators/custom.validators";

/**
 * Schema para registro de usuário
 */
export const RegisterUserSchema = z
  .object({
    email: z
      .string({ required_error: validationMessages.required })
      .email(validationMessages.string.email),

    password: strongPasswordValidator,

    confirmPassword: z.string({ required_error: validationMessages.required }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: validationMessages.fields.password.mismatch,
    path: ["confirmPassword"],
  });

/**
 * Schema para login de usuário
 */
export const LoginUserSchema = z.object({
  email: z
    .string({ required_error: validationMessages.required })
    .email(validationMessages.string.email),

  password: z
    .string({ required_error: validationMessages.required })
    .min(1, validationMessages.required),
});

/**
 * Schema para atualizar senha
 */
export const UpdatePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: validationMessages.required })
      .min(1, validationMessages.required),

    newPassword: strongPasswordValidator,

    confirmNewPassword: z.string({
      required_error: validationMessages.required,
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: validationMessages.fields.password.mismatch,
    path: ["confirmNewPassword"],
  });

/**
 * Schema para recuperação de senha
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string({ required_error: validationMessages.required })
    .email(validationMessages.string.email),
});

/**
 * Schema para resetar senha
 */
export const ResetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: validationMessages.required })
      .min(1, validationMessages.required),

    newPassword: strongPasswordValidator,

    confirmNewPassword: z.string({
      required_error: validationMessages.required,
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: validationMessages.fields.password.mismatch,
    path: ["confirmNewPassword"],
  });

/**
 * Types inferidos dos schemas
 */
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginUserInput = z.infer<typeof LoginUserSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// ── Schemas para formulários de auth ─────────────────────────────────────

/**
 * Schema para o campo unificado de login (email OU @username)
 *
 * Não valida formato de email nem de username — apenas que o campo
 * não está vazio. A lógica de detecção de tipo (parseAuthIdentifier)
 * permanece no componente para fins de UX e roteamento de auth.
 */
export const LoginIdentifierSchema = z.object({
  identifier: z
    .string({ required_error: validationMessages.required })
    .min(1, validationMessages.required),
  password: z
    .string({ required_error: validationMessages.required })
    .min(1, validationMessages.required),
});

export type LoginIdentifierInput = z.infer<typeof LoginIdentifierSchema>;

/**
 * Schema para o formulário de redefinição de senha
 *
 * Versão sem o campo `token` — o token vem da sessão Supabase
 * após o redirect, não é digitado pelo usuário.
 */
export const ResetPasswordFormSchema = z
  .object({
    newPassword: strongPasswordValidator,
    confirmNewPassword: z.string({
      required_error: validationMessages.required,
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: validationMessages.fields.password.mismatch,
    path: ["confirmNewPassword"],
  });

export type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;
