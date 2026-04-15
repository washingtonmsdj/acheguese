# Core Safety

SSOT (Single Source of Truth) para segurança, emergência, incidentes e compartilhamento.

## Responsabilidades

- Alertas de emergência (SOS, botão de pânico)
- Compartilhamento seguro de viagens
- Registro e gerenciamento de incidentes
- Evidências de segurança
- Auditoria de ações críticas

## Estrutura

```
safety/
├── types/           # Tipos canônicos
│   └── index.ts     # EmergencyAlert, RideShare, SafetyIncident, etc.
├── services/        # Lógica de negócio
│   └── SafetyService.ts
├── hooks/           # Hooks React
│   ├── useEmergencyAlert.ts
│   ├── useRideShare.ts
│   └── useSafetyIncident.ts
├── instance.ts      # Singleton instance
└── index.ts         # Barrel exports
```

## Uso

### Alerta de Emergência

```typescript
import { useEmergencyAlert } from '@/core/safety';

function EmergencyButton() {
  const { createAlert } = useEmergencyAlert();
  
  const handleEmergency = async () => {
    await createAlert.mutateAsync({
      profileId: userId,
      rideId: currentRideId,
      alertType: 'sos',
      location: { latitude, longitude },
      metadata: { driverName, vehiclePlate },
    });
  };
  
  // ...
}
```

### Compartilhamento de Viagem

```typescript
import { useRideShare } from '@/core/safety';

function ShareRideButton({ rideId }) {
  const { createShare } = useRideShare();
  
  const handleShare = async () => {
    const result = await createShare.mutateAsync({
      rideId,
      createdBy: userId,
      expiresInHours: 24,
    });
    
    if (result.success) {
      // result.data.shareUrl
    }
  };
  
  // ...
}
```

### Tracking de Viagem Compartilhada

```typescript
import { useSharedRideData } from '@/core/safety';

function TrackRidePage({ shareToken }) {
  const { data: rideData, isLoading } = useSharedRideData(shareToken);
  
  // rideData contém: status, origin, destination, currentLocation, etc.
}
```

### Service Direto

```typescript
import { safetyService } from '@/core/safety';

// Criar alerta
const result = await safetyService.createEmergencyAlert({
  profileId,
  alertType: 'sos',
  location: { latitude, longitude },
});

// Criar compartilhamento
const share = await safetyService.createRideShare({
  rideId,
  createdBy: userId,
});

// Obter dados de viagem compartilhada
const rideData = await safetyService.getSharedRideData(shareToken);
```

## Regras

- ZERO acessos diretos ao supabase fora do SafetyService
- Todas as operações de safety passam por SafetyService
- Hooks são a interface preferencial para componentes
- Auditoria automática de ações críticas

## Integração com Mobility

O módulo `modules/mobility` deve consumir `core/safety` para:
- Botão de emergência
- Compartilhamento de corrida
- Registro de incidentes

Regras de corrida (aceite, cancelamento, estados operacionais) permanecem em `modules/mobility`.