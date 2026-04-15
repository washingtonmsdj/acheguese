# Debug: Marcador Não Aparece no Mapa

## Problema
O marcador de localização do usuário não aparece no mapa, mesmo com os logs mostrando que foi criado.

## Logs Adicionados

### NeighborhoodMap.tsx
```typescript
console.log('🔍 [NeighborhoodMap] userLocation atual:', userLocation);
console.log('📷 [NeighborhoodMap] Camera atualizada:', {
  center: cam.center,
  zoom: cam.zoom,
  originalLatLng: mapCenter,
});
```

### MapLibreMap.tsx
```typescript
console.log('✈️ [MapLibreMap] Executando flyTo:', {
  center: camera.center,
  zoom: camera.zoom,
});
console.log('📍 [MapLibreMap] Criando marcador em [lng, lat]: [${lng}, ${lat}]', {
  isUserLocation,
  label: marker.label,
});
console.log('🎈 [MapLibreMap] Abrindo popup do marcador de usuário');
```

## Sequência de Logs Esperada

Quando você clicar no botão de localização, deve ver:

```
1. 🎯 Solicitando localização...
2. 🎯 [useRobustGeolocation] Iniciando busca de localização...
3. ✅ Localização recebida via callback: {latitude: X, longitude: Y, accuracy: Z}
4. 🗺️ Atualizando centro do mapa para: [X, Y]
5. 🔍 [NeighborhoodMap] userLocation atual: {latitude: X, longitude: Y, ...}
6. 📍 [NeighborhoodMap] Adicionando marcador de usuário: {lat: X, lng: Y, accuracy: Z}
7. 📊 [NeighborhoodMap] Total de marcadores: N
8. 📷 [NeighborhoodMap] Camera atualizada: {center: [Y, X], zoom: 14}
9. 🗺️ [MapLibreMap] Adicionando marcadores: N
10. 📍 [MapLibreMap] Criando marcador em [lng, lat]: [Y, X] {isUserLocation: true}
11. ✅ Marcador de usuário criado com SVG (60x60px)
12. ✅ Marcador adicionado ao mapa: Você está aqui
13. 🎈 [MapLibreMap] Abrindo popup do marcador de usuário
14. ✈️ [MapLibreMap] Executando flyTo: {center: [Y, X], zoom: 14}
```

## Possíveis Causas

### 1. Coordenadas Invertidas
**Sintoma:** Marcador aparece em local errado (oceano, outro país)
**Causa:** Confusão entre [lat, lng] e [lng, lat]
**Verificar:**
- NeighborhoodMap usa [lat, lng]
- MapLibre usa [lng, lat]
- Camera deve converter: `[mapCenter[1], mapCenter[0]]`

### 2. Zoom Muito Baixo
**Sintoma:** Marcador existe mas não é visível
**Causa:** Zoom muito afastado
**Solução:** Aumentar zoom quando precisão é boa
```typescript
setMapZoom(coords.accuracy < 100 ? 16 : 14);
```

### 3. FlyTo Não Executa
**Sintoma:** Mapa não move para localização
**Causa:** Mapa não está carregado quando flyTo é chamado
**Verificar:** Log "✈️ [MapLibreMap] Executando flyTo" aparece?

### 4. Marcador Fora da Área Visível
**Sintoma:** Marcador criado mas não visível
**Causa:** Coordenadas muito distantes do centro inicial
**Solução:** Verificar se flyTo está movendo o mapa

### 5. Z-index Baixo
**Sintoma:** Marcador coberto por outros elementos
**Causa:** z-index insuficiente
**Verificar:** Marcador tem `z-index:10000`

## Como Debugar

### Passo 1: Verificar Coordenadas
Copie as coordenadas dos logs e cole no Google Maps:
```
https://www.google.com/maps?q=LATITUDE,LONGITUDE
```

Exemplo:
```
https://www.google.com/maps?q=-12.9822,-38.4812
```

Se o local estiver correto, o problema não é de coordenadas.

### Passo 2: Verificar Conversão [lat,lng] → [lng,lat]
Procure no console:
```
📷 [NeighborhoodMap] Camera atualizada: {center: [Y, X], zoom: 14}
```

Verifique se:
- `center[0]` é a LONGITUDE (Y)
- `center[1]` é a LATITUDE (X)

### Passo 3: Verificar FlyTo
Procure no console:
```
✈️ [MapLibreMap] Executando flyTo: {center: [Y, X], zoom: 14}
```

Se NÃO aparecer, o mapa não está movendo para a localização.

### Passo 4: Inspecionar Marcador no DOM
1. Abra DevTools (F12)
2. Vá para Elements/Inspetor
3. Procure por elemento com classe `maplibregl-marker`
4. Verifique:
   - Existe no DOM?
   - Tem `width: 60px; height: 60px`?
   - Tem `z-index: 10000`?
   - Tem SVG dentro?
   - Está com `display: flex`?

### Passo 5: Verificar Posição do Marcador
No console, execute:
```javascript
document.querySelectorAll('.maplibregl-marker').forEach(m => {
  console.log('Marcador:', {
    width: m.style.width,
    height: m.style.height,
    zIndex: m.style.zIndex,
    transform: m.style.transform,
    innerHTML: m.innerHTML.substring(0, 100),
  });
});
```

### Passo 6: Forçar Zoom Máximo
Temporariamente, force zoom alto para testar:
```typescript
setMapZoom(18); // Zoom muito próximo
```

## Soluções Temporárias

### Solução 1: Aumentar Tamanho do Marcador
```typescript
el.style.cssText = [
  'width:100px', 'height:100px', // Muito maior
  'z-index:99999',
].join(';');
```

### Solução 2: Adicionar Borda Vermelha para Debug
```typescript
el.style.cssText = [
  'width:60px', 'height:60px',
  'z-index:10000',
  'border:5px solid red', // Debug visual
  'background:yellow',     // Debug visual
].join(';');
```

### Solução 3: Forçar Recentralização
Adicione um botão de teste:
```typescript
<Button onClick={() => {
  if (userLocation) {
    setMapCenter([userLocation.latitude, userLocation.longitude]);
    setMapZoom(18);
  }
}}>
  Forçar Recentralizar
</Button>
```

## Checklist de Verificação

- [ ] Logs mostram localização sendo obtida?
- [ ] Logs mostram marcador sendo criado?
- [ ] Logs mostram flyTo sendo executado?
- [ ] Coordenadas no Google Maps estão corretas?
- [ ] Marcador existe no DOM (DevTools)?
- [ ] Marcador tem tamanho correto (60x60px)?
- [ ] Marcador tem z-index alto (10000)?
- [ ] Popup "Você está aqui" abre?
- [ ] Indicador de precisão aparece?
- [ ] Mapa anima quando clica no botão?

## Próximos Passos

1. **Recarregue a página** e limpe o console
2. **Clique no botão de localização**
3. **Copie TODOS os logs** do console
4. **Verifique a sequência** de logs acima
5. **Identifique qual log está faltando** ou diferente
6. **Use o checklist** para verificar cada item

---

**Data:** 2026-04-03
**Status:** 🔍 Debugging em andamento
