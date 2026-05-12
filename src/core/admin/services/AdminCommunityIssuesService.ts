/**
 * AdminCommunityIssuesService - SSOT para gestão administrativa de problemas urbanos
 * 
 * IMPORTANTE: Este service usa CommunityIssueService como base (SSOT)
 * Adiciona apenas operações administrativas específicas
 * 
 * REGRAS:
 * - ZERO acesso direto ao banco
 * - Usa services existentes como base
 * - Adiciona apenas lógica administrativa
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { SessionService } from '@/core/session/services/SessionService';
import type { AdminSupabaseClient } from '../types/adminDatabase.types';

type IssueCategory =
  | "buraco_via"
  | "calcada_danificada"
  | "iluminacao_publica"
  | "lixo_acumulado"
  | "alagamento_cronico"
  | "arvore_risco"
  | "sinalizacao_danificada"
  | "esgoto_aberto"
  | "pichacao_vandalismo"
  | "outro";
type IssueStatus = "aberto" | "em_analise" | "em_andamento" | "resolvido" | "rejeitado";
type IssuePriority = "baixa" | "media" | "alta" | "urgente";
type IssueReportReason = "duplicate" | "false_report" | "inappropriate_content" | "spam" | "other";

interface CommunityIssue {
  [key: string]: unknown;
  id: string;
  author_profile_id: string;
  location_id: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  title: string;
  description: string;
  images?: string[];
  neighborhood: string;
  neighborhood_display: string;
  city: string;
  address_reference?: string;
  support_count: number;
  comments_count: number;
  report_count: number;
  under_review: boolean;
  removed_at?: string;
  removal_reason?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TIPOS ADMINISTRATIVOS
// ============================================================================

export interface IssueStats {
  total: number;
  aberto: number;
  em_analise: number;
  em_andamento: number;
  resolvido: number;
  rejeitado: number;
  underReview: number;
  totalReports: number;
  totalSupports: number;
  avgSupportsPerIssue: number;
}

export interface IssueWithDetails extends CommunityIssue {
  author_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  reports?: Array<{
    id: string;
    reason: IssueReportReason;
    created_at: string;
    reporter_profile?: {
      display_name: string;
    };
  }>;
}

export interface IssueFilters {
  status?: IssueStatus;
  category?: IssueCategory;
  priority?: IssuePriority;
  underReview?: boolean;
  city?: string;
  neighborhood?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class AdminCommunityIssuesServiceClass {
  private readonly TABLE = 'community_issues';
  private readonly REPORTS_TABLE = 'community_issue_reports';
  private readonly SUPPORTS_TABLE = 'community_issue_supports';
  private readonly AUDIT_TABLE = 'community_issue_audit';

  /**
   * Busca estatísticas gerais de issues
   */
  async getStats(): Promise<IssueStats> {
    try {
      const { data: issues, error } = await supabase
        .from(this.TABLE)
        .select('status, report_count, under_review, support_count');

      if (error) throw error;

      const stats: IssueStats = {
        total: issues?.length || 0,
        aberto: 0,
        em_analise: 0,
        em_andamento: 0,
        resolvido: 0,
        rejeitado: 0,
        underReview: 0,
        totalReports: 0,
        totalSupports: 0,
        avgSupportsPerIssue: 0,
      };

      issues?.forEach((issue) => {
        switch (issue.status) {
          case 'aberto':
            stats.aberto++;
            break;
          case 'em_analise':
            stats.em_analise++;
            break;
          case 'em_andamento':
            stats.em_andamento++;
            break;
          case 'resolvido':
            stats.resolvido++;
            break;
          case 'rejeitado':
            stats.rejeitado++;
            break;
        }

        if (issue.under_review) {
          stats.underReview++;
        }

        stats.totalReports += issue.report_count || 0;
        stats.totalSupports += issue.support_count || 0;
      });

      stats.avgSupportsPerIssue = stats.total > 0 
        ? Math.round((stats.totalSupports / stats.total) * 10) / 10 
        : 0;

      logger.info('AdminCommunityIssuesService.getStats', stats);
      return stats;
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getStats', error);
      return {
        total: 0,
        aberto: 0,
        em_analise: 0,
        em_andamento: 0,
        resolvido: 0,
        rejeitado: 0,
        underReview: 0,
        totalReports: 0,
        totalSupports: 0,
        avgSupportsPerIssue: 0,
      };
    }
  }

  /**
   * Busca todos os issues com filtros e paginação
   */
  async getAllIssues(filters: IssueFilters = {}): Promise<{
    data: IssueWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        status,
        category,
        priority,
        underReview,
        city,
        neighborhood,
        search,
        page = 1,
        limit = 20,
      } = filters;

      let query = supabase
        .from(this.TABLE)
        .select(`
          *,
          author_profile:profiles!community_issues_author_profile_id_fkey(
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

      if (priority) {
        query = query.eq('priority', priority);
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
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,neighborhood_display.ilike.%${search}%`);
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Buscar reports para cada issue
      const issuesWithReports = await Promise.all(
        (data || []).map(async (issue) => {
          const reports = await this.getIssueReports(issue.id);
          return {
            ...issue,
            reports,
          };
        })
      );

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      logger.info('AdminCommunityIssuesService.getAllIssues', {
        total,
        page,
        totalPages,
        filters,
      });

      return {
        data: issuesWithReports as IssueWithDetails[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getAllIssues', error);
      return {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Busca issues sob revisão (com reports)
   */
  async getIssuesUnderReview(): Promise<IssueWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(`
          *,
          author_profile:profiles!community_issues_author_profile_id_fkey(
            display_name,
            avatar_url
          )
        `)
        .eq('under_review', true)
        .order('report_count', { ascending: false });

      if (error) throw error;

      // Buscar reports para cada issue
      const issuesWithReports = await Promise.all(
        (data || []).map(async (issue) => {
          const reports = await this.getIssueReports(issue.id);
          return {
            ...issue,
            reports,
          };
        })
      );

      logger.info('AdminCommunityIssuesService.getIssuesUnderReview', {
        count: issuesWithReports.length,
      });

      return issuesWithReports as IssueWithDetails[];
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getIssuesUnderReview', error);
      return [];
    }
  }

  /**
   * Busca reports de um issue específico
   */
  async getIssueReports(issueId: string) {
    try {
      const { data, error } = await supabase
        .from(this.REPORTS_TABLE)
        .select(`
          *,
          reporter_profile:profiles!community_issue_reports_profile_id_fkey(
            display_name
          )
        `)
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getIssueReports', error);
      return [];
    }
  }

  /**
   * Atualiza o status de um issue (ação administrativa)
   */
  async updateStatus(issueId: string, status: IssueStatus): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error('not_authenticated');

      const updateData: {
        status: IssueStatus;
        updated_at: string;
        resolved_at?: string;
      } = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Se marcar como resolvido, adicionar timestamp
      if (status === 'resolvido') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(this.TABLE)
        .update(updateData)
        .eq('id', issueId);

      if (error) throw error;

      const currentIssue = await supabase
        .from(this.TABLE)
        .select('status')
        .eq('id', issueId)
        .single();

      const auditData = {
        issue_id: issueId,
        action: 'status_change',
        actor_id: user.id,
        metadata: {
          previous_status: currentIssue.data?.status,
          new_status: status,
          notes: `Status alterado de ${currentIssue.data?.status} para ${status}`,
        },
      };

      const { error: auditError } = await (supabase as unknown as AdminSupabaseClient)
        .from(this.AUDIT_TABLE)
        .insert([auditData]);

      if (auditError) throw auditError;

      logger.info('AdminCommunityIssuesService.updateStatus', { issueId, status });
      return true;
    } catch (error) {
      logger.error('AdminCommunityIssuesService.updateStatus', error);
      return false;
    }
  }

  /**
   * Atualiza a prioridade de um issue (ação administrativa)
   */
  async updatePriority(issueId: string, priority: IssuePriority): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error('not_authenticated');

      const { error } = await supabase
        .from(this.TABLE)
        .update({
          priority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId);

      if (error) throw error;

      // Audit log
      const auditData = {
        issue_id: issueId,
        action: 'updated',
        actor_id: user.id,
        metadata: { priority },
      };

      await (supabase as unknown as AdminSupabaseClient).from(this.AUDIT_TABLE).insert([auditData]);

      logger.info('AdminCommunityIssuesService.updatePriority', { issueId, priority });
      return true;
    } catch (error) {
      logger.error('AdminCommunityIssuesService.updatePriority', error);
      return false;
    }
  }

  /**
   * Remove um issue (ação administrativa)
   */
  async removeIssue(issueId: string, reason: string): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error('not_authenticated');

      const { error } = await supabase
        .from(this.TABLE)
        .update({
          removed_at: new Date().toISOString(),
          removal_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId);

      if (error) throw error;

      // Audit log
      const auditData = {
        issue_id: issueId,
        action: 'removed',
        actor_id: user.id,
        metadata: { reason },
      };

      await (supabase as unknown as AdminSupabaseClient).from(this.AUDIT_TABLE).insert([auditData]);

      logger.info('AdminCommunityIssuesService.removeIssue', { issueId, reason });
      return true;
    } catch (error) {
      logger.error('AdminCommunityIssuesService.removeIssue', error);
      return false;
    }
  }

  /**
   * Limpa flag de revisão após análise
   */
  async clearUnderReview(issueId: string): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error('not_authenticated');

      const { error } = await supabase
        .from(this.TABLE)
        .update({
          under_review: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId);

      if (error) throw error;

      // Audit log
      await (supabase as unknown as AdminSupabaseClient).from(this.AUDIT_TABLE).insert({
        issue_id: issueId,
        actor_id: user.id,
        action: 'reviewed_cleared',
        metadata: { cleared_at: new Date().toISOString() },
      });

      logger.info('AdminCommunityIssuesService.clearUnderReview', { issueId });
      return true;
    } catch (error) {
      logger.error('AdminCommunityIssuesService.clearUnderReview', error);
      return false;
    }
  }

  /**
   * Busca histórico de auditoria de um issue
   */
  async getAuditLog(issueId: string) {
    try {
      const { data, error } = await supabase
        .from(this.AUDIT_TABLE)
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getAuditLog', error);
      return [];
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Busca issues mais apoiados
   */
  async getTopSupportedIssues(limit: number = 10): Promise<IssueWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(`
          *,
          author_profile:profiles!community_issues_author_profile_id_fkey(
            display_name,
            avatar_url
          )
        `)
        .gt('support_count', 0)
        .order('support_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      logger.info('AdminCommunityIssuesService.getTopSupportedIssues', {
        count: data?.length || 0,
      });

      return (data as IssueWithDetails[]) || [];
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getTopSupportedIssues', error);
      return [];
    }
  }

  /**
   * Busca issues mais reportados
   */
  async getTopReportedIssues(limit: number = 10): Promise<IssueWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(`
          *,
          author_profile:profiles!community_issues_author_profile_id_fkey(
            display_name,
            avatar_url
          )
        `)
        .gt('report_count', 0)
        .order('report_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Buscar reports para cada issue
      const issuesWithReports = await Promise.all(
        (data || []).map(async (issue) => {
          const reports = await this.getIssueReports(issue.id);
          return {
            ...issue,
            reports,
          };
        })
      );

      logger.info('AdminCommunityIssuesService.getTopReportedIssues', {
        count: issuesWithReports.length,
      });

      return issuesWithReports as IssueWithDetails[];
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getTopReportedIssues', error);
      return [];
    }
  }

  /**
   * Busca estatísticas por categoria
   */
  async getStatsByCategory(): Promise<Record<IssueCategory, number>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('category');

      if (error) throw error;

      const stats: Record<string, number> = {};
      
      data?.forEach((issue) => {
        stats[issue.category] = (stats[issue.category] || 0) + 1;
      });

      logger.info('AdminCommunityIssuesService.getStatsByCategory', stats);
      return stats as Record<IssueCategory, number>;
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getStatsByCategory', error);
      return {} as Record<IssueCategory, number>;
    }
  }

  /**
   * Busca estatísticas por status
   */
  async getStatsByStatus(): Promise<Record<IssueStatus, number>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('status');

      if (error) throw error;

      const stats: Record<string, number> = {};
      
      data?.forEach((issue) => {
        stats[issue.status] = (stats[issue.status] || 0) + 1;
      });

      logger.info('AdminCommunityIssuesService.getStatsByStatus', stats);
      return stats as Record<IssueStatus, number>;
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getStatsByStatus', error);
      return {} as Record<IssueStatus, number>;
    }
  }

  /**
   * Busca taxa de resolução (resolvidos / total)
   */
  async getResolutionRate(): Promise<{
    total: number;
    resolved: number;
    rate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('status');

      if (error) throw error;

      const total = data?.length || 0;
      const resolved = data?.filter(i => i.status === 'resolvido').length || 0;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      logger.info('AdminCommunityIssuesService.getResolutionRate', {
        total,
        resolved,
        rate,
      });

      return { total, resolved, rate };
    } catch (error) {
      logger.error('AdminCommunityIssuesService.getResolutionRate', error);
      return { total: 0, resolved: 0, rate: 0 };
    }
  }
}

export const adminCommunityIssuesService = new AdminCommunityIssuesServiceClass();

