/**
 * useCreateIssue - Criacao de problema urbano com invalidacao de cache
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityIssueService } from "../services/CommunityIssueService";
import type { CreateIssuePayload, IssueRpcError, IssueRpcResult } from "../domain/types";

export const ISSUE_RPC_ERROR_MESSAGES: Record<IssueRpcError, string> = {
  not_authenticated: "Voce precisa estar autenticado.",
  profile_not_found: "Perfil nao encontrado.",
  location_id_required: "Localizacao obrigatoria para registrar o problema.",
  location_not_found: "Localizacao informada nao foi encontrada.",
  location_must_be_district: "O problema deve ser registrado em um bairro.",
  rate_limit_exceeded: "Voce atingiu o limite de problemas reportados hoje.",
  invalid_category: "Categoria invalida.",
  invalid_title_length: "Titulo fora do tamanho permitido.",
  invalid_description_length: "Descricao fora do tamanho permitido.",
  duplicate_issue: "Ja existe um problema similar registrado neste bairro.",
  internal_error: "Erro interno. Tente novamente.",
};

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation<IssueRpcResult, Error, CreateIssuePayload>({
    mutationFn: (payload: CreateIssuePayload) => communityIssueService.createIssue(payload),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["community-issues"] });
      }
    },
  });
}
