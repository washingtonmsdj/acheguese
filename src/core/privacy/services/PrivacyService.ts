/**
 * ══════════════════════════════════════════════════════════════════════════
 * PRIVACY SERVICE
 * ══════════════════════════════════════════════════════════════════════════
 *
 * SSOT para todas as operações de privacidade e LGPD.
 * Centraliza: solicitações DPO, exportação de dados, exclusão de conta.
 *
 * IMPORTANTE: Operações sensíveis (export, delete) usam edge functions.
 * Operações de registro (DPO requests) usam supabase client diretamente
 * pois são dados do próprio usuário autenticado, cobertos por RLS.
 *
 * LGPD: Arts. 18, 19 e 41
 * ══════════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { DPO_REQUEST_STATUS } from '@/core/privacy/constants/dpoRequestStatus';

// ── Types ──────────────────────────────────────────────────────────────────

export type DPORequestType =
  | 'access'
  | 'correction'
  | 'anonymization'
  | 'portability'
  | 'deletion'
  | 'information'
  | 'consent_revocation'
  | 'automated_decision'
  | 'violation_report'
  | 'other';

export interface CreateDPORequestParams {
  userId: string | undefined;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  requestType: DPORequestType;
  message: string;
}

export interface ExportDataResponse {
  /** JSON blob com todos os dados pessoais do usuário */
  data: Record<string, unknown>;
  sizeBytes: number;
  tablesExported: number;
}

export interface DeleteAccountParams {
  reason?: string;
  /** Deve ser true — confirmação explícita do usuário */
  confirmation: true;
  /** Se true, exporta os dados antes de deletar */
  exportFirst?: boolean;
}

export interface DeleteAccountResponse {
  scheduledPurgeAt: string;
  daysUntilPurge: number;
  recoveryPossibleUntil: string;
}

// ── Service ────────────────────────────────────────────────────────────────

export class PrivacyService {
  private static readonly db = supabase as any;
  /**
   * Registra uma solicitação ao DPO (Art. 41 LGPD).
   * Persiste na tabela `dpo_requests` e dispara email de notificação.
   */
  static async createDPORequest(params: CreateDPORequestParams): Promise<void> {
    const { error: dbError } = await this.db.from('dpo_requests').insert({
      user_id: params.userId ?? null,
      requester_name: params.requesterName,
      requester_email: params.requesterEmail,
      subject: params.subject,
      request_type: params.requestType,
      message: params.message,
      status: DPO_REQUEST_STATUS.PENDING,
    });

    if (dbError) {
      logger.error('[PrivacyService] Erro ao registrar solicitação DPO', dbError);
      throw new Error(dbError.message);
    }

    logger.info('[PrivacyService] Solicitacao DPO registrada', {
      requestType: params.requestType,
      hasUserId: Boolean(params.userId),
    });
  }

  /**
   * Exporta todos os dados pessoais do usuário autenticado (Art. 18, I LGPD).
   * Delega para a edge function `user-export-data`.
   */
  static async exportUserData(): Promise<ExportDataResponse> {
    const { data, error } = await supabase.functions.invoke('user-export-data');

    if (error) {
      logger.error('[PrivacyService] Erro ao exportar dados do usuário', error);
      throw new Error(error.message || 'Falha ao exportar dados');
    }

    return {
      data: data as Record<string, unknown>,
      sizeBytes: Number(data?.export_metadata?.size_bytes ?? 0),
      tablesExported: Object.keys(data ?? {}).length,
    };
  }

  /**
   * Agenda a exclusão da conta do usuário autenticado (Art. 18, VI LGPD).
   * Soft-delete imediato + purge em 30 dias.
   * Delega para a edge function `user-delete-account`.
   */
  static async deleteAccount(params: DeleteAccountParams): Promise<DeleteAccountResponse> {
    const { data, error } = await supabase.functions.invoke('user-delete-account', {
      body: {
        confirmation: params.confirmation,
        reason: params.reason,
        export_first: params.exportFirst ?? false,
      },
    });

    if (error) {
      logger.error('[PrivacyService] Erro ao solicitar exclusão de conta', error);
      throw new Error(error.message || 'Falha ao solicitar exclusão de conta');
    }

    return {
      scheduledPurgeAt: data.details.scheduled_purge_at,
      daysUntilPurge: data.details.days_until_purge,
      recoveryPossibleUntil: data.details.recovery_possible_until,
    };
  }
}

