/**
 * useBusinessCoverage - Hook para integração com sistema de cobertura
 * 
 * Responsável por:
 * - Verificar se business atende na localização
 * - Obter áreas de cobertura
 * - Validar cobertura para pedidos/agendamentos
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { businessCoverageService } from '../services';
import { useBusinessLocation } from './useBusinessLocation';
import type { ServiceArea, DoesCoverOutput } from '@/core/coverage';

export function useBusinessCoverage(businessId?: string) {
  const [hasCoverage, setHasCoverage] = useState<boolean>(false);
  const [coverageDetails, setCoverageDetails] = useState<DoesCoverOutput | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [coverageMessage, setCoverageMessage] = useState<string>('');
  
  const { activeLocationId } = useBusinessLocation();

  // Verificar cobertura quando localização ou business mudar
  const checkCoverage = useCallback(async () => {
    if (!businessId || !activeLocationId) {
      setHasCoverage(false);
      setCoverageDetails(null);
      setCoverageMessage('Selecione uma localização para verificar cobertura');
      return;
    }

    setIsLoading(true);
    try {
      // Verificar cobertura
      const coverage = await businessCoverageService.checkCoverageInActiveLocation(businessId);
      setHasCoverage(coverage);

      // Obter detalhes
      const details = await businessCoverageService.getCoverageDetails(businessId);
      setCoverageDetails(details);

      // Obter mensagem
      const message = await businessCoverageService.getCoverageMessage(businessId);
      setCoverageMessage(message);
    } catch (error) {
      logger.error('Error checking coverage', error as Error, {
        hook: 'useBusinessCoverage',
        businessId,
      });
      setHasCoverage(false);
      setCoverageDetails(null);
      setCoverageMessage('Erro ao verificar cobertura');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, activeLocationId]);

  // Obter áreas de cobertura
  const loadServiceAreas = useCallback(async () => {
    if (!businessId) {
      setServiceAreas([]);
      return;
    }

    try {
      const areas = await businessCoverageService.getBusinessServiceAreas(businessId);
      setServiceAreas(areas);
    } catch (error) {
      logger.error('Error loading service areas', error as Error, {
        hook: 'useBusinessCoverage',
        businessId,
      });
      setServiceAreas([]);
    }
  }, [businessId]);

  // Validar para pedido/agendamento
  const validateForOrder = useCallback(async (): Promise<{ valid: boolean; reason?: string }> => {
    if (!businessId) {
      return {
        valid: false,
        reason: 'Business não especificado'
      };
    }

    return businessCoverageService.validateForOrder(businessId);
  }, [businessId]);

  // Atualizar quando localização ou business mudar
  useEffect(() => {
    checkCoverage();
  }, [checkCoverage]);

  // Carregar áreas de cobertura uma vez
  useEffect(() => {
    loadServiceAreas();
  }, [loadServiceAreas]);

  return {
    // Estado
    hasCoverage,
    coverageDetails,
    serviceAreas,
    isLoading,
    coverageMessage,
    
    // Métodos
    checkCoverage,
    loadServiceAreas,
    validateForOrder,
    
    // Computed
    coverageType: coverageDetails?.coverage?.coverage_type === 'city' ? 'inherited' : coverageDetails?.covers ? 'direct' : null,
    isDirect: coverageDetails?.covers && coverageDetails?.coverage?.coverage_type !== 'city',
    isInherited: coverageDetails?.coverage?.coverage_type === 'city',
    hasAnyCoverage: serviceAreas.length > 0,
  };
}