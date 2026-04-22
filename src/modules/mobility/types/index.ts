/**
 * Ponto de entrada público dos tipos do módulo mobility.
 * Importar daqui — não de sub-arquivos internos.
 */

// Todos os tipos canônicos via SSOT (mobility.generated.ts)
export * from './mobility.generated';

// Tipos de relatórios (ainda não gerados do banco)
export type RideReportsRow = Record<string, unknown>;
export type ReportStatus = "pending" | "reviewed" | "resolved";
export type ReportSeverity = "low" | "medium" | "high";

// Constantes de domínio
export const MOBILITY_CONSTANTS = {
  MAX_SEARCH_RADIUS_KM: 50,
  DEFAULT_SEARCH_RADIUS_KM: 10,
  MAX_PASSENGERS: 4,
} as const;
