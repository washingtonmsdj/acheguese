/**
 * useTerritoryModeInitializer
 *
 * SSOT: gerencia modo territorial com mudanca automatica condicional.
 *
 * Regras fundamentais:
 * 1. Seletor muda manualmente quando o usuario clica nele.
 * 2. Seletor muda automaticamente apenas quando usuario em "Meu Bairro"
 *    navega para outro bairro da mesma cidade.
 * 3. Nesse caso, o modo alterna para "Minha Cidade" porque o bairro
 *    residencial do usuario e fixo.
 * 4. Modo cidade nunca muda automaticamente.
 *
 * Inicializacao:
 * - Visitantes: modo null.
 * - Usuarios cadastrados: modo 'cidade' como padrao seguro.
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useActiveTerritory } from './useActiveTerritory';
import { useUserTerritory } from './useUserTerritory';
import { TerritoryModeManager } from '../services/TerritoryModeManager';

export function useTerritoryModeInitializer() {
  const { hasHome, homeDistrict, homeCity, loading } = useUserTerritory();
  const { territoryMode, setTerritoryMode } = useActiveTerritory();
  const location = useLocation();
  const initializedRef = useRef(false);
  const lastPathnameRef = useRef<string>('');

  // Inicializa o modo territorial apenas uma vez por sessao autenticada.
  useEffect(() => {
    if (loading) return;

    if (!hasHome) {
      if (territoryMode !== null) {
        logger.debug('[TerritoryModeInit] Visitante detectado, definindo modo null');
        setTerritoryMode(null);
      }
      return;
    }

    if (!initializedRef.current && territoryMode === null) {
      const initialMode = 'cidade';

      logger.debug('[TerritoryModeInit] Inicializando modo:', initialMode);
      setTerritoryMode(initialMode);
      initializedRef.current = true;
    }
  }, [hasHome, territoryMode, setTerritoryMode, loading]);

  // Modo bairro em outro bairro alterna para modo cidade.
  useEffect(() => {
    if (!initializedRef.current || loading || !hasHome || !homeDistrict) return;
    if (territoryMode !== 'bairro') return;

    if (lastPathnameRef.current === location.pathname) return;
    lastPathnameRef.current = location.pathname;

    const shouldForce = TerritoryModeManager.shouldForceModeToCityFromUrl(
      location.pathname,
      homeDistrict as any,
      homeCity as any,
    );

    if (shouldForce) {
      logger.debug('[TerritoryModeInit] Modo bairro acessando outro bairro, alternando para modo cidade');
      setTerritoryMode('cidade');
    }
  }, [location.pathname, territoryMode, homeDistrict, homeCity, hasHome, loading, setTerritoryMode]);

  useEffect(() => {
    if (!hasHome && initializedRef.current) {
      logger.debug('[TerritoryModeInit] Logout detectado, resetando inicializacao');
      initializedRef.current = false;
      lastPathnameRef.current = '';
    }
  }, [hasHome]);
}