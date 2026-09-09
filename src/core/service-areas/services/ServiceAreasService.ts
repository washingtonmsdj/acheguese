/**
 * ServiceAreasService
 *
 * Adapter entre Profile e o Coverage SSOT.
 *
 * Persistência canônica:
 * - public.service_areas
 * - entity_type + entity_id
 * - location_id
 * - comandos server-owned do módulo Coverage
 *
 * Este módulo não cria um segundo modelo de cobertura.
 */

import {
  CoverageStatus,
  CoverageType,
  createCoverageRepository,
  type EntityType,
  type ServiceArea as CoverageArea,
} from "@/core/coverage";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { getBusinessDataIdByProfileId } from "@/core/business/services/BusinessService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { getDriverDataIdByProfileId } from "@/core/mobility/services/MobilityService";
import { profileService } from "@/core/profiles/services/ProfileService";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

export interface ServiceArea {
  id: string;
  profile_id: string;
  entity_type: EntityType;
  entity_id: string;
  coverage_type: CoverageType;
  location_id: string;
  location_name: string;
  location_full_name: string;
  location_type: string | null;
  city_name: string;
  locality_name: string;
  radius_km: number | null;
  is_primary: boolean;
  status: CoverageStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceAreaData {
  profile_id: string;
  coverage_type: CoverageType;
  location_id: string;
  radius_km?: number | null;
  is_primary?: boolean;
  is_active?: boolean;
}

export interface UpdateServiceAreaData {
  coverage_type?: CoverageType;
  location_id?: string;
  radius_km?: number | null;
  is_primary?: boolean;
  is_active?: boolean;
}

interface CoverageEntity {
  entityType: EntityType;
  entityId: string;
}

const coverageRepository = createCoverageRepository();
const locationRepository = createLocationRepository();

async function resolveCoverageEntity(profileId: string): Promise<CoverageEntity> {
  const profile = await profileService.getProfileById(profileId);
  if (!profile) throw new Error("Perfil não encontrado");

  let entityType: EntityType;
  let entityId: string | null;

  switch (profile.profile_type) {
    case "business":
      entityType = "business";
      entityId = await getBusinessDataIdByProfileId(profileId);
      break;
    case "professional":
      entityType = "service_provider";
      entityId =
        await ProfessionalService.getProfessionalDataIdByProfileId(profileId);
      break;
    case "driver":
      entityType = "mobility_driver";
      entityId = await getDriverDataIdByProfileId(profileId);
      break;
    default:
      throw new Error("Este tipo de perfil não possui área de atuação");
  }

  if (!entityId) {
    throw new Error("Entidade de cobertura não encontrada para o perfil");
  }

  return { entityType, entityId };
}

async function mapCoverageArea(
  profileId: string,
  area: CoverageArea,
): Promise<ServiceArea> {
  const [location, ancestors] = await Promise.all([
    locationRepository.findById(area.location_id),
    locationRepository.findAncestors(area.location_id, true),
  ]);

  const city =
    location?.type === "city"
      ? location
      : ancestors.find((candidate) => candidate.type === "city");
  const locality =
    location && (location.type === "neighborhood" || location.type === "district")
      ? location
      : null;

  return {
    id: area.id,
    profile_id: profileId,
    entity_type: area.entity_type,
    entity_id: area.entity_id,
    coverage_type: area.coverage_type,
    location_id: area.location_id,
    location_name: location?.name ?? "Localização",
    location_full_name: location?.full_name ?? location?.name ?? "Localização",
    location_type: location?.type ?? null,
    city_name: city?.name ?? location?.name ?? "",
    locality_name: locality?.name ?? "",
    radius_km: area.radius_km,
    is_primary: area.is_primary,
    status: area.status,
    is_active: area.status === CoverageStatus.ACTIVE,
    created_at: area.created_at,
    updated_at: area.updated_at,
  };
}

function statusFromActive(isActive: boolean | undefined): CoverageStatus {
  return isActive === false ? CoverageStatus.INACTIVE : CoverageStatus.ACTIVE;
}

class ServiceAreasService {
  async getServiceAreas(profileId: string): Promise<ServiceArea[]> {
    try {
      const entity = await resolveCoverageEntity(profileId);
      const areas = await coverageRepository.findByEntity(
        entity.entityType,
        entity.entityId,
      );

      return Promise.all(
        areas.map((area) => mapCoverageArea(profileId, area)),
      );
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "getServiceAreas",
        metadata: { profileId },
      });
      throw error;
    }
  }

  async replaceServiceAreas(
    profileId: string,
    locationIds: string[],
  ): Promise<ServiceArea[]> {
    try {
      const entity = await resolveCoverageEntity(profileId);
      const uniqueLocationIds = [...new Set(locationIds.filter(Boolean))];
      const areas = await coverageRepository.replaceByEntity(
        entity.entityType,
        entity.entityId,
        uniqueLocationIds.map((locationId, index) => ({
          coverage_type: CoverageType.DISTRICT,
          location_id: locationId,
          radius_km: null,
          is_primary: index === 0,
          status: CoverageStatus.ACTIVE,
        })),
      );

      return Promise.all(
        areas.map((area) => mapCoverageArea(profileId, area)),
      );
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "replaceServiceAreas",
        metadata: { profileId, locationCount: locationIds.length },
      });
      throw error;
    }
  }

  async createServiceArea(data: CreateServiceAreaData): Promise<ServiceArea> {
    try {
      const entity = await resolveCoverageEntity(data.profile_id);
      const area = await coverageRepository.upsertByEntity(
        entity.entityType,
        entity.entityId,
        {
          coverage_type: data.coverage_type,
          location_id: data.location_id,
          radius_km:
            data.coverage_type === CoverageType.RADIUS
              ? data.radius_km ?? null
              : null,
          is_primary: data.is_primary ?? false,
          status: statusFromActive(data.is_active),
        },
      );

      return mapCoverageArea(data.profile_id, area);
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "createServiceArea",
        metadata: { profileId: data.profile_id },
      });
      throw error;
    }
  }

  async updateServiceArea(
    profileId: string,
    id: string,
    data: UpdateServiceAreaData,
  ): Promise<ServiceArea> {
    try {
      const entity = await resolveCoverageEntity(profileId);
      const current = await coverageRepository.findById(id);

      if (
        !current ||
        current.entity_type !== entity.entityType ||
        current.entity_id !== entity.entityId
      ) {
        throw new Error("Área de atuação não pertence a este perfil");
      }

      const coverageType = data.coverage_type ?? current.coverage_type;
      const area = await coverageRepository.upsertByEntity(
        entity.entityType,
        entity.entityId,
        {
          id,
          coverage_type: coverageType,
          location_id: data.location_id ?? current.location_id,
          radius_km:
            coverageType === CoverageType.RADIUS
              ? data.radius_km ?? current.radius_km
              : null,
          is_primary: data.is_primary ?? current.is_primary,
          status:
            data.is_active === undefined
              ? current.status
              : statusFromActive(data.is_active),
        },
      );

      return mapCoverageArea(profileId, area);
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "updateServiceArea",
        metadata: { profileId, id },
      });
      throw error;
    }
  }

  async deleteServiceArea(profileId: string, id: string): Promise<void> {
    try {
      const entity = await resolveCoverageEntity(profileId);
      const removed = await coverageRepository.deleteByEntity(
        entity.entityType,
        entity.entityId,
        id,
      );

      if (removed !== 1) {
        throw new Error("Área de atuação não encontrada");
      }
    } catch (error) {
      trackError(error, {
        component: "ServiceAreasService",
        action: "deleteServiceArea",
        metadata: { profileId, id },
      });
      throw error;
    }
  }

  async setPrimaryServiceArea(
    profileId: string,
    serviceAreaId: string,
  ): Promise<ServiceArea> {
    return this.updateServiceArea(profileId, serviceAreaId, {
      is_primary: true,
    });
  }

  async getPrimaryServiceArea(profileId: string): Promise<ServiceArea | null> {
    try {
      const entity = await resolveCoverageEntity(profileId);
      const area = await coverageRepository.findPrimaryByEntity(
        entity.entityType,
        entity.entityId,
      );

      return area ? await mapCoverageArea(profileId, area) : null;
    } catch (error) {
      logger.error("ServiceAreasService.getPrimaryServiceArea", error as Error, {
        profileId,
      });
      return null;
    }
  }
}

export const serviceAreasService = new ServiceAreasService();
