/**
 * Validações Zod para Sistema de Mobilidade
 *
 * Garante integridade e segurança dos dados em runtime.
 *
 * @module lib/validations/mobilidade
 * @version 1.0.0
 */

import { z } from "zod";
import { RIDE_STATUS } from "@/core/mobility/constants";
import {
  ALERT_STATUS,
  PAYMENT_METHOD,
} from "@/shared/types/constants";

// ============================================================================
// ENUMS
// ============================================================================

export const RideTypeSchema = z.enum([
  "viagem",
  "entrega",
  "carona_compartilhada",
  "agendada",
]);

export const RideStatusSchema = z.enum([
  RIDE_STATUS.PENDING,
  RIDE_STATUS.DRIVER_ASSIGNED,
  RIDE_STATUS.DRIVER_ON_THE_WAY,
  RIDE_STATUS.DRIVER_ARRIVED,
  RIDE_STATUS.PASSENGER_ON_BOARD,
  RIDE_STATUS.IN_PROGRESS,
  RIDE_STATUS.COMPLETED,
  RIDE_STATUS.CANCELLED,
]);

export const PaymentMethodSchema = z.enum([
  PAYMENT_METHOD.PIX,
  PAYMENT_METHOD.DINHEIRO,
]);

export const DriverPlanSchema = z.enum(["padrao", "prioritario"]);

// ============================================================================
// MIGRATED FROM LIB/VALIDATION/SCHEMAS.TS
// ============================================================================

export const rideRequestSchema = z.object({
  origin: z
    .string()
    .min(1, "Origem é obrigatória")
    .max(200, "Origem deve ter no máximo 200 caracteres"),

  destination: z
    .string()
    .min(1, "Destino é obrigatório")
    .max(200, "Destino deve ter no máximo 200 caracteres"),

  passenger_count: z
    .number()
    .int("Número de passageiros deve ser inteiro")
    .min(1, "Deve ter pelo menos 1 passageiro")
    .max(4, "Máximo de 4 passageiros"),

  payment_method: z.enum(
    [
      PAYMENT_METHOD.PIX,
      PAYMENT_METHOD.DINHEIRO,
      PAYMENT_METHOD.CARTAO,
      PAYMENT_METHOD.CREDITO,
      PAYMENT_METHOD.DEBITO,
    ],
    {
      errorMap: () => ({ message: "Método de pagamento inválido" }),
    },
  ),

  notes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .optional(),
});

export type RideRequestFormData = z.infer<typeof rideRequestSchema>;

export const rideReportSchema = z.object({
  ride_id: z.string().uuid("ID de corrida inválido"),

  reason: z.enum(["driver_behavior", "safety", "route", "payment", "other"], {
    errorMap: () => ({ message: "Motivo inválido" }),
  }),

  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
});

export type RideReportFormData = z.infer<typeof rideReportSchema>;

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

export const PassengerProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  avatar_url: z.string().url().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  pontos: z.number().int().min(0).nullable().optional(),
  rank: z.enum(["bronze", "prata", "ouro", "elite"]).nullable().optional(),
});

export const DriverProfileSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  name: z.string().min(1),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  vehicle_plate: z.string().min(7).max(8),
  vehicle_model: z.string().min(1),
  vehicle_year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  cnh_image_url: z.string().url().optional(),
  is_verified: z.boolean(),
  is_online: z.boolean(),
  subscription_plan: DriverPlanSchema,
  subscription_active: z.boolean(),
  rating: z.number().min(0).max(5),
  total_rides: z.number().int().min(0),
  total_earnings: z.number().min(0),
  created_at: z.string().datetime(),
});

// ============================================================================
// RIDE REQUEST SCHEMA
// ============================================================================

export const RideRequestSchema = z.object({
  id: z.string().uuid(),
  passenger_profile_id: z.string().uuid(),
  driver_profile_id: z.string().uuid().nullable().optional(),

  origin: z.string().min(3, "Origem deve ter pelo menos 3 caracteres"),
  origin_details: z.string().nullable().optional(),
  destination: z.string().min(3, "Destino deve ter pelo menos 3 caracteres"),
  destination_details: z.string().nullable().optional(),
  origin_lat: z.number().min(-90).max(90).nullable().optional(),
  origin_lng: z.number().min(-180).max(180).nullable().optional(),
  destination_lat: z.number().min(-90).max(90).nullable().optional(),
  destination_lng: z.number().min(-180).max(180).nullable().optional(),
  search_radius_km: z.number().min(1).max(50).nullable().optional(),

  departure_time: z.string(),
  suggested_price: z.number().min(0).max(10000),
  final_price: z.number().min(0).max(10000).nullable().optional(),
  type: RideTypeSchema,
  payment_method: PaymentMethodSchema.nullable().optional(),
  observation: z.string().max(500).nullable().optional(),
  status: RideStatusSchema,

  driver_assigned_at: z.string().nullable().optional(),
  driver_on_the_way_at: z.string().nullable().optional(),
  driver_arrived_at: z.string().nullable().optional(),
  passenger_on_board_at: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  cancelled_at: z.string().nullable().optional(),
  cancellation_reason: z.string().max(500).nullable().optional(),

  created_at: z.string(),
  updated_at: z.string(),

  shared_ride_id: z.string().uuid().nullable().optional(),
  available_seats: z.number().int().min(1).max(8).nullable().optional(),

  is_scheduled: z.boolean().nullable().optional(),
  scheduled_for: z.string().nullable().optional(),

  passenger: PassengerProfileSchema.nullable().optional(),
  driver: DriverProfileSchema.nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  passenger_confirmed: z.boolean().nullable().optional(),
});

