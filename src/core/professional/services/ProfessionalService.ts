/**
 * ProfessionalService - servico canonico de profissionais.
 *
 * Centraliza leitura, escrita, identidade publica, estatisticas e integracoes
 * de profissionais usando queries/mutations canonicas e ProfileService.
 */
import { supabase } from "@/integrations/supabase";
import { ReviewsService } from "@/core/reviews";
import type { TerritoryFilter } from "@/core/location/types";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import { PAGINATION } from "@/shared/constants";
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
import * as professionalQueries from "./professional.queries";
import * as professionalMutations from "./professional.mutations";

type QueryResult<T> = Promise<{
  data: T;
  error: { code?: string; message?: string } | null;
}>;

interface QueryBuilder<TRow> {
  select(columns?: string): QueryBuilder<TRow>;
  insert(values: unknown): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  or(filters: string): QueryBuilder<TRow>;
  single(): QueryResult<TRow>;
  then<
    TResult1 = {
      data: TRow[];
      error: { code?: string; message?: string } | null;
    },
    TResult2 = never,
  >(
    onfulfilled?:
      | ((value: {
          data: TRow[];
          error: { code?: string; message?: string } | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface ProfessionalDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

const professionalDb = supabase as unknown as ProfessionalDbClient;

type AdminAvailabilityStatus = Parameters<
  typeof professionalMutations.updateProfessionalStatus
>[1];

/**
 * Facade agregada consumida pelos hooks e superficies de profissionais.
 * Mantem queries/mutations especializadas como owners; nao duplica regra de dominio.
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

export class ProfessionalService {
  /** Resolver professional_data.id pelo profile_id via owner canonico. */
  static async getProfessionalDataIdByProfileId(
    profileId: string,
  ): Promise<string | null> {
    return professionalQueries.getProfessionalDataIdByProfileId(profileId);
  }

  /** Buscar todos os servicos de um perfil especifico. */
  static async getServicesByProfile(profileId: string): Promise<Professional[]> {
    return professionalQueries.getServicesByProfile(profileId);
  }

  /** Buscar profissionais com filtros. */
  static async getProfessionals(
    filters: ProfessionalFilters = {},
  ): Promise<Professional[]> {
    return professionalQueries.getProfessionals(filters);
  }

  /** Buscar profissionais com paginacao. */
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
    const { pageParam = 0, category, searchQuery, territoryFilter } = params;
    return professionalQueries.getProfessionalsList({
      pageParam,
      category,
      territory: territoryFilter,
      search: searchQuery,
    });
  }

  /** Buscar profissional por ID. */
  static async getProfessionalById(id: string): Promise<Professional> {
    return professionalQueries.getProfessionalById(id);
  }

  /** Criar profissional preservando o lifecycle de Profile. */
  static async createProfessional(
    input: CreateProfessionalInput,
  ): Promise<Professional> {
    return createProfessionalWithProfile(input);
  }

  /** Atualizar profissional preservando o lifecycle de Profile. */
  static async updateProfessional(
    id: string,
    input: UpdateProfessionalInput,
  ): Promise<Professional> {
    return updateProfessionalWithProfile(id, input);
  }

  /** Soft-delete canonico do profissional. */
  static async deleteProfessional(id: string): Promise<void> {
    return deleteProfessionalWithProfile(id);
  }

  /** Alternar favorito do profissional. */
  static async toggleFavorite(
    professionalId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const { data: existing } = await professionalDb
        .from<{ id: string }>("professional_favorites")
        .select("id")
        .eq("professional_id", professionalId)
        .eq("profile_id", userId)
        .single();

      if (existing) {
        await professionalDb
          .from<{ id: string }>("professional_favorites")
          .delete()
          .eq("id", existing.id);
        return false;
      }

      await professionalDb
        .from<{ professional_id: string; profile_id: string }>(
          "professional_favorites",
        )
        .insert({ professional_id: professionalId, profile_id: userId });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      throw new Error(`Erro ao favoritar: ${message}`);
    }
  }

  /** Obter estatisticas de um profissional. */
  static async getStats(professionalId: string): Promise<ProfessionalStats> {
    return professionalQueries.getStats(professionalId);
  }

  /** Obter contagem total de profissionais para administracao. */
  static async getTotalProfessionalsCount(): Promise<number> {
    return professionalQueries.getTotalProfessionalsCount();
  }

  /** Obter profissionais criados em um periodo. */
  static async getProfessionalsCreatedInPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return professionalQueries.getProfessionalsCreatedInPeriod(
      startDate,
      endDate,
    );
  }

  /** Obter avaliacoes de um profissional. */
  static async getReviews(
    professionalId: string,
  ): Promise<ProfessionalReview[]> {
    return professionalQueries.getReviews(professionalId);
  }

  /** Obter avaliacao do usuario. */
  static async getMyReview(
    professionalId: string,
    userId: string,
  ): Promise<ProfessionalReview | null> {
    return professionalQueries.getMyReview(professionalId, userId);
  }

  /** Criar ou atualizar avaliacao. */
  static async submitReview(
    professionalId: string,
    userId: string,
    rating: number,
    comment?: string,
  ): Promise<void> {
    try {
      const activeProfile = await profileService.getActiveProfile(userId);
      if (!activeProfile) {
        throw new Error("Perfil ativo nao encontrado");
      }

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
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      throw new Error(`Erro ao enviar avaliacao: ${message}`);
    }
  }

  /** Obter servicos de um profissional. */
  static async getJobs(professionalId: string): Promise<ProfessionalJob[]> {
    return professionalQueries.getJobs(professionalId);
  }

  /** Criar servico de um profissional. */
  static async createJob(
    professionalId: string,
    jobData: CreateProfessionalJobInput,
  ): Promise<ProfessionalJob> {
    return professionalMutations.createJob(professionalId, jobData);
  }

  /** Incrementar visualizacoes. */
  static async incrementViews(professionalId: string): Promise<void> {
    return professionalMutations.incrementViews(professionalId);
  }

  /** Buscar profissionais por IDs. */
  static async getProfessionalsByIds(ids: string[]): Promise<Professional[]> {
    return professionalQueries.getProfessionalsByIds(ids);
  }

  /** Busca global de profissionais. */
  static async searchProfessionals(
    query: string,
    filters: ProfessionalFilters = {},
  ): Promise<Professional[]> {
    return professionalQueries.searchProfessionals(query, filters);
  }

  /**
   * Atualizar disponibilidade administrativa usando exatamente o contrato do
   * owner de mutation; a facade nao aceita estados arbitrarios.
   */
  static async updateProfessionalStatus(
    id: string,
    status: AdminAvailabilityStatus,
  ): Promise<void> {
    return professionalMutations.updateProfessionalStatus(id, status);
  }

  /** Deletar avaliacao de profissional pela mutation canonica. */
  static async deleteProfessionalReview(reviewId: string): Promise<void> {
    return professionalMutations.deleteProfessionalReview(reviewId);
  }

  /** Buscar profissionais por IDs para superficies administrativas. */
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
      return (data || []).flatMap((professional) => {
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

  /** Busca perfil publico de profissional por slug + UF + cidade. */
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
    return professionalQueries.getProfessionalPublicProfileBySlug(
      slug,
      uf,
      cidade,
    );
  }

  /** Verifica se slug ja existe. */
  static async checkSlugExists(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    return professionalQueries.checkProfessionalSlugExists(slug, excludeId);
  }

  /** Busca slugs similares para sugestao. */
  static async getSimilarSlugs(
    slug: string,
    limit = PAGINATION.DEFAULT_LIMIT,
  ): Promise<string[]> {
    return professionalQueries.getProfessionalSimilarSlugs(slug, limit);
  }

  /** Busca historico de mudancas de slug. */
  static async getSlugHistory(professionalId: string): Promise<
    Array<{
      id: string;
      old_slug: string;
      new_slug: string | null;
      change_reason: string;
      created_at: string;
    }>
  > {
    return professionalQueries.getProfessionalSlugHistory(professionalId);
  }
}
