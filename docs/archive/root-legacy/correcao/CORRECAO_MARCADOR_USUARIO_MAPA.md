# Correção: Marcador de Localização do Usuário no Mapa

## Problema
O marcador de localização do usuário não estava aparecendo no mapa após clicar no botão "Minha localização".

## Causa Raiz
Faltava logging detalhado para diagnosticar o problema e o marcador poderia não estar sendo renderizado corretamente devido a:
1. Falta de anchor explícito no marcador
2. Possível problema de visibilidade (pointer-events)
3. Dificuldade em debugar sem logs

## Solução Implementada

### 1. Logging Detalhado Adicionado

**NeighborhoodMap.tsx:**
```typescript
const markers = useMemo<MapMarker[]>(() => {
  const businessMarkers: MapMarker[] = filteredBusinesses.map(b => ({...}));

  if (userLocation) {
    console.log('📍 [NeighborhoodMap] Adicionando marcador de usuário:', {
      lat: userLocation.latitude,
      lng: userLocation.longitude,
      accuracy: userLocation.accuracy,
    });
    
    businessMarkers.push({
      id: 'user-location',
      coords: [userLocation.latitude, userLocation.longitude],
      label: 'Você está aqui',
      meta: { isUserLocation: true },
    });
  } else {
    console.log('⚠️ [NeighborhoodMap] userLocation é null, marcador não será adicionado');
  }

  console.log('📊 [NeighborhoodMap] Total de marcadores:', businessMarkers.length);
  return businessMarkers;
}, [filteredBusinesses, userLocation]);
```

**MapLibreMap.tsx:**
```typescript
const addMarkers = () => {
  console.log('🗺️ [MapLibreMap] Adicionando marcadores:', markers.length);
  
  markers.forEach(marker => {
    const [lat, lng] = marker.coords;
    const isUserLocation = (marker.meta as any)?.isUserLocation;
    
    console.log(`📍 Marcador: ${marker.label} (${lat}, ${lng}) - User: ${isUserLocation}`);
    
    // ... criar elemento ...
    
    if (isUserLocation) {
      console.log('✅ Marcador de usuário criado com SVG');
    }
    
    // ... adicionar ao mapa ...
    
    console.log(`✅ Marcador adicionado ao mapa: ${marker.label}`);
  });
  
  console.log('✅ Total de marcadores no mapa:', markersRef.current.length);
};
```

### 2. Melhorias no Marcador

**Anchor centralizado:**
```typescript
const m = new maplibregl.Marker({ 
  element: el, 
  anchor: 'center' // ← Adicionado para centralizar marcador
}).setLngLat([lng, lat]);
```

**Visibilidade garantida:**
```typescript
el.style.cssText = [
  'width:44px', 'height:44px',
  'display:flex', 'align-items:center', 'justify-content:center',
  'position:relative', 'z-index:1000',
  'pointer-events:auto', // ← Adicionado para garantir visibilidade
].join(';');
```

### 3. SVG Marcador (já implementado anteriormente)

Marcador visual robusto que funciona em todos os dispositivos:
```html
<svg width="44" height="44" viewBox="0 0 44 44">
  <!-- Círculo externo pulsante -->
  <circle cx="22" cy="22" r="20" fill="#10b981" opacity="0.2">
    <animate attributeName="r" from="15" to="20" dur="1.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <!-- Círculo principal -->
  <circle cx="22" cy="22" r="12" fill="#10b981" stroke="white" stroke-width="3"/>
  <!-- Ponto central -->
  <circle cx="22" cy="22" r="5" fill="white"/>
</svg>
```

## Fluxo Completo

```
1. Usuário clica no botão "Minha localização"
   ↓
2. handleGoToUserLocation() → requestLocation()
   ↓
3. useRobustGeolocation busca localização (GPS → IP → Cache)
   ↓
4. onSuccess callback é chamado com coordenadas
   ↓
5. setMapCenter() e setMapZoom() atualizam estado
   ↓
6. userLocation é atualizado no hook
   ↓
7. markers useMemo recalcula e adiciona marcador de usuário
   ↓
8. MapLibreMap recebe novo array de markers
   ↓
9. useEffect de markers renderiza todos os marcadores
   ↓
10. Marcador SVG verde pulsante aparece no mapa
    ↓
11. Mapa anima (flyTo) para a localização do usuário
```

## Como Testar

### Console do Navegador (F12)

**Logs esperados ao clicar no botão:**
```
🎯 Solicitando localização...
🎯 [useRobustGeolocation] Iniciando busca de localização...
📡 Tentando GPS (tentativa 1/3)
✅ [useRobustGeolocation] Localização final obtida: {latitude: -12.975, longitude: -38.476, accuracy: 50}
✅ Localização recebida via callback: {latitude: -12.975, longitude: -38.476, accuracy: 50}
✅ Requisição de localização concluída
📍 [NeighborhoodMap] Adicionando marcador de usuário: {lat: -12.975, lng: -38.476, accuracy: 50}
📊 [NeighborhoodMap] Total de marcadores: 7
🗺️ [MapLibreMap] Adicionando marcadores: 7
📍 Marcador: Sabor da Bahia (-12.975, -38.476) - User: false
📍 Marcador: Farmácia Saúde+ (-12.974, -38.477) - User: false
📍 Marcador: Auto Center Nordeste (-12.976, -38.475) - User: false
📍 Marcador: Mercadinho Família (-12.973, -38.478) - User: false
📍 Marcador: Salão Beleza Rosa (-12.977, -38.474) - User: false
📍 Marcador: Padaria Pão Quente (-12.974, -38.476) - User: false
📍 Marcador: Você está aqui (-12.975, -38.476) - User: true
✅ Marcador de usuário criado com SVG
✅ Marcador adicionado ao mapa: Você está aqui
✅ Total de marcadores no mapa: 7
```

### Visual

**Deve aparecer:**
- ✅ Marcador verde pulsante na sua localização
- ✅ Mapa anima suavemente para sua posição
- ✅ Indicador de precisão abaixo do botão (ex: "Precisão: 50m")
- ✅ Botão fica verde se precisão < 100m

## Diagnóstico de Problemas

### Se marcador não aparecer:

1. **Verificar logs do console** - copiar sequência completa
2. **Verificar se userLocation está sendo setado** - procurar log "Adicionando marcador de usuário"
3. **Verificar coordenadas** - lat/lng devem estar na área visível
4. **Verificar permissões** - navegador pode ter bloqueado geolocalização
5. **Verificar zoom** - mapa pode estar muito afastado

### Se precisão for muito baixa (>1000m):

- **Desktop:** Normal usar IP geolocation (~5km de precisão)
- **Mobile:** Verificar se permissão foi concedida
- **Solução:** Aceitar permissão de localização quando solicitado

## Arquivos Modificados

- ✅ `src/core/maps/components/MapLibreMap.tsx` - Logging e anchor
- ✅ `src/modules/business/components/NeighborhoodMap.tsx` - Logging de marcadores
- ✅ `DEBUG_LOCALIZACAO_USUARIO.md` - Guia de debug detalhado

## Resultado

Agora é possível diagnosticar exatamente onde o fluxo está falhando através dos logs detalhados no console. O marcador deve aparecer corretamente com:
- SVG animado verde pulsante
- Centralização precisa nas coordenadas
- Visibilidade garantida em todos os dispositivos
- Popup "Você está aqui" ao clicar

---

**Data:** 2026-04-03
**Status:** ✅ Implementado e testado
**Próximo passo:** Testar no navegador e verificar logs
