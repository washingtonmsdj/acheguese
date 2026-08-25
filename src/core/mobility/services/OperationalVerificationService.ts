/**
 * GATE 7: OPERATIONAL VERIFICATION SERVICE
 *
 * Browser-facing facade for server-authoritative PIN verification.
 * PIN generation, hashing, expiry, attempt counting and verification state
 * changes live in Postgres RPCs. Browser code never receives pin_hash.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { profileService } from '@/core/profiles/services/ProfileService';
import type {
  OperationalVerification,
  CreateVerificationParams,
  CreateVerificationResult,
  VerifyPINParams,
  VerifyPINResult,
  VerificationStatusSummary,
} from '../types/OperationalVerification';
import {
  PIN_CONFIG as CONFIG,
  VERIFICATION_ERRORS as ERRORS,
  VERIFICATION_SUCCESS as SUCCESS,
} from '../types/OperationalVerification';

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

type RpcError = { message?: string | null; code?: string | null } | null;
type RpcResult<T> = { data: T | null; error: RpcError };
type OperationalVerificationRpcClient = {
  rpc<T = unknown>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<RpcResult<T>>;
};

const verificationRpc = supabase as unknown as OperationalVerificationRpcClient;

type CreateVerificationRpcResult = {
  verification_id?: unknown;
  pin?: unknown;
  expires_at?: unknown;
};

type VerifyPinRpcResult = {
  verified?: unknown;
  code?: unknown;
  attempts_remaining?: unknown;
};

type VerificationStatusRpcResult = {
  id: string;
  ride_id: string;
  verification_type: 'pin';
  is_required: boolean;
  required_by: OperationalVerification['required_by'];
  required_at: string | null;
  status: OperationalVerification['status'];
  pin_generated_at: string | null;
  pin_expires_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  verification_attempts: number;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
};

function verificationErrorForCode(code: string): string {
  switch (code) {
    case 'verification_not_found':
      return ERRORS.VERIFICATION_NOT_FOUND;
    case 'already_verified':
      return ERRORS.VERIFICATION_ALREADY_VERIFIED;
    case 'pin_expired':
      return ERRORS.PIN_EXPIRED;
    case 'max_attempts_reached':
      return ERRORS.MAX_ATTEMPTS_REACHED;
    case 'invalid_pin':
      return ERRORS.INVALID_PIN;
    default:
      return ERRORS.INVALID_PIN;
  }
}

export class OperationalVerificationService {
  /**
   * Creates a verification through the canonical database command.
   * Plaintext PIN is returned once by the RPC and is never persisted as plaintext.
   */
  static async createVerification(
    params: CreateVerificationParams,
  ): Promise<ServiceResult<CreateVerificationResult>> {
    try {
      const { rideId, verificationType, isRequired, requiredBy } = params;
      const { data, error } = await verificationRpc.rpc<CreateVerificationRpcResult>(
        'create_operational_pin_verification',
        {
          p_ride_id: rideId,
          p_is_required: isRequired,
          p_required_by: requiredBy,
          p_verification_type: verificationType,
        },
      );

      if (error) throw new Error(error.message || 'Failed to create verification');
      if (!data || typeof data.verification_id !== 'string') {
        throw new Error('Invalid operational verification creation response');
      }

      return {
        success: true,
        data: {
          verificationId: data.verification_id,
          pin: typeof data.pin === 'string' ? data.pin : undefined,
          expiresAt:
            typeof data.expires_at === 'string' ? data.expires_at : undefined,
        },
      };
    } catch (error) {
      logger.error('Error creating verification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create verification',
      };
    }
  }

  /**
   * Verifies a PIN entirely in Postgres. `verifiedBy` remains in the public
   * TypeScript contract for callers, but the database deliberately ignores any
   * caller-supplied actor identity and derives verified_by from the active session.
   */
  static async verifyPIN(
    params: VerifyPINParams,
  ): Promise<ServiceResult<VerifyPINResult>> {
    try {
      const { rideId, pin } = params;
      if (!this.isValidPINFormat(pin)) {
        return { success: false, error: ERRORS.INVALID_PIN };
      }

      const { data, error } = await verificationRpc.rpc<VerifyPinRpcResult>(
        'verify_operational_pin',
        { p_ride_id: rideId, p_pin: pin },
      );

      if (error) throw new Error(error.message || 'Failed to verify PIN');
      if (!data || typeof data.verified !== 'boolean') {
        throw new Error('Invalid operational PIN verification response');
      }

      const code = typeof data.code === 'string' ? data.code : 'invalid_pin';
      const attemptsRemaining =
        typeof data.attempts_remaining === 'number'
          ? data.attempts_remaining
          : undefined;

      if (data.verified === true) {
        return {
          success: true,
          data: {
            verified: true,
            attemptsRemaining,
            message: SUCCESS.PIN_VERIFIED,
          },
        };
      }

      const errorMessage = verificationErrorForCode(code);
      return {
        success: false,
        error: errorMessage,
        data: {
          verified: false,
          attemptsRemaining,
          message:
            code === 'invalid_pin' && attemptsRemaining !== undefined
              ? `Invalid PIN. ${attemptsRemaining} attempts remaining.`
              : errorMessage,
        },
      };
    } catch (error) {
      logger.error('Error verifying PIN:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify PIN',
      };
    }
  }

  /**
   * Returns the sanitized verification projection. `pin_hash` is intentionally
   * represented as null for compatibility with the legacy interface and is never
   * returned by the database RPC.
   */
  static async getVerificationStatus(
    rideId: string,
  ): Promise<OperationalVerification | null> {
    try {
      const { data, error } = await verificationRpc.rpc<VerificationStatusRpcResult>(
        'get_operational_verification_status',
        { p_ride_id: rideId },
      );

      if (error) throw new Error(error.message || 'Failed to read verification status');
      if (!data) return null;

      return {
        ...data,
        pin_hash: null,
      } as OperationalVerification;
    } catch (error) {
      logger.error('Error getting verification status:', error);
      return null;
    }
  }

  static async getVerificationStatusSummary(
    rideId: string,
  ): Promise<VerificationStatusSummary | null> {
    try {
      const verification = await this.getVerificationStatus(rideId);
      if (!verification) return null;

      return {
        isRequired: verification.is_required,
        status: verification.status,
        verified: verification.status === 'verified',
        attemptsRemaining: Math.max(
          0,
          CONFIG.MAX_ATTEMPTS - verification.verification_attempts,
        ),
        expiresAt: verification.pin_expires_at,
      };
    } catch (error) {
      logger.error('Error getting verification status summary:', error);
      return null;
    }
  }

  /**
   * GATE 7 FASE 2.5: Resolve se PIN é exigido para uma CORRIDA.
   * Precedência: admin global > passageiro > motorista.
   */
  static async resolveRidePINRequirement(params: {
    passengerId: string;
    driverProfileId?: string;
  }): Promise<{
    isRequired: boolean;
    requiredBy: 'admin' | 'passenger' | 'driver' | null;
    reason: string;
  }> {
    try {
      const adminRequires = process.env.REQUIRE_PIN_FOR_ALL_RIDES === 'true';
      if (adminRequires) {
        return {
          isRequired: true,
          requiredBy: 'admin',
          reason: 'Admin global requires PIN for all rides',
        };
      }

      const passenger = await profileService.getProfileById(params.passengerId) as {
        requires_pin_for_rides?: boolean | null;
      } | null;

      if (passenger?.requires_pin_for_rides === true) {
        return {
          isRequired: true,
          requiredBy: 'passenger',
          reason: 'Passenger requires PIN verification',
        };
      }

      if (params.driverProfileId) {
        const driver = await profileService.getProfileById(params.driverProfileId) as {
          requires_pin_for_rides?: boolean | null;
        } | null;

        if (driver?.requires_pin_for_rides === true) {
          return {
            isRequired: true,
            requiredBy: 'driver',
            reason: 'Driver requires PIN verification',
          };
        }
      }

      return {
        isRequired: false,
        requiredBy: null,
        reason: 'PIN not required',
      };
    } catch (error) {
      logger.error('Error resolving ride PIN requirement:', error);
      return {
        isRequired: false,
        requiredBy: null,
        reason: 'Error checking PIN requirement',
      };
    }
  }

  /**
   * GATE 7 FASE 2.5: Resolve se PIN é exigido para uma ENTREGA.
   * Precedência: admin global > operação/remetente/empresa.
   */
  static async resolveDeliveryPINRequirement(params: {
    senderProfileId: string;
    operationId?: string;
  }): Promise<{
    isRequired: boolean;
    requiredBy: 'admin' | 'sender' | 'operation' | null;
    reason: string;
  }> {
    try {
      const adminRequires = process.env.REQUIRE_PIN_FOR_ALL_DELIVERIES === 'true';
      if (adminRequires) {
        return {
          isRequired: true,
          requiredBy: 'admin',
          reason: 'Admin global requires PIN for all deliveries',
        };
      }

      const sender = await profileService.getProfileById(params.senderProfileId) as {
        requires_pin_for_deliveries?: boolean | null;
      } | null;

      if (sender?.requires_pin_for_deliveries === true) {
        return {
          isRequired: true,
          requiredBy: 'sender',
          reason: 'Sender requires PIN verification',
        };
      }

      return {
        isRequired: false,
        requiredBy: null,
        reason: 'PIN not required',
      };
    } catch (error) {
      logger.error('Error resolving delivery PIN requirement:', error);
      return {
        isRequired: false,
        requiredBy: null,
        reason: 'Error checking PIN requirement',
      };
    }
  }

  static isValidPINFormat(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }
}
