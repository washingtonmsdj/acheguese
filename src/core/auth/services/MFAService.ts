/**
 * MFAService
 * 
 * Serviço para gerenciar autenticação de dois fatores (MFA)
 * Suporta TOTP (Time-based One-Time Password)
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';

export interface MFAStatus {
  mfaEnabled: boolean;
  mfaMethod: 'totp' | 'sms' | 'email' | null;
  enrolledAt: string | null;
  lastVerifiedAt: string | null;
  backupCodesGenerated: boolean;
  backupCodesCount: number;
  gracePeriodExpiresAt: string | null;
  isExempt: boolean;
  exemptionReason: string | null;
}

export interface MFAEnrollmentData {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface MFARequirement {
  required: boolean;
  gracePeriodExpiresAt: string | null;
  daysRemaining: number | null;
}

class MFAService {
  /**
   * Verificar se MFA é obrigatório para o usuário atual
   */
  async checkMFARequired(): Promise<MFARequirement> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { required: false, gracePeriodExpiresAt: null, daysRemaining: null };
      }

      const { data, error } = await supabase.rpc('check_user_mfa_required', {
        p_user_id: user.id,
      });

      if (error) {
        logger.error('MFAService.checkMFARequired', error);
        return { required: false, gracePeriodExpiresAt: null, daysRemaining: null };
      }

      // Buscar informações do período de graça
      const { data: statusData } = await supabase
        .from('user_mfa_status')
        .select('grace_period_expires_at')
        .eq('user_id', user.id)
        .single();

      const gracePeriodExpiresAt = statusData?.grace_period_expires_at || null;
      let daysRemaining = null;

      if (gracePeriodExpiresAt) {
        const expiresAt = new Date(gracePeriodExpiresAt);
        const now = new Date();
        const diffTime = expiresAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        required: data as boolean,
        gracePeriodExpiresAt,
        daysRemaining,
      };
    } catch (error) {
      logger.error('MFAService.checkMFARequired', error);
      return { required: false, gracePeriodExpiresAt: null, daysRemaining: null };
    }
  }

  /**
   * Buscar status de MFA do usuário atual
   */
  async getMFAStatus(): Promise<MFAStatus | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_mfa_status')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se não existe registro, criar um
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('user_mfa_status')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) {
            logger.error('MFAService.getMFAStatus - insert', insertError);
            return null;
          }

          data = newData;
        } else {
          logger.error('MFAService.getMFAStatus', error);
          return null;
        }
      }

      return {
        mfaEnabled: data.mfa_enabled,
        mfaMethod: data.mfa_method,
        enrolledAt: data.enrolled_at,
        lastVerifiedAt: data.last_verified_at,
        backupCodesGenerated: data.backup_codes_generated,
        backupCodesCount: data.backup_codes_count,
        gracePeriodExpiresAt: data.grace_period_expires_at,
        isExempt: data.is_exempt,
        exemptionReason: data.exemption_reason,
      };
    } catch (error) {
      logger.error('MFAService.getMFAStatus', error);
      return null;
    }
  }

  /**
   * Iniciar enrollment de MFA (TOTP)
   */
  async enrollMFA(): Promise<MFAEnrollmentData | null> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        logger.error('MFAService.enrollMFA', error);
        throw error;
      }

      // Gerar códigos de backup (simulado - Supabase não fornece isso diretamente)
      const backupCodes = this.generateBackupCodes(10);

      return {
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        backupCodes,
      };
    } catch (error) {
      logger.error('MFAService.enrollMFA', error);
      return null;
    }
  }

  /**
   * Verificar código TOTP e completar enrollment
   */
  async verifyAndEnableMFA(factorId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) {
        logger.error('MFAService.verifyAndEnableMFA - challenge', error);
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code,
      });

      if (verifyError) {
        logger.error('MFAService.verifyAndEnableMFA - verify', verifyError);
        return false;
      }

      // Atualizar status no banco
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_mfa_status')
          .upsert({
            user_id: user.id,
            mfa_enabled: true,
            mfa_method: 'totp',
            enrolled_at: new Date().toISOString(),
            last_verified_at: new Date().toISOString(),
            backup_codes_generated: true,
            backup_codes_count: 10,
          });
      }

      return true;
    } catch (error) {
      logger.error('MFAService.verifyAndEnableMFA', error);
      return false;
    }
  }

  /**
   * Desabilitar MFA
   */
  async disableMFA(factorId: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        logger.error('MFAService.disableMFA', error);
        return false;
      }

      // Atualizar status no banco
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_mfa_status')
          .update({
            mfa_enabled: false,
            mfa_method: null,
            enrolled_at: null,
            last_verified_at: null,
          })
          .eq('user_id', user.id);
      }

      return true;
    } catch (error) {
      logger.error('MFAService.disableMFA', error);
      return false;
    }
  }

  /**
   * Listar fatores MFA do usuário
   */
  async listMFAFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        logger.error('MFAService.listMFAFactors', error);
        return [];
      }

      return data.totp || [];
    } catch (error) {
      logger.error('MFAService.listMFAFactors', error);
      return [];
    }
  }

  /**
   * Gera códigos de backup criptograficamente seguros.
   *
   * Usa `crypto.getRandomValues()` (Web Crypto API) em vez de `Math.random()`,
   * que não é criptograficamente seguro e não deve ser usado para segredos.
   *
   * Formato: 8 caracteres alfanuméricos maiúsculos (ex: "A3F9K2M7")
   * Entropia: ~41 bits por código (36^8), suficiente para backup codes de MFA.
   */
  private generateBackupCodes(count: number): string[] {
    const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I para evitar confusão visual
    const CODE_LENGTH = 8;
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      const randomBytes = new Uint8Array(CODE_LENGTH);
      crypto.getRandomValues(randomBytes);
      const code = Array.from(randomBytes)
        .map((byte) => ALPHABET[byte % ALPHABET.length])
        .join('');
      codes.push(code);
    }

    return codes;
  }

  /**
   * Verificar código MFA durante login
   */
  async verifyMFACode(factorId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) {
        logger.error('MFAService.verifyMFACode - challenge', error);
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code,
      });

      if (verifyError) {
        logger.error('MFAService.verifyMFACode - verify', verifyError);
        return false;
      }

      // Atualizar last_verified_at
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_mfa_status')
          .update({
            last_verified_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      return true;
    } catch (error) {
      logger.error('MFAService.verifyMFACode', error);
      return false;
    }
  }
}

export const mfaService = new MFAService();
