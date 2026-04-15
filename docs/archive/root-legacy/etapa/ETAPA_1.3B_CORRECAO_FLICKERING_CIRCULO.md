# ETAPA 1.3B - Correção de Flickering do Círculo

**Data**: 2026-04-04  
**Problema**: Círculo piscando e múltiplas requisições ao Supabase  
**Status**: ✅ CORRIGIDO

---

## Problema Identificado

### Sintomas

1. Círculo piscava durante pan/zoom do mapa
2. Múltiplas requisições ao Supabase (logs repetidos):
   ```
   useTouristPointsSpatial.ts:48 [useTouristPointsByBounds] fetching with bounds: ...
   ```
3. Consumo desnecessário de quota do Supabase
4. Performance degradada

### Causa Raiz

O objeto `circle` era recriado a cada render porque estava sendo definido inline:

```typescript
// ❌ ANTES (ERRADO)
circle={
  userLocation && (previewRadius !== null || radiusSearchEnabled)
    ? {
        center: [userLocation.latitude, userLocation.longitude],
        radiusMeters: radiusToShow * 1000,
      }
    : undefined
}
```

**Por que isso causava problema?**

1. A cada render, um NOVO objeto era criado (mesmo com valores iguais)
2. React detectava mudança de referência → re-render do MapLibreAdapter
3. MapLibreAdapter recriava o círculo → flickering
4. `currentBounds` mudava durante pan/zoom → mais renders → mais círculos

---

## Solução Implementada

### useMemo para Estabilizar Referência

```typescript
// ✅ DEPOIS (CORRETO)
const circleConfig = React.useMemo(() => {
  if (!userLocation || (previewRadius === null && !radiusSearchEnabled)) {
    return undefined;
  }

  const radiusToShow = previewRadius !== null ? previewRadius : searchRadius;
  return {
    center: [userLocation.latitude, userLocation.longitude] as [number, number],
    radiusMeters: radiusToShow * 1000,
  };
}, [userLocation, previewRadius, radiusSearchEnabled, searchRadius]);

// Usar no MapLibreAdapter
<MapLibreAdapter circle={circleConfig} ... />
```

### Dependências do useMemo

O círculo só é recriado quando:

1. `userLocation` muda (usuário se move)
2. `previewRadius` muda (usuário clica em outro raio)
3. `radiusSearchEnabled` muda (usuário ativa/desativa busca)
4. `searchRadius` muda (usuário aplica nova busca)

**NÃO recria quando**:
- `currentBounds` muda (pan/zoom do mapa)
- Outros estados mudam
- Componente re-renderiza por outros motivos

---

## Impacto da Correção

### Antes (Problema)

- ❌ Círculo recriado a cada pan/zoom
- ❌ Múltiplas requisições ao Supabase
- ❌ Flickering visível
- ❌ Consumo desnecessário de quota

### Depois (Corrigido)

- ✅ Círculo estável durante pan/zoom
- ✅ Requisições apenas quando necessário
- ✅ Sem flickering
- ✅ Consumo otimizado de quota

---

## Logs de Validação

### Comportamento Esperado

```
[MapaPageV4] ✅ Círculo CRIADO (useMemo): {radiusToShow: 1, isPreview: true, ...}
// Pan/zoom do mapa → SEM logs de recriação
// Clique em "5km" → Novo log de criação
[MapaPageV4] ✅ Círculo CRIADO (useMemo): {radiusToShow: 5, isPreview: true, ...}
```

### Comportamento Anterior (Problema)

```
[MapaPageV4] Renderizando círculo: ...
[MapaPageV4] Renderizando círculo: ...
[MapaPageV4] Renderizando círculo: ...
// Logs repetidos a cada movimento
```

---

## Padrão de Otimização

### Regra Geral

Sempre use `useMemo` para objetos/arrays passados como props quando:

1. O objeto é criado inline
2. O componente filho usa `React.memo` ou `useEffect` com a prop como dependência
3. A prop não precisa mudar a cada render

### Exemplo Genérico

```typescript
// ❌ EVITAR
<Component config={{ x: 1, y: 2 }} />

// ✅ PREFERIR
const config = useMemo(() => ({ x: 1, y: 2 }), []);
<Component config={config} />
```

---

## Arquivos Alterados

- `src/core/maps/pages/MapaPageV4.tsx` - Adicionado `useMemo` para `circleConfig`

---

## Validação

1. Abrir console do navegador
2. Clicar em "1km" → Ver log de criação UMA VEZ
3. Mover/dar zoom no mapa → NÃO ver logs repetidos
4. Clicar em "5km" → Ver log de criação UMA VEZ (novo raio)

---

**Conclusão**: Flickering corrigido. Círculo agora é estável e não causa requisições desnecessárias ao Supabase.
