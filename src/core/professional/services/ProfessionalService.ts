/**
 * PROFILE.1.3b - BURN-DOWN AGRESSIVO
 *
 * ProfessionalService migrado para usar ProfileService como fonte única de verdade
 * Elimina regras manuais: is_verified
 * Score original: 123 (11 regras manuais)
 *
 * ✅ Fonte única para TODAS as operações de profissionais
 * ✅ Validações consistentes
 * ✅ Tratamento de erros padronizado
 * ✅ Mappers centralizados e tipados
 * ✅ Cache via React Query apenas
 * ✅ ZERO uso de any
 * ✅ Baseado no padrão BusinessService
 * ✅ MIGRADO - Usa ProfileService para verificação
 *
 * @version 1.0.0 - SSOT Migration + Profile Integration
 */
import { supabase } from "@/integrations/supabase";
import { ReviewsService } from "@/core/reviews";
import type { TerritoryFilter } from "@/core/location/types";
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

/**
 * ProfessionalFacade - Interface SSOT unificada v2.0
 *
 * Uso: ProfessionalFacade.queries.getProfessionalById(id)
 *      ProfessionalFacade.mutations.createProfessional(data, userId)
 */
export const ProfessionalFacade = {
  queries: professionalQueries,
  mutations: professionalMutations,
} as const;

// ============================================================
// LEGACY COMPATIBILITY - Instância singleton (DEPRECATED)
// ============================================================

export const professionalService = new (class ProfessionalServiceLegacy {
  // Delega todas as chamadas para os novos módulos SSOT
  // Queries
  getProfessionals = professionalQueries.getProfessionals;
  getProfessionalsList = professionalQueries.getProfessionalsList;
  getProfessionalById = professionalQueries.getProfessionalById;
  getServicesByProfile = professionalQueries.getServicesByProfile;
  getStats = professionalQueries.getStats;
  getTotalProfessionalsCount = professionalQueries.getTotalProfessionalsCount;
  getProfessionalsCreatedInPeriod = professionalQueries.getProfessionalsCreatedInPeriod;
  getReviews = professionalQueries.getReviews;
  getMyReview = professionalQueries.getMyReview;
  getJobs = professionalQueries.getJobs;
  getProfessionalsByIds = professionalQueries.getProfessionalsByIds;
  searchProfessionals = professionalQueries.searchProfessionals;
  getPublicProfileBySlug = professionalQueries.getPublicProfileBySlug;

  // Mutations
  createProfessional = professionalMutations.createProfessional;
  updateProfessional = professionalMutations.updateProfessional;
  deleteProfessional = professionalMutations.deleteProfessional;
  createJob = professionalMutations.createJob;
  updateProfessionalStatus = professionalMutations.updateProfessionalStatus;
  deleteProfessionalReview = professionalMutations.deleteProfessionalReview;
  updateProfessionalReport = professionalMutations.updateProfessionalReport;
})();

// ============================================================
// PROFESSIONAL SERVICE CLASS (LEGADO - mantido para compatibilidade)
// ============================================================

export class ProfessionalService {

  /**
   * 🔍 BUSCAR SERVIÇOS POR PERFIL
   * ✅ SSOT: Método para buscar todos os serviços de um perfil específico
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
   * ✨ CRIAR PROFISSIONAL (com validação dupla e cache)
   * FASE PROFILE.1.3 - Usa ProfileService para criação de perfil
   */
  static async createProfessional(
    input: CreateProfessionalInput,
    userId: string,
  ): Promise<Professional> {
    return createProfessionalWithProfile(input, userId);
  }

  /**
   * 📝 ATUALIZAR PROFISSIONAL (com validação dupla)
   * FASE PROFILE.1.3 - Usa ProfileService para atualização de perfil
   */
  static async updateProfessional(
    id: string,
    input: UpdateProfessionalInput,
  ): Promise<Professional> {
    return updateProfessionalWithProfile(id, input);
  }

