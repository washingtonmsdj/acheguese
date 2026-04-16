/**
 * Labels e textos da página de passageiro
 * Centralização para facilitar i18n e manutenção
 * SSOT: Single Source of Truth para todos os textos da UI
 */

export const PASSENGER_PAGE_LABELS = {
  // Header
  HEADER_TITLE: "Viagens",
  BUTTON_NEW: "Nova",
  BUTTON_BACK: "Voltar",

  // Tabs
  TAB_ACTIVE: "Ativas",
  TAB_HISTORY: "Histórico",
  TAB_SECURITY: "SOS",

  // Quick Actions
  ACTION_REQUEST_RIDE_TITLE: "Solicitar Viagem",
  ACTION_REQUEST_RIDE_SUBTITLE: "Carona segura",
  ACTION_REQUEST_RIDE_ARIA: "Solicitar viagem",
  ACTION_SEND_DELIVERY_TITLE: "Enviar Entrega",
  ACTION_SEND_DELIVERY_SUBTITLE: "Docs, comida, compras",
  ACTION_SEND_DELIVERY_ARIA: "Enviar entrega",

  // Stats
  STAT_TRIPS_LABEL: "Viagens",
  STAT_COMPLETED_LABEL: "Concluídas",
  STAT_RATING_LABEL: "Avaliação",

  // Rating Alert
  RATING_ALERT_TITLE: "Avalie sua viagem",
  RATING_ALERT_SUBTITLE: (count: number) => `${count} viagem(ns) aguardando`,
  RATING_ALERT_BADGE: "+Pontos",

  // Active Rides - Empty State
  ACTIVE_EMPTY_TITLE: "Sem viagens ativas",
  ACTIVE_EMPTY_SUBTITLE: "Solicite uma viagem ou entrega para começar",
  ACTIVE_EMPTY_BUTTON: "Solicitar Agora",

  // Active Rides - Searching Driver
  SEARCHING_TITLE: "Buscando motorista...",
  SEARCHING_SUBTITLE: "Aguarde enquanto encontramos o motorista mais próximo",
  SEARCHING_CANCEL_BUTTON: "Cancelar solicitação",
  SEARCHING_ROUTE_SEPARATOR: "→",

  // Error States
  ERROR_TITLE: "Erro ao carregar viagens",
  ERROR_DESCRIPTION: "Verifique sua conexão e tente novamente.",
  ERROR_UNKNOWN: "Erro desconhecido",

  // Toast Messages
  TOAST_OPENING_CHAT: "Abrindo chat com motorista...",

  // Aria Labels
  ARIA_BACK_BUTTON: "Voltar",
} as const;

export type PassengerPageLabel = keyof typeof PASSENGER_PAGE_LABELS;
