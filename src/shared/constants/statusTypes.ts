/**
 * Constantes para Status do Sistema
 *
 * Centraliza todos os status usados no sistema
 * para evitar magic strings e facilitar manutenção
 *
 * @version 1.0.0
 */

// Status de Alertas
export const ALERT_STATUS = {
  ACTIVE: "active",
  RESOLVED: "resolved",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;

export type AlertStatus = (typeof ALERT_STATUS)[keyof typeof ALERT_STATUS];

// Labels de Status de Alertas
export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  [ALERT_STATUS.ACTIVE]: "Ativo",
  [ALERT_STATUS.RESOLVED]: "Resolvido",
  [ALERT_STATUS.EXPIRED]: "Expirado",
  [ALERT_STATUS.CANCELLED]: "Cancelado",
};

// Cores de Status de Alertas
export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  [ALERT_STATUS.ACTIVE]: "#EF4444", // red-500
  [ALERT_STATUS.RESOLVED]: "#10B981", // green-500
  [ALERT_STATUS.EXPIRED]: "#6B7280", // gray-500
  [ALERT_STATUS.CANCELLED]: "#9CA3AF", // gray-400
};

// Status de Corridas/Viagens
export const RIDE_STATUS = {
  PENDING: "pending",
  DRIVER_ASSIGNED: "driver_assigned",
  DRIVER_ON_THE_WAY: "driver_on_the_way",
  DRIVER_ARRIVED: "driver_arrived",
  PASSENGER_ON_BOARD: "passenger_on_board",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type RideStatus = (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS];

// Labels de Status de Corridas
export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  [RIDE_STATUS.PENDING]: "Aguardando motorista",
  [RIDE_STATUS.DRIVER_ASSIGNED]: "Motorista atribuído",
  [RIDE_STATUS.DRIVER_ON_THE_WAY]: "Motorista a caminho",
  [RIDE_STATUS.DRIVER_ARRIVED]: "Motorista chegou",
  [RIDE_STATUS.PASSENGER_ON_BOARD]: "Passageiro a bordo",
  [RIDE_STATUS.IN_PROGRESS]: "Viagem em andamento",
  [RIDE_STATUS.COMPLETED]: "Viagem concluída",
  [RIDE_STATUS.CANCELLED]: "Viagem cancelada",
};

// Cores de Status de Corridas
export const RIDE_STATUS_COLORS: Record<RideStatus, string> = {
  [RIDE_STATUS.PENDING]: "#F59E0B", // amber-500
  [RIDE_STATUS.DRIVER_ASSIGNED]: "#3B82F6", // blue-500
  [RIDE_STATUS.DRIVER_ON_THE_WAY]: "#8B5CF6", // purple-500
  [RIDE_STATUS.DRIVER_ARRIVED]: "#06B6D4", // cyan-500
  [RIDE_STATUS.PASSENGER_ON_BOARD]: "#10B981", // green-500
  [RIDE_STATUS.IN_PROGRESS]: "#10B981", // green-500
  [RIDE_STATUS.COMPLETED]: "#6B7280", // gray-500
  [RIDE_STATUS.CANCELLED]: "#EF4444", // red-500
};

// Status de Empresas
export const BUSINESS_STATUS = {
  ACTIVE: "ativo",
  INACTIVE: "inativo",
  PENDING: "pendente",
  SUSPENDED: "suspenso",
} as const;

export type BusinessStatus =
  (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

// Labels de Status de Empresas
export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  [BUSINESS_STATUS.ACTIVE]: "Ativo",
  [BUSINESS_STATUS.INACTIVE]: "Inativo",
  [BUSINESS_STATUS.PENDING]: "Pendente",
  [BUSINESS_STATUS.SUSPENDED]: "Suspenso",
};

// Status de Verificação
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

// Labels de Status de Verificação
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VERIFICATION_STATUS.PENDING]: "Pendente",
  [VERIFICATION_STATUS.APPROVED]: "Aprovado",
  [VERIFICATION_STATUS.REJECTED]: "Rejeitado",
};

// Validações
export function isValidAlertStatus(status: string): status is AlertStatus {
  return Object.values(ALERT_STATUS).includes(status as AlertStatus);
}

export function isValidRideStatus(status: string): status is RideStatus {
  return Object.values(RIDE_STATUS).includes(status as RideStatus);
}

export function isValidBusinessStatus(
  status: string,
): status is BusinessStatus {
  return Object.values(BUSINESS_STATUS).includes(status as BusinessStatus);
}

export function isValidVerificationStatus(
  status: string,
): status is VerificationStatus {
  return Object.values(VERIFICATION_STATUS).includes(
    status as VerificationStatus,
  );
}
