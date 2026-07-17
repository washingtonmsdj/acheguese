/**
 * useCreateIssue - Criação de problema urbano com invalidação de cache
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityIssueService } from "../services/CommunityIssueService";
import type { CreateIssuePayload, IssueRpcError, IssueRpcResult } from "../domain/types";

export const ISSUE_RPC_ERROR_MESSAGES: Record<IssueRpcError, string> = {
  not_authenticated: "Você precisa estar autenticado.",
  profile_not_found: "Perfil não encontrado.",
  location_id_required: "Localização obrigatória para registrar o problema.",
  location_not_found: "Localização informada não foi encontrada.",
  location_must_be_district: "O problema deve ser registrado em um bairro.",
  verified_residence_required: "Confirme sua residência neste bairro antes de registrar o problema.",
  rate_limit_exceeded: "Você atingiu o limite de problemas reportados hoje.",
  invalid_category: "Categoria inválida.",
  invalid_title_length: "Título fora do tamanho permitido.",
  invalid_description_length: "Descrição fora do tamanho permitido.",
  invalid_address_reference: "Referência de localização fora do tamanho permitido.",
  invalid_priority: "Prioridade inválida.",
  invalid_images: "Uma ou mais imagens são inválidas.",
  duplicate_issue: "Já existe um problema similar registrado neste bairro.",
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
