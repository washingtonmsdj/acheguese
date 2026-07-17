import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import type { PostType } from "@/core/posts/types";
import { toast } from "sonner";
import {
  sanitizeContent,
  validatePostContent,
} from "@/shared/utils/textUtils";
import { isPostImageReference } from "@/core/media/references/postImageReference";
import { communityFeedQueryKeys } from "@/core/feed";
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

      const canonicalImages = data.images?.filter(isPostImageReference) ?? [];
      if (canonicalImages.length !== (data.images?.length ?? 0)) {
        throw new Error("Referencia de imagem de post invalida");
      }

      const resolvedLocationId =
        activeProfile.locationId ?? null;
      if (!resolvedLocationId) {
        throw new Error("Configure seu bairro no perfil antes de publicar");
      }

      // ✅ CLEANUP PÓS-SPRINT2: Usar PostsFacade.mutations.createPost() com location_id do profile
      const newPost = await PostsFacade.mutations.createPost({
        author_profile_id: activeProfile.id,
        content: sanitizedContent,
        type: data.type,
        location_id: resolvedLocationId,
        images: canonicalImages,
        tags: data.tags || [],
        reach: data.reach || "neighborhood",
      });

      return newPost;
    },
    onSuccess: () => {
      // Invalidate cache do feed
      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });
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
