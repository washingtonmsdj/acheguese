/**
 * useCreateAlert — Criação de alerta com loading/error/invalidação de cache
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityAlertService } from "../services/CommunityAlertService";
import type { CreateAlertPayload, AlertRpcError } from "../domain/types";

const RPC_ERROR_MESSAGES: Record<AlertRpcError, string> = {
  not_authenticated:        "Você precisa estar autenticado.",
  phone_not_verified:       "Verifique seu telefone antes de criar alertas.",
  account_too_new:          "Sua conta precisa ter pelo menos 7 dias.",
  profile_not_found:        "Perfil não encontrado.",
  rate_limit_exceeded:      "Você atingiu o limite de 3 alertas em 24 horas.",
  invalid_category:         "Categoria inválida.",
  invalid_description_length: "Descrição fora do tamanho permitido.",
  blocked_content:          "A descrição contém conteúdo não permitido.",
  duplicate_alert:          "Já existe um alerta recente desta categoria neste bairro.",
  internal_error:           "Erro interno. Tente novamente.",
};

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAlertPayload) =>
      communityAlertService.createAlert(payload),

    onSuccess: (result) => {
      if (result.success) {
        // Invalida o cache do feed para exibir o novo alerta
        queryClient.invalidateQueries({ queryKey: ["community-alerts"] });
      }
    },
  });
}

export { RPC_ERROR_MESSAGES };
