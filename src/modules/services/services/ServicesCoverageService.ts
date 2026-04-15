/**
 * Services Coverage Service
 *
 * Integra o módulo services com o sistema de cobertura.
 * Responsável por:
 * - Verificar se prestador atende em localização
 * - Obter áreas de cobertura de prestador
 * - Validar cobertura para agendamentos
 */

import { CoverageService, createCoverageRepository, CoverageStatus, createGeospatialPort } from '@/core/coverage/index';
import type { ServiceArea, GetCoverageOutput, DoesCoverOutput } from '@/core/coverage/index';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { servicesLocationService } from './ServicesLocationService';

export class ServicesCoverageService {
  private coverageService: CoverageService;

  constructor() {
    this.coverageService = new CoverageService(
      createCoverageRepository(),
      createLocationRepository(),
      createGeospatialPort()
    );
  }

  async checkCoverageInActiveLocation(professionalId: string): Promise<boolean> {
    const locationId = servicesLocationService.getActiveLocationId();
    if (!locationId) return false;

    try {
      const result = await this.coverageService.doesCover({
        entity_type: 'service_provider',
        entity_id: professionalId,
        location_id: locationId,
      });
      return result.covers;
    } catch {
      return false;
    }
  }

  async getCoverageDetails(professionalId: string): Promise<GetCoverageOutput | null> {
    const locationId = servicesLocationService.getActiveLocationId();
    if (!locationId) return null;

    try {
      return await this.coverageService.getCoverage({
        entity_type: 'service_provider',
        entity_id: professionalId,
      });
    } catch {
      return null;
    }
  }

  async getProfessionalServiceAreas(professionalId: string): Promise<ServiceArea[]> {
    try {
      const result = await this.coverageService.getCoverage({
        entity_type: 'service_provider',
        entity_id: professionalId,
        status: CoverageStatus.ACTIVE,
      });
      return result.coverages.map((c) => c.coverage);
    } catch {
      return [];
    }
  }

  async filterProfessionalsByCoverage(professionalIds: string[]): Promise<string[]> {
    const locationId = servicesLocationService.getActiveLocationId();
    if (!locationId || professionalIds.length === 0) return [];

    const checks = await Promise.all(
      professionalIds.map(async (id) => ({
        id,
        hasCoverage: await this.checkCoverageInActiveLocation(id),
      }))
    );

    return checks.filter((c) => c.hasCoverage).map((c) => c.id);
  }

  async getCoverageMessage(professionalId: string): Promise<string> {
    const locationId = servicesLocationService.getActiveLocationId();
    if (!locationId) return 'Selecione uma localização para verificar cobertura';

    try {
      const result = await this.coverageService.doesCover({
        entity_type: 'service_provider',
        entity_id: professionalId,
        location_id: locationId,
      });
      if (result.covers) {
        return result.coverage?.coverage_type === 'city'
          ? 'Atende nesta região (cobertura herdada)'
          : 'Atende nesta região';
      }
    } catch {
      // fallthrough
    }
    return 'Não atende nesta região';
  }

  async validateForBooking(professionalId: string): Promise<{ valid: boolean; reason?: string }> {
    if (!servicesLocationService.hasActiveLocation()) {
      return { valid: false, reason: 'Selecione uma localização para continuar' };
    }
    const hasCoverage = await this.checkCoverageInActiveLocation(professionalId);
    if (!hasCoverage) {
      return { valid: false, reason: 'Este prestador não atende na sua região' };
    }
    return { valid: true };
  }
}

export const servicesCoverageService = new ServicesCoverageService();
