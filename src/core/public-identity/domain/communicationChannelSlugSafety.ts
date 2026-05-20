/**
 * communicationChannelSlugSafety
 * Guardrails para evitar slug de canal muito distante do nome publico informado.
 */

const CHANNEL_TOKEN_STOP_WORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "the",
  "of",
  "canal",
  "comunicacao",
  "comunitario",
  "comunidade",
  "bairro",
  "tv",
  "radio",
  "portal",
  "jornal",
  "coletivo",
  "news",
  "noticias",
  "local",
  "oficial",
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
    .filter((token) => token.length >= 3 && !CHANNEL_TOKEN_STOP_WORDS.has(token));
}

export interface CommunicationChannelSlugSafetyResult {
  status: "ok" | "review";
  overlapRatio: number;
  sharedTokens: string[];
}

export function evaluateCommunicationChannelSlugSafety(params: {
  publicName: string;
  slug: string;
}): CommunicationChannelSlugSafetyResult {
  const nameTokens = Array.from(new Set(tokenize(params.publicName)));
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
