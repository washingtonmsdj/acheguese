/**
 * Constantes para Tipos de Posts da Comunidade
 *
 * Centraliza todos os tipos de posts e suas configurações
 * para evitar magic strings e facilitar manutenção
 *
 * @version 1.0.0
 */

// Tipos de Posts
export const POST_TYPES = {
  DISCUSSAO: "discussao",
  RECOMENDACAO: "recomendacao",
  ENQUETE: "enquete",
  PERGUNTA: "pergunta",
} as const;

export type PostType = (typeof POST_TYPES)[keyof typeof POST_TYPES];

// Labels dos Tipos de Posts
export const POST_TYPE_LABELS: Record<PostType, string> = {
  [POST_TYPES.DISCUSSAO]: "Discussão",
  [POST_TYPES.RECOMENDACAO]: "Recomendação",
  [POST_TYPES.ENQUETE]: "Enquete",
  [POST_TYPES.PERGUNTA]: "Pergunta",
};

// Cores dos Tipos de Posts
export const POST_TYPE_COLORS: Record<PostType, string> = {
  [POST_TYPES.DISCUSSAO]: "#3B82F6", // blue-500
  [POST_TYPES.RECOMENDACAO]: "#10B981", // green-500
  [POST_TYPES.ENQUETE]: "#8B5CF6", // purple-500
  [POST_TYPES.PERGUNTA]: "#06B6D4", // cyan-500
};

// Prefixos de Conteúdo
export const POST_CONTENT_PREFIXES = {
  PET_PERDIDO: "PET PERDIDO",
  ENQUETE: "ENQUETE",
  SUGESTAO: "SUGESTÃO",
  DISCUSSAO: "DISCUSSÃO",
  ACHADOS_PERDIDOS: "ACHADOS E PERDIDOS",
  EMERGENCIA: "EMERGÊNCIA",
} as const;

// Regex para detectar prefixos
export const POST_PREFIX_PATTERN = new RegExp(
  `^(${Object.values(POST_CONTENT_PREFIXES).join("|")}):\\s*`,
  "i",
);

// Limites de Conteúdo
export const POST_LIMITS = {
  MIN_CONTENT_LENGTH: 10,
  MAX_CONTENT_LENGTH: 5000,
  MAX_IMAGES: 4,
  MAX_TAGS: 5,
  MAX_TAG_LENGTH: 30,
} as const;

// Tipos de Ordenação
export const POST_SORT_TYPES = {
  RECENT: "recent",
  POPULAR: "popular",
  MOST_COMMENTED: "most_commented",
} as const;

export type PostSortType =
  (typeof POST_SORT_TYPES)[keyof typeof POST_SORT_TYPES];

// Labels de Ordenação
export const POST_SORT_LABELS: Record<PostSortType, string> = {
  [POST_SORT_TYPES.RECENT]: "Mais Recentes",
  [POST_SORT_TYPES.POPULAR]: "Mais Populares",
  [POST_SORT_TYPES.MOST_COMMENTED]: "Mais Comentados",
};

// Validação de Tipo de Post
export function isValidPostType(type: string): type is PostType {
  return Object.values(POST_TYPES).includes(type as PostType);
}

// Validação de Tipo de Ordenação
export function isValidSortType(type: string): type is PostSortType {
  return Object.values(POST_SORT_TYPES).includes(type as PostSortType);
}
