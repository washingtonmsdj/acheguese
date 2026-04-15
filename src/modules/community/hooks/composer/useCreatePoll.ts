import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { postService } from "@/core/posts/services";
import type { CreatePollData } from "@/core/posts/types";

/**
 * Hook for create enquetes (polls)
 *
 * Funcionalidades:
 * - Criar poll vinculada a um post
 * - Criar opções de resposta
 * - Validar dados
 *
 * SSOT MIGRATION - FASE 7: Migrado para usar PostService
 */

export interface PollOption {
  text: string;
  position: number;
}

export interface CreatePollRequest {
  postId: string;
  question: string;
  options: PollOption[];
  expiresInDays: number;
}

export function useCreatePoll() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreatePollRequest) => {
      const pollData: CreatePollData = {
        postId: data.postId,
        question: data.question,
        options: data.options,
        expiresInDays: data.expiresInDays,
      };

      return await postService.createPoll(pollData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      toast.success("Enquete criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar enquete");
    },
  });

  return {
    createPoll: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
