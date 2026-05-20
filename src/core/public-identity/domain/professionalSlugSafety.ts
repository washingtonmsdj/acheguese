/**
 * professionalSlugSafety
 * Guardrails para evitar slug profissional muito distante do nome público.
 */

const PROFESSIONAL_TOKEN_STOP_WORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "the",
  "of",
  "profissional",
  "servico",
  "servicos",
  "autonomo",
  "freelancer",
]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter(
      (token) => token.length >= 3 && !PROFESSIONAL_TOKEN_STOP_WORDS.has(token),
    );
}

export interface ProfessionalSlugSafetyResult {
  status: "ok" | "review";
  overlapRatio: number;
  sharedTokens: string[];
}

export function isProfessionalSlugSafetyBypassAllowed(params: {
  isVerifiedProfessional?: boolean;
}): boolean {
  return params.isVerifiedProfessional === true;
}

export function evaluateProfessionalSlugSafety(params: {
  professionalName: string;
  slug: string;
}): ProfessionalSlugSafetyResult {
  const nameTokens = Array.from(new Set(tokenize(params.professionalName)));
  const slugTokens = Array.from(new Set(tokenize(params.slug)));

  if (nameTokens.length === 0 || slugTokens.length === 0) {
    return { status: "ok", overlapRatio: 1, sharedTokens: [] };
  }

  const nameSet = new Set(nameTokens);
  const sharedTokens = slugTokens.filter((token) => nameSet.has(token));
  const overlapRatio = sharedTokens.length / slugTokens.length;
  const isSuspicious = sharedTokens.length === 0 || overlapRatio < 0.4;

  return {
    status: isSuspicious ? "review" : "ok",
    overlapRatio,
    sharedTokens,
  };
}
