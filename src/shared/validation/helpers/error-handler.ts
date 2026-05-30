/**
 * Helper para tratamento de erros de validação
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

import { ZodError } from "zod";

/**
 * Formata erros do Zod para mensagens user-friendly
 */
export function formatZodError(error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Obtém a primeira mensagem de erro do Zod
 */
export function getFirstZodError(error: ZodError): string {
  const firstError = error.errors[0];
  return firstError?.message || "Dados inválidos";
}

/**
 * Verifica se um erro é do Zod
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof Error && error.name === "ZodError";
}

/**
 * Trata erro de validação e retorna mensagem apropriada
 */
export function handleValidationError(error: unknown): string {
  if (isZodError(error)) {
    return getFirstZodError(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erro de validação desconhecido";
}

/**
 * Formata erros do Zod para objeto de erros por campo
 */
export function formatZodErrorsByField(
  error: ZodError,
): Record<string, string> {
  return Object.fromEntries(
    error.errors
      .map((err) => [err.path.join("."), err.message] as const)
      .filter(([field]) => Boolean(field)),
  );
}
