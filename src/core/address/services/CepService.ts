/**
 * CepService - servico de consulta de CEP (legado).
 *
 * DEPRECATED:
 * - Mantido apenas para compatibilidade.
 * - SSOT atual de geocoding/CEP: locationGeocodingService.
 */

import { logger } from '@/shared/utils/logger';
import type { CepLookupResult } from '../types';

const VIACEP_BASE = 'https://viacep.com.br/ws';

export class CepService {
  static async lookup(cep: string): Promise<CepLookupResult | null> {
    const cleaned = cep.replace(/\D/g, '');

    if (cleaned.length !== 8) {
      throw new Error('CEP deve conter 8 digitos');
    }

    try {
      const response = await fetch(`${VIACEP_BASE}/${cleaned}/json/`);

      if (!response.ok) {
        logger.warn('ViaCEP request failed', { status: response.status, cep: cleaned });
        return null;
      }

      const data = await response.json();

      if (data.erro) {
        logger.info('CEP not found', { cep: cleaned });
        return null;
      }

      return {
        cep: CepService.formatCep(data.cep),
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || '',
        ibge: data.ibge || '',
      };
    } catch (error) {
      logger.error('CepService.lookup failed', error, { cep: cleaned });
      throw new Error('Falha ao consultar CEP. Verifique sua conexao.');
    }
  }

  static formatCep(cep: string): string {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return cep;
  }

  static isValid(cep: string): boolean {
    return /^\d{5}-?\d{3}$/.test(cep.trim());
  }

  static clean(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  /**
   * Metodo de compatibilidade que redireciona para o SSOT atual.
   * @deprecated Use locationGeocodingService.lookupPostalCode() instead. Will be removed in v2.0.0
   */
  static async lookupWithMigration(cep: string): Promise<CepLookupResult | null> {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        '??  CepService.lookupWithMigration() is deprecated.\n' +
        '   Use locationGeocodingService.lookupPostalCode() instead.\n' +
        '   This method will be removed in v2.0.0'
      );
    }
    logger.warn('CepService.lookupWithMigration is deprecated. Use locationGeocodingService.lookupPostalCode directly.');

    try {
      const { locationGeocodingService } = await import('@/core/location/services/LocationGeocodingService');
      const result = await locationGeocodingService.lookupPostalCode({
        postalCode: cep,
      });

      if (!result) {
        return null;
      }

      return {
        cep: result.postalCode,
        logradouro: result.street || '',
        complemento: result.complement || '',
        bairro: result.neighborhood || '',
        localidade: result.city || '',
        uf: result.stateCode || result.state || '',
        ibge: result.ibgeCode || '',
      };
    } catch (error) {
      logger.warn('CepService.lookupWithMigration failed in SSOT path, using legacy lookup fallback', error);
      return this.lookup(cep);
    }
  }
}
