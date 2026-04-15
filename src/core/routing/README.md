# Core Routing - SSOT para Roteamento

**Status**: ✅ COMPLETO  
**Versão**: 1.0.0  
**Data**: 2026-04-06

---

## Visão Geral

Módulo transversal responsável por **roteamento, ETA e cálculo de distâncias**.

**SSOT** para qualquer funcionalidade de routing no projeto.

---

## Responsabilidades

### O que este módulo faz ✅

- Calcular rotas entre pontos
- Calcular ETA (tempo estimado de chegada)
- Calcular matriz de distâncias
- Abstrair provider específico (Mock, OSRM, Valhalla, etc)
- Validar requisições de routing
- Normalizar respostas
- Formatar distâncias e durações

### O que este módulo NÃO faz ❌

- Renderizar mapas (use `core/maps`)
- Gerenciar territórios (use `core/location`)
- Geocoding (use `core/geocoding` - futuro)
- Lógica de negócio de mobilidade (use `modules/mobility`)

---

## Estrutura

```
src/core/routing/
├── types/
│   └── index.ts              # Tipos SSOT (TransportProfile, RouteRequest, etc)
├── services/
│   ├── RoutingService.ts     # Service principal
│   ├── formatters.ts         # Utilitários de formatação
│   └── index.ts
├── hooks/
│   ├── useRouting.ts         # Hook React para routing
│   ├── useAppUrls.ts         # Hooks de navegação (existentes)
│   └── index.ts
├── instance.ts               # Instância singleton
├── index.ts                  # Barrel exports
└── README.md
```

---

## Uso Básico

### 1. Calcular ETA Simples

```typescript
import { routingService } from '@/core/routing';

const eta = await routingService.calculateSimpleETA(
  { latitude: -12.9714, longitude: -38.5014 },
  { latitude: -12.9800, longitude: -38.5100 },
  'car'
);

console.log(eta.durationSeconds); // 180
console.log(eta.distanceMeters);  // 2500
```

### 2. Calcular Rota Completa

```typescript
import { routingService } from '@/core/routing';

const response = await routingService.calculateRoute({
  origin: { latitude: -12.9714, longitude: -38.5014 },
  destination: { latitude: -12.9800, longitude: -38.5100 },
  options: {
    profile: 'car',
    alternatives: true,
    maxAlternatives: 2,
  },
});

const route = response.primaryRoute;
console.log(route.distanceMeters);
console.log(route.durationSeconds);
console.log(route.geometry); // Coordenadas da rota
```

### 3. Usar Hook React

```typescript
import { useRouting } from '@/core/routing';

function MyComponent() {
  const { calculateSimpleETA, loading, error } = useRouting();

  const handleCalculate = async () => {
    const eta = await calculateSimpleETA(origin, destination, 'car');
    if (eta) {
      console.log(`ETA: ${eta.durationSeconds}s`);
    }
  };

  return (
    <button onClick={handleCalculate} disabled={loading}>
      Calcular ETA
    </button>
  );
}
```

### 4. Formatar Valores

```typescript
import { formatDistance, formatDuration } from '@/core/routing';

formatDistance(2500);  // "2.5 km"
formatDistance(850);   // "850 m"

formatDuration(180);   // "3 min"
formatDuration(3900);  // "1h 5min"
```

---

## Perfis de Transporte

```typescript
type TransportProfile = 
  | 'car'           // Carro
  | 'motorcycle'    // Moto
  | 'foot'          // A pé
  | 'bicycle';      // Bicicleta
```

**Mapeamento de perfis legados**:
- `driving` → `car`
- `walking` → `foot`
- `cycling` → `bicycle`
- `transit` → `car` (fallback)

---

## Providers

### MockRoutingProvider (Atual)

Provider mock para desenvolvimento. Calcula rotas em linha reta usando Haversine.

**Localização**: `src/integrations/maps/providers/MockRoutingProvider.ts`

**Características**:
- ✅ Cálculo de distância (Haversine)
- ✅ Estimativa de ETA baseada em velocidade média
- ✅ Geometria simplificada (linha reta)
- ❌ Sem rotas reais
- ❌ Sem instruções de navegação

### Providers Futuros

