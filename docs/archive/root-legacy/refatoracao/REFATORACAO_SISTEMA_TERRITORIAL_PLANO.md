# Plano de Refatoração: Sistema Territorial SSOT

## Análise de Problemas Identificados

### 🔴 CRÍTICO - Violações SSOT

1. **5 LocationServices duplicados** (Services, Classifieds, Business, Community, Mobility)
2. **4 hooks de módulo idênticos** (useServicesLocation, useClassifiedsLocation, useBusinessLocation, useCommunityLocation)
3. **MobilityLocationService não estende BaseLocationService** (duplica 10+ métodos)
4. **Múltiplas formas de ler localização ativa** (4 diferentes)

### 🟡 MÉDIO - Lógica Espalhada

5. **Lógica de modo territorial em 3 lugares** (Initializer, Banner, Selector)
6. **Verificações de território duplicadas** (4+ arquivos)
7. **Inconsistência null handling** (Store vs Hook)

### 🟢 BAIXO - Gambiarras

8. **Refs para controle de inicialização** (initializedRef, prevModeRef)
9. **LocationInitializer placeholder vazio**
10. **Normalização de paths duplicada**

---

## Solução: Arquitetura SSOT Limpa

### Princípios

1. **Single Source of Truth**: `LocationContextStore` é a ÚNICA fonte de verdade
2. **Herança Correta**: Todos os LocationServices estendem `BaseLocationService`
3. **Hook Genérico**: Um único hook reutilizável para todos os módulos
4. **Lógica Centralizada**: Modo territorial gerenciado em um único lugar

---

## Fase 1: Corrigir BaseLocationService e Herança

### 1.1 Atualizar BaseLocationService

**Arquivo**: `src/core/location/services/BaseLocationService.ts`

**Mudanças**:
- Adicionar método `getOperationalLocationId()` com comportamento padrão
- Permitir override em subclasses (Mobility)
- Adicionar método `getDefaultBehavior()` abstrato

```typescript
export abstract class BaseLocationService {
  // ... métodos existentes ...
  
  /**
   * Obtém location_id operacional para filtros.
   * Padrão: retorna location_id ativo.
   * Mobility override: promove district → city.
   */
  async getOperationalLocationId(): Promise<string | null> {
    return this.getActiveLocationId();
  }
  
  /**
   * Comportamento padrão quando não há localização ativa.
   * Cada módulo pode customizar a mensagem.
   */
  abstract getDefaultBehavior(): {
    allowListing: boolean;
    showMessage: string;
    filterScope: 'none';
  };
}
```

### 1.2 Refatorar MobilityLocationService

**Arquivo**: `src/modules/mobility/services/MobilityLocationService.ts`

**Mudanças**:
- Estender `BaseLocationService`
- Remover métodos duplicados
- Manter apenas `getOperationalLocationId()` override

```typescript
export class MobilityLocationService extends BaseLocationService {
  /**
   * Override: mobility opera por cidade.
   * District → promove para city parent.
   */
  async getOperationalLocationId(): Promise<string | null> {
    const location = this.getActiveLocation();
    if (!location) return null;

    if (location.type === LocationType.CITY) {
      return location.id;
    }

    if (location.type === LocationType.DISTRICT && location.parent_id) {
      try {
        const output = await this.locationService.getLocationById({
          id: location.parent_id
        });
        const parent = output.location;
        if (parent && parent.type === LocationType.CITY) {
          return parent.id;
        }
      } catch {
        return location.id;
      }
    }

    return location.id;
  }
  
  getDefaultBehavior() {
    return {
      allowListing: false,
      showMessage: 'Selecione uma localização para ver as rotas disponíveis',
      filterScope: 'none' as const
    };
  }
  
  getFilterScope(): 'city' | 'none' {
    const location = this.getActiveLocation();
    if (!location) return 'none';
    return 'city'; // Mobility sempre opera por cidade
  }
}
```

---

## Fase 2: Hook Genérico Reutilizável

### 2.1 Criar useModuleLocation<T>

**Arquivo**: `src/core/location/hooks/useModuleLocation.ts`

