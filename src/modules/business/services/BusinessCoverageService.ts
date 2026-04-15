/**
 * Business Coverage Service
 * 
 * Integra o módulo business com o sistema de cobertura.
 * Responsável por:
 * - Verificar se business atende em localização
 * - Obter áreas de cobertura de business
 * - Validar cobertura para agendamentos/pedidos
 */

import { CoverageService } from '@/core/coverage/services/CoverageService';
import { createCoverageRepository } from '@/core/coverage/repositories/createCoverageRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { businessLocationService } from './BusinessLocationService';
import type { ServiceArea, CheckCoverageOutput } from '@/core/coverage/types';

export class BusinessCoverageService {
  private coverageService: CoverageService;

  constructor() {
    this.coverageService = new CoverageService(
      createCoverageRepository(),
      createLocationRepository()
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
      const result = await this.coverageService.checkCoverage({
        profile_id: businessId,
        location_id: locationId
      });
      
      return result.has_coverage;
    } catch {
      return false;
    }
  }

  /**
   * Obtém detalhes de cobertura do business na localização ativa
   * @param businessId - ID do business
   * @returns Promise<CheckCoverageOutput | null> detalhes de cobertura
   */
  async getCoverageDetails(businessId: string): Promise<CheckCoverageOutput | null> {
    const locationId = businessLocationService.getActiveLocationId();
    
    if (!locationId) {
      return null;
    }

    try {
      const result = await this.coverageService.checkCoverage({
        profile_id: businessId,
        location_id: locationId
      });
      
      return result;
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
      const result = await this.coverageService.getServiceAreas({
        profile_id: businessId,
        page: 1,
        page_size: 100
      });
      
      return result.service_areas;
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

    const coverageChecks = await Promise.all(
      businessIds.map(async (businessId) => {
        const hasCoverage = await this.checkCoverageInActiveLocation(businessId);
        return { businessId, hasCoverage };
      })
    );

    return coverageChecks
      .filter(check => check.hasCoverage)
      .map(check => check.businessId);
  }

  /**
   * Obtém mensagem de cobertura para exibição
   * @param businessId - ID do business
   * @returns Promise<string> mensagem de cobertura
   */
  async getCoverageMessage(businessId: string): Promise<string> {
    const details = await this.getCoverageDetails(businessId);
    
    if (!details) {
      return 'Selecione uma localização para verificar cobertura';
    }

    if (details.has_coverage) {
      if (details.coverage_type === 'direct') {
        return 'Atende nesta região';
      } else if (details.coverage_type === 'inherited') {
        return 'Atende nesta região (cobertura herdada)';
      }
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