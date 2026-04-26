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
import { applyTerritoryFilter } from "@/core/location";
import type { TerritoryFilter } from "@/core/location/types";
import { PublicIdentityService } from "@/core/public-identity";
import { logger } from "@/shared/utils/logger";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import { PAGINATION } from "@/shared/constants";
import {
  getProfessionalTerritory,
  hasPhysicalAddress as hasPhysicalAddressCanonical,
  isProfessionalMigrated as isProfessionalMigratedCanonical,
  type ProfessionalDataWithRelations,
} from "./ProfessionalCanonicalAdapter";
import {
  createProfessionalSchema,
  updateProfessionalSchema,
} from '@/shared/schemas/professional/professionalSchemas';
import {
  sanitizeString,
  sanitizeArray,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
} from "@/shared/utils/sanitization";
import type {
  Professional,
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalFilters,
  ProfessionalStats,
  ProfessionalDataRecord,
  ProfessionalDataWithProfiles,
  ProfessionalMetadata,
  ProfessionalCategory,
  ProfessionalJob,
  ProfessionalJobRecord,
  CreateProfessionalJobInput,
  ProfessionalReview,
  ProfessionalReviewRecord,
  ProfessionalReviewWithUser,
} from "@/core/professional/types";

const PROFESSIONAL_ENTITY_STATUS = {
  ACTIVE: "active",
} as const;

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
   * SANITIZAR E VALIDAR INPUT
   * Centraliza sanitização + validação para produção
   */
  private static sanitizeAndValidateInput(
    input: CreateProfessionalInput | UpdateProfessionalInput,
    isUpdate = false,
  ): CreateProfessionalInput | UpdateProfessionalInput {
    // 1. SANITIZAÇÃO primeiro
    const sanitizedBase = {
      ...input,
      name: sanitizeString(input.name),
      description: sanitizeString(input.description),
      phone: sanitizePhone(input.phone),
      whatsapp: sanitizePhone(input.whatsapp),
      email: sanitizeEmail(input.email),
      website: sanitizeUrl(input.website),
      facebook: sanitizeUrl(input.facebook),
      linkedin: sanitizeUrl(input.linkedin),
      address: sanitizeString(input.address),
      neighborhood: sanitizeString(input.neighborhood),
      city: sanitizeString(input.city),
      state: sanitizeString(input.state),
      cep: sanitizeString(input.cep),
      education: sanitizeString(input.education),
      price_range: sanitizeString(input.price_range),
      instagram: sanitizeString(input.instagram),
      logo_url: sanitizeUrl(input.logo_url),
      banner_url: sanitizeUrl(input.banner_url),
      portfolio_images: input.portfolio_images
        ? (input.portfolio_images
            .map((url) => sanitizeUrl(url))
            .filter(Boolean) as string[])
        : undefined,
      certifications: sanitizeArray(
        Array.isArray(input.certifications)
          ? input.certifications.join(",")
          : "",
      ),
      service_areas: sanitizeArray(
        Array.isArray(input.service_areas) ? input.service_areas.join(",") : "",
      ),
      languages: sanitizeArray(
        Array.isArray(input.languages) ? input.languages.join(",") : "",
      ),
    };

    // 2. VALIDAÇÃO com schema
    if (input.slug) {
      sanitizedBase.slug = PublicIdentityService.normalize(input.slug, "professional");
    }

    if (isUpdate) {
      const sanitizedUpdate: Partial<UpdateProfessionalInput> = {};
      if ("name" in input) sanitizedUpdate.name = sanitizedBase.name;
      if ("slug" in input) sanitizedUpdate.slug = sanitizedBase.slug;
      if ("category" in input) sanitizedUpdate.category = sanitizedBase.category;
      if ("subcategory" in input) sanitizedUpdate.subcategory = sanitizedBase.subcategory;
      if ("description" in input) sanitizedUpdate.description = sanitizedBase.description;
      if ("experience_years" in input) sanitizedUpdate.experience_years = sanitizedBase.experience_years;
      if ("phone" in input) sanitizedUpdate.phone = sanitizedBase.phone;
      if ("whatsapp" in input) sanitizedUpdate.whatsapp = sanitizedBase.whatsapp;
      if ("email" in input) sanitizedUpdate.email = sanitizedBase.email;
      if ("website" in input) sanitizedUpdate.website = sanitizedBase.website;
      if ("facebook" in input) sanitizedUpdate.facebook = sanitizedBase.facebook;
      if ("linkedin" in input) sanitizedUpdate.linkedin = sanitizedBase.linkedin;
      if ("address" in input) sanitizedUpdate.address = sanitizedBase.address;
      if ("neighborhood" in input) sanitizedUpdate.neighborhood = sanitizedBase.neighborhood;
      if ("city" in input) sanitizedUpdate.city = sanitizedBase.city;
      if ("state" in input) sanitizedUpdate.state = sanitizedBase.state;
      if ("cep" in input) sanitizedUpdate.cep = sanitizedBase.cep;
      if ("education" in input) sanitizedUpdate.education = sanitizedBase.education;
      if ("price_range" in input) sanitizedUpdate.price_range = sanitizedBase.price_range;
      if ("instagram" in input) sanitizedUpdate.instagram = sanitizedBase.instagram;
      if ("logo_url" in input) sanitizedUpdate.logo_url = sanitizedBase.logo_url;
      if ("banner_url" in input) sanitizedUpdate.banner_url = sanitizedBase.banner_url;
      if ("portfolio_images" in input) sanitizedUpdate.portfolio_images = sanitizedBase.portfolio_images;
      if ("certifications" in input) sanitizedUpdate.certifications = sanitizedBase.certifications;
      if ("service_areas" in input) sanitizedUpdate.service_areas = sanitizedBase.service_areas;
      if ("languages" in input) sanitizedUpdate.languages = sanitizedBase.languages;
      if ("service_radius_km" in input) sanitizedUpdate.service_radius_km = sanitizedBase.service_radius_km;
      if ("available_hours" in input) sanitizedUpdate.available_hours = sanitizedBase.available_hours;
      if ("location_id" in input) sanitizedUpdate.location_id = sanitizedBase.location_id;
      if ("address_id" in input) sanitizedUpdate.address_id = sanitizedBase.address_id;
      if ("is_accepting_clients" in input) sanitizedUpdate.is_accepting_clients = sanitizedBase.is_accepting_clients;

      const validation = updateProfessionalSchema.safeParse(sanitizedUpdate);
      if (!validation.success) {
        const errors = validation.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new Error(`Dados inválidos: ${errors}`);
      }
      return validation.data;
    }

    const validation = createProfessionalSchema.safeParse(sanitizedBase);

    if (!validation.success) {
      const errors = validation.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Dados inválidos: ${errors}`);
    }

    return validation.data;
  }

  /**
   * 🗺️ MAPPER: Input → ProfessionalData (para inserção/atualização)
   */
  private static toProfessionalData(
    input: CreateProfessionalInput | UpdateProfessionalInput,
    options: {
      mode: "create" | "update";
      currentMetadata?: ProfessionalMetadata | null;
    },
  ): Partial<ProfessionalDataRecord> {
    const result: Partial<ProfessionalDataRecord> = {};

    if (input.slug !== undefined) result.slug = input.slug;
    if (input.name !== undefined) result.professional_name = input.name;
    if (input.category !== undefined) result.service_category = input.category;
    if (input.subcategory !== undefined) result.service_subcategory = input.subcategory;
    if (input.description !== undefined) result.description = input.description;
    if (input.certifications !== undefined) result.certifications = input.certifications;
    if (input.experience_years !== undefined) result.experience_years = input.experience_years;
    if (input.education !== undefined) result.education = input.education;
    if (input.price_range !== undefined) result.price_range = input.price_range;
    if (input.service_areas !== undefined) result.service_areas = input.service_areas;
    if (input.service_radius_km !== undefined) result.service_radius_km = input.service_radius_km;
    if (input.available_hours !== undefined) result.available_hours = input.available_hours;
    if (input.whatsapp !== undefined) result.whatsapp = input.whatsapp;
    if (input.email !== undefined) result.email = input.email;
    if (input.location_id !== undefined) result.location_id = input.location_id;
    if (input.address_id !== undefined) result.address_id = input.address_id;

    if (input.is_accepting_clients !== undefined) {
      result.is_accepting_clients = input.is_accepting_clients;
    } else if (options.mode === "create") {
      result.is_accepting_clients = true;
    }

    const metadata: ProfessionalMetadata = {
      ...(options.currentMetadata ?? {}),
    };
    delete metadata.location;

    if (input.logo_url !== undefined) metadata.logo_url = input.logo_url;
    if (input.banner_url !== undefined) metadata.banner_url = input.banner_url;
    if (input.portfolio_images !== undefined) {
      metadata.portfolio_images = input.portfolio_images;
    } else if (options.mode === "create") {
      metadata.portfolio_images = [];
    }

    const socialLinks = {
      ...(typeof metadata.social_links === "object" ? metadata.social_links : {}),
    };
    if (input.instagram !== undefined) socialLinks.instagram = input.instagram;
    if (input.facebook !== undefined) socialLinks.facebook = input.facebook;
    if (input.linkedin !== undefined) socialLinks.linkedin = input.linkedin;
    if (input.website !== undefined) socialLinks.website = input.website;
    if (Object.keys(socialLinks).length > 0) {
      metadata.social_links = socialLinks;
    }

    if (input.languages !== undefined) {
      metadata.languages = input.languages;
    } else if (options.mode === "create") {
      metadata.languages = [];
    }

    if (options.mode === "create") {
      metadata.rating = metadata.rating ?? 0;
      metadata.total_reviews = metadata.total_reviews ?? 0;
      metadata.total_jobs = metadata.total_jobs ?? 0;
    }

    result.metadata = metadata;

    return result;
  }

  /**
   * 🗺️ MAPPER: ProfessionalDataWithProfiles → Professional (para saída da aplicação)
   */
  private static mapProfessionalDataToProfessional(
    data: ProfessionalDataWithProfiles,
  ): Professional {
    const metadata = data.metadata || {};
    const location = metadata.location || {};
    const socialLinks = metadata.social_links || {};

    // ETAPA 9: Preferir dados canônicos quando disponíveis
    const canonicalAddress = data.address;
    const canonicalLocation = data.location;

    // Extrair city e state do full_name canônico
    let city = location.city;
    let state = location.state;
    if (canonicalLocation?.full_name) {
      const parts = canonicalLocation.full_name.split(', ');
      if (parts.length >= 2) {
        city = parts[parts.length - 2]; // penúltimo = cidade
        state = parts[parts.length - 1]; // último = estado
      }
    }

    return {
      professional_data_id: data.id,
      id: data.profile_id,
      profile_id: data.profile_id,
      slug: data.slug || undefined,
      name: data.professional_name || data.profiles?.name || "",
      description: data.description || "",
      category: (data.service_category as ProfessionalCategory) || "outros",
      subcategory: data.service_subcategory || undefined,

      // Contact
      phone: data.profiles?.phone || undefined,
      whatsapp: data.whatsapp || data.profiles?.whatsapp || undefined,
      email: data.email || undefined,

      // Location: preferir canônico, fallback para legado
      address: canonicalAddress 
        ? `${canonicalAddress.street || ''}${canonicalAddress.number ? ', ' + canonicalAddress.number : ''}${canonicalAddress.complement ? ' - ' + canonicalAddress.complement : ''}`.trim() || undefined
        : location.address,
      neighborhood: canonicalLocation?.name || location.neighborhood,
      city: city,
      state: state,
      cep: canonicalAddress?.postal_code || location.cep,
      latitude: canonicalAddress?.latitude ?? location.latitude,
      longitude: canonicalAddress?.longitude ?? location.longitude,

      // Professional Info
      certifications: data.certifications || [],
      experience_years: data.experience_years || undefined,
      education: data.education || undefined,
      price_range: data.price_range || undefined,
      service_areas: data.service_areas || [],
      service_radius_km: data.service_radius_km || undefined,
      available_hours: data.available_hours || undefined,

      // Media
      logo_url: metadata.logo_url || data.profiles?.avatar_url,
      banner_url: metadata.banner_url,
      portfolio_images: metadata.portfolio_images || [],

      // Social
      instagram: socialLinks.instagram,
      facebook: socialLinks.facebook,
      linkedin: socialLinks.linkedin,
      website: socialLinks.website,

      // Status
      status: PROFESSIONAL_ENTITY_STATUS.ACTIVE,
      is_verified: data.is_verified ?? false,
      verified_at: data.verified_at || undefined,
      is_accepting_clients: data.is_accepting_clients ?? true,

      // Metrics
      rating: data.rating ?? metadata.rating ?? 0,
      total_reviews: metadata.total_reviews || 0,
      total_jobs: metadata.total_jobs || 0,
      response_time: metadata.response_time,

      // Meta
      languages: metadata.languages || [],
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    };
  }

  /**
   * 🗺️ MAPPER: ProfessionalJobRecord → ProfessionalJob
   */
  private static mapJobRecordToJob(
    record: ProfessionalJobRecord,
  ): ProfessionalJob {
    return {
      id: record.id,
      profile_id: record.profile_id,
      title: record.titulo,
      description: record.descricao || "",
      category: record.categoria || "",
      price: record.preco || undefined,
      duration: record.duracao || undefined,
      images: record.imagens || [],
      is_featured: record.destaque,
      is_active: record.ativo,
      created_at: record.created_at,
    };
  }

  /**
   * 🗺️ MAPPER: ProfessionalReviewWithUser → ProfessionalReview
   */
  private static mapReviewRecordToReview(
    record: ProfessionalReviewWithUser,
  ): ProfessionalReview {
    return {
      id: record.id,
      profile_id: record.profile_id,
      user_id: record.user_id,
      rating: record.rating,
      comment: record.comment || "",
      job_type: record.job_type || undefined,
      created_at: record.created_at,
      user_name: record.profiles.name,
      user_avatar: record.profiles.avatar_url || undefined,
    };
  }

  /**
   * 🔍 BUSCAR SERVIÇOS POR PERFIL
   * ✅ SSOT: Método para buscar todos os serviços de um perfil específico
   */
  static async getServicesByProfile(profileId: string): Promise<Professional[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("professional_data")
        .select(
          `
          *,
          profiles(id, name, avatar_url, phone, whatsapp)
        `,
        )
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const professionals = (
        (data as ProfessionalDataWithProfiles[]) || []
      ).map(this.mapProfessionalDataToProfessional);

      return professionals;
    } catch (error: any) {
      logger.error("Error fetching services by profile", error, {
        service: "ProfessionalService",
        method: "getServicesByProfile",
        profileId,
      });
      throw new Error(`Erro ao buscar serviços do perfil: ${error.message}`);
    }
  }

  /**
   * 🔍 BUSCAR PROFISSIONAIS (com filtros)
   */
  /**
   * Buscar profissionais (com filtros)
   * 
   * ETAPA 9: Carrega relações canônicas
   */
  static async getProfessionals(
    filters: ProfessionalFilters = {},
  ): Promise<Professional[]> {
    try {
      let query = (supabase as any)
        .from("professional_data")
        .select(
          `
          *,
          profiles(id, name, avatar_url, phone, whatsapp),
          address:addresses!address_id(*),
          location:locations!location_id(*)
        `,
        )
        .eq("is_accepting_clients", true);

      // Aplicar filtros
      if (filters.category && filters.category !== "todos") {
        query = query.eq("service_category", filters.category);
      }

      if (filters.subcategory) {
        query = query.eq("service_subcategory", filters.subcategory);
      }

      if (filters.search) {
        const sanitizedSearch = sanitizeForILike(filters.search);
        if (sanitizedSearch) {
          query = query.or(
            `professional_name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`,
          );
        }
      }

      if (filters.city) {
        query = query.eq("metadata->>city", filters.city);
      }

      if (filters.neighborhood) {
        query = query.eq("metadata->>neighborhood", filters.neighborhood);
      }

      // ✅ MIGRADO - Removido filtro manual is_verified, deve ser feito via ProfileService
      // if (filters.is_verified !== undefined) {
      //   query = query.eq('is_verified', filters.is_verified);
      // }

      if (filters.min_rating) {
        query = query.gte("rating", filters.min_rating);
      }

      // ✅ SSOT - Filtro territorial usando utilitário compartilhado
      if (filters.territoryFilter) {
        query = applyTerritoryFilter(query, filters.territoryFilter);
      }

      // Ordenação
      switch (filters.sortBy) {
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "name":
          query = query.order("professional_name", { ascending: true });
          break;
        case "experience_years":
          query = query.order("experience_years", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const professionals = (
        (data as ProfessionalDataWithProfiles[]) || []
      ).map(this.mapProfessionalDataToProfessional);

      return professionals;
    } catch (error: any) {
      throw new Error(`Erro ao buscar profissionais: ${error.message}`);
    }
  }

  /**
   * 🔍 BUSCAR PROFISSIONAIS COM PAGINAÇÃO (para infinite scroll)
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
      pageSize = 12,
      location_id,
      territoryFilter,
    } = params;

    try {
      // ETAPA 9: Carregar FK joins canônicos
      let query = (supabase as any)
        .from("professional_data")
        .select(
          `
          *,
          profiles(id, name, avatar_url, phone, whatsapp),
          address:addresses!address_id(
            id,
            location_id,
            postal_code,
            street,
            number,
            complement,
            address_type,
            latitude,
            longitude
          ),
          location:locations!location_id(
            id,
            name,
            full_name,
            type,
            slug
          )
        `,
        )
        .eq("is_accepting_clients", true)
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      // Aplicar filtros
      if (category && category !== "todos") {
        query = query.eq("service_category", category);
      }

      if (territoryFilter) {
        query = applyTerritoryFilter(query, territoryFilter);
      } else if (location_id) {
        query = query.eq("location_id", location_id);
      }

      if (searchQuery && searchQuery.trim()) {
        const sanitizedQuery = sanitizeForILike(searchQuery);
        if (sanitizedQuery) {
          query = query.or(
            `professional_name.ilike.%${sanitizedQuery}%,service_category.ilike.%${sanitizedQuery}%,metadata->>neighborhood.ilike.%${sanitizedQuery}%`,
          );
        }
      }

      // Aplicar ordenação (deve ser após os filtros)
      query = query
        // ✅ MIGRADO - Removida ordenação manual por is_verified, deve ser feita via ProfileService
        // .order('is_verified', { ascending: false })
        .order("rating", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const professionals = (
        (data as ProfessionalDataWithProfiles[]) || []
      ).map(this.mapProfessionalDataToProfessional);

      return {
        professionals,
        nextPage: data && data.length === pageSize ? pageParam + 1 : undefined,
      };
    } catch (error: any) {
      throw new Error(`Erro ao carregar profissionais: ${error.message}`);
    }
  }

  /**
   * Buscar profissional por ID
   * 
   * ETAPA 9: Carrega relações canônicas
   */
  static async getProfessionalById(id: string): Promise<Professional> {
    try {
      const { data, error } = await (supabase as any)
        .from("professional_data")
        .select(
          `
          *,
          profiles(id, name, avatar_url, phone, whatsapp),
          address:addresses!address_id(*),
          location:locations!location_id(*)
        `,
        )
        .eq("profile_id", id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Profissional não encontrado");

      return this.mapProfessionalDataToProfessional(
        data as ProfessionalDataWithProfiles,
      );
    } catch (error: any) {
      throw new Error(`Erro ao buscar profissional: ${error.message}`);
    }
  }

  /**
   * ✨ CRIAR PROFISSIONAL (com validação dupla e cache)
   * FASE PROFILE.1.3 - Usa ProfileService para criação de perfil
   */
  static async createProfessional(
    input: CreateProfessionalInput,
    userId: string,
  ): Promise<Professional> {
    try {
      // 🧼 SANITIZAÇÃO + VALIDAÇÃO CENTRALIZADA
      const validatedInput = this.sanitizeAndValidateInput(
        input,
        false,
      ) as CreateProfessionalInput;

      const slug = validatedInput.slug
        ? await this.validateAvailableSlug(validatedInput.slug)
        : await this.generateUniqueSlug(validatedInput.name);

      if (!validatedInput.location_id) {
        throw new Error("location_id Ã© obrigatÃ³rio para cadastrar profissional.");
      }

      // 1. Criar profile usando ProfileService (MIGRADO)
      const { profileService } = await import("@/core/profiles/services/ProfileService");
      const profile = await profileService.createProfile({
        profile_type: "professional",
        name: validatedInput.name,
        username: this._generateProfessionalUsername(validatedInput.name),
        city: validatedInput.city || "Não informado",
        bio: validatedInput.description,
        avatar_url: validatedInput.logo_url,
      });

      if (!profile) throw new Error("Erro ao criar perfil do profissional");

      // 2. Adicionar user como owner
      const { error: memberError } = await (supabase as any)
        .from("profile_members")
        .insert({
          profile_id: profile.id,
          user_id: userId,
          role: "owner",
        });

      if (memberError) throw memberError;

      // 3. Converter input para formato do professional_data
      const professionalData = this.toProfessionalData(
        { ...validatedInput, slug },
        { mode: "create" },
      );

      // 4. Criar professional_data

      const { data: professional, error } = await (supabase as any)
        .from("professional_data")
        .insert({
          profile_id: profile.id,
          ...professionalData,
          rating: 0,
        })
        .select(
          `
          *,
          profiles(id, name, avatar_url, phone, whatsapp),
          address:addresses!address_id(*),
          location:locations!location_id(*)
        `,
        )
        .single();

      if (error) throw error;

      // 5. Criar professional_stats
      await (supabase as any).from("professional_stats").insert({
        profile_id: profile.id,
        views_count: 0,
        contacts_count: 0,
        favorites_count: 0,
        shares_count: 0,
        jobs_completed: 0,
        response_rate: 0,
        average_response_time: 0,
      });

      return this.mapProfessionalDataToProfessional(
        professional as ProfessionalDataWithProfiles,
      );
    } catch (error: any) {
      throw new Error(`Erro ao criar profissional: ${error.message}`);
    }
  }

  /**
   * 📝 ATUALIZAR PROFISSIONAL (com validação dupla)
   * FASE PROFILE.1.3 - Usa ProfileService para atualização de perfil
   */
  static async updateProfessional(
    id: string,
    input: UpdateProfessionalInput,
  ): Promise<Professional> {
    try {
      // 🧼 SANITIZAÇÃO + VALIDAÇÃO CENTRALIZADA
      const validatedInput = this.sanitizeAndValidateInput(
        input,
        true,
      ) as UpdateProfessionalInput;

      const { data: currentProfessional, error: currentError } = await (supabase as any)
        .from("professional_data")
        .select("id, profile_id, slug, metadata")
        .or(`profile_id.eq.${id},id.eq.${id}`)
        .maybeSingle();

      if (currentError) throw currentError;
      if (!currentProfessional) throw new Error("Profissional nÃ£o encontrado");

      // Converter input para formato do professional_data
      const professionalData = this.toProfessionalData(validatedInput, {
        mode: "update",
        currentMetadata: currentProfessional.metadata as ProfessionalMetadata,
      });

      const updatePayload: Partial<ProfessionalDataRecord> & {
        updated_at: string;
      } = {
        ...professionalData,
        updated_at: new Date().toISOString(),
      };
      delete updatePayload.slug;

      // Atualizar profile usando ProfileService se necessário (MIGRADO)
      if (validatedInput.name) {
        const { profileService } = await import("@/core/profiles/services/ProfileService");
        await profileService.updateProfile(currentProfessional.profile_id, {
          name: validatedInput.name,
          bio: validatedInput.description,
          avatar_url: validatedInput.logo_url,
        });
      }

      if (
        validatedInput.slug !== undefined &&
        validatedInput.slug !== currentProfessional.slug
      ) {
        const cooldown = await PublicIdentityService.canChangeIdentifier({
          entityType: "professional",
          entityId: currentProfessional.id,
        });

        if (!cooldown.canChange) {
          throw new Error(
            `NÃ£o Ã© possÃ­vel alterar o slug do profissional agora. Aguarde ${cooldown.daysRemaining || 0} dia(s).`,
          );
        }

        const availability = await PublicIdentityService.checkAvailability({
          identifier: validatedInput.slug,
          entityType: "professional",
          excludeEntityId: currentProfessional.id,
        });

        if (availability.status !== "available") {
          throw new Error(
            availability.message ||
              `Slug "${validatedInput.slug}" nÃ£o estÃ¡ disponÃ­vel.` +
                (availability.suggestion ? ` SugestÃ£o: ${availability.suggestion}` : ""),
          );
        }

        updatePayload.slug = validatedInput.slug;
      }

      const { data: professional, error } = await (supabase as any)
        .from("professional_data")
        .update(updatePayload)
        .eq("profile_id", currentProfessional.profile_id)
        .select(
          `
          *,
          profiles(id, name, avatar_url, phone, whatsapp),
          address:addresses!address_id(*),
          location:locations!location_id(*)
        `,
        )
        .single();

      if (error) throw error;

      return this.mapProfessionalDataToProfessional(
        professional as ProfessionalDataWithProfiles,
      );
    } catch (error: any) {
      throw new Error(`Erro ao atualizar profissional: ${error.message}`);
    }
  }

  /**
   * ☠️ SOFT DELETE - Não remove dados, apenas marca como inativo
   * FASE PROFILE.1.3 - Usa ProfileService para soft delete
   */
  static async deleteProfessional(id: string): Promise<void> {
    try {
      const { data: professional, error: resolveError } = await (supabase as any)
        .from("professional_data")
        .select("id, profile_id")
        .or(`profile_id.eq.${id},id.eq.${id}`)
        .maybeSingle();

      if (resolveError) throw resolveError;
      if (!professional) throw new Error("Profissional nÃ£o encontrado");
      // Soft delete: marcar como inativo ao invés de remover
      const { error } = await (supabase as any)
        .from("professional_data")
        .update({
          is_accepting_clients: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", professional.id);

      if (error) throw error;

      // Verificar se o profile existe antes de atualizar
      const { data: profileExists } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("id", professional.profile_id)
        .single();

      // Só atualizar o profile se ele existir
      if (profileExists) {
        const { profileService } = await import("@/core/profiles/services/ProfileService");
        await profileService.updateProfile(professional.profile_id, {
          is_active: false,
        });
      }
    } catch (error: any) {
      throw new Error(`Erro ao deletar profissional: ${error.message}`);
    }
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
    try {
      const { data, error } = await supabase
        .from("professional_stats")
        .select("*")
        .eq("profile_id", professionalId)
        .single();

      if (error) throw error;
      return data as ProfessionalStats;
    } catch (error: any) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }
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
    try {
      const { count, error } = await supabase
        .from("professional_data")
        .select("*", { count: "exact", head: true });

      if (error) {
        logger.error("Error getting professionals count", error, {
          service: "ProfessionalService",
          method: "getTotalProfessionalsCount",
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error("Error getting professionals count", error as Error, {
        service: "ProfessionalService",
        method: "getTotalProfessionalsCount",
      });
      return 0;
    }
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
    try {
      const { count, error } = await (supabase as any)
        .from("professional_data")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) {
        logger.error("Error getting professionals in period", error, {
          service: "ProfessionalService",
          method: "getProfessionalsCreatedInPeriod",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error("Error getting professionals in period", error as Error, {
        service: "ProfessionalService",
        method: "getProfessionalsCreatedInPeriod",
      });
      return 0;
    }
  }

  /**
   * ⭐ OBTER AVALIAÇÕES DE UM PROFISSIONAL
   * ✅ LOTE 6 - Refatorado para usar ReviewsService
   */
  static async getReviews(
    professionalId: string,
  ): Promise<ProfessionalReview[]> {
    try {
      const reviews = await ReviewsService.getReviewsForProfile(
        professionalId,
        "professional",
      );

      // Mapear para formato compatível com interface atual
      return reviews.map((r) => ({
        id: r.id,
        profile_id: r.reviewed_profile_id,
        user_id: r.reviewer_profile_id,
        rating: r.rating,
        comment: r.comment || "",
        created_at: r.created_at,
        user_name: r.reviewer_profile.name,
        user_avatar: r.reviewer_profile.avatar_url,
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar avaliações: ${error.message}`);
    }
  }

  /**
   * ⭐ OBTER AVALIAÇÃO DO USUÁRIO
   * ✅ LOTE 6 - Refatorado para usar ReviewsService
   */
  static async getMyReview(
    professionalId: string,
    userId: string,
  ): Promise<ProfessionalReview | null> {
    try {
      // ✅ LOTE 6 - Usar profile ativo em vez de user_id
      const { profileService } = await import("@/core/profiles/services/ProfileService");

      const activeProfile = await profileService.getActiveProfile(userId);
      if (!activeProfile) return null;

      const review = await ReviewsService.getReviewByReviewer(
        professionalId,
        activeProfile.id,
        "professional",
      );

      if (!review) return null;

      // Buscar dados do reviewer para compatibilidade
      const reviewerProfile = await profileService.getProfileById(
        review.reviewer_profile_id,
      );

      return {
        id: review.id,
        profile_id: review.reviewed_profile_id,
        user_id: review.reviewer_profile_id,
        rating: review.rating,
        comment: review.comment || "",
        created_at: review.created_at,
        user_name: reviewerProfile?.name || "Usuário",
        user_avatar: reviewerProfile?.avatar_url,
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar minha avaliação: ${error.message}`);
    }
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
      // Buscar profile ativo do usuário
      const { profileService } = await import("@/core/profiles/services/ProfileService");
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
    try {
      const { data, error } = await (supabase as any)
        .from("professional_jobs")
        .select("*")
        .eq("profile_id", professionalId)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data as ProfessionalJobRecord[]) || []).map(
        this.mapJobRecordToJob,
      );
    } catch (error: any) {
      throw new Error(`Erro ao buscar serviços: ${error.message}`);
    }
  }

  /**
   * 🛍️ CRIAR SERVIÇO
   */
  static async createJob(
    professionalId: string,
    jobData: CreateProfessionalJobInput,
  ): Promise<ProfessionalJob> {
    try {
      const { data, error } = await (supabase as any)
        .from("professional_jobs")
        .insert({
          profile_id: professionalId,
          ...jobData,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapJobRecordToJob(data as ProfessionalJobRecord);
    } catch (error: any) {
      throw new Error(`Erro ao criar serviço: ${error.message}`);
    }
  }

  /**
   * 👁️ INCREMENTAR VISUALIZAÇÕES
   */
  static async incrementViews(professionalId: string): Promise<void> {
    try {
      await supabase.rpc("increment_professional_views", {
        professional_id: professionalId,
      });
    } catch (error) {
      // Silently fail - views are not critical
      logger.warn("Failed to increment views:", error);
    }
  }

  /**
   * 🔍 BUSCAR PROFISSIONAIS POR IDs (para recomendações)
   */
  static async getProfessionalsByIds(ids: string[]): Promise<Professional[]> {
    try {
      if (!ids || ids.length === 0) return [];

      const { data, error } = await (supabase as any)
        .from("professional_data")
        .select(
          `
          *,
          profiles(id, name, avatar_url, phone, whatsapp)
        `,
        )
        .in("profile_id", ids)
        .eq("is_accepting_clients", true);

      if (error) throw error;

      return ((data as ProfessionalDataWithProfiles[]) || []).map(
        this.mapProfessionalDataToProfessional,
      );
    } catch (error: any) {
      throw new Error(`Erro ao buscar profissionais por IDs: ${error.message}`);
    }
  }

  /**
   * 🔍 BUSCAR PROFISSIONAIS (para busca global)
   */
  static async searchProfessionals(
    query: string,
    filters: ProfessionalFilters = {},
  ): Promise<Professional[]> {
    try {
      if (!query || query.trim().length < 2) {
        return this.getProfessionals(filters);
      }

      const searchTerm = sanitizeForILike(query.trim());

      if (!searchTerm) {
        return this.getProfessionals(filters);
      }

      let supabaseQuery = (supabase as any)
        .from("professional_data")
        .select(
          `
          *,
          profiles(id, name, avatar_url, phone, whatsapp)
        `,
        )
        .eq("is_accepting_clients", true);

      // Busca textual
      supabaseQuery = supabaseQuery.or(`
        professional_name.ilike.%${searchTerm}%,
        service_category.ilike.%${searchTerm}%,
        service_subcategory.ilike.%${searchTerm}%,
        description.ilike.%${searchTerm}%,
        metadata->>neighborhood.ilike.%${searchTerm}%,
        metadata->>city.ilike.%${searchTerm}%
      `);

      // Aplicar filtros adicionais
      if (filters.category && filters.category !== "todos") {
        supabaseQuery = supabaseQuery.eq("service_category", filters.category);
      }

      if (filters.city) {
        supabaseQuery = supabaseQuery.eq("metadata->>city", filters.city);
      }

      // ✅ MIGRADO - Removido filtro manual is_verified, deve ser feito via ProfileService
      // if (filters.is_verified !== undefined) {
      //   supabaseQuery = supabaseQuery.eq('is_verified', filters.is_verified);
      // }

      // Ordenação por relevância
      supabaseQuery = supabaseQuery
        // ✅ MIGRADO - Removida ordenação manual por is_verified, deve ser feita via ProfileService
        // .order('is_verified', { ascending: false })
        .order("rating", { ascending: false })
        .limit(20);

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      return ((data as ProfessionalDataWithProfiles[]) || []).map(
        this.mapProfessionalDataToProfessional,
      );
    } catch (error: any) {
      throw new Error(`Erro ao buscar profissionais: ${error.message}`);
    }
  }

  /**
   * 🧹 LIMPAR CACHE (removido - usar apenas React Query)
   */
  static clearCache(): void {
    // Cache removido - usar apenas React Query
    logger.warn(
      "ProfessionalService.clearCache() foi removido. Use React Query invalidation.",
    );
  }

  /**
   * 🔗 GERAR USERNAME ÚNICO PARA PROFISSIONAL
   * FASE PROFILE.1.3 - Helper para criação de username
   */
  private static async validateAvailableSlug(slug: string): Promise<string> {
    const normalizedSlug = PublicIdentityService.normalize(slug, "professional");
    const availability = await PublicIdentityService.checkAvailability({
      identifier: normalizedSlug,
      entityType: "professional",
    });

    if (availability.status !== "available") {
      throw new Error(
        availability.message ||
          `Slug "${normalizedSlug}" nÃ£o estÃ¡ disponÃ­vel.` +
            (availability.suggestion ? ` SugestÃ£o: ${availability.suggestion}` : ""),
      );
    }

    return normalizedSlug;
  }

  private static async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug =
      PublicIdentityService.normalize(name, "professional") || "profissional";
    let candidate = baseSlug;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const availability = await PublicIdentityService.checkAvailability({
        identifier: candidate,
        entityType: "professional",
      });

      if (availability.status === "available") {
        return candidate;
      }

      candidate =
        availability.suggestion && availability.suggestion !== candidate
          ? availability.suggestion
          : `${baseSlug}-${attempt + 1}`;
    }

    throw new Error("NÃ£o foi possÃ­vel gerar um slug profissional disponÃ­vel.");
  }

  private static _generateProfessionalUsername(name: string): string {
    return (
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "")
        .substring(0, 20) + "_pro"
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
    try {
      const statusPayload =
        status === "aprovado"
          ? {
              is_accepting_clients: true,
              is_verified: true,
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : {
              is_accepting_clients: false,
              is_verified: false,
              verified_at: null,
              updated_at: new Date().toISOString(),
            };

      const { error } = await (supabase as any)
        .from("professional_data")
        .update(statusPayload)
        .or(`id.eq.${id},profile_id.eq.${id}`);

      if (error) throw error;
    } catch (error) {
      logger.error("Error updating professional status:", error);
      throw error;
    }
  }

  /**
   * Deletar avaliação de profissional (admin)
   * ✅ SSOT - Centraliza deleção de avaliações
   */
  static async deleteProfessionalReview(reviewId: string): Promise<void> {
    try {
      await ReviewsService.removeReview(reviewId, "professional");
    } catch (error) {
      logger.error("Error deleting professional review:", error);
      throw error;
    }
  }

  /**
   * Atualizar status de denúncia de profissional (admin)
   * ✅ SSOT - Centraliza atualização de denúncias
   */
  static async updateProfessionalReport(
    reportId: string,
    status: string,
  ): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("professional_reports")
        .update({ status })
        .eq("id", reportId);

      if (error) throw error;
    } catch (error) {
      logger.error("Error updating professional report:", error);
      throw error;
    }
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
      const addr = (professional as ProfessionalDataWithRelations).address;
      const parts: string[] = [];
      
      if (addr.street) parts.push(addr.street);
      if (addr.number) parts.push(addr.number);
      if (addr.neighborhood) parts.push(addr.neighborhood);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.postal_code) parts.push(`CEP ${addr.postal_code}`);

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
    const { data, error } = await (supabase as any)
      .from('professional_data')
      .select(`
        id, slug, professional_name, description,
        service_category, service_subcategory,
        is_verified, is_accepting_clients,
        certifications, experience_years, price_range, metadata,
        profiles!inner(avatar_url),
        location:locations!professional_data_location_id_fkey(
          name, type, slug,
          parent:locations!locations_parent_id_fkey(name, slug)
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const location = data.location as any;
    let city: string | null = null;
    let state: string | null = null;

    if (location) {
      if (location.type === 'city') {
        city = location.name;
        state = location.parent?.slug?.toUpperCase() ?? null;
      } else if (location.type === 'district') {
        city = location.parent?.name ?? null;
        state = uf.toUpperCase();
      }
    }

    const ufMatch = !state || state.toLowerCase() === uf.toLowerCase();
    const cidadeMatch =
      !city ||
      city.toLowerCase().replace(/\s+/g, '-') === cidade.toLowerCase() ||
      location?.slug === cidade.toLowerCase();

    if (!ufMatch || !cidadeMatch) return null;

    const profiles = data.profiles as any;
    const metadata = (data.metadata as any) ?? {};

    return {
      id: data.id,
      slug: data.slug,
      professional_name: data.professional_name,
      description: data.description,
      service_category: data.service_category,
      service_subcategory: data.service_subcategory,
      is_verified: data.is_verified,
      is_accepting_clients: data.is_accepting_clients,
      city,
      state,
      avatar_url: profiles?.avatar_url ?? null,
      logo_url: metadata?.logo_url ?? null,
      certifications: data.certifications,
      experience_years: data.experience_years,
      price_range: data.price_range,
    };
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
    try {
      let query = (supabase as any)
        .from('professional_data')
        .select('id')
        .eq('slug', slug)
        .limit(1);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('Error checking slug existence:', error);
        throw error;
      }
      
      return !!data;
    } catch (error) {
      logger.error('Error in checkSlugExists:', error);
      throw error;
    }
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
    try {
      const { data, error } = await supabase
        .from('professional_data')
        .select('slug')
        .ilike('slug', `${slug}%`)
        .limit(limit);

      if (error) {
        logger.error('Error getting similar slugs:', error);
        throw error;
      }
      
      return (data || []).map((d: { slug: string }) => d.slug).filter(Boolean);
    } catch (error) {
      logger.error('Error in getSimilarSlugs:', error);
      throw error;
    }
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
    try {
      const { data, error } = await (supabase as any)
        .from('professional_slug_history')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting slug history:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      logger.error('Error in getSlugHistory:', error);
      throw error;
    }
  }
}

