# Core Pricing

SSOT (Single Source of Truth) para precificação e estimativas.

## Responsabilidades

- Calcular estimativas de preço
- Gerenciar regras de precificação por modalidade
- Aplicar multiplicadores (horário de pico, customizados)
- Gerar detalhamento de preço
- Suportar múltiplos modos (ride, delivery, mototaxi, motoboy)

## Estrutura

```
pricing/
├── types/           # Tipos canônicos
│   └── index.ts     # PricingMode, PriceEstimate, PricingRule, etc.
├── services/        # Lógica de negócio
│   └── PricingService.ts
├── hooks/           # Hooks React
│   ├── usePriceEstimate.ts
│   └── usePricingRules.ts
├── instance.ts      # Singleton instance
└── index.ts         # Barrel exports
```

## Uso

### Estimativa de Preço

```typescript
import { usePriceEstimate } from '@/core/pricing';

function RouteEstimator() {
  const { data: estimate, isLoading } = usePriceEstimate({
    mode: 'ride',
    origin: { latitude: -12.975, longitude: -38.476 },
    destination: { latitude: -12.980, longitude: -38.480 },
    options: {
      includeBreakdown: true,
      applyPeakHours: true,
    },
  });
  
  // estimate.estimatedPrice
  // estimate.breakdown
  // estimate.metadata
}
```

### Estimativa Rápida

```typescript
import { useQuickPriceEstimate } from '@/core/pricing';

function QuickEstimate({ distanceKm, durationMinutes }) {
  const { data: price } = useQuickPriceEstimate(
    'ride',
    distanceKm,
    durationMinutes
  );
  
  return <span>R$ {price?.toFixed(2)}</span>;
}
```

### Service Direto

```typescript
import { pricingService } from '@/core/pricing';

// Calcular estimativa
const estimate = await pricingService.calculateEstimate({
  mode: 'ride',
  origin: { latitude, longitude },
  destination: { latitude, longitude },
  options: { includeBreakdown: true },
});

// Estimativa rápida
const price = await pricingService.calculateQuickEstimate(
  'ride',
  distanceKm,
  durationMinutes
);

// Obter regra
const rule = await pricingService.getRule('ride');

// Atualizar regra
await pricingService.updateRule('ride', {
  baseFare: 6.0,
  pricePerKm: 3.0,
});
```

## Regras

- Separação clara: `core/routing` fornece distância/tempo, `core/pricing` calcula preço
- Suporte a múltiplos modos (ride, delivery, mototaxi, motoboy)
- Multiplicadores de horário de pico configuráveis
- Preparado para pricing dinâmico futuro (não implementado)

## Integração com Mobility

O módulo `modules/mobility` deve consumir `core/pricing` para:
- Estimativas de preço de corridas
- Cálculo de valor final
- Exibição de detalhamento

Regras de corrida (aceite, cancelamento, estados) permanecem em `modules/mobility`.