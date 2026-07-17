import {
  CoverageService,
  CoverageStatus,
  createCoverageRepository,
  createGeospatialPort,
} from '@/core/coverage';
import type {
  CoverageDefinition,
  DoesCoverOutput,
  GetCoverageOutput,
  ServiceArea,
} from '@/core/coverage';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { businessLocationService } from './BusinessLocationService';

/** Business-specific adapter over the canonical cross-domain coverage owner. */
export class BusinessCoverageService {
  private readonly coverageService: CoverageService;

  constructor() {
    this.coverageService = new CoverageService(
      createCoverageRepository(),
      createLocationRepository(),
      createGeospatialPort(),
    );
  }

  async checkCoverageInActiveLocation(businessId: string): Promise<boolean> {
    const result = await this.getCoverageDetails(businessId);
    return result?.covers ?? false;
  }

  async getCoverageDetails(businessId: string): Promise<DoesCoverOutput | null> {
    const locationId = businessLocationService.getActiveLocationId();
    if (!locationId) return null;

    return this.coverageService.doesCover({
      entity_type: 'business',
      entity_id: businessId,
      location_id: locationId,
    });
  }

  async getBusinessCoverage(businessId: string): Promise<GetCoverageOutput> {
    return this.coverageService.getCoverage({
      entity_type: 'business',
      entity_id: businessId,
      status: CoverageStatus.ACTIVE,
    });
  }

  async getBusinessServiceAreas(businessId: string): Promise<ServiceArea[]> {
    const result = await this.getBusinessCoverage(businessId);
    return result.coverages.map(({ coverage }) => coverage);
  }

  async setBusinessCoverage(
    businessId: string,
    coverages: CoverageDefinition[],
  ): Promise<ServiceArea[]> {
    const result = await this.coverageService.setCoverage({
      entity_type: 'business',
      entity_id: businessId,
      coverages,
    });

    return result.coverages;
  }

  async removeBusinessCoverage(
    businessId: string,
    coverageId?: string,
  ): Promise<number> {
    const result = await this.coverageService.removeCoverage({
      entity_type: 'business',
      entity_id: businessId,
      coverage_id: coverageId,
    });

    return result.removed_count;
  }

  async hasAnyCoverage(businessId: string): Promise<boolean> {
    const areas = await this.getBusinessServiceAreas(businessId);
    return areas.length > 0;
  }

  async filterBusinessesByCoverage(businessIds: string[]): Promise<string[]> {
    if (!businessLocationService.hasActiveLocation() || businessIds.length === 0) {
      return [];
    }

    const checks = await Promise.all(
      businessIds.map(async (businessId) => ({
        businessId,
        covers: await this.checkCoverageInActiveLocation(businessId),
      })),
    );

    return checks.filter(({ covers }) => covers).map(({ businessId }) => businessId);
  }

  async getCoverageMessage(businessId: string): Promise<string> {
    if (!businessLocationService.hasActiveLocation()) {
      return 'Selecione uma localizacao para verificar cobertura';
    }

    const result = await this.getCoverageDetails(businessId);
    if (result?.covers) {
      return result.coverage?.coverage_type === 'city'
        ? 'Atende nesta regiao (cobertura herdada)'
        : 'Atende nesta regiao';
    }

    return 'Nao atende nesta regiao';
  }

  async validateForOrder(
    businessId: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    if (!businessLocationService.hasActiveLocation()) {
      return {
        valid: false,
        reason: 'Selecione uma localizacao para continuar',
      };
    }

    if (!(await this.checkCoverageInActiveLocation(businessId))) {
      return {
        valid: false,
        reason: 'Este negocio nao atende na sua regiao',
      };
    }

    return { valid: true };
  }
}

export const businessCoverageService = new BusinessCoverageService();
