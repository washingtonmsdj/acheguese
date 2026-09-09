/**
 * GATE 7: OPERATIONAL VERIFICATION TYPES
 * 
 * Types para verificação operacional (PIN) de corridas e entregas.
 * 
 * Data: 08/04/2026
 * Status: Novo escopo pós-fechamento da mobilidade
 */

// ============================================
// ENUMS
// ============================================

export type VerificationType = 'pin'; // v1 só PIN, futuro: 'signature', 'qrcode'

export type VerificationRequiredBy = 
  | 'admin'      // Configuração global do sistema
  | 'passenger'  // Preferência do passageiro
  | 'driver'     // Preferência do motorista
  | 'sender'     // Remetente da entrega
  | 'operation'; // Configuração da operação/empresa

export type VerificationStatus = 
  | 'not_required' // Verificação não é necessária
  | 'pending'      // Aguardando verificação
  | 'verified'     // Verificado com sucesso
  | 'failed';      // Falha na verificação (tentativas esgotadas)

// ============================================
// INTERFACES
// ============================================

/**
 * Verificação operacional completa
 */
export interface OperationalVerification {
  // Identificação
  id: string;
  ride_id: string;
  verification_type: VerificationType;
  
  // Exigência
  is_required: boolean;
  required_by: VerificationRequiredBy | null;
  required_at: string | null; // ISO 8601
  
  // Status
  status: VerificationStatus;
  
  // PIN (hash)
  pin_hash: string | null; // bcrypt hash, nunca texto puro
  pin_generated_at: string | null; // ISO 8601
  pin_expires_at: string | null; // ISO 8601
  
  // Verificação
  verified_at: string | null; // ISO 8601
  verified_by: string | null; // profile_id
  verification_attempts: number;
  last_attempt_at: string | null; // ISO 8601
  
  // Auditoria
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * Parâmetros para validar PIN
 */
export interface VerifyPINParams {
  rideId: string;
  pin: string; // 4 dígitos
}

export interface RequesterPinResult {
  verificationId: string;
  pin: string;
  expiresAt: string;
}

/**
 * Parâmetros para verificar se PIN é exigido
 */
export interface CheckPINRequiredParams {
  rideMode: 'ride' | 'motoboy';
  passengerId?: string;
  driverProfileId?: string;
  senderProfileId?: string;
  operationId?: string;
}

/**
 * Resultado da validação de PIN
 */
export interface VerifyPINResult {
  verified: boolean;
  attemptsRemaining?: number;
  message?: string;
}

/**
 * Status resumido da verificação
 */
export interface VerificationStatusSummary {
  isRequired: boolean;
  status: VerificationStatus;
  verified: boolean;
  attemptsRemaining: number;
  expiresAt: string | null;
}

// ============================================
// CONSTANTES
// ============================================

/**
 * Configurações de PIN
 */
export const PIN_CONFIG = {
  LENGTH: 4,
  MAX_ATTEMPTS: 5,
  EXPIRATION_HOURS: 24,
  BCRYPT_ROUNDS: 10,
} as const;

/**
 * Mensagens de erro
 */
export const VERIFICATION_ERRORS = {
  PIN_REQUIRED: 'PIN verification required',
  INVALID_PIN: 'Invalid PIN',
  PIN_EXPIRED: 'PIN has expired',
  MAX_ATTEMPTS_REACHED: 'Maximum verification attempts reached',
  VERIFICATION_NOT_FOUND: 'Verification not found',
  VERIFICATION_ALREADY_VERIFIED: 'Verification already completed',
  PIN_NOT_GENERATED: 'PIN ainda não foi gerado pelo solicitante',
} as const;

/**
 * Mensagens de sucesso
 */
export const VERIFICATION_SUCCESS = {
  PIN_VERIFIED: 'PIN verified successfully',
  VERIFICATION_CREATED: 'Verification created successfully',
} as const;
