/**
 * Service area management service.
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

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

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  delete: () => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
  maybeSingle: () => Promise<QueryResult<TRow>>;
}

interface ServiceAreasDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

type ServiceAreaRow = ServiceArea;
type ServiceAreaInsert = CreateServiceAreaData;
type ServiceAreaUpdate = UpdateServiceAreaData;

const serviceAreasDb = supabase as unknown as ServiceAreasDbClient;

class ServiceAreasService {
  async getServiceAreas(profileId: string): Promise<ServiceArea[]> {
    try {
      const { data, error } = await serviceAreasDb
        .from<ServiceAreaRow>("service_areas")
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
      const createPayload: ServiceAreaInsert = data;
      const { data: serviceArea, error } = await serviceAreasDb
        .from<ServiceAreaRow>("service_areas")
        .insert([createPayload])
        .select()
        .single();

      if (error || !serviceArea) {
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
      const updatePayload: ServiceAreaUpdate = data;
      const { data: serviceArea, error } = await serviceAreasDb
        .from<ServiceAreaRow>("service_areas")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error || !serviceArea) {
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
      const { error } = await serviceAreasDb
        .from<ServiceAreaRow>("service_areas")
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
      await serviceAreasDb
        .from<ServiceAreaRow>("service_areas")
        .update({ is_primary: false })
        .eq("profile_id", profileId);

      const { error } = await serviceAreasDb
        .from<ServiceAreaRow>("service_areas")
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

  async getPrimaryServiceArea(profileId: string): Promise<ServiceArea | null> {
    try {
      const { data, error } = await serviceAreasDb
        .from<ServiceAreaRow>("service_areas")
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

      return data ?? null;
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
