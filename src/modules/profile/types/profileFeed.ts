export type ProfileFeedPostType =
  | "pergunta"
  | "discussao"
  | "recomendacao"
  | "enquete"
  | "achados_e_perdidos";

export interface ProfileFeedPost {
  id: string;
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  author_reputation?: number;
  is_verified_resident?: boolean;
  type: ProfileFeedPostType;
  content: string;
  images?: string[];
  tags: string[];
  location_id: string;
  reach: "street" | "neighborhood" | "city";
  likes_count: number;
  comments_count: number;
  confirmations_count?: number;
  created_at: string;
  updated_at: string;
  is_verified?: boolean;
  is_liked?: boolean;
  is_saved?: boolean;
  is_edited?: boolean;
  city?: string;
  neighborhood?: string;
  street?: string;
}

interface ServiceAuthorProfile {
  id?: string;
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  verified?: boolean | null;
  reputation?: number | null;
  city?: string | null;
  neighborhood?: string | null;
  street?: string | null;
}

export interface ServiceProfilePostRow {
  id: string;
  author_profile_id: string;
  type?: string | null;
  content?: string | null;
  images?: string[] | null;
  tags?: string[] | null;
  location_id?: string | null;
  reach?: "street" | "neighborhood" | "city" | null;
  likes_count?: number | null;
  comments_count?: number | null;
  confirmations_count?: number | null;
  created_at: string;
  updated_at?: string | null;
  is_edited?: boolean | null;
  author_profile?: ServiceAuthorProfile | null;
}

export function normalizeProfileFeedPostType(
  rawType: string | null | undefined,
): ProfileFeedPostType {
  switch (rawType) {
    case "pergunta":
      return "pergunta";
    case "recomendacao":
      return "recomendacao";
    case "enquete":
      return "enquete";
    case "achado_perdido":
    case "achados":
    case "achados_e_perdidos":
      return "achados_e_perdidos";
    case "texto":
    case "alerta":
    case "evento":
    case "favor":
    case "desapego":
    case "post":
    case "discussao":
    default:
      return "discussao";
  }
}

export function toProfileFeedPost(
  post: ServiceProfilePostRow,
  options: { isLiked?: boolean; isSaved?: boolean } = {},
): ProfileFeedPost {
  const authorProfile = post.author_profile;

  return {
    id: post.id,
    author_profile_id: post.author_profile_id,
    author_name: authorProfile?.name ?? authorProfile?.username ?? "Usuario",
    author_avatar: authorProfile?.avatar_url ?? undefined,
    author_reputation: authorProfile?.reputation ?? 0,
    is_verified_resident: authorProfile?.verified ?? false,
    type: normalizeProfileFeedPostType(post.type),
    content: post.content ?? "",
    images: post.images ?? [],
    tags: post.tags ?? [],
    location_id: post.location_id ?? "",
    reach: post.reach ?? "city",
    likes_count: post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    confirmations_count: post.confirmations_count ?? 0,
    created_at: post.created_at,
    updated_at: post.updated_at ?? post.created_at,
    is_verified: authorProfile?.verified ?? false,
    is_liked: options.isLiked ?? false,
    is_saved: options.isSaved ?? false,
    is_edited: post.is_edited ?? false,
    city: authorProfile?.city ?? undefined,
    neighborhood: authorProfile?.neighborhood ?? undefined,
    street: authorProfile?.street ?? undefined,
  };
}
