/**
 * useCreateAlert - Criacao de alerta com invalidacao de cache
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityAlertService } from "../services/CommunityAlertService";
import type { CreateAlertPayload, AlertRpcError, AlertRpcResult } from "../domain/types";

const RPC_ERROR_MESSAGES: Record<AlertRpcError, string> = {
  not_authenticated: "Voce precisa estar autenticado.",
  phone_not_verified: "Verifique seu telefone antes de criar alertas.",
  account_too_new: "Sua conta precisa ter pelo menos 7 dias.",
  profile_not_found: "Perfil nao encontrado.",
  location_id_required: "Localizacao obrigatoria para criar alertas.",
  location_not_found: "Localizacao informada nao foi encontrada.",
  location_must_be_district: "O alerta deve ser publicado em um bairro.",
  rate_limit_exceeded: "Voce atingiu o limite de 3 alertas em 24 horas.",
  invalid_category: "Categoria invalida.",
  invalid_description_length: "Descricao fora do tamanho permitido.",
  blocked_content: "A descricao contem conteudo nao permitido.",
  duplicate_alert: "Ja existe um alerta recente desta categoria neste bairro.",
  internal_error: "Erro interno. Tente novamente.",
};

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation<AlertRpcResult, Error, CreateAlertPayload>({
    mutationFn: (payload: CreateAlertPayload) => communityAlertService.createAlert(payload),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["community-alerts"] });
      }
    },
  });
}

export { RPC_ERROR_MESSAGES };
