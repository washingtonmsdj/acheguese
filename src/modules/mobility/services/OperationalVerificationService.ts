/**
 * GATE 7: OPERATIONAL VERIFICATION SERVICE
 * 
 * Service para gerenciar verificações operacionais (PIN) de corridas e entregas.
 * 
 * Data: 08/04/2026
 * Status: Novo escopo pós-fechamento da mobilidade
 * 
 * Responsabilidades:
 * - Gerar PIN quando exigido
 * - Validar PIN fornecido
 * - Gerenciar status de verificação
 * - Registrar tentativas
 * - Verificar expiração
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';
import { profileService } from '@/core/profiles/services/ProfileService';
import type {
  OperationalVerification,
  CreateVerificationParams,
  CreateVerificationResult,
  VerifyPINParams,
  VerifyPINResult,
  CheckPINRequiredParams,
  VerificationStatusSummary,
  PIN_CONFIG,
  VERIFICATION_ERRORS,
  VERIFICATION_SUCCESS,
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

export class OperationalVerificationService {
  // ============================================
  // CRIAR VERIFICAÇÃO
  // ============================================

  /**
   * Cria uma verificação operacional e gera PIN se necessário
   */
  static async createVerification(
    params: CreateVerificationParams
  ): Promise<ServiceResult<CreateVerificationResult>> {
    try {
      const { rideId, verificationType, isRequired, requiredBy } = params;

      // Se não é exigido, criar registro mas sem PIN
      if (!isRequired) {
        const { data, error } = await supabase
          .from('operational_verifications')
          .insert({
            ride_id: rideId,
            verification_type: verificationType,
            is_required: false,
            status: 'not_required',
          })
          .select('id')
          .single();

        if (error) throw error;

        return {
          success: true,
          data: {
            verificationId: data.id,
          },
        };
      }

      // Gerar PIN de 4 dígitos
      const pin = this.generatePIN();
      const pinHash = await bcrypt.hash(pin, CONFIG.BCRYPT_ROUNDS);

      // Calcular expiração (24h)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CONFIG.EXPIRATION_HOURS * 60 * 60 * 1000);

      // Criar registro
      const { data, error } = await supabase
        .from('operational_verifications')
        .insert({
          ride_id: rideId,
          verification_type: verificationType,
          is_required: true,
          required_by: requiredBy,
          required_at: now.toISOString(),
          status: 'pending',
          pin_hash: pinHash,
          pin_generated_at: now.toISOString(),
          pin_expires_at: expiresAt.toISOString(),
          verification_attempts: 0,
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          verificationId: data.id,
          pin, // Retornar PIN em texto puro APENAS na criação
          expiresAt: expiresAt.toISOString(),
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

  // ============================================
  // VALIDAR PIN
  // ============================================

  /**
   * Valida PIN fornecido contra hash armazenado
   */
  static async verifyPIN(
    params: VerifyPINParams
  ): Promise<ServiceResult<VerifyPINResult>> {
    try {
      const { rideId, pin, verifiedBy } = params;

      // Buscar verificação
      const { data: verification, error: fetchError } = await supabase
        .from('operational_verifications')
        .select('*')
        .eq('ride_id', rideId)
        .eq('verification_type', 'pin')
        .single();

      if (fetchError || !verification) {
        return {
          success: false,
          error: ERRORS.VERIFICATION_NOT_FOUND,
        };
      }

      // Verificar se já foi verificado
      if (verification.status === 'verified') {
        return {
          success: false,
          error: ERRORS.VERIFICATION_ALREADY_VERIFIED,
        };
      }

      // Verificar se expirou
      if (verification.pin_expires_at) {
        const expiresAt = new Date(verification.pin_expires_at);
        if (expiresAt < new Date()) {
          await supabase
            .from('operational_verifications')
            .update({ status: 'failed' })
            .eq('id', verification.id);

          return {
            success: false,
            error: ERRORS.PIN_EXPIRED,
          };
        }
      }

      // Verificar tentativas
      if (verification.verification_attempts >= CONFIG.MAX_ATTEMPTS) {
        return {
          success: false,
          error: ERRORS.MAX_ATTEMPTS_REACHED,
        };
      }

      // Validar PIN
      const isValid = await bcrypt.compare(pin, verification.pin_hash);

      // Atualizar registro
      const now = new Date().toISOString();

      if (isValid) {
        // PIN correto
        await supabase
          .from('operational_verifications')
          .update({
            status: 'verified',
            verified_at: now,
            verified_by: verifiedBy,
            verification_attempts: verification.verification_attempts + 1,
            last_attempt_at: now,
          })
          .eq('id', verification.id);

        return {
          success: true,
          data: {
            verified: true,
            message: SUCCESS.PIN_VERIFIED,
          },
        };
      } else {
        // PIN incorreto
        const newAttempts = verification.verification_attempts + 1;
        const attemptsRemaining = CONFIG.MAX_ATTEMPTS - newAttempts;

        const updateData: any = {
          verification_attempts: newAttempts,
          last_attempt_at: now,
        };

        // Se esgotou tentativas, marcar como failed
        if (attemptsRemaining <= 0) {
          updateData.status = 'failed';
        }

        await supabase
          .from('operational_verifications')
          .update(updateData)
          .eq('id', verification.id);

        return {
          success: false,
          error: ERRORS.INVALID_PIN,
          data: {
            verified: false,
            attemptsRemaining,
            message: attemptsRemaining > 0
              ? `Invalid PIN. ${attemptsRemaining} attempts remaining.`
              : ERRORS.MAX_ATTEMPTS_REACHED,
          },
        };
      }
    } catch (error) {
      logger.error('Error verifying PIN:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify PIN',
      };
    }
  }

  // ============================================
  // OBTER STATUS
  // ============================================

  /**
   * Obtém status da verificação para uma corrida
   */
  static async getVerificationStatus(
    rideId: string
  ): Promise<OperationalVerification | null> {
    try {
      const { data, error } = await supabase
        .from('operational_verifications')
        .select('*')
        .eq('ride_id', rideId)
        .eq('verification_type', 'pin')
        .single();

      if (error || !data) return null;

      return data as OperationalVerification;
    } catch (error) {
      logger.error('Error getting verification status:', error);
      return null;
    }
  }

  /**
   * Obtém resumo do status da verificação
   */
  static async getVerificationStatusSummary(
    rideId: string
  ): Promise<VerificationStatusSummary | null> {
    try {
      const verification = await this.getVerificationStatus(rideId);

      if (!verification) return null;

      return {
        isRequired: verification.is_required,
        status: verification.status,
        verified: verification.status === 'verified',
        attemptsRemaining: CONFIG.MAX_ATTEMPTS - verification.verification_attempts,
        expiresAt: verification.pin_expires_at,
      };
    } catch (error) {
      logger.error('Error getting verification status summary:', error);
      return null;
    }
  }

  // ============================================
  // VERIFICAR SE PIN É EXIGIDO
  // ============================================

  /**
   * GATE 7 FASE 2.5: Resolve se PIN é exigido para uma CORRIDA
   * 
   * Precedência: admin global > passageiro > motorista
   * Regra: Se qualquer nível exigir, a corrida exige PIN
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
      // 1. Verificar admin global (prioridade máxima)
      // Por enquanto, usar variável de ambiente como configuração global
      const adminRequires = process.env.REQUIRE_PIN_FOR_ALL_RIDES === 'true';
      
      if (adminRequires) {
        return {
          isRequired: true,
          requiredBy: 'admin',
          reason: 'Admin global requires PIN for all rides',
        };
      }

      // 2. Verificar preferência do passageiro
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

      // 3. Verificar preferência do motorista (se já atribuído)
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

      // Nenhum nível exige PIN
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
   * GATE 7 FASE 2.5: Resolve se PIN é exigido para uma ENTREGA
   * 
   * Precedência: admin global > operação/remetente/empresa
   * Regra: Motoboy NÃO decide exigência de PIN da entrega
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
      // 1. Verificar admin global (prioridade máxima)
      const adminRequires = process.env.REQUIRE_PIN_FOR_ALL_DELIVERIES === 'true';
      
      if (adminRequires) {
        return {
          isRequired: true,
          requiredBy: 'admin',
          reason: 'Admin global requires PIN for all deliveries',
        };
      }

      // 2. Verificar configuração da operação (se houver)
      if (params.operationId) {
        // TODO: Implementar quando houver tabela de operações
        // const { data: operation } = await supabase
        //   .from('operations')
        //   .select('requires_pin_for_deliveries')
        //   .eq('id', params.operationId)
        //   .single();
        //
        // if (operation?.requires_pin_for_deliveries === true) {
        //   return {
        //     isRequired: true,
        //     requiredBy: 'operation',
        //     reason: 'Operation requires PIN verification',
        //   };
        // }
      }

      // 3. Verificar preferência do remetente
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

      // Nenhum nível exige PIN
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

  /**
   * @deprecated Use resolveRidePINRequirement() or resolveDeliveryPINRequirement()
   */
  static async isPINRequired(
    params: CheckPINRequiredParams
  ): Promise<boolean> {
    try {
      const { rideMode, passengerId, driverProfileId, senderProfileId } = params;

      if (rideMode === 'ride' && passengerId) {
        const result = await this.resolveRidePINRequirement({
          passengerId,
          driverProfileId,
        });
        return result.isRequired;
      } else if (rideMode === 'motoboy' && senderProfileId) {
        const result = await this.resolveDeliveryPINRequirement({
          senderProfileId,
        });
        return result.isRequired;
      }

      return false;
    } catch (error) {
      logger.error('Error checking if PIN is required:', error);
      return false;
    }
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  /**
   * Gera PIN de 4 dígitos
   */
  private static generatePIN(): string {
    const cryptoApi = globalThis.crypto;

    if (cryptoApi?.getRandomValues) {
      const bytes = new Uint16Array(1);
      cryptoApi.getRandomValues(bytes);
      return (bytes[0] % 10000).toString().padStart(4, '0');
    }

    return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  }

  /**
   * Valida formato de PIN
   */
  static isValidPINFormat(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }
}


