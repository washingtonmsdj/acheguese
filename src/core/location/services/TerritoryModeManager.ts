/**
 * TerritoryModeManager - SSOT para lógica de modo territorial
 * 
 * REGRAS FUNDAMENTAIS (SSOT):
 * 1. Seletor muda MANUALMENTE quando usuário clica nele
 * 2. Seletor muda AUTOMATICAMENTE apenas em um caso:
 *    - Usuário em modo "Meu Bairro" navega para outro bairro
 *    - Sistema força modo "Minha Cidade"
 *    - Razão: Bairro do usuário é FIXO
 * 3. Modo cidade NUNCA muda automaticamente
 * 4. Visitantes sempre têm modo null
 * 
 * Responsabilidades:
 * - Validar se um modo é válido para o usuário
 * - Detectar quando forçar mudança de bairro para cidade
 * - Fornecer nomes de exibição para os modos
 * 
 * @version 2.1.0 - Mudança automática condicional (bairro → cidade)
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
   * Verifica se deve forçar mudança de modo bairro para cidade baseado na URL.
   * 
   * REGRA: Se usuário está em modo bairro e a URL aponta para outro bairro,
   * força mudança para modo cidade (bairro do usuário é FIXO).
   * 
   * @param pathname - Pathname atual da URL
   * @param homeDistrict - Bairro do usuário
   * @param homeCity - Cidade do usuário
   * @returns true se deve forçar mudança para cidade
   */
  static shouldForceModeToCityFromUrl(
    pathname: string,
    homeDistrict: { geographic_path?: string; path?: string } | null,
    homeCity: { geographic_path?: string; path?: string } | null
  ): boolean {
    if (!homeDistrict || !homeCity) return false;

    // Extrair segmentos da URL (ex: /gastronomia/ba/salvador/barra/produto)
    const segments = pathname.split('/').filter(Boolean);
    
    // Precisa ter pelo menos: [modulo, estado, cidade, bairro]
    if (segments.length < 4) return false;

    // Pegar o slug do bairro da URL (4º segmento, índice 3)
    const urlDistrictSlug = segments[3];
    
    // Pegar o slug do bairro do usuário
    const districtPath = homeDistrict.geographic_path ?? homeDistrict.path ?? '';
    const homeDistrictSlug = districtPath.split('/').filter(Boolean).pop();
    
    // Se a URL aponta para um bairro diferente do usuário, forçar cidade
    if (urlDistrictSlug !== homeDistrictSlug) {
      logger.debug(`[TerritoryModeManager] URL bairro (${urlDistrictSlug}) diferente do usuário (${homeDistrictSlug})`);
      return true;
    }

    return false;
  }
  
  /**
   * Valida se um modo é válido para o usuário.
   * 
   * @returns true se o modo é válido, false caso contrário
   */
  static isValidMode(
    mode: TerritoryMode,
    hasHome: boolean,
    homeDistrict: Location | null
  ): boolean {
    // Visitante só pode ter modo null
    if (!hasHome) return mode === null;
    
    // Usuário sem bairro não pode ter modo bairro
    if (!homeDistrict && mode === 'bairro') return false;
    
    // Outros casos são válidos
    return true;
  }
  
  /**
   * Retorna o nome do modo para exibição.
   */
  static getModeName(mode: TerritoryMode, hasHome: boolean): string {
    if (!hasHome) return 'Cidade';
    if (mode === 'bairro') return 'Meu Bairro';
    return 'Minha Cidade';
  }
}