// ============================================================================
// CREATE RIDE SCHEMA
// ============================================================================

export const CreateRideDataSchema = z
  .object({
    origin: z.string().min(3, "Origem deve ter pelo menos 3 caracteres"),
    destination: z.string().min(3, "Destino deve ter pelo menos 3 caracteres"),
    departure_time: z.string(),
    suggested_price: z
      .number()
      .min(5, "Preço mínimo é R$ 5,00")
      .max(10000, "Preço máximo é R$ 10.000,00"),
    type: RideTypeSchema,
    payment_method: PaymentMethodSchema,
    observation: z
      .string()
      .max(500, "Observação muito longa (máx 500 caracteres)")
      .optional(),
    available_seats: z.number().int().min(1).max(8).optional(),

    origin_lat: z.number().min(-90).max(90).optional(),
    origin_lng: z.number().min(-180).max(180).optional(),
    destination_lat: z.number().min(-90).max(90).optional(),
    destination_lng: z.number().min(-180).max(180).optional(),
    search_radius_km: z.number().min(1).max(50).optional(),

    pickup_address_id: z.string().uuid().optional(),
    dropoff_address_id: z.string().uuid().optional(),
    pickup_location_id: z.string().uuid().optional(),
    dropoff_location_id: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      if (data.origin_lat !== undefined || data.origin_lng !== undefined) {
        return data.origin_lat !== undefined && data.origin_lng !== undefined;
      }
      return true;
    },
    { message: "Coordenadas de origem incompletas", path: ["origin_lat"] },
  )
  .refine(
    (data) => {
      if (data.destination_lat !== undefined || data.destination_lng !== undefined) {
        return data.destination_lat !== undefined && data.destination_lng !== undefined;
      }
      return true;
    },
    { message: "Coordenadas de destino incompletas", path: ["destination_lat"] },
  );

// ============================================================================
// RATING SCHEMA
// ============================================================================

export const RideRatingSchema = z.object({
  ride_id: z.string().uuid(),
  rating: z
    .number()
    .int()
    .min(1, "Avaliação mínima é 1 estrela")
    .max(5, "Avaliação máxima é 5 estrelas"),
  comment: z
    .string()
    .max(500, "Comentário muito longo (máx 500 caracteres)")
    .optional(),
});

// ============================================================================
// DRIVER STATS SCHEMA
// ============================================================================

export const DriverStatsSchema = z.object({
  totalRides: z.number().int().min(0),
  completedRides: z.number().int().min(0),
  cancelledRides: z.number().int().min(0),
  avgRating: z.number().min(0).max(5),
  acceptanceRate: z.number().min(0).max(100),
  onlineHoursToday: z.number().min(0),
});

// ============================================================================
// DRIVER EARNINGS SCHEMA
// ============================================================================

export const DriverEarningsSchema = z.object({
  today: z.number().min(0),
  week: z.number().min(0),
  month: z.number().min(0),
  total: z.number().min(0),
});

// ============================================================================
// EMERGENCY ALERT SCHEMA
// ============================================================================

export const EmergencyAlertSchema = z.object({
  user_id: z.string().uuid(),
  ride_id: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  driver_profile_id: z.string().uuid().optional(),
  driver_name: z.string().optional(),
  vehicle_plate: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  alert_type: z
    .enum(["emergency_button", "automatic", "manual"])
    .default("emergency_button"),
  status: z
    .enum([ALERT_STATUS.ACTIVE, ALERT_STATUS.RESOLVED, "false_alarm"])
    .default(ALERT_STATUS.ACTIVE),
});

// ============================================================================
// FILTERS SCHEMA
// ============================================================================

export const MobilidadeFiltersSchema = z.object({
  type: z.union([RideTypeSchema, z.literal("all")]),
  status: z.union([RideStatusSchema, z.literal("all")]),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateCreateRideData(data: unknown) {
  return CreateRideDataSchema.parse(data);
}

export function validateRideRequest(data: unknown) {
  return RideRequestSchema.parse(data);
}

export function validateRideRating(data: unknown) {
  return RideRatingSchema.parse(data);
}

export function validateDriverStats(data: unknown) {
  return DriverStatsSchema.parse(data);
}

export function validateDriverEarnings(data: unknown) {
  return DriverEarningsSchema.parse(data);
}

export function validateEmergencyAlert(data: unknown) {
  return EmergencyAlertSchema.parse(data);
}

export function validateMobilidadeFilters(data: unknown) {
  return MobilidadeFiltersSchema.parse(data);
}

// ============================================================================
// SAFE PARSE HELPERS
// ============================================================================

export function safeValidateRideRequest(data: unknown) {
  return RideRequestSchema.safeParse(data);
}

export function safeValidateCreateRideData(data: unknown) {
  return CreateRideDataSchema.safeParse(data);
}

export function safeValidateRideRating(data: unknown) {
  return RideRatingSchema.safeParse(data);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ValidatedRideRequest = z.infer<typeof RideRequestSchema>;
export type ValidatedCreateRideData = z.infer<typeof CreateRideDataSchema>;
export type ValidatedRideRating = z.infer<typeof RideRatingSchema>;
export type ValidatedDriverStats = z.infer<typeof DriverStatsSchema>;
export type ValidatedDriverEarnings = z.infer<typeof DriverEarningsSchema>;
export type ValidatedEmergencyAlert = z.infer<typeof EmergencyAlertSchema>;
export type ValidatedMobilidadeFilters = z.infer<typeof MobilidadeFiltersSchema>;
