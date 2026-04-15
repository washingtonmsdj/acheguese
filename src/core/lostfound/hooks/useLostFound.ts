/**
 * Hooks para Lost & Found - SSOT
 * Usa LostFoundService para todas as operações
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  lostFoundService,
  type LostFoundPost,
  type LostFoundComment,
} from "@/core/lostfound/services";
import { useToast } from "@/shared/hooks/use-toast";

/**
 * Hook para buscar posts de achados e perdidos
 */
export function useLostFoundPosts(
  filters: {
    tipo?: "perdido" | "achado";
    categoria?: string;
    resolvido?: boolean;
  } = {},
) {
  return useQuery({
    queryKey: ["lost-found-posts", filters],
    queryFn: () => lostFoundService.getPosts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar post específico
 */
export function useLostFoundPost(id: string | undefined) {
  return useQuery({
    queryKey: ["lost-found-post", id],
    queryFn: () => lostFoundService.getPostById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar comentários de um post
 */
export function useLostFoundComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["lost-found-comments", postId],
    queryFn: () => lostFoundService.getComments(postId!),
    enabled: !!postId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    retry: 1,
  });
}

/**
 * Hook para criar novo post
 */
export function useCreateLostFoundPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (
      data: Omit<LostFoundPost, "id" | "created_at" | "updated_at">,
    ) => lostFoundService.createPost(data),
    onSuccess: () => {
      // Invalidar cache de posts
      queryClient.invalidateQueries({ queryKey: ["lost-found-posts"] });
      toast({ title: "Post criado com sucesso!" });
    },
    onError: () => {
      toast({
        title: "Erro ao criar post",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para criar comentário
 */
export function useCreateLostFoundComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<LostFoundComment, "id" | "created_at">) =>
      lostFoundService.createComment(data),
    onSuccess: (_, variables) => {
      // Invalidar cache de comentários do post
      queryClient.invalidateQueries({
        queryKey: ["lost-found-comments", variables.post_id],
      });
      toast({ title: "Comentário enviado!" });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar comentário",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para marcar post como resolvido/não resolvido
 */
export function useToggleLostFoundResolved() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (postId: string) => lostFoundService.toggleResolved(postId),
    onSuccess: (_, postId) => {
      // Invalidar cache do post específico e lista de posts
      queryClient.invalidateQueries({ queryKey: ["lost-found-post", postId] });
      queryClient.invalidateQueries({ queryKey: ["lost-found-posts"] });
      toast({ title: "Status atualizado!" });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para atualizar post
 */
export function useUpdateLostFoundPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<LostFoundPost>;
    }) => lostFoundService.updatePost(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidar cache do post específico e lista de posts
      queryClient.invalidateQueries({ queryKey: ["lost-found-post", id] });
      queryClient.invalidateQueries({ queryKey: ["lost-found-posts"] });
      toast({ title: "Post atualizado!" });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar post",
        variant: "destructive",
      });
    },
  });
}
