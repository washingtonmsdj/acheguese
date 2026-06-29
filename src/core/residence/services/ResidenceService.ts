/**
 * Residence Service
 *
 * Handles user residence management
 * Moved from UI component to follow architecture rules
 * 
 * MODELO CANÔNICO (ETAPA 12 - FINAL):
 * - address_id: FK para addresses (SSOT de endereços) — OBRIGATÓRIO
 * - location_id: FK para locations (território oficial) — OBRIGATÓRIO
 * 
 * CAMPOS LEGADOS REMOVIDOS NA ETAPA 12:
 * - street, number, complement, neighborhood, city, state, postal_code
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { Address } from '@/core/address/types';
import type { Location } from '@/core/location/types';

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  select(columns?: string): QueryBuilder<TRow>;
  insert(values: unknown): QueryBuilder<TRow>;
  update(values: unknown): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  in(column: string, values: readonly unknown[]): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  single(): QueryResult<TRow>;
  then<TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: TRow[]; error: { code?: string; message?: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface ResidenceDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

const residenceDb = supabase as unknown as ResidenceDbClient;

export interface UserResidence {
  id: string;
  user_id: string;
  
  // Modelo canônico (ETAPA 12: obrigatórios)
  address_id: string;
  location_id: string;
  
  country: string;
  
  is_primary: boolean;
  is_verified: boolean;
  verification_requested_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserResidenceWithRelations extends UserResidence {
  address: Address;
  location: Location;
}

export interface CreateResidenceData {
  user_id: string;
  
  // Modelo canônico (ETAPA 12: obrigatórios)
  address_id: string;
  location_id: string;
  
  country?: string;
  is_primary?: boolean;
}

export interface UpdateResidenceData {
  // Modelo canônico
  address_id?: string;
  location_id?: string;
  country?: string;
  is_primary?: boolean;
  is_verified?: boolean;
  verification_requested_at?: string | null;
}

export interface EnqueueTerritoryResolutionReviewInput {
  userId: string;
  source: string;
  reviewStatus: "needs_review" | "unresolved";
  reviewReason?: string | null;
  rawState?: string | null;
  rawCity?: string | null;
  rawNeighborhood?: string | null;
  postalCode?: string | null;
  ibgeCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  canonicalStateId?: string | null;
  canonicalCityId?: string | null;
  canonicalDistrictId?: string | null;
  payload?: Record<string, unknown>;
}

type UserResidenceRow = UserResidence;
type CreateResidenceInsert = Pick<
  UserResidenceRow,
  "user_id" | "address_id" | "location_id" | "country" | "is_primary"
>;
type TerritoryResolutionQueueInsert = {
  user_id: string;
  source: string;
  review_status: "needs_review" | "unresolved";
  review_reason: string | null;
  raw_state: string | null;
  raw_city: string | null;
  raw_neighborhood: string | null;
  postal_code: string | null;
  ibge_code: string | null;
  latitude: number | null;
  longitude: number | null;
  canonical_state_id: string | null;
  canonical_city_id: string | null;
  canonical_district_id: string | null;
  payload: Record<string, unknown>;
};

class ResidenceService {
  /**
   * Buscar residências do usuário
   */
  async getUserResidences(userId: string): Promise<UserResidence[]> {
    try {
      const { data, error } = await supabase
        .from("user_residences")
        .select("*")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false });

      if (error) {
        logger.error("Error fetching user residences:", error);
        throw new Error("Failed to fetch user residences");
      }

      return ((data ?? []) as unknown) as UserResidence[];
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "getUserResidences",
        metadata: { userId },
      });
      throw error;
    }
  }

  /**
   * Buscar residências com relações (address, location)
   * 
   * ETAPA 12: Sempre carrega relações canônicas (obrigatórias)
   */
  async getUserResidencesWithRelations(userId: string): Promise<UserResidenceWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from("user_residences")
        .select(`
          *,
          address:addresses!address_id(*),
          location:locations!location_id(*)
        `)
        .eq("user_id", userId)
        .order("is_primary", { ascending: false });

      if (error) {
        logger.error("Error fetching user residences with relations:", error);
        throw new Error("Failed to fetch user residences with relations");
      }

      return ((data ?? []) as unknown) as UserResidenceWithRelations[];
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "getUserResidencesWithRelations",
        metadata: { userId },
      });
      throw error;
    }
  }

  /**
   * Verificar se residência está migrada
   * ETAPA 12: Sempre true (campos canônicos obrigatórios)
   */
  isMigrated(residence: UserResidence): boolean {
    return true; // Sempre migrado após ETAPA 12
  }

  /**
   * Obter endereço formatado (apenas canônico)
   * ETAPA 12: Sem fallback legado
   */
  getFormattedAddress(residence: UserResidenceWithRelations): string {
    const addr = residence.address;
    const parts: string[] = [];
    
    if (addr.street) parts.push(addr.street);
    if (addr.number) parts.push(addr.number);
    if (addr.complement) parts.push(addr.complement);
    if (addr.postal_code) parts.push(`CEP ${addr.postal_code}`);
    
    return parts.join(', ') || 'Endereço não disponível';
  }

  /**
   * Obter coordenadas (apenas canônico)
   * ETAPA 12: Sem fallback legado
   */
  getCoordinates(residence: UserResidenceWithRelations): { latitude: number; longitude: number } | null {
    const addr = residence.address;
    if (addr.latitude && addr.longitude) {
      return {
        latitude: addr.latitude,
        longitude: addr.longitude,
      };
    }
    return null;
  }

  /**
   * Obter território (apenas canônico)
   * ETAPA 12: Sempre presente
   */
  getTerritory(residence: UserResidence): string {
    return residence.location_id;
  }

  /**
   * Obter nome do território (apenas canônico)
   * ETAPA 12: Sem fallback legado
   */
  getTerritoryName(residence: UserResidenceWithRelations): string {
    return residence.location.name;
  }

  /**
   * Criar nova residência
   * 
   * ETAPA 12: Apenas modelo canônico (address_id + location_id obrigatórios)
   */
  async createResidence(data: CreateResidenceData): Promise<UserResidence> {
    try {
      // Validar campos obrigatórios
      if (!data.address_id || !data.location_id) {
        throw new Error('address_id e location_id são obrigatórios após ETAPA 12');
      }

      const payload: CreateResidenceInsert = {
        user_id: data.user_id,
        address_id: data.address_id,
        location_id: data.location_id,
        country: data.country || 'Brasil',
        is_primary: data.is_primary ?? true,
      };

      const { data: residence, error } = await supabase
        .from("user_residences")
        .insert([payload])
        .select()
        .single();

      if (error) {
        logger.error("Error creating residence:", error);
        throw new Error("Failed to create residence");
      }

      return residence;
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "createResidence",
      });
      throw error;
    }
  }

  /**
   * Atualizar residência
   * 
   * ETAPA 12: Apenas modelo canônico (sem campos legados)
   */
  async updateResidence(
    id: string,
    data: UpdateResidenceData,
  ): Promise<UserResidence> {
    try {
      const payload: Partial<UserResidenceRow> = {};

      // Modelo canônico
      if (data.address_id !== undefined) payload.address_id = data.address_id;
      if (data.location_id !== undefined) payload.location_id = data.location_id;
      if (data.country !== undefined) payload.country = data.country;
      if (data.is_primary !== undefined) payload.is_primary = data.is_primary;
      if (data.is_verified !== undefined) payload.is_verified = data.is_verified;
      if (data.verification_requested_at !== undefined) {
        payload.verification_requested_at = data.verification_requested_at;
      }

      const { data: residence, error } = await supabase
        .from("user_residences")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating residence:", error);
        throw new Error("Failed to update residence");
      }

      return residence;
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "updateResidence",
        metadata: { id },
      });
      throw error;
    }
  }

  async deleteResidence(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_residences")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Error deleting residence:", error);
        throw new Error("Failed to delete residence");
      }
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "deleteResidence",
        metadata: { id },
      });
      throw error;
    }
  }

  async setPrimaryResidence(
    userId: string,
    residenceId: string,
  ): Promise<void> {
    try {
      // First, unset all primary residences for this user
      await supabase
        .from("user_residences")
        .update({ is_primary: false })
        .eq("user_id", userId);

      // Then set the new primary residence
      const { error } = await supabase
        .from("user_residences")
        .update({ is_primary: true })
        .eq("id", residenceId);

      if (error) {
        logger.error("Error setting primary residence:", error);
        throw new Error("Failed to set primary residence");
      }
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "setPrimaryResidence",
        metadata: { userId, residenceId },
      });
      throw error;
    }
  }

  async getPrimaryResidence(userId: string): Promise<UserResidence | null> {
    try {
      const { data, error } = await supabase
        .from("user_residences")
        .select("*")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .maybeSingle();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }

  async countPrimaryResidencesByLocationIds(locationIds: string[]): Promise<Map<string, number>> {
    const normalizedIds = [...new Set(locationIds.filter(Boolean))];
    if (!normalizedIds.length) {
      return new Map<string, number>();
    }

    try {
      const { data, error } = await supabase
        .from("user_residences")
        .select("location_id")
        .eq("is_primary", true)
        .in("location_id", normalizedIds);

      if (error) {
        throw error;
      }

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const locationId = row.location_id as string | null;
        if (!locationId) continue;
        counts.set(locationId, (counts.get(locationId) ?? 0) + 1);
      }
      return counts;
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "countPrimaryResidencesByLocationIds",
        metadata: { locationCount: normalizedIds.length },
      });
      return new Map<string, number>();
    }
  }

  async getPrimaryResidenceWithRelations(
    userId: string,
  ): Promise<UserResidenceWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from("user_residences")
        .select(`
          *,
          address:addresses!address_id(*),
          location:locations!location_id(*)
        `)
        .eq("user_id", userId)
        .eq("is_primary", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        logger.error("Error fetching primary residence with relations:", error);
        throw new Error("Failed to fetch primary residence with relations");
      }

      return (data as UserResidenceWithRelations | null) ?? null;
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "getPrimaryResidenceWithRelations",
        metadata: { userId },
      });
      return null;
    }
  }

  async getUserResidence(userId: string): Promise<UserResidence | null> {
    try {
      const { data, error } = await residenceDb
        .from<UserResidenceRow>("user_residences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        logger.error("Error fetching user residence:", error);
        throw new Error("Failed to fetch user residence");
      }

      return data;
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "getUserResidence",
        metadata: { userId },
      });
      throw error;
    }
  }

  async requestVerification(residenceId: string): Promise<void> {
    try {
      const { error } = await residenceDb
        .from<UserResidenceRow>("user_residences")
        .update({ verification_requested_at: new Date().toISOString() })
        .eq("id", residenceId);

      if (error) {
        logger.error("Error requesting verification:", error);
        throw new Error("Failed to request verification");
      }
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "requestVerification",
        metadata: { residenceId },
      });
      throw error;
    }
  }

  async enqueueTerritoryResolutionReview(
    input: EnqueueTerritoryResolutionReviewInput,
  ): Promise<void> {
    try {
      const payload: TerritoryResolutionQueueInsert = {
        user_id: input.userId,
        source: input.source,
        review_status: input.reviewStatus,
        review_reason: input.reviewReason ?? "auto_reconciliation_requires_review",
        raw_state: input.rawState ?? null,
        raw_city: input.rawCity ?? null,
        raw_neighborhood: input.rawNeighborhood ?? null,
        postal_code: input.postalCode ?? null,
        ibge_code: input.ibgeCode ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        canonical_state_id: input.canonicalStateId ?? null,
        canonical_city_id: input.canonicalCityId ?? null,
        canonical_district_id: input.canonicalDistrictId ?? null,
        payload: input.payload ?? {},
      };

      const { error } = await residenceDb
        .from<TerritoryResolutionQueueInsert>("territory_resolution_queue")
        .insert(payload);

      if (error) {
        throw error;
      }
    } catch (error) {
      trackError(error, {
        component: "ResidenceService",
        action: "enqueueTerritoryResolutionReview",
        metadata: {
          source: input.source,
          reviewStatus: input.reviewStatus,
        },
      });
      throw error;
    }
  }
}

export const residenceService = new ResidenceService();
