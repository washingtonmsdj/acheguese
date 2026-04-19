/**
 * useTerritoryModeInitializer
 * 
 * SSOT: Gerencia modo territorial com mudança automática condicional.
 * 
 * REGRAS FUNDAMENTAIS:
 * 1. Seletor muda MANUALMENTE quando usuário clica nele
 * 2. Seletor muda AUTOMATICAMENTE apenas em um caso:
 *    - Usuário em modo "Meu Bairro" (Pituba)
 *    - Navega para outro bairro (Barra)
 *    - Sistema força modo "Minha Cidade" (Salvador)
 *    - Razão: Bairro do usuário é FIXO, não pode mostrar outro bairro
 * 3. Modo cidade NUNCA muda automaticamente
 * 
 * Inicialização (apenas no login/carregamento inicial):
 * - Visitantes: modo null
 * - Usuários cadastrados: modo 'cidade' (padrão seguro)
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useRef } from 'react';
import { useUserTerritory } from './useUserTerritory';
import { useActiveTerritory } from './useActiveTerritory';
import { useLocation } from 'react-router-dom';
import { TerritoryModeManager } from '../services/TerritoryModeManager';
export function useTerritoryModeInitializer() {
  const { hasHome, homeDistrict, homeCity, loading } = useUserTerritory();
  const { territoryMode, setTerritoryMode } = useActiveTerritory();
  const location = useLocation();
  const initializedRef = useRef(false);
  const lastPathnameRef = useRef<string>('');

  // Inicialização do modo (apenas uma vez)
  useEffect(() => {
    // Aguardar carregamento dos dados do usuário
    if (loading) return;

    // Visitante: garantir modo null
    if (!hasHome) {
      if (territoryMode !== null) {
        logger.debug('[TerritoryModeInit] Visitante detectado, definindo modo null');
        setTerritoryMode(null);
      }
      return;
    }

    // Usuário cadastrado: inicializar modo apenas uma vez
    // Modo padrão: 'cidade' (permite ver toda a cidade)
    // Usuário pode mudar manualmente para 'bairro' se quiser filtrar apenas seu bairro
    if (!initializedRef.current && territoryMode === null) {
      const initialMode = 'cidade'; // Modo padrão seguro
      
      logger.debug('[TerritoryModeInit] Inicializando modo:', initialMode);
      setTerritoryMode(initialMode);
      initializedRef.current = true;
    }
  }, [hasHome, territoryMode, setTerritoryMode, loading]);

  // Mudança automática: Modo Bairro → Outro Bairro = Força Cidade
  useEffect(() => {
    // Só verifica se já inicializou e tem dados do usuário
    if (!initializedRef.current || loading || !hasHome || !homeDistrict) return;
    
    // Só age se está em modo bairro
    if (territoryMode !== 'bairro') return;

    // Detectar mudança de pathname
    if (lastPathnameRef.current === location.pathname) return;
    lastPathnameRef.current = location.pathname;

    // Verificar se deve forçar mudança para cidade
    const shouldForce = TerritoryModeManager.shouldForceModeToCityFromUrl(
      location.pathname,
      homeDistrict,
      homeCity
    );

    if (shouldForce) {
      logger.debug('[TerritoryModeInit] Modo bairro acessando outro bairro, forçando modo cidade');
      setTerritoryMode('cidade');
    }
  }, [location.pathname, territoryMode, homeDistrict, homeCity, hasHome, loading, setTerritoryMode]);

  // Reset quando usuário faz logout
  useEffect(() => {
    if (!hasHome && initializedRef.current) {
      logger.debug('[TerritoryModeInit] Logout detectado, resetando inicialização');
      initializedRef.current = false;
      lastPathnameRef.current = '';
    }
  }, [hasHome]);
}