**OSRM** (Open Source Routing Machine):
- Routing real baseado em OSM
- Instruções de navegação
- Rotas alternativas
- Gratuito e self-hosted

**Valhalla**:
- Routing avançado
- Múltiplos perfis de transporte
- Isócronas
- Gratuito e self-hosted

**Google Maps Directions API**:
- Routing comercial
- Tráfego em tempo real
- Pago

---

## Trocar Provider

```typescript
import { reconfigureRoutingProvider } from '@/core/routing';
import { osrmProvider } from '@/integrations/maps/providers/OSRMProvider';

// Trocar de Mock para OSRM
reconfigureRoutingProvider(osrmProvider);

// Todos os consumidores continuam funcionando sem mudanças
```

---

## Integração com Módulos

### Mobility

```typescript
// modules/mobility/hooks/useDriverLocation.ts
import { routingService } from '@/core/routing';

const eta = await routingService.calculateSimpleETA(
  driverLocation,
  destination,
  'car'
);
```

### Maps

```typescript
// core/maps/components/RouteLayer.tsx
import { useRouting } from '@/core/routing';

const { calculateRoute } = useRouting();
const response = await calculateRoute(request);
```

---

## Validações

### Coordenadas
- ✅ Latitude: -90 a 90
- ✅ Longitude: -180 a 180
- ✅ Tipo number obrigatório

### Requisições
- ✅ Origem e destino obrigatórios
- ✅ Perfil de transporte obrigatório
- ✅ Waypoints opcionais validados

---

## Arquitetura

### Camadas

```
┌─────────────────────────────────────────┐
│         MODULES (mobility, maps)        │
│  Componentes, páginas, lógica de UI     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           CORE/ROUTING (SSOT)           │
│  RoutingService, tipos, hooks           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      INTEGRATIONS/MAPS/PROVIDERS        │
│  MockRoutingProvider, OSRMProvider      │
└─────────────────────────────────────────┘
```

### Fluxo de Dados

```
Component → useRouting() → routingService → provider → response
```

---

## Regras de Importação

### ✅ PERMITIDO

```typescript
// Módulos importam de core/routing
import { routingService, useRouting } from '@/core/routing';

// core/routing importa de core/maps (apenas tipos)
import type { Coordinates } from '@/core/maps/types';

// Providers implementam interface de core/routing
import type { RoutingProvider } from '@/core/routing/types';
```

### ❌ PROIBIDO

```typescript
// NUNCA importar provider diretamente em módulo
import { mockRoutingProvider } from '@/integrations/maps'; // ❌

// NUNCA duplicar lógica de routing
function calculateMyOwnETA() { ... } // ❌ Usar routingService

// NUNCA calcular rota em componente
const distance = haversine(lat1, lng1, lat2, lng2); // ❌ Usar routingService
```

---

## Migração de Código Legado

### Antes (Código Espalhado)

```typescript
// ❌ Lógica de ETA duplicada em componente
const R = 6371;
const dLat = ((destLat - location.latitude) * Math.PI) / 180;
const dLon = ((destLng - location.longitude) * Math.PI) / 180;
const a = Math.sin(dLat / 2) ** 2 + ...;
const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
setEta(`${Math.round(dist * 3)} min`);
```

### Depois (SSOT)

```typescript
// ✅ Service SSOT
const eta = await routingService.calculateSimpleETA(
  origin,
  destination,
  'car'
);
setEta(formatDuration(eta.durationSeconds));
```

---

## Pendências Futuras

**NÃO implementado ainda**:
- ❌ Provider real (OSRM/Valhalla)
- ❌ Matriz de distâncias completa
- ❌ Isócronas
- ❌ Map matching
- ❌ Tráfego em tempo real
- ❌ Rotas com múltiplos waypoints
- ❌ Otimização de rotas

**Implementado**:
- ✅ Tipos SSOT completos
- ✅ RoutingService transversal
- ✅ Hook React (useRouting)
- ✅ MockRoutingProvider funcional
- ✅ Formatadores (distância, duração)
- ✅ Validações
- ✅ Perfis de transporte (car, motorcycle, foot, bicycle)
- ✅ Integração com mobility
- ✅ Compatibilidade com código existente

---

**Versão**: 1.0.0  
**Status**: ✅ COMPLETO
