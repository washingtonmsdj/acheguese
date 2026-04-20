/**
 * InlineFieldError — Mensagem de erro inline por campo
 *
 * Exibe erros de validação Zod/RHF imediatamente abaixo do campo
 * que os originou. Renderiza null quando não há mensagem.
 *
 * Uso:
 *   <InlineFieldError message={errors.email?.message} />
 *
 * Padrão visual: text-destructive text-xs (shadcn/ui)
 */

import type { FieldError, Merge, FieldErrorsImpl } from "react-hook-form";

interface InlineFieldErrorProps {
  message?: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
  id?: string;
}

export function InlineFieldError({ message, id }: InlineFieldErrorProps) {
  const messageStr =
    typeof message === "string"
      ? message
      : typeof message === "object" && message !== null && "message" in message
        ? String(message.message)
        : undefined;
  if (!messageStr) return null;
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="text-destructive text-xs mt-1"
    >
      {messageStr}
    </p>
  );
}
