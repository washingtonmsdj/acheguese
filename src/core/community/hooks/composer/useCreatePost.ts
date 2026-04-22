import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import type { PostType } from "../types";
import { toast } from "sonner";
import {
  sanitizeContent,
  sanitizeUrl,
  validatePostContent,
} from "@/shared/utils/textUtils";
import { useCommunityInteractions } from "@/core/community/hooks/useCommunityInteractions";
import { PostsFacade } from "@/core/posts/services"; // ✅ GATE 4A FASE 13 - SSOT v2.0

/**
 * Hook for create posts na comunidade
 *
 * Requirement 3: Criar Post
 * Requirement 13: Limitações de Uso
 * Requirement 29: Validações e Segurança
 *
 * Funcionalidades:
 * - Criar post com validação
 * - Sanitizar conteúdo para prevenir XSS
 * - Validar rate limit (5 posts/dia)
 * - Auto-atribuir city, neighborhood, street do profile do usuário
 * - Criar associações de tags
 * - Invalidate cache do feed após criação
 */

interface CreatePostData {
  type: PostType;
  content: string;
  images?: string[];
  tags?: string[];
  reach?: "street" | "neighborhood" | "city";
}

export function useCreatePost() {
  const { user, activeProfile } = useSessionContext();
  const queryClient = useQueryClient();
  const { recordInteraction } = useCommunityInteractions();

  const mutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      if (!user || !activeProfile) {
        throw new Error("Usuário não autenticado");
      }

      // Requirement 29.2: Validar conteúdo
      const validation = validatePostContent(data.content);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Requirement 29.2: Sanitizar conteúdo para prevenir XSS
      const sanitizedContent = sanitizeContent(data.content);

      // Requirement 29.2: Sanitizar URLs de imagens
      const sanitizedImages =
        data.images?.map(sanitizeUrl).filter((url) => url !== "") || [];

      // ✅ CLEANUP PÓS-SPRINT2: Usar PostsFacade.mutations.createPost() com location_id do profile
      const newPost = await PostsFacade.mutations.createPost({
        author_profile_id: activeProfile.id,
        content: sanitizedContent,
        type: data.type,
        location_id: activeProfile.locationId,
        images: sanitizedImages,
        tags: data.tags || [],
        reach: data.reach || "neighborhood",
      });

      return newPost;
    },
    onSuccess: (newPost) => {
      // Registrar interação e ganhar pontos
      recordInteraction(
        "post_created",
        "post",
        newPost.id,
        {},
        {
          showToast: true,
        },
      );

      // Invalidate cache do feed
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      toast.success("Post criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar post");
    },
  });

  return {
    createPost: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
