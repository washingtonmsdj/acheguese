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
  /** Compatibilidade de leitura; o projeto não habilita recovery codes no Auth. */
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
  private async reconcilePolicyTracker(): Promise<void> {
    try {
      const required = await SessionRpcService.checkMfaRequired();
      if (required === null) {
        logger.error(
          'MFAService.reconcilePolicyTracker',
          new Error('session-rpc returned no MFA requirement'),
        );
      }
    } catch (error) {
      logger.error('MFAService.reconcilePolicyTracker', error);
    }
  }

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
   * `mfaEnabled` vem somente de fatores TOTP `verified`. Uma falha ao consultar
   * a autoridade também precisa subir como erro; transformar indisponibilidade
   * em "não ativado" permitiria uma tela de segurança fail-open.
   */
  async getMFAStatus(): Promise<MFAStatus | null> {
    try {
      const user = await SessionService.getCurrentUser();

      if (!user) {
        return null;
      }

      const { data: factorData, error: factorError } =
        await supabase.auth.mfa.listFactors();
      if (factorError || !factorData) {
        throw factorError ?? new Error('Supabase Auth returned no MFA factors payload');
      }

      const hasVerifiedTotp =
        Array.isArray(factorData.totp) &&
        factorData.totp.some((factor) => factor.status === 'verified');

      const { data: policyData, error: policyError } = await supabase
        .from('user_mfa_status')
        .select(
          'enrolled_at,last_verified_at,grace_period_expires_at,is_exempt,exemption_reason',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (policyError) {
        logger.warn('MFAService.getMFAStatus - policy metadata', policyError);
      }

      return {
        mfaEnabled: hasVerifiedTotp,
        mfaMethod: hasVerifiedTotp ? 'totp' : null,
        enrolledAt: policyData?.enrolled_at ?? null,
        lastVerifiedAt: policyData?.last_verified_at ?? null,
        backupCodesGenerated: false,
        backupCodesCount: 0,
        gracePeriodExpiresAt: policyData?.grace_period_expires_at ?? null,
        isExempt: policyData?.is_exempt === true,
        exemptionReason: policyData?.exemption_reason ?? null,
      };
    } catch (error) {
      logger.error('MFAService.getMFAStatus', error);
      throw error;
    }
  }

  /**
   * Começa um novo enrollment apenas depois de reconciliar a autoridade real.
   *
   * Um fator TOTP `unverified` pode sobrar quando o usuário fecha a tela antes
   * de confirmar o código. Reabrir a configuração não deve acumular fatores
   * órfãos nem criar um novo segredo ao lado de um fator já verificado.
   *
   * A limpeza acontece somente após ação explícita de iniciar/reiniciar a
   * configuração e falha de forma fechada: se listar ou remover um fator órfão
   * falhar, nenhum novo fator é criado.
   */
  async enrollMFA(): Promise<MFAEnrollmentData | null> {
    try {
      const { data: factorData, error: factorError } =
        await supabase.auth.mfa.listFactors();
      if (factorError || !factorData) {
        throw factorError ?? new Error('Supabase Auth returned no MFA factors payload');
      }

      const totpFactors = factorData.totp ?? [];
      if (totpFactors.some((factor) => factor.status === 'verified')) {
        throw new Error('A verified TOTP factor already exists');
      }

      const abandonedFactors = totpFactors.filter(
        (factor) => factor.status !== 'verified',
      );
      for (const factor of abandonedFactors) {
        const { error: cleanupError } = await supabase.auth.mfa.unenroll({
          factorId: factor.id,
        });
        if (cleanupError) {
          throw cleanupError;
        }
      }

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

  async verifyAndEnableMFA(factorId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId });

      if (error || !data?.id) {
        logger.error(
          'MFAService.verifyAndEnableMFA - challenge',
          error ?? new Error('Missing challenge id'),
        );
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

      await this.reconcilePolicyTracker();
      return true;
    } catch (error) {
      logger.error('MFAService.verifyAndEnableMFA', error);
      return false;
    }
  }

  async disableMFA(factorId: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) {
        logger.error('MFAService.disableMFA', error);
        return false;
      }

      await this.reconcilePolicyTracker();
      return true;
    } catch (error) {
      logger.error('MFAService.disableMFA', error);
      return false;
    }
  }

  /**
   * A indisponibilidade da lista não equivale a uma lista vazia. Consumidores
   * de ações destrutivas precisam diferenciar "nenhum fator" de "não consegui
   * consultar".
   */
  async listMFAFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      logger.error('MFAService.listMFAFactors', error);
      throw error;
    }
    if (!data) {
      throw new Error('Supabase Auth returned no MFA factors payload');
    }

    return data.totp || [];
  }

  async verifyMFACode(factorId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId });

      if (error || !data?.id) {
        logger.error(
          'MFAService.verifyMFACode - challenge',
          error ?? new Error('Missing challenge id'),
        );
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

      await this.reconcilePolicyTracker();
      return true;
    } catch (error) {
      logger.error('MFAService.verifyMFACode', error);
      return false;
    }
  }
}

export const mfaService = new MFAService();
