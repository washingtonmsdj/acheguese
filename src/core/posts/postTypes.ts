export const CANONICAL_POST_TYPES = [
  "post",
  "discussao",
  "pergunta",
  "recomendacao",
  "enquete",
  "alerta",
  "achados",
  "favor",
  "evento",
  "desapego",
  "civic_report",
  "classificado",
  "ride_share",
] as const;

export type PostType = (typeof CANONICAL_POST_TYPES)[number];
