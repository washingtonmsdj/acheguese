import type { UnifiedPost } from "@/shared/types/posts";

export type TerritorialFeedChannel =
  | "todos"
  | "para_voce"
  | "moradores"
  | "empresas"
  | "eventos"
  | "alertas"
  | "vagas"
  | "classificados";

type FeedUserSignal = {
  location_id?: string;
};

const CHANNELS: TerritorialFeedChannel[] = [
  "moradores",
  "empresas",
  "eventos",
  "alertas",
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
  vaga: ["empresas", "vagas"],
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

function inferLegacyChannels(post: UnifiedPost): Set<TerritorialFeedChannel> {
  const channels = new Set<TerritorialFeedChannel>();
  const tokens = getTokens(post);

  const isAlert =
    post.type === "alerta" ||
    includesAny(tokens, ["alerta", "urgente", "seguranca", "risco", "transito", "utilidade"]);
  const isEvent =
    post.type === "evento" ||
    includesAny(tokens, ["evento", "programacao", "agenda", "oficina", "show", "encontro"]);
  const isJob = includesAny(tokens, ["vaga", "emprego", "oportunidade", "contrata", "curriculo", "trabalho"]);
  const isClassified = includesAny(tokens, ["classificado", "compra", "venda", "aluga", "servico", "frete", "desapego"]);
  const isBusiness =
    includesAny(tokens, ["empresa", "comercio", "negocio", "loj", "restaurante", "promocao", "delivery"]) ||
    isJob ||
    isClassified;

  if (isAlert) channels.add("alertas");
  if (isEvent) channels.add("eventos");
  if (isJob) channels.add("vagas");
  if (isClassified) channels.add("classificados");
  if (isBusiness) channels.add("empresas");

  if (
    !isBusiness ||
    post.type === "discussao" ||
    post.type === "pergunta" ||
    post.type === "recomendacao" ||
    post.type === "enquete"
  ) {
    channels.add("moradores");
  }

  return channels;
}

function inferChannels(post: UnifiedPost): Set<TerritorialFeedChannel> {
  const channels = new Set<TerritorialFeedChannel>(["todos", "para_voce"]);

  for (const channel of post.distribution_channels ?? []) {
    const normalized = norm(channel) as TerritorialFeedChannel;
    if (CHANNELS.includes(normalized)) {
      channels.add(normalized);
    }
  }

  const intent = norm(post.content_intent ?? "");
  for (const channel of INTENT_TO_CHANNELS[intent] ?? []) {
    channels.add(channel);
  }

  // fallback para posts legados sem schema estruturado
  if (channels.size <= 2) {
    for (const channel of inferLegacyChannels(post)) {
      channels.add(channel);
    }
  }

  return channels;
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

  return posts.filter((post) => inferChannels(post).has(channel));
}