```typescript
/**
 * Hook genérico para integração de módulos com fundação geográfica.
 * Substitui useBusinessLocation, useServicesLocation, useClassifiedsLocation, useCommunityLocation.
 */
export function useModuleLocation<T extends BaseLocationService>(
  service: T
) {
  const [activeLocation, setActiveLocation] = useState<Location | null>(
    () => service.getActiveLocation()
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshActiveLocation = useCallback(() => {
    setActiveLocation(service.getActiveLocation());
  }, [service]);

  useEffect(() => {
    const unsubscribe = service.subscribe(() => {
      setActiveLocation(service.getActiveLocation());
    });
    setActiveLocation(service.getActiveLocation());
    return unsubscribe;
  }, [service]);

  const validateLocationId = useCallback(async (locationId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      return await service.validateLocationId(locationId);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const getFilterParams = useCallback(() => {
    return service.getFilterParams();
  }, [service]);

  const getDefaultBehavior = useCallback(() => {
    return service.getDefaultBehavior();
  }, [service]);

  return {
    activeLocation,
    isLoading,
    hasActiveLocation: activeLocation !== null,
    activeLocationId: activeLocation?.id || null,
    activeLocationName: service.getActiveLocationName(),
    refreshActiveLocation,
    validateLocationId,
    getFilterParams,
    getDefaultBehavior,
    filterScope: service.getFilterScope(),
    canCreate: activeLocation !== null,
    isCity: service.isCity(),
    isDistrict: service.isDistrict(),
  };
}
```

### 2.2 Atualizar Hooks de Módulos

**Arquivos**: 
- `src/modules/business/hooks/useBusinessLocation.ts`
- `src/modules/services/hooks/useServicesLocation.ts`
- `src/modules/classifieds/hooks/useClassifiedsLocation.ts`
- `src/modules/community/hooks/useCommunityLocation.ts`

```typescript
// useBusinessLocation.ts
export function useBusinessLocation() {
  return useModuleLocation(businessLocationService);
}

// useServicesLocation.ts
export function useServicesLocation() {
  return useModuleLocation(servicesLocationService);
}

// useClassifiedsLocation.ts
export function useClassifiedsLocation() {
  return useModuleLocation(classifiedsLocationService);
}

// useCommunityLocation.ts (se existir)
export function useCommunityLocation() {
  return useModuleLocation(communityLocationService);
}
```

---

## Fase 3: Centralizar Lógica de Modo Territorial

### 3.1 Criar TerritoryModeManager

**Arquivo**: `src/core/location/services/TerritoryModeManager.ts`

```typescript
/**
 * TerritoryModeManager - SSOT para lógica de modo territorial
 * 
 * Responsabilidades:
 * - Inicializar modo baseado em usuário e localização
 * - Detectar mismatch (usuário em bairro diferente)
 * - Forçar mudança automática de modo quando necessário
 * - Fornecer regras de negócio centralizadas
 */
export class TerritoryModeManager {
  /**
   * Determina o modo inicial baseado em usuário e localização.
   */
  static getInitialMode(
    hasHome: boolean,
    homeDistrict: Location | null,
    activeLocation: Location | null
  ): TerritoryMode {
    // Visitante
    if (!hasHome) return null;
    
    // Usuário sem bairro definido
    if (!homeDistrict) return 'cidade';
    
    // Usuário no próprio bairro
    if (activeLocation?.id === homeDistrict.id) return 'bairro';
    
    // Usuário fora do bairro
    return 'cidade';
  }
  
  /**
   * Detecta se há mismatch entre modo e localização.
   * Retorna null se não há mismatch, ou objeto com detalhes.
   */
  static detectMismatch(
    territoryMode: TerritoryMode,
    activeLocation: Location | null,
    homeDistrict: Location | null,
    homeCity: Location | null
  ): MismatchInfo | null {
    if (!homeDistrict || !activeLocation) return null;
    
    // Está no próprio bairro - sem mismatch
    if (activeLocation.id === homeDistrict.id) return null;
    
    // Está na própria cidade em modo cidade - sem mismatch
    if (homeCity && activeLocation.id === homeCity.id && territoryMode === 'cidade') {
      return null;
    }
    
    // Está em bairro da mesma cidade em modo cidade - sem mismatch
    if (homeCity && activeLocation.parent_id === homeCity.id && territoryMode === 'cidade') {
      return null;
    }
    
    // Mismatch detectado
    return {
      currentName: activeLocation.name,
      fromName: territoryMode === 'bairro' ? homeDistrict.name : (homeCity?.name || homeDistrict.name),
      homePath: homeDistrict.path,
      homeCityPath: homeCity?.path,
    };
  }
  
  /**
   * Determina se deve forçar mudança de modo.
   * Regra: se está em modo bairro e acessou outro bairro → forçar cidade.
   */
  static shouldForceModeChange(
    territoryMode: TerritoryMode,
    activeLocation: Location | null,
    homeDistrict: Location | null
  ): boolean {
    if (territoryMode !== 'bairro') return false;
    if (!homeDistrict || !activeLocation) return false;
    
    // Está em outro lugar que não o próprio bairro
    return activeLocation.id !== homeDistrict.id;
  }
}
```

### 3.2 Refatorar useTerritoryModeInitializer

