# ETAPA 1.3B - CORREÇÃO NÍVEL AAA: Diagnóstico Profundo

**Data:** 2026-04-04  
**Status:** DIAGNÓSTICO EM ANDAMENTO

## Problema

Círculo visual não aparece no mapa porque `userLocation` permanece `null` no `MapaPageV4.tsx`, mesmo após o `GeolocationService` retornar sucesso.

## Hipótese Inicial (DESCARTADA)

❌ "MapaPageV4 não chama requestLocation()"
- **Realidade:** MapaPageV4 JÁ chama `requestLocation()` no useEffect (linha 166-173)

## Hipótese Atual (EM INVESTIGAÇÃO)

🔍 **Hook `useRobustGeolocation` não está atualizando o estado `coords` corretamente**

### Evidências

```
✅ [GeolocationService] GPS sucesso: 2000m precisão
✅ [useRobustGeolocation] Localização obtida | {"source":"gps","accuracy":"2000m"}

MAS:

[MapaPageV4] userLocation atualizado: null
```

### Possíveis Causas

1. **Race condition:** `setState` é chamado mas o componente não re-renderiza
2. **Problema de referência:** `coords` está sendo atualizado mas não propagado
3. **Cache stale:** Hook retorna cache antigo ao invés de dados frescos
4. **Timing issue:** `requestLocation()` é chamado antes do hook estar pronto

## Correções Aplicadas (Nível AAA)

### 1. Logs Detalhados no MapaPageV4

```typescript
const { coords: userLocation, requestLocation, loading: geoLoading } = useRobustGeolocation({ 
  useCache: true,
  onSuccess: (coords) => {
    console.log('[MapaPageV4] ✅ Geolocalização obtida via callback:', coords);
  },
  onError: (error) => {
    console.error('[MapaPageV4] ❌ Erro na geolocalização:', error);
  }
});

// Debug completo
React.useEffect(() => {
  console.log('[MapaPageV4] userLocation atualizado:', userLocation);
  console.log('[MapaPageV4] geoLoading:', geoLoading);
  console.log('[MapaPageV4] radiusSearchEnabled:', radiusSearchEnabled);
}, [userLocation, geoLoading, radiusSearchEnabled]);
```

**Objetivo:** Verificar se o callback `onSuccess` é chamado mas `coords` não atualiza.

### 2. Logs Críticos no Hook useRobustGeolocation

#### A. Log de mudança de estado

```typescript
const [state, setState] = useState<GeolocationState>({...});

useEffect(() => {
  console.log('[useRobustGeolocation] ESTADO MUDOU:', state);
}, [state]);
```

**Objetivo:** Rastrear TODA mudança de estado do hook.

#### B. Log antes/depois do setState

```typescript
console.log('[useRobustGeolocation] ANTES setState - result.coords:', result.coords);
console.log('[useRobustGeolocation] ANTES setState - result completo:', result);

const newState = {
  coords: result.coords,
  loading: false,
  error: null,
  permissionState: 'granted' as const,
  source: result.source,
};

console.log('[useRobustGeolocation] CHAMANDO setState com:', newState);
setState(newState);
console.log('[useRobustGeolocation] DEPOIS setState - aguardando próximo render...');
```

**Objetivo:** Verificar se `setState` está sendo chamado com dados corretos.

#### C. Log no início do requestLocation

```typescript
const requestLocation = useCallback(async () => {
  console.log('[useRobustGeolocation] requestLocation CHAMADO');
  console.log('[useRobustGeolocation] requestInFlight.current:', requestInFlight.current);
  
  if (requestInFlight.current) {
    logger.warn('⚠️ [useRobustGeolocation] Requisição já em andamento');
    return;
  }
  requestInFlight.current = true;

  console.log('[useRobustGeolocation] Iniciando requisição...');
  setState(prev => {
    console.log('[useRobustGeolocation] setState inicial - prev:', prev);
    return { ...prev, loading: true, error: null };
  });
  // ...
}, [useCache, timeout, maxRetries]);
```

**Objetivo:** Rastrear o fluxo completo desde a chamada até o setState.

## Próximos Passos

### 1. Executar e Coletar Logs

Usuário deve:
1. Abrir o mapa
2. Mover o slider de raio
3. Copiar TODOS os logs do console
4. Colar no relatório de homologação

### 2. Analisar Sequência de Logs

Esperamos ver:

```
[MapaPageV4] Montando componente, solicitando localização...
[useRobustGeolocation] requestLocation CHAMADO
[useRobustGeolocation] requestInFlight.current: false
[useRobustGeolocation] Iniciando requisição...
[useRobustGeolocation] setState inicial - prev: {coords: null, loading: false, ...}
[useRobustGeolocation] ESTADO MUDOU: {coords: null, loading: true, ...}
🎯 [useRobustGeolocation] Iniciando busca de localização...
✅ [GeolocationService] GPS sucesso: 2000m precisão
✅ [useRobustGeolocation] Localização obtida
[useRobustGeolocation] ANTES setState - result.coords: {latitude: -12.9, longitude: -38.5, ...}
[useRobustGeolocation] CHAMANDO setState com: {coords: {...}, loading: false, ...}
[useRobustGeolocation] DEPOIS setState - aguardando próximo render...
[useRobustGeolocation] Chamando onSuccess callback...
[MapaPageV4] ✅ Geolocalização obtida via callback: {latitude: -12.9, ...}
[useRobustGeolocation] ESTADO MUDOU: {coords: {...}, loading: false, ...}
[MapaPageV4] userLocation atualizado: {latitude: -12.9, longitude: -38.5, ...}
```

### 3. Identificar Ponto de Falha

Se os logs mostrarem:
- ✅ `setState` chamado com dados corretos
- ✅ `onSuccess` callback executado
- ❌ `userLocation` ainda é `null`

Então o problema é **propagação de estado do hook para o componente**.

### 4. Possíveis Soluções

#### Solução A: Forçar re-render com key

```typescript
const [geoKey, setGeoKey] = useState(0);

const { coords: userLocation } = useRobustGeolocation({ 
  key: geoKey,
  useCache: true 
});
```

#### Solução B: Usar callback ao invés de estado

```typescript
const [userLocation, setUserLocation] = useState(null);

useRobustGeolocation({ 
  useCache: true,
  onSuccess: (coords) => {
    setUserLocation(coords); // Atualizar estado local
  }
});
```

#### Solução C: Usar GeolocationService diretamente

```typescript
const [userLocation, setUserLocation] = useState(null);

useEffect(() => {
  GeolocationService.getCurrentLocation().then(result => {
    setUserLocation(result.coords);
  });
}, []);
```

## Arquivos Alterados

1. **src/core/maps/pages/MapaPageV4.tsx**
   - Adicionado logs detalhados
   - Adicionado callbacks onSuccess/onError
   - Adicionado tracking de geoLoading

2. **src/shared/hooks/useRobustGeolocation.ts**
   - Adicionado log de mudança de estado
   - Adicionado logs antes/depois setState
   - Adicionado logs no início do requestLocation

## Critério de Sucesso

✅ Logs mostram que `setState` é chamado com dados corretos  
✅ Logs mostram que estado do hook muda  
✅ Logs mostram que `userLocation` no MapaPageV4 recebe os dados  
✅ Círculo aparece no mapa quando slider é movido

## Status

🔍 **AGUARDANDO VALIDAÇÃO RUNTIME**

Usuário deve executar o mapa e coletar logs para análise.

