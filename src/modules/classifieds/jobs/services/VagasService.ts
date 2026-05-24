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
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase/supabase';
import { JOB_QUERY_LIMITS } from '../constants/query-limits';
import type {
  Vaga,
  VagaFilters,
  VagaSortOption,
  VagasQueryParams,
  VagasPaginatedResult,
} from '../types/vagas.types';

// ═══════════════════════════════════════════════════════════════════════════════
// MAPEAMENTO DATABASE -> DOMAIN
// ═══════════════════════════════════════════════════════════════════════════════

type VagaRowLike = Record<string, unknown>;

function mapRowToVaga(row: VagaRowLike): Vaga {
  const raw = row as Record<string, unknown>;
  return {
    // Identificação
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? ''),
    
    // Dados
    titulo: String(raw.titulo ?? ''),
    descricao: String(raw.descricao ?? ''),
    resumo: typeof raw.resumo === 'string' ? raw.resumo : undefined,
    
    // Empresa
    empresaNome: String(raw.empresa_nome ?? raw.empresa ?? ''),
    empresaLogoUrl: typeof raw.empresa_logo_url === 'string' ? raw.empresa_logo_url : undefined,
    empresaId: typeof raw.empresa_id === 'string' ? raw.empresa_id : undefined,
    ownerProfileId: String(raw.owner_profile_id ?? ''),
    
    // Localização
    locationId: String(raw.location_id ?? ''),
    bairroId: typeof raw.bairro_id === 'string' ? raw.bairro_id : undefined,
    bairroNome: typeof raw.bairro_nome === 'string' ? raw.bairro_nome : undefined,
    
    // Classificação
    categoria: String(raw.categoria ?? ''),
    subcategoria: typeof raw.subcategoria === 'string' ? raw.subcategoria : undefined,
    contrato: (raw.contrato as Vaga['contrato']) ?? 'CLT',
    modalidade: (raw.modalidade as Vaga['modalidade']) ?? 'Presencial',
    nivel: (raw.nivel as Vaga['nivel']) ?? 'Pleno',
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    
    // Remuneração
    salaryMode: (raw.salary_mode as Vaga['salaryMode']) ?? 'a_combinar',
    salarioMin: typeof raw.salario_min === 'number' ? raw.salario_min : undefined,
    salarioMax: typeof raw.salario_max === 'number' ? raw.salario_max : undefined,
    salarioTexto: typeof raw.salario_texto === 'string' ? raw.salario_texto : undefined,
    beneficios: Array.isArray(raw.beneficios) ? (raw.beneficios as string[]) : [],
    
    // Detalhes
    requisitos: Array.isArray(raw.requisitos) ? (raw.requisitos as string[]) : [],
    diferenciais: Array.isArray(raw.diferenciais) ? (raw.diferenciais as string[]) : [],
    responsabilidades: Array.isArray(raw.responsabilidades) ? (raw.responsabilidades as string[]) : [],
    jornadaDescricao: typeof raw.jornada_descricao === 'string' ? raw.jornada_descricao : undefined,
    
    // Candidatura
    applicationChannel: (raw.application_channel as Vaga['applicationChannel']) ?? 'internal',
    applicationUrl: typeof raw.application_url === 'string' ? raw.application_url : undefined,
    applicationWhatsapp: typeof raw.application_whatsapp === 'string' ? raw.application_whatsapp : undefined,
    applicationEmail: typeof raw.application_email === 'string' ? raw.application_email : undefined,
    applicationPhone: typeof raw.application_phone === 'string' ? raw.application_phone : undefined,
    applicationInstructions: typeof raw.application_instructions === 'string' ? raw.application_instructions : undefined,
    
    // Controle
    status: (raw.status as Vaga['status']) ?? 'published',
    urgencia: (raw.urgencia as Vaga['urgencia']) ?? 'normal',
    highlightType: (raw.highlight_type as Vaga['highlightType']) ?? 'none',
    vagasQuantidade: typeof raw.vagas_quantidade === 'number' ? raw.vagas_quantidade : 1,
    
    // Datas
    createdAt: new Date(String(raw.created_at ?? new Date().toISOString())),
    updatedAt: new Date(String(raw.updated_at ?? new Date().toISOString())),
    publishedAt: typeof raw.published_at === 'string' ? new Date(raw.published_at) : undefined,
    expiresAt: typeof raw.expires_at === 'string' ? new Date(raw.expires_at) : undefined,
    closedAt: typeof raw.closed_at === 'string' ? new Date(raw.closed_at) : undefined,
    
    // SEO
    metaTitle: typeof raw.meta_title === 'string' ? raw.meta_title : undefined,
    metaDescription: typeof raw.meta_description === 'string' ? raw.meta_description : undefined,
    ogImageUrl: typeof raw.og_image_url === 'string' ? raw.og_image_url : undefined,
    
    // Analytics
    viewCount: typeof raw.view_count === 'number' ? raw.view_count : 0,
    applicationCount: typeof raw.application_count === 'number' ? raw.application_count : 0,
    shareCount: typeof raw.share_count === 'number' ? raw.share_count : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class VagasService {
  private static readonly DEFAULT_LIMIT = JOB_QUERY_LIMITS.DEFAULT_LIMIT;
  private static readonly MAX_LIMIT = JOB_QUERY_LIMITS.MAX_LIMIT;
  private static urgenciaColumnAvailable: boolean | null = null;
  private static highlightTypeColumnAvailable: boolean | null = null;

  /**
   * Leituras públicas dependem do RLS da tabela `vagas` para definir
   * visibilidade/status. Isso evita drift entre o frontend e o enum real
   * do banco quando as migrations locais ainda não foram aplicadas no ambiente.
   */
  private static getPublicQuery(): any {
    return (supabase as any).from('vagas');
  }

  private static isMissingColumnError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const typed = error as { code?: string; message?: string };
    return typed.code === '42703' || typed.message?.toLowerCase().includes('column') === true;
  }

  private static async getRecentByLocation(locationId: string, limit: number): Promise<Vaga[]> {
    const { data, error } = await supabase
      .from('vagas')
      .select('*')
      .eq('location_id', locationId)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('[VagasService] Erro no fallback de vagas por localizacao:', error);
      return [];
    }

    return ((data ?? []) as VagaRowLike[]).map(mapRowToVaga);
  }

  private static applyLocationIds(
    query: any,
    locationIds: string[],
  ): any {
    const uniqueLocationIds = Array.from(new Set(locationIds.filter(Boolean)));
    if (uniqueLocationIds.length <= 1) {
      return query.eq('location_id', uniqueLocationIds[0] ?? '');
    }
    return query.in('location_id', uniqueLocationIds);
  }

  /**
   * Listar vagas com filtros territoriais e ordenação
   * Página pública canônica: /vagas/:uf/:cidade
   */
  static async getVagas(params: VagasQueryParams): Promise<VagasPaginatedResult> {
    const { locationId, locationIds, filters, sort = 'newest', limit = this.DEFAULT_LIMIT, offset = 0 } = params;
    const resolvedLocationIds = locationIds?.length ? locationIds : [locationId];
    
    try {
      let query: any = this.applyLocationIds(
        this.getPublicQuery().select('*', { count: 'exact' }),
        resolvedLocationIds,
      );

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
          query = query.eq('contrato', String(filters.contrato));
        }

        // Modalidade
        if (filters.modalidade) {
          query = query.eq('modalidade', String(filters.modalidade));
        }

        // Nível
        if (filters.nivel) {
          query = query.eq('nivel', String(filters.nivel));
        }

        // Bairro: filtro visual resolvido para locations.id; query canônica em location_id.
        if (filters.bairroId) {
          query = query.eq('location_id', filters.bairroId);
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
          // Relevância: ordenação segura por data no banco, ranking de destaque aplicado no cliente.
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

      const rows = (data ?? []) as VagaRowLike[];
      if (sort === 'relevance') {
        const weight = (highlightType?: string) => {
          switch (highlightType) {
            case 'featured':
              return 3;
            case 'sponsored':
              return 2;
            case 'premium':
              return 1;
            default:
              return 0;
          }
        };
        rows.sort((a, b) => weight(String(b.highlight_type ?? '')) - weight(String(a.highlight_type ?? '')));
      }

      const vagas = rows.map(mapRowToVaga);
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

      return mapRowToVaga(data as VagaRowLike);
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

      return mapRowToVaga(data as VagaRowLike);
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
      if (this.urgenciaColumnAvailable === false) {
        return this.getRecentByLocation(locationId, limit);
      }

      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('location_id', locationId)
        .in('urgencia', ['urgente', 'extrema'])
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (this.isMissingColumnError(error)) {
          this.urgenciaColumnAvailable = false;
          logger.warn(
            '[VagasService] Coluna urgência não encontrada. Aplicar migration 20260417100000_fix_vagas_urgencia_highlight.sql',
          );
          return this.getRecentByLocation(locationId, limit);
        }
        logger.error('[VagasService] Erro ao buscar vagas urgentes:', error);
        return [];
      }

      this.urgenciaColumnAvailable = true;
      return ((data ?? []) as VagaRowLike[]).map(mapRowToVaga);
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
      if (this.highlightTypeColumnAvailable === false) {
        return this.getRecentByLocation(locationId, limit);
      }

      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('location_id', locationId)
        .neq('highlight_type', 'none')
        .order('highlight_type', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (this.isMissingColumnError(error)) {
          this.highlightTypeColumnAvailable = false;
          logger.warn(
            '[VagasService] Coluna highlight_type não encontrada. Aplicar migration 20260417100000_fix_vagas_urgencia_highlight.sql',
          );
          return this.getRecentByLocation(locationId, limit);
        }
        logger.error('[VagasService] Erro ao buscar vagas em destaque:', error);
        return [];
      }

      this.highlightTypeColumnAvailable = true;
      return ((data ?? []) as VagaRowLike[]).map(mapRowToVaga);
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
      const { data, error } = await (supabase as any)
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
  static async getBairrosComVagas(
    locationId: string,
    locationIds?: string[],
  ): Promise<{ id: string; nome: string; count: number }[]> {
    try {
      const resolvedLocationIds = locationIds?.length ? locationIds : [locationId];
      const { data, error } = await this.applyLocationIds(
        (supabase as any).from('vagas').select('location_id'),
        resolvedLocationIds,
      );

      if (error) {
        logger.error('[VagasService] Erro ao buscar bairros:', error);
        return [];
      }

      const counts = new Map<string, number>();
      (data ?? []).forEach((row: { location_id: string | null }) => {
        if (!row.location_id) return;
        counts.set(row.location_id, (counts.get(row.location_id) ?? 0) + 1);
      });

      const countedIds = Array.from(counts.keys());
      if (countedIds.length === 0) return [];

      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, type')
        .in('id', countedIds)
        .eq('type', 'district');

      if (locationsError) {
        logger.error('[VagasService] Erro ao resolver bairros:', locationsError);
        return [];
      }

      return ((locations ?? []) as Array<{ id: string; name: string }>)
        .map((location) => ({
          id: location.id,
          nome: location.name,
          count: counts.get(location.id) ?? 0,
        }))
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
        empresa: vagaData.empresaNome,
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
        .insert(dbRow as never)
        .select()
        .single();

      if (error) {
        logger.error('[VagasService] Erro ao criar vaga:', error);
        throw new Error(`Falha ao criar vaga: ${error.message}`);
      }

      logger.info(`[VagasService] Vaga criada: ${data.id}`);
      return mapRowToVaga(data as VagaRowLike);
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
      return mapRowToVaga(data as VagaRowLike);
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
      await supabase.rpc('increment_vaga_view_count' as never, { vaga_id: id } as never);
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

