# 🗺️ AUDITORIA: Consolidação dos Mapas

**Data:** 2026-04-03  
**Objetivo:** Identificar funcionalidades duplicadas entre NeighborhoodMap e MapaPageV4, e o que precisa ser consolidado no mapa central (MapLibreAdapter)

---

## 📊 COMPARAÇÃO DE FUNCIONALIDADES

### 1️⃣ NeighborhoodMap (Mapa de Empresas do Bairro)
**Localização:** `src/modules/business/components/NeighborhoodMap.tsx`

#### ✅ Funcionalidades Implementadas:
- **Busca de empresas** (Input com ícone Search)
- **Filtro client-side** por nome e categoria
- **Contador de resultados** da busca
- **Botão de localização GPS** com loading state
- **Indicador de precisão GPS** (badge com cor verde/amarelo)
- **Marcador de localização do usuário** ("Você está aqui")
- **Botão de limpar busca** (X no input)
- **Controles visuais** (showControls prop)
- **Polígonos de território** (namedBounds + neighborhoodBounds)
- **Círculo de CEP** (postalCodeBounds)
- **Click em marcadores** (onBusinessClick)
- **FlyTo automático** ao obter localização GPS

#### 🎨 UI/UX:
- Controles no topo esquerdo (busca + localização)
- Background blur nos controles (`bg-background/95 backdrop-blur-sm`)
- Sombras nos controles (`shadow-lg`)
- Feedback visual de precisão GPS
- Ícones Lucide (Search, Navigation, X, Loader2)

---

### 2️⃣ MapaPageV4 (Mapa Central da Plataforma)
**Localização:** `src/core/maps/pages/MapaPageV4.tsx`

#### ✅ Funcionalidades Implementadas:
- **Busca de lugares/endereços** (MapSearchPanel)
- **Seletor territorial** (TerritorySelectorV2)
- **Indicador territorial** (TerritoryIndicator)
- **Toggle de camadas** (MapLayerToggle - businesses, events, alerts, services)
- **Fetch por viewport** (useMapViewportFetch)
- **Debounce de fetch** (400ms)
- **Zoom mínimo** para fetch (minZoom: 10)
- **Múltiplas camadas de dados** (businesses, alerts, events)
- **Filtro territorial** (useTerritoryFilter)
- **Polígonos de território** (useTerritoryPolygon)
- **Marcador de localização do usuário**
- **Botão de localização GPS** (emoji 📍)
- **Indicador de status de geolocalização** (GeolocationStatusIndicator)
- **Loading indicator** (emoji ⏳)

#### 🎨 UI/UX:
- Busca no topo esquerdo
- Seletor territorial no topo direito
- Toggle de camadas no canto inferior esquerdo
- Botão de localização no canto inferior direito
- Indicador de status no topo direito

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. Duplicação de Lógica de Busca
- **NeighborhoodMap:** Busca client-side com filtro por nome/categoria
- **MapaPageV4:** Busca de geocoding (MapSearchPanel)
- **Problema:** Dois tipos de busca diferentes, sem padrão unificado

### 2. Duplicação de Controles de Localização
- **NeighborhoodMap:** Botão com ícone Navigation + loading state + indicador de precisão
- **MapaPageV4:** Botão emoji 📍 + GeolocationStatusIndicator separado
- **Problema:** UX inconsistente entre os mapas

### 3. Duplicação de Marcadores de Usuário
- **Ambos:** Adicionam marcador "Você está aqui" manualmente
- **Problema:** Lógica duplicada que deveria estar no MapLibreAdapter

### 4. Duplicação de FlyTo
- **NeighborhoodMap:** FlyTo ao obter localização GPS
- **MapaPageV4:** FlyTo ao obter localização GPS
- **Problema:** Mesma lógica em dois lugares

### 5. Falta de Padronização de UI
- **NeighborhoodMap:** Controles com backdrop-blur e shadow-lg
- **MapaPageV4:** Controles sem estilo consistente (emojis)
- **Problema:** Experiência visual inconsistente

---

## 🎯 O QUE PRECISA SER CONSOLIDADO NO MAPA CENTRAL

### 🔧 MapLibreAdapter Precisa Receber:

#### 1. Sistema de Busca Unificado
```typescript
interface MapSearchConfig {
  type: 'geocoding' | 'entity-filter' | 'both';
  placeholder?: string;
  onSearch?: (query: string) => void;
  entityFilter?: (entities: any[], query: string) => any[];
}
```

