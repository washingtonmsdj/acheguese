/**
 * @deprecated Este arquivo está DEPRECADO
 * 
 * ⚠️ NÃO USE ESTE ARQUIVO! ⚠️
 * 
 * Todas as constantes de status foram consolidadas em:
 * @see src/shared/types/global.constants.ts
 * 
 * Este arquivo será removido em versão futura.
 * Por favor, atualize seus imports para:
 * 
 * ```typescript
 * // ❌ ERRADO (deprecado)
 * import { ALERT_STATUS, RIDE_STATUS } from '@/shared/constants/statusTypes';
 * 
 * // ✅ CORRETO (SSOT)
 * import { ALERT_STATUS, RIDE_STATUS, BUSINESS_STATUS } from '@/shared/types/global.constants';
 * ```
 * 
 * Razão da mudança: Princípio SSOT (Single Source of Truth)
 * - Evita duplicação de definições
 * - Centraliza manutenção
 * - Previne inconsistências
 * 
 * @module StatusTypes
 * @deprecated Use global.constants.ts
 * @version 1.0.0 (DEPRECATED)
 */

// Re-exports temporários para compatibilidade (serão removidos)
export {
  ALERT_STATUS,
  ALERT_STATUS_LABELS,
  ALERT_STATUS_COLORS,
  RIDE_STATUS,
  RIDE_STATUS_LABELS,
  RIDE_STATUS_COLORS,
  BUSINESS_STATUS,
  BUSINESS_STATUS_LABELS,
  VERIFICATION_STATUS,
  VERIFICATION_STATUS_LABELS,
  isValidAlertStatus,
  isValidRideStatus,
  isValidBusinessStatus,
  isValidVerificationStatus,
  type AlertStatus,
  type RideStatus,
  type BusinessStatus,
  type VerificationStatus,
} from '@/shared/types/global.constants';
