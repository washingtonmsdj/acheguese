/**
 * Business Coverage Service
 * 
 * Integra o módulo business com o sistema de cobertura.
 * Responsável por:
 * - Verificar se business atende em localização
 * - Obter áreas de cobertura de business
 * - Validar cobertura para agendamentos/pedidos
 */

import { CoverageService, createCoverageRepository, CoverageStatus, createGeospatialPort } from '@/core/coverage/index.ts';
import type { ServiceArea, DoesCoverOutput, GetCoverageOutput } from '@/core/coverage/index.ts';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { businessLocationService } from './BusinessLocationService';

export class BusinessCoverageService {
  private coverageService: CoverageService;

  constructor() {
    this.coverageService = new CoverageService(
      createCoverageRepository(),
      createLocationRepository(),
      createGeospatialPort()
    );
  }

  /**
   * Verifica se business atende na localização ativa
   * @param businessId - ID do business
   * @returns Promise<boolean> indicando se atende
   */
  async checkCoverageInActiveLocation(businessId: string): Promise<boolean> {
    const locationId = businessLocationService.getActiveLocationId();

    if (!locationId) {
      return false;
    }

    try {
      const result = await this.coverageService.doesCover({
        entity_type: 'business',
        entity_id: businessId,
        location_id: locationId
      });

      return result.covers;
    } catch {
      return false;
    }
  }

  /**
   * Obtém detalhes de cobertura do business na localização ativa
   * @param businessId - ID do business
   * @returns Promise<DoesCoverOutput | null> detalhes de cobertura
   */
  async getCoverageDetails(businessId: string): Promise<DoesCoverOutput | null> {
    const locationId = businessLocationService.getActiveLocationId();

    if (!locationId) {
      return null;
    }

    try {
      return await this.coverageService.doesCover({
        entity_type: 'business',
        entity_id: businessId,
        location_id: locationId
      });
    } catch {
      return null;
    }
  }

  /**
   * Obtém todas as áreas de cobertura de um business
   * @param businessId - ID do business
   * @returns Promise<ServiceArea[]> áreas de cobertura
   */
  async getBusinessServiceAreas(businessId: string): Promise<ServiceArea[]> {
    try {
      const result = await this.coverageService.getCoverage({
        entity_type: 'business',
        entity_id: businessId,
        status: CoverageStatus.ACTIVE
      });
      return result.coverages.map((c) => c.coverage);
    } catch {
      return [];
    }
  }

  /**
   * Verifica se business tem cobertura em alguma localização
   * @param businessId - ID do business
   * @returns Promise<boolean> indicando se tem cobertura
   */
  async hasAnyCoverage(businessId: string): Promise<boolean> {
    try {
      const areas = await this.getBusinessServiceAreas(businessId);
      return areas.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Filtra businesses que atendem na localização ativa
   * @param businessIds - IDs dos businesses a filtrar
   * @returns Promise<string[]> IDs dos businesses que atendem
   */
  async filterBusinessesByCoverage(businessIds: string[]): Promise<string[]> {
    const locationId = businessLocationService.getActiveLocationId();

    if (!locationId || businessIds.length === 0) {
      return [];
    }

    const checks = await Promise.all(
      businessIds.map(async (id) => ({
        id,
        hasCoverage: await this.checkCoverageInActiveLocation(id)
      }))
    );

    return checks.filter((c) => c.hasCoverage).map((c) => c.id);
  }

  /**
   * Obtém mensagem de cobertura para exibição
   * @param businessId - ID do business
   * @returns Promise<string> mensagem de cobertura
   */
  async getCoverageMessage(businessId: string): Promise<string> {
    const locationId = businessLocationService.getActiveLocationId();
    if (!locationId) return 'Selecione uma localização para verificar cobertura';

    try {
      const result = await this.coverageService.doesCover({
        entity_type: 'business',
        entity_id: businessId,
        location_id: locationId
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

  /**
   * Valida se business pode aceitar pedido/agendamento na localização ativa
   * @param businessId - ID do business
   * @returns Promise<{ valid: boolean; reason?: string }> resultado da validação
   */
  async validateForOrder(businessId: string): Promise<{ valid: boolean; reason?: string }> {
    if (!businessLocationService.hasActiveLocation()) {
      return {
        valid: false,
        reason: 'Selecione uma localização para continuar'
      };
    }

    const hasCoverage = await this.checkCoverageInActiveLocation(businessId);

    if (!hasCoverage) {
      return {
        valid: false,
        reason: 'Este negócio não atende na sua região'
      };
    }

    return { valid: true };
  }
}

// Singleton instance
export const businessCoverageService = new BusinessCoverageService();