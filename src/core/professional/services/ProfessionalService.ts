/**
 * ProfessionalService - servico canonico de profissionais.
 *
 * Centraliza leitura, escrita, identidade publica, estatisticas e integracoes
 * de profissionais usando queries/mutations SSOT e ProfileService.
 */
import { supabase } from "@/integrations/supabase";
import { ReviewsService } from "@/core/reviews";
import type { TerritoryFilter } from "@/core/location/types";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import { PAGINATION } from "@/shared/constants";
import {
  getProfessionalTerritory,
  hasPhysicalAddress as hasPhysicalAddressCanonical,
  isProfessionalMigrated as isProfessionalMigratedCanonical,
  type ProfessionalDataWithRelations,
} from "./ProfessionalCanonicalAdapter";
import {
  createProfessionalWithProfile,
  updateProfessionalWithProfile,
  deleteProfessionalWithProfile,
} from "./professional.profile-lifecycle";
import type {
  Professional,
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalFilters,
  ProfessionalStats,
  ProfessionalDataRecord,
  ProfessionalJob,
  CreateProfessionalJobInput,
  ProfessionalReview,
} from "@/core/professional/types";

// ============================================================
// SSOT v2.0 - FACADE EXPORTS (NOVO)
// ============================================================

import * as professionalQueries from "./professional.queries";
import * as professionalMutations from "./professional.mutations";

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  select(columns?: string): QueryBuilder<TRow>;
  insert(values: unknown): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  or(filters: string): QueryBuilder<TRow>;
  single(): QueryResult<TRow>;
  then<TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: TRow[]; error: { code?: string; message?: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface ProfessionalDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

const professionalDb = supabase as unknown as ProfessionalDbClient;

/**
 * ProfessionalFacade - Interface SSOT unificada v2.0
 *
 * Uso: ProfessionalFacade.queries.getProfessionalById(id)
 *      ProfessionalFacade.mutations.createProfessional(data, userId)
 */
export const ProfessionalFacade = {
  queries: professionalQueries,
  mutations: {
    ...professionalMutations,
    createProfessional: createProfessionalWithProfile,
    updateProfessional: updateProfessionalWithProfile,
    deleteProfessional: deleteProfessionalWithProfile,
  },
} as const;

// ============================================================
// PROFESSIONAL SERVICE CLASS
// ============================================================

export class ProfessionalService {

  /**
   * BUSCAR SERVICOS POR PERFIL
   * SSOT: metodo para buscar todos os servicos de um perfil especifico.
   */
  static async getServicesByProfile(profileId: string): Promise<Professional[]> {
    return professionalQueries.getServicesByProfile(profileId);
  }

  /**
   * BUSCAR PROFISSIONAIS (com filtros)
   */
  static async getProfessionals(
    filters: ProfessionalFilters = {},
  ): Promise<Professional[]> {
    return professionalQueries.getProfessionals(filters);
  }

  /**
   * BUSCAR PROFISSIONAIS COM PAGINACAO (infinite scroll)
   */
  static async getProfessionalsList(
    params: {
      pageParam?: number;
      category?: string;
      searchQuery?: string;
      pageSize?: number;
      location_id?: string;
      territoryFilter?: TerritoryFilter;
    } = {},
  ): Promise<{ professionals: Professional[]; nextPage?: number }> {
    const {
      pageParam = 0,
      category,
      searchQuery,
      territoryFilter,
    } = params;
    return professionalQueries.getProfessionalsList({
      pageParam,
      category,
      territory: territoryFilter,
      search: searchQuery,
    });
  }

  /**
   * Buscar profissional por ID
   */
  static async getProfessionalById(id: string): Promise<Professional> {
    return professionalQueries.getProfessionalById(id);
  }


  /**
   * CRIAR PROFISSIONAL (com validacao dupla e cache)
   * FASE PROFILE.1.3: usa ProfileService para criacao de perfil.
   */
  static async createProfessional(
    input: CreateProfessionalInput,
    userId: string,
  ): Promise<Professional> {
    return createProfessionalWithProfile(input, userId);
  }

  /**
   * ATUALIZAR PROFISSIONAL (com validacao dupla)
   * FASE PROFILE.1.3: usa ProfileService para atualizacao de perfil.
   */
  static async updateProfessional(
    id: string,
    input: UpdateProfessionalInput,
  ): Promise<Professional> {
    return updateProfessionalWithProfile(id, input);
  }

  /**
   * SOFT DELETE - nao remove dados, apenas marca como inativo.
   * FASE PROFILE.1.3: usa ProfileService para soft delete.
   */
  static async deleteProfessional(id: string): Promise<void> {
    return deleteProfessionalWithProfile(id);
  }

  /**
   * ⭐ TOGGLE FAVORITO
   */
  static async toggleFavorite(
    professionalId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      // Verificar se ja e favorito.
      const { data: existing } = await professionalDb
        .from<{ id: string }>("professional_favorites")
        .select("id")
        .eq("professional_id", professionalId)
        .eq("profile_id", userId)
        .single();

      if (existing) {
        // Remover favorito
        await professionalDb
          .from<{ id: string }>("professional_favorites")
          .delete()
          .eq("id", existing.id);

        return false;
      } else {
        // Adicionar favorito
        await professionalDb
          .from<{ professional_id: string; profile_id: string }>("professional_favorites")
          .insert({ professional_id: professionalId, profile_id: userId });

        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      throw new Error(`Erro ao favoritar: ${message}`);
    }
  }

  /**
   * OBTER ESTATISTICAS
   */
  static async getStats(professionalId: string): Promise<ProfessionalStats> {
    return professionalQueries.getStats(professionalId);
  }

  // ============================================================================
  // ESTATISTICAS ADMINISTRATIVAS
  // ============================================================================

  /**
   * OBTER CONTAGEM TOTAL DE PROFISSIONAIS
   * SSOT para contagem de profissionais no dashboard admin.
   *
   * @returns Numero total de profissionais cadastrados.
   */
  static async getTotalProfessionalsCount(): Promise<number> {
    return professionalQueries.getTotalProfessionalsCount();
  }

  /**
   * OBTER PROFISSIONAIS CRIADOS EM UM PERIODO
   * SSOT para atividade de profissionais por periodo.
   *
   * @param startDate - Data inicial do periodo.
   * @param endDate - Data final do periodo.
   * @returns Numero de profissionais criados no periodo.
   */
  static async getProfessionalsCreatedInPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return professionalQueries.getProfessionalsCreatedInPeriod(startDate, endDate);
  }

  /**
   * OBTER AVALIACOES DE UM PROFISSIONAL
   * LOTE 6: refatorado para usar ReviewsService.
   */
  static async getReviews(
    professionalId: string,
  ): Promise<ProfessionalReview[]> {
    return professionalQueries.getReviews(professionalId);
  }

  /**
   * OBTER AVALIACAO DO USUARIO
   * LOTE 6: refatorado para usar ReviewsService.
   */
  static async getMyReview(
    professionalId: string,
    userId: string,
  ): Promise<ProfessionalReview | null> {
    return professionalQueries.getMyReview(professionalId, userId);
  }

  /**
   * CRIAR OU ATUALIZAR AVALIACAO
   */
  static async submitReview(
    professionalId: string,
    userId: string,
    rating: number,
    comment?: string,
  ): Promise<void> {
    try {
      // Buscar profile ativo do usuario.
      const activeProfile = await profileService.getActiveProfile(userId);
      
      if (!activeProfile) {
        throw new Error("Perfil ativo nao encontrado");
      }

      // Usar upsertReview para criar ou atualizar
      await ReviewsService.upsertReview(
        {
          reviewed_profile_id: professionalId,
          reviewer_profile_id: activeProfile.id,
          rating,
          comment,
        },
        "professional",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      throw new Error(`Erro ao enviar avaliacao: ${message}`);
    }
  }

  /**
   * OBTER SERVICOS DE UM PROFISSIONAL
   */
  static async getJobs(professionalId: string): Promise<ProfessionalJob[]> {
    return professionalQueries.getJobs(professionalId);
  }

  /**
   * CRIAR SERVICO
   */
  static async createJob(
    professionalId: string,
    jobData: CreateProfessionalJobInput,
  ): Promise<ProfessionalJob> {
    return professionalMutations.createJob(professionalId, jobData);
  }

  /**
   * INCREMENTAR VISUALIZACOES
   */
  static async incrementViews(professionalId: string): Promise<void> {
    return professionalMutations.incrementViews(professionalId);
  }

  /**
   * BUSCAR PROFISSIONAIS POR IDS (para recomendacoes)
   */
  static async getProfessionalsByIds(ids: string[]): Promise<Professional[]> {
    return professionalQueries.getProfessionalsByIds(ids);
  }

  /**
   * BUSCAR PROFISSIONAIS (para busca global)
   */
  static async searchProfessionals(
    query: string,
    filters: ProfessionalFilters = {},
  ): Promise<Professional[]> {
    return professionalQueries.searchProfessionals(query, filters);
  }

  /**
   * LIMPAR CACHE (removido - usar apenas React Query)
   */
  static clearCache(): void {
    // Cache removido - usar apenas React Query
    logger.warn(
      "ProfessionalService.clearCache() foi removido. Use React Query invalidation.",
    );
  }

  

  // ============================================================================
  // METODOS DE ADMIN
  // ============================================================================

  /**
   * Atualizar status de profissional (admin)
   * SSOT - Centraliza atualizacao de status.
   */
  static async updateProfessionalStatus(
    id: string,
    status: string,
  ): Promise<void> {
    return professionalMutations.updateProfessionalStatus(id, status);
  }

  /**
   * Deletar avaliacao de profissional (admin).
   * SSOT - Centraliza delecao de avaliacoes.
   */
  static async deleteProfessionalReview(reviewId: string): Promise<void> {
    return professionalMutations.deleteProfessionalReview(reviewId);
  }

  /**
   * Atualizar status de denuncia de profissional (admin).
   * SSOT - Centraliza atualizacao de denuncias.
   */
  /**
   * Buscar profissionais por IDs (para admin)
   * SSOT - Centraliza busca por IDs.
   */
  static async getProfessionalsByIdsSimple(
    ids: string[],
  ): Promise<Array<{ id: string; name: string }>> {
    try {
      if (ids.length === 0) return [];
      const idList = ids.join(",");

      const { data, error } = await professionalDb
        .from<{
          id: string;
          profile_id: string;
          professional_name: string | null;
        }>("professional_data")
        .select("id, profile_id, professional_name")
        .or(`id.in.(${idList}),profile_id.in.(${idList})`);

      if (error) throw error;
      return ((data || []) as Array<{
        id: string;
        profile_id: string;
        professional_name: string | null;
      }>).flatMap((professional) => {
        const name = professional.professional_name || "Profissional";
        return [
          { id: professional.id, name },
          { id: professional.profile_id, name },
        ];
      });
    } catch (error) {
      logger.error("Error fetching professionals by IDs:", error);
      return [];
    }
  }

  /**
   * ============================================
   * METODOS CANONICOS (ETAPA 9)
   * ============================================
   */

  /**
   * Verificar se profissional esta migrado para modelo canonico.
   */
  static isProfessionalMigrated(professional: ProfessionalDataRecord): boolean {
    return isProfessionalMigratedCanonical(professional);
  }

  /**
   * Verificar se profissional tem endereco fisico.
   */
  static hasPhysicalAddress(professional: ProfessionalDataRecord): boolean {
    return hasPhysicalAddressCanonical(professional);
  }

  /**
   * Obter endereco formatado (apenas canonico).
   */
  static getFormattedAddress(professional: ProfessionalDataRecord): string {
    // Usar apenas address canonico quando relacoes estiverem carregadas.
    if ((professional as ProfessionalDataWithRelations).address) {
      const addr = (professional as ProfessionalDataWithRelations).address as unknown as Record<string, unknown>;
      const parts: string[] = [];
      
      if (typeof addr.street === "string") parts.push(addr.street);
      if (typeof addr.number === "string") parts.push(addr.number);
      if (typeof addr.neighborhood === "string") parts.push(addr.neighborhood);
      if (typeof addr.city === "string") parts.push(addr.city);
      if (typeof addr.state === "string") parts.push(addr.state);
      if (typeof addr.postal_code === "string") parts.push(`CEP ${addr.postal_code}`);

      return parts.join(', ');
    }

    return '';
  }

  /**
   * Obter coordenadas (apenas canonico).
   */
  static getCoordinates(professional: ProfessionalDataRecord): { latitude: number; longitude: number } | null {
    // Usar apenas address canonico quando relacoes estiverem carregadas.
    if (
      (professional as ProfessionalDataWithRelations).address?.latitude &&
      (professional as ProfessionalDataWithRelations).address?.longitude
    ) {
      return {
        latitude: (professional as ProfessionalDataWithRelations).address.latitude,
        longitude: (professional as ProfessionalDataWithRelations).address.longitude,
      };
    }

    return null;
  }

  /**
   * Obter territorio principal.
   */
  static getTerritory(professional: ProfessionalDataRecord): string | null {
    return getProfessionalTerritory(professional);
  }

  /**
   * Obter nome do territorio (apenas canonico).
   */
  static getTerritoryName(professional: ProfessionalDataRecord): string | null {
    // Usar apenas location canonico quando relacoes estiverem carregadas.
    if ((professional as ProfessionalDataWithRelations).location?.name) {
      return (professional as ProfessionalDataWithRelations).location.name;
    }

    return null;
  }

  /**
   * Busca perfil publico de profissional por slug + UF + cidade.
   * SSOT para acesso a tabela professional_data por slug.
   */
  static async getPublicProfileBySlug(
    slug: string,
    uf: string,
    cidade: string,
  ): Promise<{
    id: string;
    slug: string;
    professional_name: string;
    description: string | null;
    service_category: string | null;
    service_subcategory: string | null;
    is_verified: boolean;
    is_accepting_clients: boolean;
    city: string | null;
    state: string | null;
    avatar_url: string | null;
    logo_url: string | null;
    certifications: string[] | null;
    experience_years: number | null;
    price_range: string | null;
  } | null> {
    return professionalQueries.getProfessionalPublicProfileBySlug(slug, uf, cidade);
  }

  /**
   * Verifica se slug ja existe.
   * Usado por ProfessionalIdentityAdapter para validacao de unicidade.
   * 
   * @param slug - Slug a verificar
   * @param excludeId - ID do profissional a excluir da verificacao (para updates).
   * @returns true se slug existe, false caso contrario.
   */
  static async checkSlugExists(
    slug: string,
    excludeId?: string
  ): Promise<boolean> {
    return professionalQueries.checkProfessionalSlugExists(slug, excludeId);
  }

  /**
   * Busca slugs similares para sugestao.
   * Usado por ProfessionalIdentityAdapter para gerar sugestoes de slugs disponiveis.
   * 
   * @param slug - Slug base para buscar similares
   * @param limit - Numero maximo de resultados (padrao: 20).
   * @returns Array de slugs similares.
   */
  static async getSimilarSlugs(slug: string, limit = PAGINATION.DEFAULT_LIMIT): Promise<string[]> {
    return professionalQueries.getProfessionalSimilarSlugs(slug, limit);
  }

  /**
   * Busca historico de mudancas de slug.
   * Usado por ProfessionalIdentityAdapter para verificar cooldown.
   * 
   * @param professionalId - ID do profissional (professional_data.id)
   * @returns Array de registros de historico.
   */
  static async getSlugHistory(professionalId: string): Promise<Array<{
    id: string;
    old_slug: string;
    new_slug: string | null;
    change_reason: string;
    created_at: string;
  }>> {
    return professionalQueries.getProfessionalSlugHistory(professionalId);
  }
}
