/**
 * 🧼 SANITIZATION UTILITIES - Funções Reutilizáveis
 *
 * ✅ Sanitização centralizada
 * ✅ Reutilizável em todo o sistema
 * ✅ Proteção contra XSS e dados maliciosos
 *
 * @version 1.0.0 - Production Hardening
 */

/**
 * Sanitiza uma string removendo caracteres perigosos
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove HTML básico
    .replace(/javascript:/gi, "") // Remove javascript: URLs
    .replace(/on\w+=/gi, "") // Remove event handlers
    .substring(0, 500); // Limita tamanho
}

/**
 * Sanitiza um array de strings
 */
export function sanitizeArray(input: string | null | undefined): string[] {
  if (!input || typeof input !== "string") return [];

  return input
    .split(",")
    .map((s) => sanitizeString(s))
    .filter((s) => s.length > 0 && s.length <= 100) // Remove vazios e muito longos
    .slice(0, 20); // Máximo 20 itens
}

/**
 * Sanitiza URL
 */
export function sanitizeUrl(
  input: string | null | undefined,
): string | undefined {
  if (!input || typeof input !== "string") return undefined;

  const sanitized = sanitizeString(input);

  // Deve começar com http:// ou https://
  if (!sanitized.match(/^https?:\/\//)) {
    return undefined;
  }

  return sanitized;
}

/**
 * Sanitiza email
 */
export function sanitizeEmail(
  input: string | null | undefined,
): string | undefined {
  if (!input || typeof input !== "string") return undefined;

  const sanitized = sanitizeString(input).toLowerCase();

  // Validação básica de email
  if (!sanitized.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return undefined;
  }

  return sanitized;
}

/**
 * Sanitiza telefone (formato brasileiro)
 */
export function sanitizePhone(
  input: string | null | undefined,
): string | undefined {
  if (!input || typeof input !== "string") return undefined;

  // Remove tudo exceto números
  const numbers = input.replace(/\D/g, "");

  // Deve ter 10 ou 11 dígitos
  if (numbers.length < 10 || numbers.length > 11) {
    return undefined;
  }

  // Formatar: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
}
