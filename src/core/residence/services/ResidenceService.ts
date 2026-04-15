// @ts-nocheck
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
}

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

      return data || [];
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

      return data || [];
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

      const payload: any = {
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
      const payload: any = {};

      // Modelo canônico
      if (data.address_id !== undefined) payload.address_id = data.address_id;
      if (data.location_id !== undefined) payload.location_id = data.location_id;
      if (data.country !== undefined) payload.country = data.country;
      if (data.is_primary !== undefined) payload.is_primary = data.is_primary;

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
      const { data, error } = await (supabase as any)
        .from("user_residences")
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
      const { error } = await (supabase as any)
        .from("user_residences")
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
}

export const residenceService = new ResidenceService();
