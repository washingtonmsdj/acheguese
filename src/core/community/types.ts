export type ReportReason =
  | "spam"
  | "odio"
  | "assedio"
  | "violencia"
  | "desinformacao"
  | "conteudo_inadequado"
  | "outro";

export interface CommunityStats {
  total_posts: number;
  total_comments: number;
  total_likes: number;
  active_users: number;
}

export interface SponsoredAd {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}
