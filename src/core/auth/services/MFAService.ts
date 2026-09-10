/**
 * MFAService
 *
 * Serviço para gerenciar autenticação multifator (MFA).
 * Supabase Auth é a autoridade dos fatores TOTP; `user_mfa_status` mantém
 * somente metadata/política auxiliar e nunca substitui um fator verificado.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { SessionService } from '@/core/session/services/SessionService';
import { SessionRpcService } from '@/core/session/services/SessionRpcService';

export interface MFAStatus {
  mfaEnabled: boolean;
  mfaMethod: 'totp' | 'sms' | 'email' | null;
  enrolledAt: string | null;
  lastVerifiedAt: string | null;
  /** Compatibilidade de leitura. Recovery codes não são suportados pelo Auth. */
  backupCodesGenerated: boolean;
  backupCodesCount: number;
  gracePeriodExpiresAt: string | null;
  isExempt: boolean;
  exemptionReason: string | null;
}

export interface MFAEnrollmentData {
  /** ID autoritativo do fator criado pelo Supabase Auth. */
  factorId: string;
  qrCode: string;
  secret: string;
}

export interface MFARequirement {
  required: boolean;
  gracePeriodExpiresAt: string | null;
  daysRemaining: number | null;
}

class MFAService {
  /**
   * Verificar se MFA é obrigatório para o usuário atual.
   *
   * Para uma sessão autenticada, falha de `session-rpc` não pode ser convertida
   * em `required: false`: isso seria um bypass fail-open da política de MFA.
   */
  async checkMFARequired(): Promise<MFARequirement> {
    try {
      const user = await SessionService.getCurrentUser();

      if (!user) {
        return { required: false, gracePeriodExpiresAt: null, daysRemaining: null };
      }

      const required = await SessionRpcService.checkMfaRequired();
      if (required === null) {
        throw new Error('session-rpc returned no MFA requirement');
      }

      // Grace period é metadata de UX. A decisão `required` vem do broker.
      const { data: statusData, error: statusError } = await supabase
        .from('user_mfa_status')
        .select('grace_period_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statusError) {
        logger.warn('MFAService.checkMFARequired.gracePeriod', statusError);
      }

      const gracePeriodExpiresAt = statusData?.grace_period_expires_at || null;
      let daysRemaining: number | null = null;

      if (gracePeriodExpiresAt) {
        const expiresAt = new Date(gracePeriodExpiresAt);
        if (!Number.isNaN(expiresAt.getTime())) {
          const diffTime = expiresAt.getTime() - Date.now();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      return {
        required,
        gracePeriodExpiresAt,
        daysRemaining,
      };
    } catch (error) {
      logger.error('MFAService.checkMFARequired', error);
      throw error;
    }
  }

  /**
   * Buscar status auxiliar de MFA do usuário atual.
   *
   * Os campos históricos de backup codes são neutralizados porque Supabase Auth
   * não fornece recovery codes. Exibi-los como válidos criaria uma capacidade
   * de recuperação que não existe.
   */
  async getMFAStatus(): Promise<MFAStatus | null> {
    try {
      const user = await SessionService.getCurrentUser();

      if (!user) {
        return null;
      }

      const { data: initialData, error } = await supabase
        .from('user_mfa_status')
        .select('*')
        .eq('user_id', user.id)
        .single();
      let data = initialData;

      if (error) {
        // Se não existe registro, criar apenas a linha auxiliar do próprio usuário.
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

      if (!data) return null;

      return {
        mfaEnabled: data.mfa_enabled === true,
        mfaMethod: (data.mfa_method as 'totp' | 'sms' | 'email' | null),
        enrolledAt: data.enrolled_at,
        lastVerifiedAt: data.last_verified_at,
        backupCodesGenerated: false,
        backupCodesCount: 0,
        gracePeriodExpiresAt: data.grace_period_expires_at,
        isExempt: data.is_exempt === true,
        exemptionReason: data.exemption_reason,
      };
    } catch (error) {
      logger.error('MFAService.getMFAStatus', error);
      return null;
    }
  }

  /**
   * Iniciar enrollment de MFA (TOTP).
   * O `factorId` retornado pelo Auth deve ser usado para challenge/verify.
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

      if (!data?.id || !data.totp?.qr_code || !data.totp?.secret) {
        throw new Error('Supabase Auth returned an invalid MFA enrollment');
      }

      return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      };
    } catch (error) {
      logger.error('MFAService.enrollMFA', error);
      return null;
    }
  }

  /**
   * Verificar código TOTP e completar enrollment.
   * Supabase Auth é a autoridade; falha no tracker auxiliar não desfaz um fator
   * que o Auth já verificou, mas é registrada para reconciliação.
   */
  async verifyAndEnableMFA(factorId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error || !data?.id) {
        logger.error('MFAService.verifyAndEnableMFA - challenge', error ?? new Error('Missing challenge id'));
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

      const user = await SessionService.getCurrentUser();

      if (user) {
        const now = new Date().toISOString();
        const { error: statusError } = await supabase
          .from('user_mfa_status')
          .upsert({
            user_id: user.id,
            mfa_enabled: true,
            mfa_method: 'totp',
            enrolled_at: now,
            last_verified_at: now,
            backup_codes_generated: false,
            backup_codes_count: 0,
          });

        if (statusError) {
          logger.error('MFAService.verifyAndEnableMFA - status sync', statusError);
        }
      }

      return true;
    } catch (error) {
      logger.error('MFAService.verifyAndEnableMFA', error);
      return false;
    }
  }

  /**
   * Desabilitar MFA.
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

      const user = await SessionService.getCurrentUser();

      if (user) {
        const { error: statusError } = await supabase
          .from('user_mfa_status')
          .update({
            mfa_enabled: false,
            mfa_method: null,
            enrolled_at: null,
            last_verified_at: null,
            backup_codes_generated: false,
            backup_codes_count: 0,
          })
          .eq('user_id', user.id);

        if (statusError) {
          logger.error('MFAService.disableMFA - status sync', statusError);
        }
      }

      return true;
    } catch (error) {
      logger.error('MFAService.disableMFA', error);
      return false;
    }
  }

  /**
   * Listar fatores MFA TOTP do usuário no Supabase Auth.
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
   * Verificar código MFA durante login.
   */
  async verifyMFACode(factorId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error || !data?.id) {
        logger.error('MFAService.verifyMFACode - challenge', error ?? new Error('Missing challenge id'));
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

      const user = await SessionService.getCurrentUser();

      if (user) {
        const { error: statusError } = await supabase
          .from('user_mfa_status')
          .update({
            last_verified_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (statusError) {
          logger.error('MFAService.verifyMFACode - status sync', statusError);
        }
      }

      return true;
    } catch (error) {
      logger.error('MFAService.verifyMFACode', error);
      return false;
    }
  }
}

export const mfaService = new MFAService();
