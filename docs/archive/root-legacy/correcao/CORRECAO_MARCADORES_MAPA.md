# Correção: Marcadores no Mapa Principal

## Problema Identificado

A página de empresas (`/empresas-landing`) exibia marcadores no mapa, mas a página principal do mapa (`/mapa`) não exibia nenhum marcador, apesar de buscar os dados corretamente.

## Causa Raiz

### Arquitetura Divergente

**NeighborhoodMap (usado em /empresas-landing):**
```tsx
<MapLibreAdapter
  markers={legacyMarkers}  // ✅ Passa marcadores para renderização
  onMarkerClick={onBusinessClick}
/>
```

**MapaPageV4 (usado em /mapa) - ANTES:**
```tsx
<MapLibreAdapter
  // ❌ Não passava marcadores
/>

<MapRoot>
  <MapMarkerCollection />  // ❌ Apenas renderiza <div> com data-*, não marcadores visuais
</MapRoot>
```

### Problema Técnico

O componente `MapMarkerCollection` foi projetado para renderizar elementos DOM com atributos `data-*` (para clustering futuro), mas **não cria marcadores visuais no mapa MapLibre**.

Enquanto isso, o `MapLibreAdapter` tem a lógica completa de renderização de marcadores visuais via `maplibregl.Marker`, mas a `MapaPageV4` não estava passando os marcadores para ele.

## Solução Implementada

### 1. Converter MapMarker[] para LegacyMapMarker[]

Adicionado `useMemo` na `MapaPageV4` para converter os marcadores do formato interno para o formato esperado pelo `MapLibreAdapter`:

```tsx
const legacyMarkers = React.useMemo(() => {
  const allMarkers: any[] = [];
  
  // Adicionar marcadores de todas as camadas visíveis
  Object.entries(layerData).forEach(([layerKey, markers]) => {
    markers.forEach((marker) => {
      allMarkers.push({
        id: marker.id,
        coords: [marker.coordinates.latitude, marker.coordinates.longitude],
        label: marker.title,
        meta: {
          type: marker.type,
          category: marker.metadata?.category,
          rating: marker.metadata?.rating,
          isOpen: marker.status === 'active',
        },
      });
    });
  });

  // Adicionar marcador de localização do usuário
  if (userCoords) {
    allMarkers.push({
      id: 'user-location',
      coords: [userCoords.latitude, userCoords.longitude],
      label: 'Você está aqui',
      meta: { isUserLocation: true },
    });
  }

  return allMarkers;
}, [layerData, userCoords]);
```

### 2. Passar Marcadores para MapLibreAdapter

```tsx
<MapLibreAdapter
  ref={adapterRef}
  styleUrl={TILE_STYLE_URL}
  territoryPolygons={territoryPolygons}
  markers={legacyMarkers}  // ✅ Agora passa os marcadores
  onMarkerClick={(id) => {
    const marker = Object.values(layerData)
      .flat()
      .find((m) => m.id === id);
    if (marker) {
      adapterRef.current?.flyTo({ center: marker.coordinates, zoom: 17 });
    }
  }}
  onViewportChange={handleViewportChange}
/>
```

### 3. Remover MapMarkerCollection

Removida a camada `MapRoot` + `MapMarkerCollection` que não estava renderizando marcadores visuais:

```tsx
// REMOVIDO:
<div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
  <MapRoot>
    <MapMarkerCollection />
  </MapRoot>
</div>
```

## Resultado

✅ Página `/mapa` agora renderiza marcadores visuais de:
- Empresas (businesses)
- Eventos (events)
- Alertas comunitários (alerts)
- Localização do usuário (quando solicitada)

✅ Comportamento consistente entre:
- `/empresas-landing` (NeighborhoodMap)
- `/mapa` (MapaPageV4)

✅ Clique em marcador centraliza o mapa com zoom 17

## Arquivos Modificados

- `src/core/maps/pages/MapaPageV4.tsx`

## Observações

### MapMarkerCollection - Propósito Futuro

O componente `MapMarkerCollection` foi mantido no código pois foi projetado para uma arquitetura futura de clustering. Atualmente:

- **Não deve ser usado** para renderização de marcadores visuais
- **Propósito:** Preparação para clustering (quando `markers.length > clusterThreshold`)
- **Estado:** Placeholder - implementação de clustering pendente

### Padrão Correto

Para renderizar marcadores no mapa MapLibre, sempre usar:

```tsx
<MapLibreAdapter markers={legacyMarkers} />
```

Não usar `MapMarkerCollection` diretamente para renderização visual.

## Status

✅ **CORRIGIDO** - Marcadores agora aparecem na página principal do mapa
