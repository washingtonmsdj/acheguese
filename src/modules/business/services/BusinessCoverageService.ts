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

  async checkCoverageInActiveLocation(businessDataId: string): Promise<boolean> {
    const result = await this.getCoverageDetails(businessDataId);
    return result?.covers ?? false;
  }

  async getCoverageDetails(businessDataId: string): Promise<DoesCoverOutput | null> {
    const locationId = businessLocationService.getActiveLocationId();
    if (!locationId) return null;

    return this.coverageService.doesCover({
      entity_type: 'business',
      entity_id: businessDataId,
      location_id: locationId,
    });
  }

  async getBusinessCoverage(businessDataId: string): Promise<GetCoverageOutput> {
    return this.coverageService.getCoverage({
      entity_type: 'business',
      entity_id: businessDataId,
      status: CoverageStatus.ACTIVE,
    });
  }

  async getBusinessServiceAreas(businessDataId: string): Promise<ServiceArea[]> {
    const result = await this.getBusinessCoverage(businessDataId);
    return result.coverages.map(({ coverage }) => coverage);
  }

  async setBusinessCoverage(
    businessDataId: string,
    coverages: CoverageDefinition[],
  ): Promise<ServiceArea[]> {
    const result = await this.coverageService.setCoverage({
      entity_type: 'business',
      entity_id: businessDataId,
      coverages,
    });

    return result.coverages;
  }

  async removeBusinessCoverage(
    businessDataId: string,
    coverageId?: string,
  ): Promise<number> {
    const result = await this.coverageService.removeCoverage({
      entity_type: 'business',
      entity_id: businessDataId,
      coverage_id: coverageId,
    });

    return result.removed_count;
  }

  async hasAnyCoverage(businessDataId: string): Promise<boolean> {
    const areas = await this.getBusinessServiceAreas(businessDataId);
    return areas.length > 0;
  }

  async filterBusinessesByCoverage(businessDataIds: string[]): Promise<string[]> {
    if (!businessLocationService.hasActiveLocation() || businessDataIds.length === 0) {
      return [];
    }

    const checks = await Promise.all(
      businessDataIds.map(async (businessDataId) => ({
        businessDataId,
        covers: await this.checkCoverageInActiveLocation(businessDataId),
      })),
    );

    return checks.filter(({ covers }) => covers).map(({ businessDataId }) => businessDataId);
  }

  async getCoverageMessage(businessDataId: string): Promise<string> {
    if (!businessLocationService.hasActiveLocation()) {
      return 'Selecione uma localizacao para verificar cobertura';
    }

    const result = await this.getCoverageDetails(businessDataId);
    if (result?.covers) {
      return result.coverage?.coverage_type === 'city'
        ? 'Atende nesta regiao (cobertura herdada)'
        : 'Atende nesta regiao';
    }

    return 'Nao atende nesta regiao';
  }

  async validateForOrder(
    businessDataId: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    if (!businessLocationService.hasActiveLocation()) {
      return {
        valid: false,
        reason: 'Selecione uma localizacao para continuar',
      };
    }

    if (!(await this.checkCoverageInActiveLocation(businessDataId))) {
      return {
        valid: false,
        reason: 'Este negocio nao atende na sua regiao',
      };
    }

    return { valid: true };
  }
}

export const businessCoverageService = new BusinessCoverageService();
