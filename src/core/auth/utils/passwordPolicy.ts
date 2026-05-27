import validationMessages from "@/shared/validation/messages/pt-BR";
import {
  PASSWORD_POLICY,
  getPasswordRequirementStatus,
  getPasswordStrength,
  isStrongPassword,
  type PasswordRequirementStatus,
} from "@/shared/validation/passwordPolicy";

export const AUTH_PASSWORD_MIN_LENGTH = PASSWORD_POLICY.MIN_LENGTH;
export type { PasswordRequirementStatus };

export function getAuthPasswordRequirementStatus(
  password: string,
): PasswordRequirementStatus[] {
  return getPasswordRequirementStatus(password);
}

export function validateAuthPassword(password: string): string | null {
  if (!password) {
    return "Senha e obrigatoria";
  }

  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return validationMessages.fields.password.min;
  }

  if (!isStrongPassword(password)) {
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
  return getPasswordStrength(password);
}
