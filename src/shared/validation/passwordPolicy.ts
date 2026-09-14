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

export type PasswordConceptRequirementId =
  | "length"
  | "letters"
  | "number_symbol";

export interface PasswordConceptRequirementStatus {
  id: PasswordConceptRequirementId;
  label: string;
  satisfied: boolean;
}

export function getPasswordRequirementStatus(
  password: string,
): PasswordRequirementStatus[] {
  return [
    {
      id: "length",
      label: `Mínimo de ${PASSWORD_POLICY.MIN_LENGTH} caracteres`,
      satisfied: password.length >= PASSWORD_POLICY.MIN_LENGTH,
    },
    {
      id: "uppercase",
      label: "Pelo menos uma letra maiúscula",
      satisfied: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "Pelo menos uma letra minúscula",
      satisfied: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Pelo menos um número",
      satisfied: /\d/.test(password),
    },
    {
      id: "special",
      label: "Pelo menos um caractere especial",
      satisfied: PASSWORD_POLICY.SPECIAL_CHARACTER_REGEX.test(password),
    },
  ];
}

/** Copy compacta do concept sem duplicar a política de senha. */
export function getPasswordRequirementsSummary(
  compactLength = false,
): string {
  const lengthCopy = compactLength
    ? `${PASSWORD_POLICY.MIN_LENGTH}+ caracteres`
    : `${PASSWORD_POLICY.MIN_LENGTH} ou mais caracteres`;
  return `${lengthCopy}, maiúscula, minúscula, número e símbolo.`;
}

/**
 * Agrupa os cinco requisitos canônicos nas três linhas mostradas no concept.
 * O estado continua derivado da mesma política usada na validação do formulário.
 */
export function getPasswordConceptRequirementStatus(
  password: string,
): PasswordConceptRequirementStatus[] {
  const canonical = new Map(
    getPasswordRequirementStatus(password).map((requirement) => [
      requirement.id,
      requirement.satisfied,
    ]),
  );

  return [
    {
      id: "length",
      label: `${PASSWORD_POLICY.MIN_LENGTH} ou mais caracteres`,
      satisfied: canonical.get("length") === true,
    },
    {
      id: "letters",
      label: "Maiúscula e minúscula",
      satisfied:
        canonical.get("uppercase") === true && canonical.get("lowercase") === true,
    },
    {
      id: "number_symbol",
      label: "Número e símbolo",
      satisfied:
        canonical.get("number") === true && canonical.get("special") === true,
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
    return { level: 2, label: "Razoável" };
  }

  if (satisfiedCount === 4) {
    return { level: 3, label: "Boa" };
  }

  return { level: 4, label: "Forte" };
}
