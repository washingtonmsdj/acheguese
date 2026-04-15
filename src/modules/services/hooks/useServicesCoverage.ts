/**
 * useServicesCoverage - Hook para integração com sistema de cobertura
 *
 * Responsável por:
 * - Verificar se prestador atende na localização
 * - Obter áreas de cobertura
 * - Validar cobertura para agendamentos
 */

import { useState, useEffect, useCallback } from 'react';
import { servicesCoverageService } from '../services';
import { useServicesLocation } from './useServicesLocation';
import type { ServiceArea, GetCoverageOutput } from '@/core/coverage';

export function useServicesCoverage(professionalId?: string) {
  const [hasCoverage, setHasCoverage] = useState<boolean>(false);
  const [coverageDetails, setCoverageDetails] = useState<GetCoverageOutput | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [coverageMessage, setCoverageMessage] = useState<string>('');

  const { activeLocationId } = useServicesLocation();

  const checkCoverage = useCallback(async () => {
    if (!professionalId || !activeLocationId) {
      setHasCoverage(false);
      setCoverageDetails(null);
      setCoverageMessage('Selecione uma localização para verificar cobertura');
      return;
    }

    setIsLoading(true);
    try {
      const coverage = await servicesCoverageService.checkCoverageInActiveLocation(professionalId);
      setHasCoverage(coverage);

      const details = await servicesCoverageService.getCoverageDetails(professionalId);
      setCoverageDetails(details);

      const message = await servicesCoverageService.getCoverageMessage(professionalId);
      setCoverageMessage(message);
    } catch (error) {
      console.error('Error checking services coverage:', error);
      setHasCoverage(false);
      setCoverageDetails(null);
      setCoverageMessage('Erro ao verificar cobertura');
    } finally {
      setIsLoading(false);
    }
  }, [professionalId, activeLocationId]);

  const loadServiceAreas = useCallback(async () => {
    if (!professionalId) {
      setServiceAreas([]);
      return;
    }
    try {
      const areas = await servicesCoverageService.getProfessionalServiceAreas(professionalId);
      setServiceAreas(areas);
    } catch (error) {
      console.error('Error loading service areas:', error);
      setServiceAreas([]);
    }
  }, [professionalId]);

  const validateForBooking = useCallback(async (): Promise<{ valid: boolean; reason?: string }> => {
    if (!professionalId) return { valid: false, reason: 'Prestador não especificado' };
    return servicesCoverageService.validateForBooking(professionalId);
  }, [professionalId]);

  useEffect(() => { checkCoverage(); }, [checkCoverage]);
  useEffect(() => { loadServiceAreas(); }, [loadServiceAreas]);

  return {
    hasCoverage,
    coverageDetails,
    serviceAreas,
    isLoading,
    coverageMessage,
    checkCoverage,
    loadServiceAreas,
    validateForBooking,
    coverageType: coverageDetails?.coverages?.[0]?.coverage?.coverage_type || null,
    isDirect: coverageDetails?.coverages?.[0]?.coverage?.coverage_type === 'district' || coverageDetails?.coverages?.[0]?.coverage?.coverage_type === 'radius',
    isInherited: coverageDetails?.coverages?.[0]?.coverage?.coverage_type === 'city',
    hasAnyCoverage: serviceAreas.length > 0,
  };
}
