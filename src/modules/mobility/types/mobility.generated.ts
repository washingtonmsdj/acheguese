/**
 * mobility.generated.ts — Ponto único de re-exportação de tipos do domínio Mobility
 *
 * SSOT: Todos os componentes e hooks do módulo mobility importam tipos daqui.
 * Não duplicar definições — apenas re-exportar das fontes canônicas.
 *
 * Fontes:
 * - RideRequest, DriverProfile, Vehicle → ./types (tipos de banco)
 * - RideStatus, RideType, DriverPlan, MobilidadeFilters → ../schemas/mobilitySchemas (Zod inferred)
 * - DriverStats, DriverEarnings, WeeklyEarning → ../services/DriverService
 */

// ── Tipos de banco (estrutura das tabelas) ────────────────────────────────
export type {
  RideRequest,
  DriverProfile,
  Vehicle,
  LocationTracking,
  DriverStatus,
  TripStats,
  DriverDashboard,
} from './types';

// ── Tipos inferidos dos schemas Zod ──────────────────────────────────────
export type {
  ValidatedRideRequest,
  ValidatedCreateRideData,
  ValidatedRideRating,
  ValidatedDriverStats,
  ValidatedDriverEarnings,
  ValidatedMobilidadeFilters,
} from '../schemas/mobilitySchemas';

// ── Enums / union types inferidos do Zod ─────────────────────────────────
import type { z } from 'zod';
import type {
  RideStatusSchema,
  RideTypeSchema,
  DriverPlanSchema,
  MobilidadeFiltersSchema,
  DriverEarningsSchema,
  DriverStatsSchema,
} from '../schemas/mobilitySchemas';

export type RideStatus = z.infer<typeof RideStatusSchema>;
export type RideType = z.infer<typeof RideTypeSchema>;
export type DriverPlan = z.infer<typeof DriverPlanSchema>;
export type MobilidadeFilters = z.infer<typeof MobilidadeFiltersSchema>;
export type DriverEarnings = z.infer<typeof DriverEarningsSchema>;
export type DriverStats = z.infer<typeof DriverStatsSchema>;

// ── Tipos do DriverService ────────────────────────────────────────────────
export type { WeeklyEarning } from '../services/DriverService';
