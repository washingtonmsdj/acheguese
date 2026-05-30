import type { UnifiedPost } from "@/shared/types/posts";
import { getRecordValue } from "@/shared/utils/recordLookup";

export type TerritorialFeedChannel =
  | "todos"
  | "para_voce"
  | "empresas"
  | "eventos"
  | "alertas"
  | "oportunidades"
  | "vagas"
  | "moradores"
  | "classificados";

type FeedUserSignal = {
  location_id?: string;
};

const CHANNELS: TerritorialFeedChannel[] = [
  "moradores",
  "empresas",
  "eventos",
  "alertas",
  "oportunidades",
  "vagas",
  "classificados",
];

const INTENT_TO_CHANNELS: Record<string, TerritorialFeedChannel[]> = {
  discussao: ["moradores"],
  pergunta: ["moradores"],
  enquete: ["moradores"],
  recomendacao: ["moradores"],
  aviso_comunitario: ["moradores", "alertas"],
  alerta_urgente: ["alertas"],
  reportar_problema: ["alertas"],
  vaga: ["empresas", "oportunidades", "vagas"],
  oportunidade: ["empresas", "oportunidades", "vagas"],
  classificado: ["classificados"],
  promocao: ["empresas", "classificados"],
  servico: ["empresas", "classificados"],
  evento: ["eventos"],
  mutirao: ["eventos", "moradores"],
  encontro: ["eventos", "moradores"],
};

function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function includesAny(tokens: string[], patterns: string[]): boolean {
  return patterns.some((pattern) => tokens.some((token) => token.includes(pattern)));
}

function getTokens(post: UnifiedPost): string[] {
  const tags = (post.tags ?? []).map(norm);
  const dist = (post.distribution_channels ?? []).map(norm);
  const contentTokens = norm(post.content ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const typeToken = norm(post.type ?? "");
  const intentToken = norm(post.content_intent ?? "");
  return [typeToken, intentToken, ...dist, ...tags, ...contentTokens];
}

function inferChannels(post: UnifiedPost): Set<TerritorialFeedChannel> {
  const channels = new Set<TerritorialFeedChannel>(["todos", "para_voce"]);

  for (const channel of post.distribution_channels ?? []) {
    const normalized = norm(channel) as TerritorialFeedChannel;
    if (normalized === "oportunidades") {
      channels.add("oportunidades");
      channels.add("vagas");
      continue;
    }
    if (normalized === "vagas") {
      channels.add("vagas");
      channels.add("oportunidades");
      continue;
    }
    if (CHANNELS.includes(normalized)) {
      channels.add(normalized);
    }
  }

  const intent = norm(post.content_intent ?? "");
  for (const channel of getRecordValue(INTENT_TO_CHANNELS, intent) ?? []) {
    channels.add(channel);
  }

  return channels;
}

function isOpportunityPost(post: UnifiedPost): boolean {
  const tokens = getTokens(post);
  return (
    post.content_intent === "oportunidade" ||
    post.display_format === "opportunity_card" ||
    includesAny(tokens, ["oportunidade", "freela", "diaria", "procuro trabalho", "ofereco trabalho"])
  );
}

function scoreForYou(post: UnifiedPost, signal?: FeedUserSignal): number {
  const tokens = getTokens(post);
  const channels = inferChannels(post);
  const createdAt = new Date(post.created_at).getTime();
  const now = Date.now();
  const hoursSince = Math.max(0, (now - createdAt) / 36e5);

  let score = 0;
  score += Math.max(0, 40 - hoursSince);
  score += (post.likes_count ?? 0) * 1.5;
  score += (post.comments_count ?? 0) * 2;

  if (signal?.location_id && post.location_id && signal.location_id === post.location_id) {
    score += 30;
  }

  if (post.distribution_channels?.length) score += 6;
  if (post.content_intent) score += 6;
  if (channels.has("alertas")) score += 8;
  if (channels.has("eventos")) score += 6;
  if (includesAny(tokens, ["hoje", "agora", "amanha"])) score += 4;

  return score;
}

export function filterByTerritorialChannel(
  posts: UnifiedPost[],
  channel: TerritorialFeedChannel,
  signal?: FeedUserSignal,
): UnifiedPost[] {
  if (channel === "todos") return posts;

  if (channel === "para_voce") {
    return [...posts].sort((a, b) => scoreForYou(b, signal) - scoreForYou(a, signal));
  }

  if (channel === "oportunidades") {
    return posts.filter((post) => {
      const channels = inferChannels(post);
      return channels.has("oportunidades") || channels.has("vagas");
    });
  }

  return posts.filter((post) => inferChannels(post).has(channel));
}

export function rebalanceTerritorialMix(posts: UnifiedPost[]): UnifiedPost[] {
  if (posts.length <= 4) return posts;

  const opportunities = posts.filter(isOpportunityPost);
  if (opportunities.length === 0) return posts;

  const maxOpportunityRatio = 0.45;
  const maxOpportunities = Math.max(3, Math.floor(posts.length * maxOpportunityRatio));

  const result: UnifiedPost[] = [];
  let keptOpportunityCount = 0;
  const skippedOpportunityBuffer: UnifiedPost[] = [];

  for (const post of posts) {
    const opportunity = isOpportunityPost(post);
    if (!opportunity) {
      result.push(post);
      if (skippedOpportunityBuffer.length > 0 && keptOpportunityCount < maxOpportunities) {
        result.push(skippedOpportunityBuffer.shift() as UnifiedPost);
        keptOpportunityCount += 1;
      }
      continue;
    }

    const recentOpportunityStreak = result.slice(-2).filter(isOpportunityPost).length;
    if (keptOpportunityCount >= maxOpportunities || recentOpportunityStreak >= 2) {
      skippedOpportunityBuffer.push(post);
      continue;
    }

    result.push(post);
    keptOpportunityCount += 1;
  }

  return result;
}
