# Core Tracking

SSOT (Single Source of Truth) para rastreio de posição, presença e heartbeat.

## Responsabilidades

- Posição em tempo real de entidades (driver, user, vehicle, device)
- Heartbeat automático com throttling
- Status de presença (online/offline/busy/away)
- Histórico mínimo de localização
- Subscriptions de tracking em tempo real
- Controle de frequência de atualização

## Estrutura

```
tracking/
├── types/           # Tipos canônicos
│   └── index.ts     # TrackingPosition, PresenceStatus, HeartbeatPayload, etc.
├── services/        # Lógica de negócio
│   └── TrackingService.ts
├── hooks/           # Hooks React
│   ├── useTracking.ts           # Tracking de entidades
│   └── useGeolocationTracking.ts # Rastreio GPS do dispositivo
├── instance.ts      # Singleton instance
└── index.ts         # Barrel exports
```

## Uso

### Tracking de Entidade

```typescript
import { useTracking } from '@/core/tracking';

function DriverLocation({ driverId }) {
  const { position, status, isConnected, updatePosition } = useTracking({
    entityId: driverId,
    entityType: 'driver',
  });
  
  // ...
}
```

### Rastreio GPS do Dispositivo

```typescript
import { useGeolocationTracking } from '@/core/tracking';

function LocationSender({ driverId }) {
  const { isTracking, currentPosition, startTracking, stopTracking } = 
    useGeolocationTracking({
      entityId: driverId,
      entityType: 'driver',
      updateInterval: 10000, // 10s
    });
  
  // ...
}
```

### Service Direto

```typescript
import { trackingService } from '@/core/tracking';

// Obter posição
const position = await trackingService.getCurrentPosition(driverId, 'driver');

// Atualizar posição
await trackingService.updatePosition(driverId, { latitude, longitude, accuracy });

// Subscrever a atualizações
const subscription = trackingService.subscribeToPosition(
  driverId,
  (position) => console.log('Nova posição:', position),
  'driver'
);

// Cancelar subscription
subscription.unsubscribe();
```

## Regras

- ZERO acessos diretos ao supabase fora do TrackingService
- Todas as subscriptions passam por TrackingService
- Hooks são a interface preferencial para componentes
- Throttling automático para evitar sobrecarga
- Histórico mínimo mantido pelo service

## Integração com Mobility

O módulo `modules/mobility` deve consumir `core/tracking` para:
- Rastreio de motoristas
- Status de presença
- Heartbeat automático

Regras de corrida (aceite, cancelamento, etc.) permanecem em `modules/mobility`.