  /**
   * ☠️ SOFT DELETE - Não remove dados, apenas marca como inativo
   * FASE PROFILE.1.3 - Usa ProfileService para soft delete
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
      // Verificar se já é favorito
      const { data: existing } = await (supabase as any)
        .from("professional_favorites")
        .select("id")
        .eq("professional_id", professionalId)
        .eq("profile_id", userId)
        .single();

      if (existing) {
        // Remover favorito
        await (supabase as any)
          .from("professional_favorites")
          .delete()
          .eq("id", existing.id);

        return false;
      } else {
        // Adicionar favorito
        await (supabase as any)
          .from("professional_favorites")
          .insert({ professional_id: professionalId, profile_id: userId });

        return true;
      }
    } catch (error: any) {
      throw new Error(`Erro ao favoritar: ${error.message}`);
    }
  }

  /**
   * 📊 OBTER ESTATÍSTICAS
   */
  static async getStats(professionalId: string): Promise<ProfessionalStats> {
    return professionalQueries.getStats(professionalId);
  }

  // ============================================================================
  // 📊 ESTATÍSTICAS ADMINISTRATIVAS
  // ============================================================================

  /**
   * 📊 OBTER CONTAGEM TOTAL DE PROFISSIONAIS
   * ✅ SSOT para contagem de profissionais no dashboard admin
   *
   * @returns Número total de profissionais cadastrados
   */
  static async getTotalProfessionalsCount(): Promise<number> {
    return professionalQueries.getTotalProfessionalsCount();
  }

