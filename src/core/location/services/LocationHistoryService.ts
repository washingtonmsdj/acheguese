/**
 * LocationService - SSOT para localização e áreas de serviço
 *
 * Responsável por:
 * - Histórico de localização GPS
 * - Residências de usuários
 * - Áreas de serviço de profissionais
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { residenceService } from "@/core/residence/services/ResidenceService";
import { serviceAreasService } from "@/core/service-areas/services/ServiceAreasService";

export interface LocationHistory {
  id: string;
  profile_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  created_at: string;
}

export interface UserResidence {
  id: string;
  user_id: string;
  neighborhood: string;
  city: string;
  state?: string;
  street?: string;
  is_primary?: boolean;
}

export interface ServiceArea {
  id: string;
  profile_id: string;
  city: string;
  neighborhoods: string[];
  is_primary: boolean;
  is_active: boolean;
}

export interface ProfileLocation {
  neighborhood: string;
  city: string;
  state?: string;
  isPrimary?: boolean;
}

class LocationServiceClass {
  private readonly db = supabase as any;
  /**
   * Salva localização no histórico
   */
  async saveLocation(
    locationData: Omit<LocationHistory, "id" | "created_at">,
  ): Promise<LocationHistory | null> {
    try {
      const { data, error } = await this.db
        .from("location_history")
        .insert([locationData])
        .select()
        .single();

      if (error) throw error;
      return data as LocationHistory;
    } catch (error) {
      logger.error("Error saving location:", error);
      return null;
    }
  }

  /**
   * Busca histórico de localização de um perfil
   */
  async getLocationHistory(
    profileId: string,
    limit: number = 100,
  ): Promise<LocationHistory[]> {
    try {
      const { data, error } = await this.db
        .from("location_history")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as LocationHistory[]) || [];
    } catch (error) {
      logger.error("Error fetching location history:", error);
      return [];
    }
  }

  /**
   * Busca última localização conhecida
   */
  async getLastLocation(profileId: string): Promise<LocationHistory | null> {
    try {
      const { data, error } = await this.db
        .from("location_history")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as LocationHistory;
    } catch (error) {
      logger.error("Error fetching last location:", error);
      return null;
    }
  }

  /**
   * Remove histórico antigo (limpeza)
   */
  async cleanOldHistory(daysOld: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await this.db
        .from("location_history")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error cleaning old location history:", error);
      return false;
    }
  }

  /**
   * Busca residência do usuário
   */
  async getUserResidence(userId: string): Promise<UserResidence | null> {
    try {
      const primaryResidence = await residenceService.getPrimaryResidenceWithRelations(userId);
      if (!primaryResidence) return null;

      const residence = primaryResidence as {
        location?: { name?: string; full_name?: string; metadata?: { state_code?: string } };
        address?: { street?: string };
      };
      const location = residence.location;
      const address = residence.address;
      return {
        id: primaryResidence.id,
        user_id: primaryResidence.user_id,
        neighborhood: location?.name || "",
        city: location?.full_name?.split(" - ")?.[1] || location?.name || "",
        state: location?.metadata?.state_code,
        street: address?.street || undefined,
        is_primary: primaryResidence.is_primary,
      };
    } catch (error) {
      logger.error("Error fetching user residence:", error);
      return null;
    }
  }

  /**
   * Busca área de serviço primária de um perfil profissional
   */
  async getPrimaryServiceArea(profileId: string): Promise<ServiceArea | null> {
    try {
      return (await serviceAreasService.getPrimaryServiceArea(profileId)) as ServiceArea | null;
    } catch (error) {
      logger.error("Error fetching primary service area:", error);
      return null;
    }
  }

  /**
   * Busca localização de um perfil (residência ou área de serviço)
   * @param userId - ID do usuário
   * @param profileType - Tipo do perfil ('personal' ou outro)
   * @param profileId - ID do perfil profissional (se aplicável)
   */
  async getProfileLocation(
    userId: string,
    profileType: string,
    profileId?: string,
  ): Promise<ProfileLocation | null> {
    try {
      // Perfil pessoal: busca residência com relações canônicas
      if (profileType === "personal") {
        const residence = await residenceService.getPrimaryResidenceWithRelations(userId);
        if (!residence) return null;

        // ETAPA 12: Usar apenas modelo canônico
        const location = (residence as { location?: { name?: string; full_name?: string; metadata?: { state_code?: string } } }).location;
        return {
          neighborhood: location.name,
          city: location.full_name.split(' - ')[1] || location.name,
          state: location.metadata?.state_code,
        };
      }

      // Perfil profissional: busca área de serviço
      if (profileId) {
        const serviceArea = await this.getPrimaryServiceArea(profileId);
        if (!serviceArea) return null;

        return {
          neighborhood: serviceArea.neighborhoods?.[0] || "",
          city: serviceArea.city,
          isPrimary: serviceArea.is_primary,
        };
      }

      return null;
    } catch (error) {
      logger.error("Error fetching profile location:", error);
      return null;
    }
  }
}

export const locationService = new LocationServiceClass();
export { locationService as LocationService };
