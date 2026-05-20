/**
 * businessSlugSafety
 * Guardrails para evitar slug publico muito distante do nome informado.
 * Mantem regra centralizada para UI e submit.
 */

const BUSINESS_TOKEN_STOP_WORDS = new Set([
  "da",
  "de",
  "do",
  "das",
  "dos",
  "e",
  "the",
  "of",
  "ltda",
  "mei",
  "sa",
  "eireli",
  "empresa",
  "empresas",
  "servico",
  "servicos",
  "comercio",
  "comercial",
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
    .filter((token) => token.length >= 3 && !BUSINESS_TOKEN_STOP_WORDS.has(token));
}

export interface BusinessSlugSafetyResult {
  status: "ok" | "review";
  overlapRatio: number;
  sharedTokens: string[];
}

export function isBusinessSlugSafetyBypassAllowed(params: {
  isVerifiedOfficial?: boolean;
}): boolean {
  return params.isVerifiedOfficial === true;
}

export function evaluateBusinessSlugSafety(params: {
  businessName: string;
  slug: string;
}): BusinessSlugSafetyResult {
  const nameTokens = Array.from(new Set(tokenize(params.businessName)));
  const slugTokens = Array.from(new Set(tokenize(params.slug)));

  if (nameTokens.length === 0 || slugTokens.length === 0) {
    return { status: "ok", overlapRatio: 1, sharedTokens: [] };
  }

  const nameSet = new Set(nameTokens);
  const sharedTokens = slugTokens.filter((token) => nameSet.has(token));
  const overlapRatio = sharedTokens.length / slugTokens.length;

  // Regra: exige ao menos 1 token em comum ou 40% de sobreposicao do slug.
  const isSuspicious = sharedTokens.length === 0 || overlapRatio < 0.4;

  return {
    status: isSuspicious ? "review" : "ok",
    overlapRatio,
    sharedTokens,
  };
}
