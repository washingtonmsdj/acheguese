/**
 * AdminCommunityAlertsService - SSOT para gestão administrativa de alertas comunitários
 * 
 * IMPORTANTE: Este service usa CommunityAlertService e AlertModerationService como base (SSOT)
 * Adiciona apenas operações administrativas específicas
 * 
 * REGRAS:
 * - ZERO acesso direto ao banco
 * - Usa services existentes como base
 * - Adiciona apenas lógica administrativa
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from "@/integrations/supabase";

type AlertCategory =
  | "tiroteio_disparos"
  | "assalto_em_andamento"
  | "tentativa_de_invasao"
  | "incendio_explosao"
  | "acidente_grave"
  | "alagamento_deslizamento"
  | "risco_na_via"
  | "pessoa_vulneravel_em_risco";
type AlertStatus = "ativo" | "encerrado" | "expirado" | "removido";
type AlertReportReason =
  | "false_alert"
  | "promotes_crime"
  | "identifies_person"
  | "monitors_operation"
  | "hate_speech"
  | "spam"
  | "other";

interface CommunityAlert {
  [key: string]: unknown;
  id: string;
  author_user_id?: string;
  author_profile_id?: string;
  category: AlertCategory;
  status: AlertStatus;
  location_id: string;
  latitude: number | null;
  longitude: number | null;
  neighborhood?: string | null;
  neighborhood_display: string | null;
  city: string | null;
  description: string;
  report_count: number;
  under_review: boolean;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  removed_at?: string;
  removal_reason?: string;
}

// ============================================================================
// TIPOS ADMINISTRATIVOS
// ============================================================================

export interface AlertStats {
  total: number;
  active: number;
  ended: number;
  expired: number;
  removed: number;
  underReview: number;
  totalReports: number;
  avgReportsPerAlert: number;
}

export interface AlertWithDetails extends CommunityAlert {
  author_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  reports?: Array<{
    id: string;
    reason: AlertReportReason;
    created_at: string;
    reporter_profile?: {
      display_name: string;
    };
  }>;
}

export interface AlertFilters {
  status?: AlertStatus;
  category?: AlertCategory;
  underReview?: boolean;
  city?: string;
  neighborhood?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BlockedTerm {
  id: string;
  term: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class AdminCommunityAlertsServiceClass {
  private readonly TABLE = 'community_alerts';
  private readonly REPORTS_TABLE = 'community_alert_reports';
  private readonly BLOCKED_TERMS_TABLE = 'alert_blocked_terms';

  /**
   * Busca estatísticas gerais de alertas
   */
  async getStats(): Promise<AlertStats> {
    try {
      const { data: alerts, error } = await supabase
        .from(this.TABLE)
        .select('status, report_count, under_review');

      if (error) throw error;

      const stats: AlertStats = {
        total: alerts?.length || 0,
        active: 0,
        ended: 0,
        expired: 0,
        removed: 0,
        underReview: 0,
        totalReports: 0,
        avgReportsPerAlert: 0,
      };

      alerts?.forEach((alert) => {
        switch (alert.status) {
          case 'ativo':
            stats.active++;
            break;
          case 'encerrado':
            stats.ended++;
            break;
          case 'expirado':
            stats.expired++;
            break;
          case 'removido':
            stats.removed++;
            break;
        }

        if (alert.under_review) {
          stats.underReview++;
        }

        stats.totalReports += alert.report_count || 0;
      });

      stats.avgReportsPerAlert = stats.total > 0 
        ? Math.round((stats.totalReports / stats.total) * 10) / 10 
        : 0;

      logger.info('AdminCommunityAlertsService.getStats', stats);
      return stats;
    } catch (error) {
      logger.error('AdminCommunityAlertsService.getStats', error);
      return {
        total: 0,
        active: 0,
        ended: 0,
        expired: 0,
        removed: 0,
        underReview: 0,
        totalReports: 0,
        avgReportsPerAlert: 0,
      };
    }
  }

  /**
   * Busca todos os alertas com filtros e paginação
   */
  async getAllAlerts(filters: AlertFilters = {}): Promise<{
    data: AlertWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        status,
        category,
        underReview,
        city,
        neighborhood,
        search,
        page = 1,
        limit = 20,
      } = filters;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from(this.TABLE)
        .select(`
          *,
          author_profile:profiles!community_alerts_profile_id_fkey(
            display_name,
            avatar_url
          )
        `, { count: 'exact' });

      // Filtros
      if (status) {
        query = query.eq('status', status);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (underReview !== undefined) {
        query = query.eq('under_review', underReview);
      }

      if (city) {
        query = query.eq('city', city);
      }

      if (neighborhood) {
        query = query.eq('neighborhood_display', neighborhood);
      }

      if (search) {
        query = query.or(`description.ilike.%${search}%,neighborhood_display.ilike.%${search}%`);
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Buscar reports para cada alerta
      const alertsWithReports = await Promise.all(
        (data || []).map(async (alert) => {
          const reports = await this.getAlertReports(alert.id);
          return {
            ...alert,
            reports,
          };
        })
      );

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      logger.info('AdminCommunityAlertsService.getAllAlerts', {
        total,
        page,
        totalPages,
        filters,
      });

      return {
        data: alertsWithReports as unknown as AlertWithDetails[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('AdminCommunityAlertsService.getAllAlerts', error);
      return {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Busca alertas sob revisão (com reports)
   */
  async getAlertsUnderReview(): Promise<AlertWithDetails[]> {
    try {
      const { data: alerts, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .eq('under_review', true)
        .in('status', ['ativo'])
        .order('report_count', { ascending: false });

      if (error) throw error;

      // Buscar reports para cada alerta
      const alertsWithReports = await Promise.all(
        (alerts || []).map(async (alert) => {
          const reports = await this.getAlertReports(alert.id);
          return {
            ...alert,
            reports,
          };
        })
      );

      logger.info('AdminCommunityAlertsService.getAlertsUnderReview', {
        count: alertsWithReports.length,
      });

      return alertsWithReports as AlertWithDetails[];
    } catch (error) {
      logger.error('AdminCommunityAlertsService.getAlertsUnderReview', error);
      return [];
    }
  }

  /**
   * Busca reports de um alerta específico
   */
  async getAlertReports(alertId: string) {
    try {
      const { data, error } = await supabase
        .from(this.REPORTS_TABLE)
        .select(`
          *,
          reporter_profile:profiles!community_alert_reports_reporter_id_fkey(
            display_name
          )
        `)
        .eq('alert_id', alertId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('AdminCommunityAlertsService.getAlertReports', error);
      return [];
    }
  }

  /**
   * Remove um alerta (ação administrativa)
   */
  async removeAlert(alertId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .update({
          status: 'removido',
          removed_at: new Date().toISOString(),
          removal_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      await this.writeAuditLog(alertId, 'removed', { reason });
      const success = true;
      
      if (success) {
        logger.info('AdminCommunityAlertsService.removeAlert', { alertId, reason });
      }

      return success;
    } catch (error) {
      logger.error('AdminCommunityAlertsService.removeAlert', error);
      return false;
    }
  }

  /**
   * Limpa flag de revisão após análise
   */
  async clearUnderReview(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .update({ under_review: false, updated_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      await this.writeAuditLog(alertId, 'reviewed_cleared', {
        cleared_at: new Date().toISOString(),
      });
      const success = true;
      
      if (success) {
        logger.info('AdminCommunityAlertsService.clearUnderReview', { alertId });
      }

      return success;
    } catch (error) {
      logger.error('AdminCommunityAlertsService.clearUnderReview', error);
      return false;
    }
  }

  /**
   * Encerra um alerta manualmente
   */
  async endAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .update({
          status: 'encerrado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      await this.writeAuditLog(alertId, 'ended', {});
      const success = true;
      
      if (success) {
        logger.info('AdminCommunityAlertsService.endAlert', { alertId });
      }

      return success;
    } catch (error) {
      logger.error('AdminCommunityAlertsService.endAlert', error);
      return false;
    }
  }

  /**
   * Busca histórico de auditoria de um alerta
   */
  async getAuditLog(alertId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('community_alert_audit')
        .select('*')
        .eq('alert_id', alertId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('AdminCommunityAlertsService.getAuditLog', error);
      return [];
    }
  }

  private async writeAuditLog(
    alertId: string,
    actionType: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await (supabase as any)
      .from('community_alert_audit')
      .insert({
        alert_id: alertId,
        actor_id: user.id,
        action_type: actionType,
        metadata,
      });

    if (error) {
      throw error;
    }
  }

  // ============================================================================
  // TERMOS BLOQUEADOS
  // ============================================================================

  /**
   * Busca todos os termos bloqueados
   */
  async getBlockedTerms(): Promise<BlockedTerm[]> {
    try {
      const { data, error } = await supabase
        .from(this.BLOCKED_TERMS_TABLE)
        .select('*')
        .order('term', { ascending: true });

      if (error) throw error;

      logger.info('AdminCommunityAlertsService.getBlockedTerms', {
        count: data?.length || 0,
      });

      return (data as BlockedTerm[]) || [];
    } catch (error) {
      logger.error('AdminCommunityAlertsService.getBlockedTerms', error);
      return [];
    }
  }

  /**
   * Adiciona um termo bloqueado
   */
  async addBlockedTerm(term: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.BLOCKED_TERMS_TABLE)
        .insert({
          term: term.toLowerCase().trim(),
          is_active: true,
        });

      if (error) throw error;

      logger.info('AdminCommunityAlertsService.addBlockedTerm', { term });
      return true;
    } catch (error) {
      logger.error('AdminCommunityAlertsService.addBlockedTerm', error);
      return false;
    }
  }

  /**
   * Remove um termo bloqueado
   */
  async removeBlockedTerm(termId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.BLOCKED_TERMS_TABLE)
        .delete()
        .eq('id', termId);

      if (error) throw error;

      logger.info('AdminCommunityAlertsService.removeBlockedTerm', { termId });
      return true;
    } catch (error) {
      logger.error('AdminCommunityAlertsService.removeBlockedTerm', error);
      return false;
    }
  }

  /**
   * Ativa/desativa um termo bloqueado
   */
  async toggleBlockedTerm(termId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.BLOCKED_TERMS_TABLE)
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', termId);

      if (error) throw error;

      logger.info('AdminCommunityAlertsService.toggleBlockedTerm', {
        termId,
        isActive,
      });
      return true;
    } catch (error) {
      logger.error('AdminCommunityAlertsService.toggleBlockedTerm', error);
      return false;
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Busca alertas mais reportados
   */
  async getTopReportedAlerts(limit: number = 10): Promise<AlertWithDetails[]> {
    try {
      const { data, error } = await (supabase as any)
        .from(this.TABLE)
        .select(`
          *,
          author_profile:profiles!community_alerts_profile_id_fkey(
            display_name,
            avatar_url
          )
        `)
        .gt('report_count', 0)
        .order('report_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Buscar reports para cada alerta
      const alertsWithReports = await Promise.all(
        (data || []).map(async (alert) => {
          const reports = await this.getAlertReports(alert.id);
          return {
            ...alert,
            reports,
          };
        })
      );

      logger.info('AdminCommunityAlertsService.getTopReportedAlerts', {
        count: alertsWithReports.length,
      });

      return alertsWithReports as unknown as AlertWithDetails[];
    } catch (error) {
      logger.error('AdminCommunityAlertsService.getTopReportedAlerts', error);
      return [];
    }
  }

  /**
   * Busca estatísticas por categoria
   */
  async getStatsByCategory(): Promise<Record<AlertCategory, number>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('type');

      if (error) throw error;

      const stats: Record<string, number> = {};
      
      (data as Array<{ type: string }> | null)?.forEach((alert) => {
        stats[alert.type] = (stats[alert.type] || 0) + 1;
      });

      logger.info('AdminCommunityAlertsService.getStatsByCategory', stats);
      return stats as Record<AlertCategory, number>;
    } catch (error) {
      logger.error('AdminCommunityAlertsService.getStatsByCategory', error);
      return {} as Record<AlertCategory, number>;
    }
  }
}

export const adminCommunityAlertsService = new AdminCommunityAlertsServiceClass();

