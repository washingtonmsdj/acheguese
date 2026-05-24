/**
 * TerritoryModeManager - SSOT para logica de modo territorial.
 *
 * Regras fundamentais:
 * 1. Seletor muda manualmente quando o usuario clica nele.
 * 2. Seletor muda automaticamente apenas quando usuario em "Meu Bairro"
 *    navega para outro bairro da mesma cidade.
 * 3. Nesse caso, o modo alterna para "Minha Cidade" porque o bairro
 *    residencial do usuario e fixo.
 * 4. Modo cidade nunca muda automaticamente.
 * 5. Visitantes sempre tem modo null.
 */
import { logger } from '@/shared/utils/logger';

import type { Location, TerritoryMode } from '../types';

export interface MismatchInfo {
  reason: string;
  currentMode?: TerritoryMode;
  suggestedMode?: TerritoryMode;
}

export class TerritoryModeManager {
  /**
   * Verifica se deve alternar de modo bairro para cidade baseado na URL.
   *
   * Regra: se usuario esta em modo bairro e a URL aponta para outro bairro,
   * alterna para modo cidade. O bairro residencial do usuario nao deve ser
   * substituido por navegacao contextual.
   */
  static shouldForceModeToCityFromUrl(
    pathname: string,
    homeDistrict: { geographic_path?: string; path?: string } | null,
    homeCity: { geographic_path?: string; path?: string } | null,
  ): boolean {
    if (!homeDistrict || !homeCity) return false;

    // URL canonica esperada: /modulo/uf/cidade/bairro/...
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length < 4) return false;

    const urlDistrictSlug = segments[3];
    const districtPath = homeDistrict.geographic_path ?? homeDistrict.path ?? '';
    const homeDistrictSlug = districtPath.split('/').filter(Boolean).pop();

    if (urlDistrictSlug !== homeDistrictSlug) {
      logger.debug(`[TerritoryModeManager] URL bairro (${urlDistrictSlug}) diferente do usuario (${homeDistrictSlug})`);
      return true;
    }

    return false;
  }

  static isValidMode(
    mode: TerritoryMode,
    hasHome: boolean,
    homeDistrict: Location | null,
  ): boolean {
    if (!hasHome) return mode === null;
    if (!homeDistrict && mode === 'bairro') return false;
    return true;
  }

  static getModeName(mode: TerritoryMode, hasHome: boolean): string {
    if (!hasHome) return 'Cidade';
    if (mode === 'bairro') return 'Meu Bairro';
    return 'Minha Cidade';
  }
}