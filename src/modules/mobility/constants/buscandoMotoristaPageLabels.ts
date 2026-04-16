/**
 * Labels e textos da página de busca de motorista
 * Centralização para facilitar i18n e manutenção
 * SSOT: Single Source of Truth para todos os textos da UI
 */

export const BUSCANDO_MOTORISTA_PAGE_LABELS = {
  // Search Status
  SEARCH_TITLE: "Buscando motorista...",
  SEARCH_SUBTITLE: "Aguarde enquanto encontramos o mais próximo",

  // Route Labels
  ROUTE_ORIGIN_LABEL: "Origem",
  ROUTE_DESTINATION_LABEL: "Destino",
  ROUTE_ORIGIN_DEFAULT: "Origem não informada",
  ROUTE_DESTINATION_DEFAULT: "Destino não informado",

  // Price
  PRICE_LABEL: "Valor estimado",
  PRICE_FORMAT: (price: number) => `R$ ${price.toFixed(2)}`,

  // Actions
  BUTTON_CANCEL: "Cancelar solicitação",
  BUTTON_BACK: "Voltar",

  // Map Legend
  LEGEND_ORIGIN: "Origem",
  LEGEND_DESTINATION: "Destino",

  // Toast Messages
  TOAST_DRIVER_FOUND: "Motorista encontrado! 🎉",

  // Console Logs (para debug)
  LOG_NO_ROUTE: "[BuscandoMotoristaPage] Nenhuma rota retornada",
  LOG_ROUTE_SUCCESS: "[BuscandoMotoristaPage] Rota real carregada com sucesso",
  LOG_ROUTE_ERROR: "[BuscandoMotoristaPage] Erro ao carregar rota real:",

  // Aria Labels
  ARIA_BACK_BUTTON: "Voltar",
} as const;

export type BuscandoMotoristaPageLabel = keyof typeof BUSCANDO_MOTORISTA_PAGE_LABELS;
