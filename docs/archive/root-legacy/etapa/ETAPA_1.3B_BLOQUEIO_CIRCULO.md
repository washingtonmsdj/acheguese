# ETAPA 1.3B - BLOQUEIO: Círculo Não Aparece

**Data:** 2026-04-04  
**Status:** DIAGNÓSTICO EM ANDAMENTO (Correções Nível AAA Aplicadas)

## Problema Identificado

O círculo visual (zona de raio) não aparece no mapa quando o usuário move o slider, mesmo com todas as correções aplicadas.

## Diagnóstico Completo

### O que funciona ✅

1. **Slider de raio**: Aparece e responde corretamente
2. **handleRadiusChange**: Função criada e funcionando (logs mostram valores 10-31)
3. **radiusSearchEnabled**: Muda para `true` quando slider é movido
4. **Geolocalização**: Service obtém localização com sucesso (logs mostram GPS com 2000m precisão)
5. **requestLocation()**: MapaPageV4 chama o método no useEffect (linha 166-173)

### O que NÃO funciona ❌

**Círculo visual não aparece no mapa**

## Causa Raiz Identificada

```typescript
// MapaPageV4.tsx linha 166
const { coords: userLocation } = useRobustGeolocation({ useCache: true });

// Log mostra:
[MapaPageV4] userLocation atualizado: null
```

**Problema:** O hook `useRobustGeolocation` retorna `coords: null`, mesmo depois que a geolocalização é obtida com sucesso.

### Evidências dos Logs

```
✅ [useRobustGeolocation] Localização obtida | {"source":"gps","accuracy":"2000m"...}
✅ [GeolocationService] GPS sucesso: 2000m precisão

MAS:

[MapaPageV4] userLocation atualizado: null
[MapaPageV4] Círculo NÃO renderizado: {radiusSearchEnabled: true, userLocation: false}
```

### Lógica do Círculo

```typescript
circle={
  radiusSearchEnabled && userLocation  // userLocation é null!
    ? {
        center: [userLocation.latitude, userLocation.longitude],
        radiusMeters: searchRadius * 1000,
      }
    : undefined
}
```

Como `userLocation` é `null`, a condição `radiusSearchEnabled && userLocation` retorna `false`, e o círculo não é renderizado.

## Correções Aplicadas (Nível AAA)

### 1. Logs Detalhados no MapaPageV4

- ✅ Adicionado callbacks `onSuccess` e `onError`
- ✅ Adicionado tracking de `geoLoading`
- ✅ Logs detalhados de estado (userLocation, geoLoading, radiusSearchEnabled)

### 2. Logs Críticos no Hook useRobustGeolocation

- ✅ Log de toda mudança de estado
- ✅ Logs antes/depois do `setState`
- ✅ Logs no início do `requestLocation`
- ✅ Logs do estado anterior no `setState`

### 3. Objetivo dos Logs

Identificar se o problema é:
- **Race condition:** setState chamado mas componente não re-renderiza
- **Problema de referência:** coords atualizado mas não propagado
- **Cache stale:** Hook retorna cache antigo
- **Timing issue:** requestLocation chamado antes do hook estar pronto

## Arquivos Alterados

1. **src/core/maps/pages/MapaPageV4.tsx**
   - Adicionado logs detalhados e callbacks

2. **src/shared/hooks/useRobustGeolocation.ts**
   - Adicionado logs críticos em pontos estratégicos

3. **ETAPA_1.3B_CORRECAO_NIVEL_AAA.md**
   - Documentação completa das correções

## Próximos Passos

### 1. Validação Runtime (OBRIGATÓRIA)

Usuário deve:
1. Abrir o mapa no navegador
2. Abrir o console (F12)
3. Mover o slider de raio
4. Copiar TODOS os logs do console
5. Colar no relatório de homologação

### 2. Análise dos Logs

Com os logs, poderemos identificar:
- Se `setState` está sendo chamado com dados corretos
- Se o estado do hook está mudando
- Se o callback `onSuccess` está sendo executado
- Se `userLocation` no MapaPageV4 está recebendo os dados

### 3. Possíveis Soluções (Após Análise)

#### Solução A: Usar callback ao invés de estado

```typescript
const [userLocation, setUserLocation] = useState(null);

useRobustGeolocation({ 
  useCache: true,
  onSuccess: (coords) => {
    setUserLocation(coords); // Atualizar estado local
  }
});
```

#### Solução B: Usar GeolocationService diretamente

```typescript
const [userLocation, setUserLocation] = useState(null);

useEffect(() => {
  GeolocationService.getCurrentLocation().then(result => {
    setUserLocation(result.coords);
  });
}, []);
```

## Status

🔍 **AGUARDANDO VALIDAÇÃO RUNTIME**

Correções nível AAA aplicadas. Logs detalhados adicionados. Aguardando execução pelo usuário para coletar evidências e identificar causa raiz exata.

## Conclusão

**ETAPA 1.3B está BLOQUEADA** até que os logs runtime sejam coletados e analisados.

O problema NÃO está no código do MapaPageV4 (todas as correções foram aplicadas corretamente). O problema está na propagação de estado do hook `useRobustGeolocation` para o componente.

Com os logs detalhados, poderemos identificar o ponto exato de falha e aplicar a correção definitiva.