```typescript
export function useTerritoryModeInitializer() {
  const { hasHome, homeDistrict, homeCity, loading } = useUserTerritory();
  const { activeLocation, territoryMode, setTerritoryMode } = useActiveTerritory();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Visitante: garantir modo null
    if (!hasHome) {
      if (territoryMode !== null) {
        setTerritoryMode(null);
      }
      return;
    }

    // Inicializar modo apenas uma vez
    if (!initializedRef.current && territoryMode === null) {
      const initialMode = TerritoryModeManager.getInitialMode(
        hasHome,
        homeDistrict,
        activeLocation
      );
      setTerritoryMode(initialMode);
      initializedRef.current = true;
    }
  }, [hasHome, homeDistrict, activeLocation, territoryMode, setTerritoryMode, loading]);

  // Reset quando usuário faz logout
  useEffect(() => {
    if (!hasHome && initializedRef.current) {
      initializedRef.current = false;
    }
  }, [hasHome]);
}
```

### 3.3 Refatorar TerritoryMismatchBanner

```typescript
export function TerritoryMismatchBanner() {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { homeDistrict, homeCity, hasHome } = useUserTerritory();
  const { activeLocation, territoryMode, setTerritoryMode } = useActiveTerritory();

  // Detectar e forçar mudança de modo automaticamente
  useEffect(() => {
    if (!hasHome || !activeLocation) return;
    
    const shouldForce = TerritoryModeManager.shouldForceModeChange(
      territoryMode,
      activeLocation,
      homeDistrict
    );
    
    if (shouldForce) {
      setTerritoryMode('cidade');
    }
  }, [activeLocation, homeDistrict, hasHome, territoryMode, setTerritoryMode]);

  // Detectar mismatch para exibir banner
  const mismatch = useMemo(() => {
    return TerritoryModeManager.detectMismatch(
      territoryMode,
      activeLocation,
      homeDistrict,
      homeCity
    );
  }, [territoryMode, activeLocation, homeDistrict, homeCity]);

  if (!mismatch || dismissed === mismatch.currentName) return null;

  // ... resto do componente ...
}
```

---

## Fase 4: Corrigir Inconsistências

### 4.1 Corrigir null handling em LocationContextStore

```typescript
setActiveLocation(location: Location | null): void {
  if (location === null) {
    this.clearActiveTerritory();
    return;
  }
  
  if (location.status !== 'active') {
    this.error = { 
      code: LocationErrorCode.LOCATION_INACTIVE, 
      message: `Location ${location.id} is not active` 
    };
    throw this.error;
  }
  
  this.error = null;
  this.activeTerritory = { type: 'location', location };
  this.notify();
}
```

### 4.2 Simplificar useLocationContext

```typescript
export function useLocationContext(): LocationContextValue {
  const { activeTerritory, activeLocation, setActiveLocation, clearActiveTerritory } =
    useActiveTerritory();

  return {
    activeTerritory,
    activeLocation,
    setActiveLocation, // Agora aceita null diretamente
    clearActiveTerritory,
    isLoading: false,
    error: null,
  };
}
```

---

## Fase 5: Remover Gambiarras

### 5.1 Remover LocationInitializer placeholder

**Arquivo**: `src/core/location/components/LocationInitializer.tsx`

**Ação**: Deletar arquivo (não faz nada útil)

### 5.2 Centralizar normalização de paths

**Criar**: `src/core/routing/utils/pathNormalization.ts`

```typescript
export function normalizeTerritoryPath(path: string): string {
  return path.startsWith('/br/') ? path.replace(/^\/br/, '') : path;
}
```

**Atualizar**: TerritorySelectorV2 para usar função centralizada

---

## Ordem de Implementação

1. ✅ **Fase 1**: Corrigir BaseLocationService e MobilityLocationService
2. ✅ **Fase 2**: Criar useModuleLocation genérico
3. ✅ **Fase 3**: Criar TerritoryModeManager e refatorar lógica
4. ✅ **Fase 4**: Corrigir inconsistências de null handling
5. ✅ **Fase 5**: Remover gambiarras e centralizar utils

---

## Benefícios Esperados

- ✅ **SSOT Real**: Uma única fonte de verdade para território
- ✅ **Menos Código**: ~500 linhas removidas (duplicação)
- ✅ **Manutenibilidade**: Mudanças em um único lugar
- ✅ **Testabilidade**: Lógica centralizada é mais fácil de testar
- ✅ **Consistência**: Comportamento uniforme em todos os módulos
- ✅ **Clareza**: Responsabilidades bem definidas

---

**Status**: 📋 Plano Aprovado - Aguardando Implementação  
**Data**: 2026-04-03  
**Versão**: 1.0.0
