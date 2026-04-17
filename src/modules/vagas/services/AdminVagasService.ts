/**
 * ADMIN VAGAS SERVICE — SSOT
 * 
 * Responsabilidade: Funcionalidades administrativas para vagas
 * Estende VagasService com operações de moderação e gestão
 * 
 * Padrão SSOT:
 * - Usa tabela vagas (migration 20260416110000)
 * - Enums: vaga_status, vaga_contrato, vaga_modalidade, vaga_nivel, vaga_urgencia
 * - Full-text search em português
 * - Filtros territoriais integrados
 * 
 * Substitui: adminVagasService.ts (antigo)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/utils/logger';
import type { VagaStatus, VagaContrato, VagaModalidade, VagaNivel } from './VagasService';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface VagaStats {
  total: number;
  ativas: number;
  pausadas: number;
  encerradas: number;
  preenchidas: number;
  urgentes: number;
  destaque: number;
  byContrato: Record<VagaContrato, number>;
  byModalidade: Record<VagaModalidade, number>;
  byNivel: Record<VagaNivel, number>;
}

export interface AdminVagaRow {
  id: string;
  titulo: string;
  empresa: string;
  descricao: string;
  location_id: string;
  contrato: VagaContrato;
  modalidade: VagaModalidade;
  nivel: VagaNivel;
  tags: string[];
  salario_texto: string | null;
  salario_min: number | null;
  salario_max: number | null;
  beneficios: string[];
  contato_email: string | null;
  contato_whatsapp: string | null;
  contato_url: string | null;
  status: VagaStatus;
  urgencia: 'normal' | 'urgente';
  destaque: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  location?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface AdminVaga {
  id: string;
  titulo: string;
  empresa: string;
  descricao: string;
  locationId: string;
  location?: {
    id: string;
    name: string;
    type: string;
  };
  contrato: VagaContrato;
  modalidade: VagaModalidade;
  nivel: VagaNivel;
  tags: string[];
  salarioTexto?: string;
  salarioMin?: number;
  salarioMax?: number;
  beneficios: string[];
  contatoEmail?: string;
  contatoWhatsapp?: string;
  contatoUrl?: string;
  status: VagaStatus;
  urgencia: 'normal' | 'urgente';
  destaque: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface GetVagasParams {
  page?: number;
  limit?: number;
  search?: string;
  contrato?: VagaContrato;
  modalidade?: VagaModalidade;
  nivel?: VagaNivel;
  status?: VagaStatus;
  urgente?: boolean;
  destaque?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class AdminVagasService {
  /**
   * Buscar estatísticas de vagas
   */
  static async getStats(): Promise<VagaStats> {
    try {
      const { data: vagas, error } = await supabase
        .from('vagas')
        .select('*');

      if (error) throw error;

      const stats: VagaStats = {
        total: vagas?.length || 0,
        ativas: vagas?.filter(v => v.status === 'ativa').length || 0,
        pausadas: vagas?.filter(v => v.status === 'pausada').length || 0,
        encerradas: vagas?.filter(v => v.status === 'encerrada').length || 0,
        preenchidas: vagas?.filter(v => v.status === 'preenchida').length || 0,
        urgentes: vagas?.filter(v => v.urgencia === 'urgente').length || 0,
        destaque: vagas?.filter(v => v.destaque).length || 0,
        byContrato: {} as Record<VagaContrato, number>,
        byModalidade: {} as Record<VagaModalidade, number>,
        byNivel: {} as Record<VagaNivel, number>,
      };

      // Contar por contrato
      vagas?.forEach(v => {
        if (v.contrato) {
          stats.byContrato[v.contrato as VagaContrato] = 
            (stats.byContrato[v.contrato as VagaContrato] || 0) + 1;
        }
        if (v.modalidade) {
          stats.byModalidade[v.modalidade as VagaModalidade] = 
            (stats.byModalidade[v.modalidade as VagaModalidade] || 0) + 1;
        }
        if (v.nivel) {
          stats.byNivel[v.nivel as VagaNivel] = 
            (stats.byNivel[v.nivel as VagaNivel] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de vagas:', error);
      throw error;
    }
  }

  /**
   * Buscar todas as vagas com paginação e filtros
   */
  static async getAllVagas(params: GetVagasParams = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        contrato,
        modalidade,
        nivel,
        status,
        urgente,
        destaque,
      } = params;

      let query = supabase
        .from('vagas')
        .select(`
          *,
          location:locations(
            id,
            name,
            type
          )
        `, { count: 'exact' });

      // Filtros
      if (search) {
        query = query.textSearch('titulo,empresa,descricao', search, {
          type: 'websearch',
          config: 'portuguese',
        });
      }
      if (contrato) {
        query = query.eq('contrato', contrato);
      }
      if (modalidade) {
        query = query.eq('modalidade', modalidade);
      }
      if (nivel) {
        query = query.eq('nivel', nivel);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (urgente !== undefined) {
        query = query.eq('urgencia', urgente ? 'urgente' : 'normal');
      }
      if (destaque !== undefined) {
        query = query.eq('destaque', destaque);
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Ordenação
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data as AdminVagaRow[]).map(this.mapRowToAdminVaga),
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error('Erro ao buscar vagas:', error);
      throw error;
    }
  }

  /**
   * Atualizar status da vaga
   */
  static async updateStatus(vagaId: string, status: VagaStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('vagas')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar status da vaga:', error);
      return false;
    }
  }

  /**
   * Ativar vaga (status = ativa)
   */
  static async ativarVaga(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, 'ativa');
  }

  /**
   * Pausar vaga (status = pausada)
   */
  static async pausarVaga(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, 'pausada');
  }

  /**
   * Encerrar vaga (status = encerrada)
   */
  static async encerrarVaga(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, 'encerrada');
  }

  /**
   * Marcar vaga como preenchida (status = preenchida)
   */
  static async marcarPreenchida(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, 'preenchida');
  }

  /**
   * Toggle destaque
   */
  static async toggleDestaque(vagaId: string, destaque: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('vagas')
        .update({ 
          destaque,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Erro ao toggle destaque:', error);
      return false;
    }
  }

  /**
   * Toggle urgência
   */
  static async toggleUrgencia(vagaId: string, urgente: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('vagas')
        .update({ 
          urgencia: urgente ? 'urgente' : 'normal',
          updated_at: new Date().toISOString(),
        })
        .eq('id', vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Erro ao toggle urgência:', error);
      return false;
    }
  }

  /**
   * Deletar vaga
   */
  static async deleteVaga(vagaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('vagas')
        .delete()
        .eq('id', vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Erro ao deletar vaga:', error);
      return false;
    }
  }

  /**
   * Buscar vagas expirando (próximos N dias)
   */
  static async getVagasExpirando(days: number = 7): Promise<AdminVaga[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from('vagas')
        .select(`
          *,
          location:locations(
            id,
            name,
            type
          )
        `)
        .eq('status', 'ativa')
        .not('expires_at', 'is', null)
        .gte('expires_at', now.toISOString())
        .lte('expires_at', futureDate.toISOString())
        .order('expires_at', { ascending: true });

      if (error) throw error;
      return (data as AdminVagaRow[]).map(this.mapRowToAdminVaga);
    } catch (error) {
      logger.error('Erro ao buscar vagas expirando:', error);
      return [];
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ════════════════════════════════════════════════════════════════════════

  private static mapRowToAdminVaga(row: AdminVagaRow): AdminVaga {
    return {
      id: row.id,
      titulo: row.titulo,
      empresa: row.empresa,
      descricao: row.descricao,
      locationId: row.location_id,
      location: row.location,
      contrato: row.contrato,
      modalidade: row.modalidade,
      nivel: row.nivel,
      tags: row.tags,
      salarioTexto: row.salario_texto || undefined,
      salarioMin: row.salario_min || undefined,
      salarioMax: row.salario_max || undefined,
      beneficios: row.beneficios,
      contatoEmail: row.contato_email || undefined,
      contatoWhatsapp: row.contato_whatsapp || undefined,
      contatoUrl: row.contato_url || undefined,
      status: row.status,
      urgencia: row.urgencia,
      destaque: row.destaque,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    };
  }
}
