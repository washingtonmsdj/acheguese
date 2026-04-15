/**
 * Service Areas Service
 *
 * Handles service area management for professional profiles
 * Moved from UI component to follow architecture rules
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

export interface ServiceArea {
  id: string;
  profile_id: string;
  city: string;
  neighborhoods: string[] | null;
  radius_km: number;
  center_lat: number | null;
  center_lng: number | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceAreaData {
  profile_id: string;
  city: string;
  neighborhoods?: string[];
  radius_km: number;
  center_lat?: number;
  center_lng?: number;
  is_primary?: boolean;
  is_active?: boolean;
}

export interface UpdateServiceAreaData {
  city?: string;
  neighborhoods?: string[];
  radius_km?: number;
  center_lat?: number;
  center_lng?: number;
  is_primary?: boolean;
  is_active?: boolean;
}

class ServiceAreasService {
  async getServiceAreas(profileId: string): Promise<ServiceArea[]> {
    try {
      const { data, error } = await supabase
        .from("service_areas")
        .select("*")
        .eq("profile_id", profileId)
        .order("is_primary", { ascending: false });

      if (error) {
        logger.error("Error fetching service areas:", error);
        throw new Error("Failed to fetch service areas");
      }

      return data || [];
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "getServiceAreas",
        metadata: { profileId },
      });
      throw error;
    }
  }

  async createServiceArea(data: CreateServiceAreaData): Promise<ServiceArea> {
    try {
      const { data: serviceArea, error } = await supabase
        .from("service_areas")
        .insert([data])
        .select()
        .single();

      if (error) {
        logger.error("Error creating service area:", error);
        throw new Error("Failed to create service area");
      }

      return serviceArea;
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "createServiceArea",
      });
      throw error;
    }
  }

  async updateServiceArea(
    id: string,
    data: UpdateServiceAreaData,
  ): Promise<ServiceArea> {
    try {
      const { data: serviceArea, error } = await supabase
        .from("service_areas")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating service area:", error);
        throw new Error("Failed to update service area");
      }

      return serviceArea;
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "updateServiceArea",
        metadata: { id },
      });
      throw error;
    }
  }

  async deleteServiceArea(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("service_areas")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Error deleting service area:", error);
        throw new Error("Failed to delete service area");
      }
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "deleteServiceArea",
        metadata: { id },
      });
      throw error;
    }
  }

  async setPrimaryServiceArea(
    profileId: string,
    serviceAreaId: string,
  ): Promise<void> {
    try {
      // First, unset all primary areas for this profile
      await supabase
        .from("service_areas")
        .update({ is_primary: false })
        .eq("profile_id", profileId);

      // Then set the new primary area
      const { error } = await supabase
        .from("service_areas")
        .update({ is_primary: true })
        .eq("id", serviceAreaId);

      if (error) {
        logger.error("Error setting primary service area:", error);
        throw new Error("Failed to set primary service area");
      }
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "setPrimaryServiceArea",
        metadata: { profileId, serviceAreaId },
      });
      throw error;
    }
  }

  async getPrimaryServiceArea(
    profileId: string,
  ): Promise<ServiceArea | null> {
    try {
      const { data, error } = await supabase
        .from("service_areas")
        .select("*")
        .eq("profile_id", profileId)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching primary service area:", error);
        throw new Error("Failed to fetch primary service area");
      }

      return data;
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "getPrimaryServiceArea",
        metadata: { profileId },
      });
      return null;
    }
  }
}

export const serviceAreasService = new ServiceAreasService();
