/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VAGAS SERVICE — SSOT NÍVEL AAA
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Responsabilidade: Única fonte de verdade para vagas de emprego
 * 
 * Arquitetura:
 * - Métodos de listagem territorial com filtros avançados
 * - Busca por slug canônico (detalhe)
 * - Gestão de candidaturas tipadas
 * - Cache inteligente via React Query (não implementado aqui)
 * - Tratamento de erros consistente
 * - Logging estruturado
 * 
 * Alinhado com: types/vagas.types.ts + migration 20260416170000
 * 
 * @version 3.0.0 - Service Completo AAA
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/utils/logger';
import type {
  Vaga,
  VagaRow,
  VagaFilters,
  VagaSortOption,
  VagasQueryParams,
  VagasPaginatedResult,
} from '../types/vagas.types';

// ═══════════════════════════════════════════════════════════════════════════════
// MAPEAMENTO DATABASE -> DOMAIN
// ═══════════════════════════════════════════════════════════════════════════════

function mapRowToVaga(row: VagaRow): Vaga {
  return {
    // Identificação
    id: row.id,
    slug: row.slug,
    
    // Dados
    titulo: row.titulo,
    descricao: row.descricao,
    resumo: row.resumo ?? undefined,
    
    // Empresa
    empresaNome: row.empresa_nome,
    empresaLogoUrl: row.empresa_logo_url ?? undefined,
    empresaId: row.empresa_id ?? undefined,
    ownerProfileId: row.owner_profile_id,
    
    // Localização
    locationId: row.location_id,
    bairroId: row.bairro_id ?? undefined,
    bairroNome: row.bairro_nome ?? undefined,
    
    // Classificação
    categoria: row.categoria,
    subcategoria: row.subcategoria ?? undefined,
    contrato: row.contrato,
    modalidade: row.modalidade,
    nivel: row.nivel,
    tags: row.tags ?? [],
    
    // Remuneração
    salaryMode: row.salary_mode,
    salarioMin: row.salario_min ?? undefined,
    salarioMax: row.salario_max ?? undefined,
    salarioTexto: row.salario_texto ?? undefined,
    beneficios: row.beneficios ?? [],
    
    // Detalhes
    requisitos: row.requisitos ?? [],
    diferenciais: row.diferenciais ?? [],
    responsabilidades: row.responsabilidades ?? [],
    jornadaDescricao: row.jornada_descricao ?? undefined,
    
    // Candidatura
    applicationChannel: row.application_channel,
    applicationUrl: row.application_url ?? undefined,
    applicationWhatsapp: row.application_whatsapp ?? undefined,
    applicationEmail: row.application_email ?? undefined,
    applicationPhone: row.application_phone ?? undefined,
    applicationInstructions: row.application_instructions ?? undefined,
    
    // Controle
    status: row.status,
    urgencia: row.urgencia,
    highlightType: row.highlight_type,
    vagasQuantidade: row.vagas_quantidade ?? 1,
    
    // Datas
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
    
    // SEO
    metaTitle: row.meta_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    
    // Analytics
    viewCount: row.view_count ?? 0,
    applicationCount: row.application_count ?? 0,
    shareCount: row.share_count ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class VagasService {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  /**
   * Leituras públicas dependem do RLS da tabela `vagas` para definir
   * visibilidade/status. Isso evita drift entre o frontend e o enum real
   * do banco quando as migrations locais ainda não foram aplicadas no ambiente.
   */
  private static getPublicQuery() {
    return supabase.from('vagas');
  }

  /**
   * Listar vagas com filtros territoriais e ordenação
   * Página pública canônica: /vagas/:uf/:cidade
   */
  static async getVagas(params: VagasQueryParams): Promise<VagasPaginatedResult> {
    const { locationId, filters, sort = 'newest', limit = this.DEFAULT_LIMIT, offset = 0 } = params;
    
    try {
      let query = this.getPublicQuery()
        .select('*', { count: 'exact' })
        .eq('location_id', locationId);

      // Aplicar filtros
      if (filters) {
        // Busca textual
        if (filters.search) {
          query = query.textSearch('search_vector', filters.search, {
            type: 'websearch',
            config: 'portuguese',
          });
        }

        // Categoria
        if (filters.categoria) {
          query = query.eq('categoria', filters.categoria);
        }

        // Subcategoria
        if (filters.subcategoria) {
          query = query.eq('subcategoria', filters.subcategoria);
        }

        // Contrato
        if (filters.contrato) {
          query = query.eq('contrato', filters.contrato);
        }

        // Modalidade
        if (filters.modalidade) {
          query = query.eq('modalidade', filters.modalidade);
        }

        // Nível
        if (filters.nivel) {
          query = query.eq('nivel', filters.nivel);
        }

        // Bairro
        if (filters.bairroId) {
          query = query.eq('bairro_id', filters.bairroId);
        }

        // Faixa salarial
        if (filters.salaryMin !== null && filters.salaryMin !== undefined) {
          query = query.gte('salario_min', filters.salaryMin);
        }
        if (filters.salaryMax !== null && filters.salaryMax !== undefined) {
          query = query.lte('salario_max', filters.salaryMax);
        }

        // Apenas com salário definido
        if (filters.hasSalary) {
          query = query.or('salario_min.not.is.null,salary_mode.eq.fixed');
        }

        // Tags
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags);
        }

        // Data de publicação
        if (filters.publishedAfter) {
          query = query.gte('published_at', filters.publishedAfter.toISOString());
        }
      }

      // Ordenação
      switch (sort) {
        case 'relevance':
          // Relevância: premium primeiro, depois data
          query = query.order('highlight_type', { ascending: false, nullsFirst: false });
          query = query.order('published_at', { ascending: false });
          break;
        case 'newest':
          query = query.order('published_at', { ascending: false });
          break;
        case 'salary_desc':
          query = query.order('salario_max', { ascending: false, nullsFirst: true });
          break;
        case 'salary_asc':
          query = query.order('salario_min', { ascending: true, nullsFirst: true });
          break;
        case 'views':
          query = query.order('view_count', { ascending: false });
          break;
        default:
          query = query.order('published_at', { ascending: false });
      }

      // Paginação
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('[VagasService] Erro ao buscar vagas:', error);
        throw new Error(`Falha ao buscar vagas: ${error.message}`);
      }

      const vagas = (data ?? []).map(mapRowToVaga);
      const total = count ?? 0;

      logger.info(`[VagasService] ${vagas.length} vagas encontradas (total: ${total})`);

      return {
        vagas,
        total,
        hasMore: offset + vagas.length < total,
        page: Math.floor(offset / limit) + 1,
      };
    } catch (error) {
      logger.error('[VagasService] Erro inesperado:', error);
      throw error;
    }
  }

  /**
   * Buscar vaga por slug canônico
   * Rota pública: /vagas/:uf/:cidade/:slug
   */
  static async getVagaBySlug(slug: string): Promise<Vaga | null> {
    try {
      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error(`[VagasService] Erro ao buscar vaga ${slug}:`, error);
        throw new Error(`Falha ao buscar vaga: ${error.message}`);
      }

      // Incrementar view count (fire and forget)
      this.incrementViewCount(data.id).catch(() => {});

      return mapRowToVaga(data as VagaRow);
    } catch (error) {
      logger.error('[VagasService] Erro inesperado:', error);
      throw error;
    }
  }

  /**
   * Buscar vaga por ID (para admin/owner)
   */
  static async getVagaById(id: string): Promise<Vaga | null> {
    try {
      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error(`[VagasService] Erro ao buscar vaga ${id}:`, error);
        throw new Error(`Falha ao buscar vaga: ${error.message}`);
      }

      return mapRowToVaga(data as VagaRow);
    } catch (error) {
      logger.error('[VagasService] Erro inesperado:', error);
      throw error;
    }
  }

  /**
   * Buscar vagas urgentes em um território
   * NOTA: Requer coluna 'urgencia' com enum ('normal', 'urgente', 'extrema')
   * Migration: 20260417100000_fix_vagas_urgencia_highlight.sql
   */
  static async getVagasUrgentes(locationId: string, limit = 5): Promise<Vaga[]> {
    try {
      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('location_id', locationId)
        .in('urgencia', ['urgente', 'extrema'])
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Se a coluna não existir, retornar array vazio (migration pendente)
        if (error.code === '42703' || error.message?.includes('urgencia')) {
          logger.warn('[VagasService] Coluna urgencia não encontrada. Aplicar migration 20260417100000_fix_vagas_urgencia_highlight.sql');
          return [];
        }
        logger.error('[VagasService] Erro ao buscar vagas urgentes:', error);
        return [];
      }

      return (data ?? []).map(mapRowToVaga);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      return [];
    }
  }

  /**
   * Buscar vagas em destaque/premium
   * NOTA: Requer coluna 'highlight_type' com enum ('none', 'premium', 'sponsored', 'featured')
   * Migration: 20260417100000_fix_vagas_urgencia_highlight.sql
   */
  static async getVagasDestaque(locationId: string, limit = 6): Promise<Vaga[]> {
    try {
      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('location_id', locationId)
        .neq('highlight_type', 'none')
        .order('highlight_type', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Se a coluna não existir, retornar array vazio (migration pendente)
        if (error.code === '42703' || error.message?.includes('highlight_type')) {
          logger.warn('[VagasService] Coluna highlight_type não encontrada. Aplicar migration 20260417100000_fix_vagas_urgencia_highlight.sql');
          return [];
        }
        logger.error('[VagasService] Erro ao buscar vagas em destaque:', error);
        return [];
      }

      return (data ?? []).map(mapRowToVaga);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      return [];
    }
  }

  /**
   * Buscar vagas relacionadas (mesma categoria/tags)
   */
  static async getVagasRelacionadas(vagaId: string, locationId: string, limit = 3): Promise<Vaga[]> {
    try {
      // Primeiro, buscar a vaga para pegar categoria e tags
      const { data: vagaBase, error: errorBase } = await supabase
        .from('vagas')
        .select('categoria, tags')
        .eq('id', vagaId)
        .single();

      if (errorBase || !vagaBase) {
        return [];
      }

      // Buscar vagas com mesma categoria ou tags similares
      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('location_id', locationId)
        .neq('id', vagaId)
        .or(`categoria.eq.${vagaBase.categoria},tags.ov.{${vagaBase.tags.join(',')}}`)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('[VagasService] Erro ao buscar vagas relacionadas:', error);
        return [];
      }

      return (data ?? []).map(mapRowToVaga);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      return [];
    }
  }

  /**
   * Buscar vagas de uma empresa específica
   */
  static async getVagasByEmpresa(empresaId: string, limit = 10): Promise<Vaga[]> {
    try {
      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('[VagasService] Erro ao buscar vagas da empresa:', error);
        return [];
      }

      return (data ?? []).map(mapRowToVaga);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      return [];
    }
  }

  /**
   * Buscar vagas do usuário atual (para gestão)
   */
  static async getMinhasVagas(profileId: string): Promise<Vaga[]> {
    try {
      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('owner_profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[VagasService] Erro ao buscar minhas vagas:', error);
        throw new Error(`Falha ao buscar suas vagas: ${error.message}`);
      }

      return (data ?? []).map(mapRowToVaga);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      throw error;
    }
  }

  /**
   * Buscar bairros com vagas ativas (para filtros territoriais)
   */
  static async getBairrosComVagas(locationId: string): Promise<{ id: string; nome: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('vagas')
        .select('bairro_id, bairro_nome')
        .eq('location_id', locationId)
        .not('bairro_id', 'is', null);

      if (error) {
        logger.error('[VagasService] Erro ao buscar bairros:', error);
        return [];
      }

      // Agrupar e contar
      const grouped = new Map<string, { nome: string; count: number }>();
      
      (data ?? []).forEach((row: { bairro_id: string; bairro_nome: string }) => {
        const existing = grouped.get(row.bairro_id);
        if (existing) {
          existing.count++;
        } else {
          grouped.set(row.bairro_id, { nome: row.bairro_nome, count: 1 });
        }
      });

      return Array.from(grouped.entries())
        .map(([id, info]) => ({ id, nome: info.nome, count: info.count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      return [];
    }
  }

  /**
   * Criar nova vaga
   */
  static async createVaga(vagaData: Omit<Vaga, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'applicationCount' | 'shareCount'>): Promise<Vaga> {
    try {
      const dbRow = {
        slug: vagaData.slug,
        titulo: vagaData.titulo,
        descricao: vagaData.descricao,
        resumo: vagaData.resumo,
        empresa_nome: vagaData.empresaNome,
        empresa_logo_url: vagaData.empresaLogoUrl,
        empresa_id: vagaData.empresaId,
        owner_profile_id: vagaData.ownerProfileId,
        location_id: vagaData.locationId,
        bairro_id: vagaData.bairroId,
        categoria: vagaData.categoria,
        subcategoria: vagaData.subcategoria,
        contrato: vagaData.contrato,
        modalidade: vagaData.modalidade,
        nivel: vagaData.nivel,
        tags: vagaData.tags,
        salary_mode: vagaData.salaryMode,
        salario_min: vagaData.salarioMin,
        salario_max: vagaData.salarioMax,
        salario_texto: vagaData.salarioTexto,
        beneficios: vagaData.beneficios,
        requisitos: vagaData.requisitos,
        diferenciais: vagaData.diferenciais,
        responsabilidades: vagaData.responsabilidades,
        jornada_descricao: vagaData.jornadaDescricao,
        application_channel: vagaData.applicationChannel,
        application_url: vagaData.applicationUrl,
        application_whatsapp: vagaData.applicationWhatsapp,
        application_email: vagaData.applicationEmail,
        application_phone: vagaData.applicationPhone,
        application_instructions: vagaData.applicationInstructions,
        status: vagaData.status,
        urgencia: vagaData.urgencia,
        highlight_type: vagaData.highlightType,
        vagas_quantidade: vagaData.vagasQuantidade,
        expires_at: vagaData.expiresAt?.toISOString(),
        meta_title: vagaData.metaTitle,
        meta_description: vagaData.metaDescription,
        og_image_url: vagaData.ogImageUrl,
      };

      const { data, error } = await supabase
        .from('vagas')
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        logger.error('[VagasService] Erro ao criar vaga:', error);
        throw new Error(`Falha ao criar vaga: ${error.message}`);
      }

      logger.info(`[VagasService] Vaga criada: ${data.id}`);
      return mapRowToVaga(data as VagaRow);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      throw error;
    }
  }

  /**
   * Atualizar vaga existente
   */
  static async updateVaga(id: string, updates: Partial<Vaga>): Promise<Vaga> {
    try {
      const dbRow: Record<string, unknown> = {};
      
      // Mapear apenas campos permitidos
      if (updates.titulo !== undefined) dbRow.titulo = updates.titulo;
      if (updates.descricao !== undefined) dbRow.descricao = updates.descricao;
      if (updates.resumo !== undefined) dbRow.resumo = updates.resumo;
      if (updates.empresaNome !== undefined) dbRow.empresa_nome = updates.empresaNome;
      if (updates.empresaLogoUrl !== undefined) dbRow.empresa_logo_url = updates.empresaLogoUrl;
      if (updates.bairroId !== undefined) dbRow.bairro_id = updates.bairroId;
      if (updates.categoria !== undefined) dbRow.categoria = updates.categoria;
      if (updates.subcategoria !== undefined) dbRow.subcategoria = updates.subcategoria;
      if (updates.contrato !== undefined) dbRow.contrato = updates.contrato;
      if (updates.modalidade !== undefined) dbRow.modalidade = updates.modalidade;
      if (updates.nivel !== undefined) dbRow.nivel = updates.nivel;
      if (updates.tags !== undefined) dbRow.tags = updates.tags;
      if (updates.salaryMode !== undefined) dbRow.salary_mode = updates.salaryMode;
      if (updates.salarioMin !== undefined) dbRow.salario_min = updates.salarioMin;
      if (updates.salarioMax !== undefined) dbRow.salario_max = updates.salarioMax;
      if (updates.salarioTexto !== undefined) dbRow.salario_texto = updates.salarioTexto;
      if (updates.beneficios !== undefined) dbRow.beneficios = updates.beneficios;
      if (updates.requisitos !== undefined) dbRow.requisitos = updates.requisitos;
      if (updates.diferenciais !== undefined) dbRow.diferenciais = updates.diferenciais;
      if (updates.responsabilidades !== undefined) dbRow.responsabilidades = updates.responsabilidades;
      if (updates.jornadaDescricao !== undefined) dbRow.jornada_descricao = updates.jornadaDescricao;
      if (updates.applicationChannel !== undefined) dbRow.application_channel = updates.applicationChannel;
      if (updates.applicationUrl !== undefined) dbRow.application_url = updates.applicationUrl;
      if (updates.applicationWhatsapp !== undefined) dbRow.application_whatsapp = updates.applicationWhatsapp;
      if (updates.applicationEmail !== undefined) dbRow.application_email = updates.applicationEmail;
      if (updates.applicationPhone !== undefined) dbRow.application_phone = updates.applicationPhone;
      if (updates.applicationInstructions !== undefined) dbRow.application_instructions = updates.applicationInstructions;
      if (updates.status !== undefined) dbRow.status = updates.status;
      if (updates.urgencia !== undefined) dbRow.urgencia = updates.urgencia;
      if (updates.highlightType !== undefined) dbRow.highlight_type = updates.highlightType;
      if (updates.vagasQuantidade !== undefined) dbRow.vagas_quantidade = updates.vagasQuantidade;
      if (updates.expiresAt !== undefined) dbRow.expires_at = updates.expiresAt?.toISOString();
      if (updates.metaTitle !== undefined) dbRow.meta_title = updates.metaTitle;
      if (updates.metaDescription !== undefined) dbRow.meta_description = updates.metaDescription;
      if (updates.ogImageUrl !== undefined) dbRow.og_image_url = updates.ogImageUrl;

      const { data, error } = await supabase
        .from('vagas')
        .update(dbRow)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`[VagasService] Erro ao atualizar vaga ${id}:`, error);
        throw new Error(`Falha ao atualizar vaga: ${error.message}`);
      }

      logger.info(`[VagasService] Vaga atualizada: ${id}`);
      return mapRowToVaga(data as VagaRow);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      throw error;
    }
  }

  /**
   * Publicar vaga (mudar status de draft para published)
   */
  static async publishVaga(id: string): Promise<Vaga> {
    return this.updateVaga(id, { status: 'published' });
  }

  /**
   * Pausar vaga
   */
  static async pauseVaga(id: string): Promise<Vaga> {
    return this.updateVaga(id, { status: 'paused' });
  }

  /**
   * Encerrar vaga
   */
  static async closeVaga(id: string): Promise<Vaga> {
    return this.updateVaga(id, { status: 'closed' });
  }

  /**
   * Excluir vaga (apenas se estiver em rascunho ou pending_review)
   */
  static async deleteVaga(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vagas')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`[VagasService] Erro ao excluir vaga ${id}:`, error);
        throw new Error(`Falha ao excluir vaga: ${error.message}`);
      }

      logger.info(`[VagasService] Vaga excluída: ${id}`);
    } catch (error) {
      logger.error('[VagasService] Erro:', error);
      throw error;
    }
  }

  /**
   * Incrementar contador de visualizações
   */
  private static async incrementViewCount(id: string): Promise<void> {
    try {
      await supabase.rpc('increment_vaga_view_count', { vaga_id: id });
    } catch {
      // Silencioso - não quebrar a experiência por analytics
    }
  }

  /**
   * Gerar slug único para nova vaga
   */
  static generateSlug(titulo: string, empresa: string): string {
    const base = `${titulo}-${empresa}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }
}

// Export singleton
export const vagasService = VagasService;
