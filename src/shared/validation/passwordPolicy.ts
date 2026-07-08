export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  SPECIAL_CHARACTER_REGEX: /[^A-Za-z0-9\s]/,
} as const;

export type PasswordRequirementId =
  | "length"
  | "uppercase"
  | "lowercase"
  | "number"
  | "special";

export interface PasswordRequirementStatus {
  id: PasswordRequirementId;
  label: string;
  satisfied: boolean;
}

export function getPasswordRequirementStatus(
  password: string,
): PasswordRequirementStatus[] {
  return [
    {
      id: "length",
      label: `Minimo de ${PASSWORD_POLICY.MIN_LENGTH} caracteres`,
      satisfied: password.length >= PASSWORD_POLICY.MIN_LENGTH,
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
      satisfied: PASSWORD_POLICY.SPECIAL_CHARACTER_REGEX.test(password),
    },
  ];
}

export function isStrongPassword(password: string): boolean {
  return getPasswordRequirementStatus(password).every(
    (requirement) => requirement.satisfied,
  );
}

export function getPasswordStrength(password: string): {
  level: number;
  label: string;
} {
  if (!password) {
    return { level: 0, label: "" };
  }

  const satisfiedCount = getPasswordRequirementStatus(password).filter(
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
