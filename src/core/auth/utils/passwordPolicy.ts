import validationMessages from "@/shared/validation/messages/pt-BR";
import { AUTH_PASSWORD_POLICY } from "@/core/auth/constants/password";

export const AUTH_PASSWORD_MIN_LENGTH = AUTH_PASSWORD_POLICY.MIN_LENGTH;

const SPECIAL_CHARACTER_REGEX = /[^A-Za-z0-9\s]/;

export interface PasswordRequirementStatus {
  id: "length" | "uppercase" | "lowercase" | "number" | "special";
  label: string;
  satisfied: boolean;
}

export function getAuthPasswordRequirementStatus(
  password: string,
): PasswordRequirementStatus[] {
  return [
    {
      id: "length",
      label: `Minimo de ${AUTH_PASSWORD_MIN_LENGTH} caracteres`,
      satisfied: password.length >= AUTH_PASSWORD_MIN_LENGTH,
    },
    {
      id: "uppercase",
      label: "Pelo menos uma letra maiuscula",
      satisfied: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "Pelo menos uma letra minuscula",
      satisfied: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Pelo menos um numero",
      satisfied: /\d/.test(password),
    },
    {
      id: "special",
      label: "Pelo menos um caractere especial",
      satisfied: SPECIAL_CHARACTER_REGEX.test(password),
    },
  ];
}

/**
 * @deprecated Use strongPasswordValidator do user.schema.ts em vez disso.
 * Este método será removido em favor da validação via Zod schemas.
 */
export function validateAuthPassword(password: string): string | null {
  if (!password) {
    return "Senha e obrigatoria";
  }

  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return validationMessages.fields.password.min;
  }

  const allRequirementsMet = getAuthPasswordRequirementStatus(password).every(
    (requirement) => requirement.satisfied,
  );

  if (!allRequirementsMet) {
    return validationMessages.fields.password.requirements;
  }

  return null;
}

export function isAuthPasswordValid(password: string): boolean {
  return validateAuthPassword(password) === null;
}

export function getAuthPasswordStrength(password: string): {
  level: number;
  label: string;
} {
  if (!password) {
    return { level: 0, label: "" };
  }

  const satisfiedCount = getAuthPasswordRequirementStatus(password).filter(
    (requirement) => requirement.satisfied,
  ).length;

  if (satisfiedCount <= 1) {
    return { level: 1, label: "Fraca" };
  }

  if (satisfiedCount <= 3) {
    return { level: 2, label: "Razoavel" };
  }

  if (satisfiedCount === 4) {
    return { level: 3, label: "Boa" };
  }

  return { level: 4, label: "Forte" };
}
