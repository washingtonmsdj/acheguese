import { UnifiedPost } from "@/shared/types/posts";
import { PostType } from "@/shared/constants/postTypeConfig";
import { VERIFICATION_STATUS } from "@/shared/types/constants";
import type {
  CivicPostStatus,
  PostUrgency,
} from "@/shared/constants/statusConfig";
import type { CivicProblemType } from "@/shared/constants/civicProblemTypes";

// ─── Interfaces de entrada ────────────────────────────────────────────────────

interface CivicReportData {
  id: string;
  profile_id: string;
  type: string;
  description: string;
  location: string;
  status: string;
  urgency: string;
  upvotes: number;
  created_at: string;
  image_url?: string;
  profile?: {
    name?: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

interface CommunityPostData {
  id: string;
  author_profile_id: string;
  author_name?: string;
  author_avatar?: string;
  is_verified_resident?: boolean;
  type: string;
  content: string;
  images?: string[];
  tags: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  confirmations_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  has_user_confirmed?: boolean;
  event_date?: string;
  price?: number;
  contact_info?: string;
}

interface FeedPostData {
  id: string;
  author: {
    id: string;
    name?: string;
    avatar?: string;
    type?: string;
  };
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  liked?: boolean;
  saved?: boolean;
  tags?: string[];
  type?: string;
}

// ─── PostAdapter ──────────────────────────────────────────────────────────────

export class PostAdapter {
  static fromCivicReport(report: CivicReportData): UnifiedPost {
    return {
      id: report.id,
      type: "civic_report" as PostType,
      author_profile_id: report.profile_id,
      author_name: report.profile?.name || "Anônimo",
      author_avatar: report.profile?.avatar_url,
      is_verified_resident: report.profile?.is_verified,
      content: report.description,
      description: report.description,
      location: report.location,
      image_url: report.image_url,
      likes_count: 0,
      comments_count: 0,
      upvotes: report.upvotes,
      status: report.status as CivicPostStatus,
      urgency: report.urgency as PostUrgency,
      created_at: report.created_at,
      civic_type: report.type as CivicProblemType,
    };
  }

  static fromCommunityPost(post: CommunityPostData): UnifiedPost {
    return {
      id: post.id,
      type: (post.type || "discussao") as PostType,
      author_profile_id: post.author_profile_id,
      author_name: post.author_name || "Usuário",
      author_avatar: post.author_avatar,
      is_verified_resident: post.is_verified_resident,
      content: post.content,
      images: post.images,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      confirmations_count: post.confirmations_count,
      is_liked: post.is_liked,
      is_saved: post.is_saved,
      has_user_confirmed: post.has_user_confirmed,
      created_at: post.created_at,
      tags: post.tags,
    };
  }

  static fromFeedPost(post: FeedPostData): UnifiedPost {
    return {
      id: post.id,
      type: (post.type || "discussao") as PostType,
      author_profile_id: post.author?.id || "",
      author_name: post.author?.name || "Usuário",
      author_avatar: post.author?.avatar,
      is_verified_resident: post.author?.type === VERIFICATION_STATUS.VERIFIED,
      content: post.content,
      image_url: post.image_url,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      is_liked: post.liked,
      is_saved: post.saved,
      created_at: post.created_at,
      tags: post.tags,
    };
  }

  /**
   * Converte Post do PostService (Supabase) em UnifiedPost
   * ✅ SSOT: usa location e location_id do JOIN — sem campos legados
   */
  static fromServicePost(post: any): UnifiedPost {
    const profile = post.author_profile || post.profile;

    return {
      id: post.id,
      type: (post.type || "text") as PostType,
      author_profile_id: post.profile_id || post.author_profile_id || "",
      author_name: profile?.name || profile?.username || "Usuário",
      author_avatar: profile?.avatar_url,
      is_verified_resident: profile?.verified || false,
      content: post.content,
      image_url: post.image_url,
      location: post.location,     // ✅ objeto do JOIN com locations
      location_id: post.location_id, // ✅ para cálculo de proximidade
      reach: post.reach,            // ✅ metadado de escopo intencional
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      is_liked: post.is_liked,
      is_saved: post.is_saved,
      created_at: post.created_at,
      tags: post.tags,
    };
  }

  static convertArray(
    items: Array<CivicReportData | CommunityPostData | FeedPostData>,
  ): UnifiedPost[] {
    return items.map((item) => {
      if ("profile_id" in item && "urgency" in item)
        return PostAdapter.fromCivicReport(item as CivicReportData);
      if (
        "author" in item &&
        typeof item.author === "object" &&
        item.author !== null &&
        "id" in item.author
      ) {
        return PostAdapter.fromFeedPost(item as FeedPostData);
      }
      if ("author_profile_id" in item && "author_profile" in item) {
        return PostAdapter.fromServicePost(item);
      }
      if ("profile_id" in item && "profile" in item && !("author_profile_id" in item)) {
        return PostAdapter.fromServicePost(item);
      }
      return PostAdapter.fromCommunityPost(item as CommunityPostData);
    });
  }

  static filterByType(posts: UnifiedPost[], type: string): UnifiedPost[] {
    return posts.filter((p) => p.type === type);
  }

  static sortPosts(
    posts: UnifiedPost[],
    criteria: string = "recent",
    userLocation?: { location_id?: string },
  ): UnifiedPost[] {
    const sorted = [...posts];
    switch (criteria) {
      case "popular":
        return sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      case "nearby":
        if (!userLocation) return sorted;
        return sorted.sort((a, b) => {
          const scoreA = PostAdapter.calculateProximity(a, userLocation);
          const scoreB = PostAdapter.calculateProximity(b, userLocation);
          return scoreB - scoreA;
        });
      default:
        return sorted.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
  }

  /**
   * Calcula proximidade territorial por location_id
   * ✅ SSOT: usa apenas identificadores — sem comparação textual
   */
  private static calculateProximity(
    post: UnifiedPost,
    userLocation: { location_id?: string },
  ): number {
    if (post.location_id && userLocation.location_id) {
      if (post.location_id === userLocation.location_id) return 3;
    }
    return 0;
  }
}
