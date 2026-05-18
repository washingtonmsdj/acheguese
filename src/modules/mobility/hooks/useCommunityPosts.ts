import { useQuery } from "@tanstack/react-query";
import { postService } from "@/core/posts/services"; // ✅ LOTE 8
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService"; // ✅ LOTE 8
import { CommentService } from "@/core/comments/services/CommentService"; // ✅ LOTE 7

export interface CommunityPost {
  id: string;
  content: string;
  author_profile_id: string;
  type: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author_name?: string;
  author_avatar?: string;
  author_neighborhood?: string;
  author_verified?: boolean;
  intent?: 'offering' | 'requesting';
  origin?: string;
  destination?: string;
  departure_time?: string;
  seats_available?: number;
  ride_type?: 'viagem' | 'carona_compartilhada' | 'entrega' | 'agendada';
  price?: number;
  interested_count?: number;
  has_joined?: boolean;
}

interface CreateCommunityPostInput {
  author_profile_id?: string;
  content: string;
  location_id?: string;
  reach?: 'city' | 'neighborhood' | 'street';
}

export function useCommunityPosts(filters?: {
  search?: string;
  category?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["community-ride-posts", filters],
    queryFn: async () => {
      // ✅ LOTE 8 - PostService.getPostsByType (canonical boundary)
      const posts = await postService.getPostsByType("ride_share", {
        search: filters?.search,
      });
      return posts as CommunityPost[];
    },
  });

  const createPost = async (postData: CreateCommunityPostInput) => {
    // ✅ CLEANUP PÓS-SPRINT2: createPost() com location_id do postData
    // postData deve incluir author_profile_id e location_id
    await postService.createPost({
      author_profile_id: postData.author_profile_id ?? 'unknown',
      content: postData.content,
      type: "ride_share",
      location_id: postData.location_id ?? 'unknown',
      reach: postData.reach || 'neighborhood',
    });
    refetch();
  };

  const likePost = async (postId: string) => {
    // ✅ LOTE 8 - SocialInteractionsService.likePost (canonical boundary)
    await SocialInteractionsService.likePost(postId);
    refetch();
  };

  const commentOnPost = async (postId: string, content: string) => {
    // ✅ LOTE 7 - CommentService.createComment
    await CommentService.createComment({
      post_id: postId,
      content,
      author_profile_id: "unknown",
    });
    refetch();
  };

  return {
    posts: data || [],
    isLoading,
    loading: isLoading,
    error,
    createPost,
    likePost,
    commentOnPost,
    refetch,
  };
}
