/**
 * Types e Interfaces da Comunidade
 */

export interface RankingUser {
  id: string;
  name: string;
  points: number;
  position: number;
}

export interface FavoriteGroup {
  id: string;
  name: string;
  members: string;
  icon: string;
}

export interface TrendingTopic {
  id: string;
  title: string;
  mentions: number;
  position: number;
}

export interface SponsoredAd {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

export interface MentionedProfile {
  id: string;
  name?: string;
  avatar_url?: string;
  neighborhood?: string;
  user_type?: string;
}

export type ReportReason =
  | "spam"
  | "propaganda"
  | "conteúdo_ofensivo"
  | "conteudo_ofensivo"
  | "links_maliciosos"
  | "inappropriate"
  | "harassment"
  | "misinformation"
  | "other";