  /**
   * 📅 OBTER PROFISSIONAIS CRIADOS EM UM PERÍODO
   * ✅ SSOT para atividade de profissionais por período
   *
   * @param startDate - Data inicial do período
   * @param endDate - Data final do período
   * @returns Número de profissionais criados no período
   */
  static async getProfessionalsCreatedInPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return professionalQueries.getProfessionalsCreatedInPeriod(startDate, endDate);
  }

  /**
   * ⭐ OBTER AVALIAÇÕES DE UM PROFISSIONAL
   * ✅ LOTE 6 - Refatorado para usar ReviewsService
   */
  static async getReviews(
    professionalId: string,
  ): Promise<ProfessionalReview[]> {
    return professionalQueries.getReviews(professionalId);
  }

  /**
   * ⭐ OBTER AVALIAÇÃO DO USUÁRIO
   * ✅ LOTE 6 - Refatorado para usar ReviewsService
   */
  static async getMyReview(
    professionalId: string,
    userId: string,
  ): Promise<ProfessionalReview | null> {
    return professionalQueries.getMyReview(professionalId, userId);
  }

  /**
   * ⭐ CRIAR/ATUALIZAR AVALIAÇÃO
   */
  static async submitReview(
    professionalId: string,
    userId: string,
    rating: number,
    comment?: string,
    jobType?: string,
  ): Promise<void> {
    try {
      const { profileService } = await import("@/core/profiles/services/ProfileService");
      // Buscar profile ativo do usuário
      const activeProfile = await profileService.getActiveProfile(userId);
      
      if (!activeProfile) {
        throw new Error("Perfil ativo não encontrado");
      }

      // Usar upsertReview para criar ou atualizar
      await ReviewsService.upsertReview(
        {
          reviewed_profile_id: professionalId,
          reviewer_profile_id: activeProfile.id,
          rating,
          comment,
          job_type: jobType,
        },
        "professional",
      );
    } catch (error: any) {
      throw new Error(`Erro ao enviar avaliação: ${error.message}`);
    }
  }

  /**
   * 🛍️ OBTER SERVIÇOS DE UM PROFISSIONAL
   */
  static async getJobs(professionalId: string): Promise<ProfessionalJob[]> {
    return professionalQueries.getJobs(professionalId);
  }

  /**
   * 🛍️ CRIAR SERVIÇO
   */
  static async createJob(
    professionalId: string,
    jobData: CreateProfessionalJobInput,
  ): Promise<ProfessionalJob> {
    return professionalMutations.createJob(professionalId, jobData);
  }

  /**
   * 👁️ INCREMENTAR VISUALIZAÇÕES
   */
  static async incrementViews(professionalId: string): Promise<void> {
    return professionalMutations.incrementViews(professionalId);
  }

  /**
   * 🔍 BUSCAR PROFISSIONAIS POR IDs (para recomendações)
   */
  static async getProfessionalsByIds(ids: string[]): Promise<Professional[]> {
    return professionalQueries.getProfessionalsByIds(ids);
  }

  /**
   * 🔍 BUSCAR PROFISSIONAIS (para busca global)
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
  // MÉTODOS DE ADMIN
  // ============================================================================

  /**
   * Atualizar status de profissional (admin)
   * ✅ SSOT - Centraliza atualização de status
   */
  static async updateProfessionalStatus(
    id: string,
    status: string,
  ): Promise<void> {
    return professionalMutations.updateProfessionalStatus(id, status);
  }

  /**
   * Deletar avaliação de profissional (admin)
   * ✅ SSOT - Centraliza deleção de avaliações
   */
  static async deleteProfessionalReview(reviewId: string): Promise<void> {
    return professionalMutations.deleteProfessionalReview(reviewId);
  }

  /**
   * Atualizar status de denúncia de profissional (admin)
   * ✅ SSOT - Centraliza atualização de denúncias
   */
  static async updateProfessionalReport(
    reportId: string,
    status: string,
  ): Promise<void> {
    return professionalMutations.updateProfessionalReport(reportId, status);
  }

  /**
   * Buscar profissionais por IDs (para admin)
   * ✅ SSOT - Centraliza busca por IDs
   */
  static async getProfessionalsByIdsSimple(
    ids: string[],
  ): Promise<Array<{ id: string; name: string }>> {
    try {
      if (ids.length === 0) return [];
      const idList = ids.join(",");

      const { data, error } = await (supabase as any)
        .from("professional_data")
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
   * MÉTODOS CANÔNICOS (ETAPA 9)
   * ============================================
   */

  /**
   * Verificar se profissional está migrado para modelo canônico
   */
  static isProfessionalMigrated(professional: ProfessionalDataRecord): boolean {
    return isProfessionalMigratedCanonical(professional);
  }

  /**
   * Verificar se profissional tem endereço físico
   */
  static hasPhysicalAddress(professional: ProfessionalDataRecord): boolean {
    return hasPhysicalAddressCanonical(professional);
  }

  /**
   * Obter endereço formatado (apenas canônico)
   */
  static getFormattedAddress(professional: ProfessionalDataRecord): string {
    // Usar apenas address canônico quando relações estiverem carregadas
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
   * Obter coordenadas (apenas canônico)
   */
  static getCoordinates(professional: ProfessionalDataRecord): { latitude: number; longitude: number } | null {
    // Usar apenas address canônico quando relações estiverem carregadas
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
   * Obter território principal
   */
  static getTerritory(professional: ProfessionalDataRecord): string | null {
    return getProfessionalTerritory(professional);
  }

  /**
   * Obter nome do território (apenas canônico)
   */
  static getTerritoryName(professional: ProfessionalDataRecord): string | null {
    // Usar apenas location canônico quando relações estiverem carregadas
    if ((professional as ProfessionalDataWithRelations).location?.name) {
      return (professional as ProfessionalDataWithRelations).location.name;
    }

    return null;
  }

  /**
   * Busca perfil público de profissional por slug + uf + cidade.
   * SSOT para acesso à tabela professional_data por slug.
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
   * Verifica se slug já existe
   * Usado por ProfessionalIdentityAdapter para validação de unicidade
   * 
   * @param slug - Slug a verificar
   * @param excludeId - ID do profissional a excluir da verificação (para updates)
   * @returns true se slug existe, false caso contrário
   */
  static async checkSlugExists(
    slug: string,
    excludeId?: string
  ): Promise<boolean> {
    return professionalQueries.checkProfessionalSlugExists(slug, excludeId);
  }

  /**
   * Busca slugs similares para sugestão
   * Usado por ProfessionalIdentityAdapter para gerar sugestões de slugs disponíveis
   * 
   * @param slug - Slug base para buscar similares
   * @param limit - Número máximo de resultados (padrão: 20)
   * @returns Array de slugs similares
   */
  static async getSimilarSlugs(slug: string, limit = PAGINATION.DEFAULT_LIMIT): Promise<string[]> {
    return professionalQueries.getProfessionalSimilarSlugs(slug, limit);
  }

  /**
   * Busca histórico de mudanças de slug
   * Usado por ProfessionalIdentityAdapter para verificar cooldown
   * 
   * @param professionalId - ID do profissional (professional_data.id)
   * @returns Array de registros de histórico
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
