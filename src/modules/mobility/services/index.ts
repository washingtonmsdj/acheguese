/**
 * MOBILITY SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// FACADE - Interface unificada SSOT v2.0
// ============================================================
export {
  MobilityFacade,
  UnifiedMobilityService,
} from "./MobilityService";

// ============================================================
// QUERIES - Operações de leitura
// ============================================================
export * from "./mobility.queries";

// ============================================================
// MUTATIONS - Operações de escrita
// ============================================================
export * from "./mobility.mutations";

// ============================================================
// HELPERS - Funções auxiliares
// ============================================================
export * from "./mobility.helpers";

// ============================================================
// SERVICES ESPECIALIZADOS
// ============================================================
export * from "./ChatService";
export * from "./DriverService";
export * from "./RideService";
export * from "./MobilityAdminQueryService";
export * from "./MobilityAuditService";
export * from "./DriverAvailabilityService";
export * from "./OperationalVerificationService";
export * from "./DriverModerationEventsService";
export * from "./MotoboySourceResolverService";

// ============================================================
// ADAPTERS E VALIDATORS
// ============================================================
export * from "./RideCanonicalAdapter";
export * from "./validators";
