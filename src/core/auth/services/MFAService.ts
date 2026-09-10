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
  /**
   * Sincroniza o tracker auxiliar pelo broker server-owned após uma mutação
   * confirmada pelo Supabase Auth. Falha de sincronização não desfaz uma
   * operação que o Auth já confirmou.
   */
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
   * Buscar status de MFA do usuário atual.
   *
   * `mfaEnabled` e `mfaMethod` são derivados dos fatores verificados retornados
   * pelo Supabase Auth. A tabela auxiliar fornece somente metadata de política.
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
        logger.error(
          'MFAService.getMFAStatus - factors',
          factorError ?? new Error('Supabase Auth returned no MFA factors payload'),
        );
        return null;
      }

      // Este serviço suporta TOTP. `listFactors().totp` representa os fatores
      // TOTP habilitados/confirmados para a sessão do usuário.
      const hasVerifiedTotp = Array.isArray(factorData.totp) && factorData.totp.length > 0;

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
        // O projeto não habilita recovery codes do Auth. Os códigos locais
        // históricos foram removidos porque nunca constituíram recuperação real.
        backupCodesGenerated: false,
        backupCodesCount: 0,
        gracePeriodExpiresAt: policyData?.grace_period_expires_at ?? null,
        isExempt: policyData?.is_exempt === true,
        exemptionReason: policyData?.exemption_reason ?? null,
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
   */
  async verifyAndEnableMFA(factorId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

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

      await this.reconcilePolicyTracker();
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
