# Correção: Visibilidade no Mobile - Marcador e Indicadores

## Problema Reportado
No mobile:
- Indicador de precisão não aparece
- Marcador de localização do usuário não é visível

## Causa Raiz
1. **Z-index baixo** - Controles com z-10 podem ser cobertos pelo mapa
2. **Marcador pequeno** - 44x44px é difícil de ver em telas pequenas
3. **Pointer events** - Controles sem pointer-events corretos
4. **Popup não abre automaticamente** - Usuário não sabe onde está o marcador

## Soluções Implementadas

### 1. Z-index Aumentado nos Controles

**Antes:**
```tsx
<div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
```

**Depois:**
```tsx
<div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
  {/* Cada controle individual tem pointer-events-auto */}
  <div className="flex gap-2 pointer-events-auto">
```

**Benefícios:**
- z-[1000] garante que controles fiquem acima do mapa
- pointer-events-none no container evita bloquear interações do mapa
- pointer-events-auto nos controles permite cliques

### 2. Marcador Maior e Mais Visível

**Antes:**
```tsx
el.style.cssText = [
  'width:44px', 'height:44px',
  'z-index:1000',
].join(';');

el.innerHTML = `
  <svg width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="12" fill="#10b981" stroke="white" stroke-width="3"/>
    <circle cx="22" cy="22" r="5" fill="white"/>
  </svg>
`;
```

**Depois:**
```tsx
el.style.cssText = [
  'width:60px', 'height:60px',  // ← 36% maior
  'z-index:10000',               // ← 10x maior
  'pointer-events:auto',
].join(';');

el.innerHTML = `
  <svg width="60" height="60" viewBox="0 0 60 60">
    <!-- Círculo externo pulsante maior -->
    <circle cx="30" cy="30" r="28" fill="#10b981" opacity="0.2">
      <animate attributeName="r" from="20" to="28" dur="1.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <!-- Círculo principal maior -->
    <circle cx="30" cy="30" r="16" fill="#10b981" stroke="white" stroke-width="4"/>
    <!-- Ponto central maior -->
    <circle cx="30" cy="30" r="7" fill="white"/>
  </svg>
`;
```

**Benefícios:**
- 60x60px é muito mais visível em mobile
- z-index:10000 garante que fica acima de tudo
- Animação pulsante mais ampla (r="28")
- Círculos maiores e mais grossos

### 3. Popup Automático para Marcador de Usuário

**Antes:**
```tsx
if (marker.label) {
  m.setPopup(
    new maplibregl.Popup({ offset: 16, closeButton: false })
      .setHTML(`<div>${marker.label}</div>`)
  );
}
```

**Depois:**
```tsx
if (marker.label) {
  const popup = new maplibregl.Popup({ 
    offset: isUserLocation ? 30 : 16,  // Offset maior para marcador de usuário
    closeButton: false,
    className: isUserLocation ? 'user-location-popup' : '',
  }).setHTML(`<div style="font-size:13px;font-weight:600;padding:4px 8px">${marker.label}</div>`);
  
  m.setPopup(popup);
  
  // Abrir popup automaticamente para marcador de usuário
  if (isUserLocation) {
    m.togglePopup();
  }
}
```

**Benefícios:**
- Popup abre automaticamente mostrando "Você está aqui"
- Offset maior (30px) evita sobreposição com marcador grande
- Classe CSS customizada permite estilização específica

### 4. Logging Detalhado

Adicionado logs para debug:
```tsx
console.log('🔍 [NeighborhoodMap] userLocation atual:', userLocation);
console.log('🗺️ Atualizando centro do mapa para:', [coords.latitude, coords.longitude]);
console.log('✅ Marcador de usuário criado com SVG (60x60px)');
```

## Comparação Visual

### Desktop
- **Antes:** Marcador 44x44px, pode ser difícil de ver
- **Depois:** Marcador 60x60px, muito mais visível

### Mobile
- **Antes:** Marcador invisível, controles cobertos
- **Depois:** Marcador grande e pulsante, controles sempre visíveis

## Tamanhos dos Elementos

| Elemento | Antes | Depois | Aumento |
|----------|-------|--------|---------|
| Marcador usuário | 44x44px | 60x60px | +36% |
| Círculo principal | r=12 | r=16 | +33% |
| Círculo pulsante | r=20 | r=28 | +40% |
| Ponto central | r=5 | r=7 | +40% |
| Z-index controles | 10 | 1000 | +9900% |
| Z-index marcador | 1000 | 10000 | +900% |

## Como Testar no Mobile

### 1. Abrir DevTools Mobile Emulation
- F12 → Toggle device toolbar (Ctrl+Shift+M)
- Selecionar dispositivo (ex: iPhone 12 Pro)

### 2. Navegar para Página
```
http://localhost:5173/empresas-landing
```

### 3. Clicar no Botão de Localização
- Botão com ícone de navegação no canto superior direito

### 4. Verificar Visualmente

**Deve aparecer:**
- ✅ Marcador verde grande e pulsante
- ✅ Popup "Você está aqui" aberto automaticamente
- ✅ Indicador de precisão abaixo do botão
- ✅ Mapa anima para sua localização

**Logs esperados:**
```
🔍 [NeighborhoodMap] userLocation atual: {latitude: -12.9822, longitude: -38.4812, accuracy: 2000}
🗺️ Atualizando centro do mapa para: [-12.9822, -38.4812]
📍 [NeighborhoodMap] Adicionando marcador de usuário: {lat: -12.9822, lng: -38.4812, accuracy: 2000}
✅ Marcador de usuário criado com SVG (60x60px)
✅ Marcador adicionado ao mapa: Você está aqui
```

## Arquivos Modificados

1. **src/modules/business/components/NeighborhoodMap.tsx**
   - Z-index aumentado para z-[1000]
   - Pointer events corrigidos
   - Log de debug adicionado

2. **src/core/maps/components/MapLibreMap.tsx**
   - Marcador aumentado para 60x60px
   - Z-index aumentado para 10000
   - Popup automático para marcador de usuário
   - Offset maior para popup de usuário

## Resultado Esperado

### Mobile
- Marcador verde grande e pulsante claramente visível
- Popup "Você está aqui" aberto automaticamente
- Indicador de precisão sempre visível acima do mapa
- Controles nunca cobertos pelo mapa

### Desktop
- Marcador maior mas não exagerado
- Mesma funcionalidade do mobile
- Melhor visibilidade geral

---

**Data:** 2026-04-03
**Status:** ✅ Implementado
**Próximo teste:** Verificar no mobile real ou emulador