#### 2. Controles de Localização Padronizados
```typescript
interface LocationControlConfig {
  enabled: boolean;
  showAccuracy?: boolean;
  showStatusIndicator?: boolean;
  autoFlyTo?: boolean;
  flyToZoom?: number;
}
```

#### 3. Marcador de Usuário Automático
```typescript
interface UserLocationMarkerConfig {
  enabled: boolean;
  label?: string;
  icon?: string;
  autoAdd?: boolean; // Adiciona automaticamente quando GPS obtém coordenadas
}
```

#### 4. Sistema de Controles Posicionáveis
```typescript
interface MapControlsConfig {
  search?: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' };
  location?: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' };
  layers?: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' };
  territory?: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' };
}
```

#### 5. Estilo de Controles Unificado
```typescript
interface ControlStyleConfig {
  variant: 'default' | 'blur' | 'solid';
  shadow: boolean;
  rounded: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}
```

---

## 📋 PLANO DE CONSOLIDAÇÃO

### Fase 1: Extrair Componentes Reutilizáveis
1. **MapSearchControl** - Busca unificada (geocoding + filtro)
2. **MapLocationControl** - Botão de localização + indicador de precisão
3. **MapLayerControl** - Toggle de camadas
4. **MapTerritoryControl** - Seletor + indicador territorial

### Fase 2: Criar Sistema de Layout de Controles
1. **MapControlsLayout** - Container posicionável para controles
2. **useMapControls** - Hook para gerenciar estado dos controles

### Fase 3: Integrar no MapLibreAdapter
1. Adicionar props de configuração de controles
2. Renderizar controles automaticamente baseado na config
3. Manter API retrocompatível

### Fase 4: Migrar NeighborhoodMap
1. Remover lógica de busca duplicada
2. Remover controles duplicados
3. Usar apenas props de configuração do MapLibreAdapter

### Fase 5: Migrar MapaPageV4
1. Remover componentes de controle inline
2. Usar sistema de controles do MapLibreAdapter
3. Manter apenas lógica de fetch de dados

---

## 🚀 BENEFÍCIOS DA CONSOLIDAÇÃO

### 1. Redução de Código
- **Antes:** ~500 linhas de lógica duplicada
- **Depois:** ~150 linhas de configuração

### 2. Consistência de UX
- Todos os mapas terão a mesma aparência e comportamento
- Controles padronizados em todas as páginas

### 3. Manutenibilidade
- Um único lugar para corrigir bugs de controles
- Mudanças de UI aplicadas automaticamente em todos os mapas

### 4. Testabilidade
- Controles isolados podem ser testados individualmente
- Menos mocks necessários nos testes

### 5. Performance
- Menos re-renders desnecessários
- Lógica de busca otimizada em um único lugar

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Auditoria completa (este documento)
2. ⏳ Criar componentes de controles reutilizáveis
3. ⏳ Implementar sistema de layout de controles
4. ⏳ Integrar no MapLibreAdapter
5. ⏳ Migrar NeighborhoodMap
6. ⏳ Migrar MapaPageV4
7. ⏳ Testes E2E de regressão
8. ⏳ Documentação de uso

---

## 🎨 EXEMPLO DE USO FUTURO

### NeighborhoodMap (Simplificado)
```typescript
<MapLibreAdapter
  styleUrl={DEFAULT_TILE_STYLE.styleUrl}
  territoryPolygons={territoryPolygons}
  markers={markers}
  controls={{
    search: {
      type: 'entity-filter',
      position: 'top-left',
      placeholder: 'Buscar empresas...',
    },
    location: {
      position: 'top-right',
      showAccuracy: true,
      autoFlyTo: true,
    },
  }}
  userLocationMarker={{
    enabled: true,
    autoAdd: true,
  }}
/>
```

### MapaPageV4 (Simplificado)
```typescript
<MapLibreAdapter
  styleUrl={TILE_STYLE_URL}
  territoryPolygons={territoryPolygons}
  markers={legacyMarkers}
  controls={{
    search: {
      type: 'geocoding',
      position: 'top-left',
    },
    location: {
      position: 'bottom-right',
      showStatusIndicator: true,
    },
    layers: {
      position: 'bottom-left',
      layers: ['businesses', 'events', 'alerts'],
    },
    territory: {
      position: 'top-right',
      showSelector: true,
      showIndicator: true,
    },
  }}
/>
```

---

## ✅ CONCLUSÃO

O NeighborhoodMap e o MapaPageV4 têm funcionalidades complementares que precisam ser consolidadas no MapLibreAdapter. A consolidação eliminará duplicação, melhorará a consistência e facilitará a manutenção futura.

**Próximo passo:** Criar os componentes de controles reutilizáveis.
