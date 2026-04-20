/**
 * useCreateIssue — Criação de problema urbano com loading/error/invalidação de cache
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityIssueService } from "../services/CommunityIssueService";
import type { CreateIssuePayload, IssueRpcError } from "../domain/types";

export const ISSUE_RPC_ERROR_MESSAGES: Record<IssueRpcError, string> = {
  not_authenticated:          "Você precisa estar autenticado.",
  profile_not_found:          "Perfil não encontrado.",
  rate_limit_exceeded:        "Você atingiu o limite de problemas reportados hoje.",
  invalid_category:           "Categoria inválida.",
  invalid_title_length:       "Título fora do tamanho permitido.",
  invalid_description_length: "Descrição fora do tamanho permitido.",
  duplicate_issue:            "Já existe um problema similar registrado neste bairro.",
  internal_error:             "Erro interno. Tente novamente.",
};

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIssuePayload) =>
      communityIssueService.createIssue(payload),

    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["community-issues"] });
      }
    },
  });
}
