# MOBILIDADE (MOTOBOY) - REFERÊNCIA RÁPIDA

**Objetivo**: Consulta rápida de APIs, componentes e comandos  
**Público**: Desenvolvedores

---

## 🎯 Componentes Principais

### RequestMotoboyButton
```tsx
import { RequestMotoboyButton } from '@/modules/mobility/components';

<RequestMotoboyButton
  sourceType="business" // ou "gastronomy", "service", "passenger"
  sourceId={businessId}
  businessName="Nome da Empresa" // opcional
  variant="default" // ou "outline", "ghost"
  size="default" // ou "sm", "lg"
  className="custom-class" // opcional
/>
```

### RideHistoryUnified
```tsx
import { RideHistoryUnified } from '@/modules/mobility/components';

<RideHistoryUnified
  variant="full" // ou "compact"
  onRate={(ride) => handleRate(ride)} // opcional
  initialTypeFilter="all" // ou "viagem", "motoboy"
/>
```

### CreateReportModal
```tsx
import { CreateReportModal } from '@/modules/mobility/components';

<CreateReportModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  rideId={rideId}
  rideSummary="Origem → Destino" // opcional
/>
```

---

## 🪝 Hooks Principais

### useDelivery
```tsx
import { useDelivery } from '@/modules/mobility/hooks/useDelivery';

const {
  deliveries,           // Lista de entregas
  activeDelivery,       // Entrega ativa
  isLoading,           // Estado de carregamento
  isSubmitting,        // Estado de submissão
  createDelivery,      // Criar entrega
  cancelDelivery,      // Cancelar entrega
  confirmPickup,       // Confirmar coleta
  startDelivery,       // Iniciar entrega
  confirmDelivery,     // Confirmar entrega
  failDelivery,        // Registrar falha
  refetch,             // Recarregar dados
} = useDelivery('business', businessId);

// Criar entrega
await createDelivery({
  pickupAddressId: '...',
  dropoffAddressId: '...',
  pickupLocationId: '...',
  dropoffLocationId: '...',
  originLat: -23.5505,
  originLng: -46.6333,
  destinationLat: -23.5629,
  destinationLng: -46.6544,
  recipientName: 'Cliente',
  recipientPhone: '11999999999',
  packageDescription: 'Pedido #123',
  sourceType: 'business',
  sourceId: businessId,
});
```

### useRideReports
```tsx
import { useRideReports } from '@/modules/mobility/hooks/useRideReports';

const {
  myReports,           // Meus reports
  isLoading,          // Estado de carregamento
  isSubmitting,       // Estado de submissão
  createReport,       // Criar report
  getRideReports,     // Buscar reports de uma corrida
  refetch,            // Recarregar dados
} = useRideReports();

// Criar report
await createReport({
  rideId: '...',
  reportType: 'safety_concern',
  severity: 'high',
  title: 'Problema de segurança',
  description: 'Descrição detalhada...',
});
```

---

## 🔧 Services Principais

### MotoboyAuthorizationService
```typescript
import { MotoboyAuthorizationService } from '@/modules/mobility/services/MotoboyAuthorizationService';

const result = await MotoboyAuthorizationService.authorize({
  requestingUserId: user.id,
  sourceType: 'business',
  sourceId: businessId,
  pickupLocationId: locationId,
  planTier: 'premium',
});

if (result.authorized) {
  // Prosseguir
} else {
  console.log(result.reason); // ROLLOUT_DISABLED, MISSING_ENTITLEMENT, etc.
}
```

### RideReportsService
```typescript
import { RideReportsService } from '@/modules/mobility/services/RideReportsService';

// Criar report
const result = await RideReportsService.createReport({
  rideId: '...',
  reporterProfileId: '...',
  reporterType: 'passenger',
  reportType: 'safety_concern',
  severity: 'high',
  title: 'Título',
  description: 'Descrição',
});

// Listar reports
const reports = await RideReportsService.listReports({
  status: 'pending',
  severity: 'high',
  limit: 20,
});

// Atualizar report
await RideReportsService.updateReport(reportId, {
  status: 'resolved',
  resolutionNotes: 'Problema resolvido',
});

// Estatísticas
const stats = await RideReportsService.getReportStats();
```

---

## 🔑 Query Keys

```typescript
import { MOBILITY_QUERY_KEYS } from '@/modules/mobility/constants/queryKeys';

// Rides
MOBILITY_QUERY_KEYS.rides(userId)
MOBILITY_QUERY_KEYS.ride(rideId)
MOBILITY_QUERY_KEYS.rideHistory(userId)

// Deliveries
MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId)
MOBILITY_QUERY_KEYS.delivery(deliveryId)

// Reports
MOBILITY_QUERY_KEYS.rideReports(userId)
MOBILITY_QUERY_KEYS.rideReportsByRide(rideId)
MOBILITY_QUERY_KEYS.rideReportsStats()

// Admin
MOBILITY_QUERY_KEYS.adminReports(filters)
MOBILITY_QUERY_KEYS.adminReportsStats()
MOBILITY_QUERY_KEYS.adminMotoboyOperations(filters)
```

---

## 📊 Tipos Principais

### ReportType
```typescript
type ReportType =
  | "safety_concern"
  | "driver_behavior"
  | "passenger_behavior"
  | "route_issue"
  | "payment_issue"
  | "vehicle_condition"
  | "cancellation_abuse"
  | "fraud_suspicion"
  | "other";
```

### ReportSeverity
```typescript
type ReportSeverity = "low" | "medium" | "high" | "critical";
```

### ReportStatus
```typescript
type ReportStatus = "pending" | "under_review" | "resolved" | "dismissed";
```

### SourceType
```typescript
type SourceType = "passenger" | "business" | "gastronomy" | "service" | "admin";
```

---

## 🗄️ Queries SQL Úteis

### Listar Entregas Ativas
```sql
SELECT * FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND status IN ('requested', 'searching_driver', 'driver_assigned', 'in_delivery')
ORDER BY created_at DESC;
```

### Listar Reports Pendentes
```sql
SELECT * FROM ride_reports
WHERE status = 'pending'
ORDER BY severity DESC, reported_at DESC;
```

### Métricas de SLA
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_accept_time_minutes,
  COUNT(CASE WHEN status = 'failed' THEN 1 END)::float / COUNT(*) * 100 as failure_rate
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## 🛣️ Rotas Admin

```
/admin/motoboy-operations     → AdminMotoboyOperations
/admin/reports-passageiros    → AdminReportsPassageirosV2
/admin/motoristas             → AdminMotoristas
/admin/operacoes              → AdminOperacoes
```

---

## 🎨 Cores e Badges

### Severidade
```typescript
const SEVERITY_COLORS = {
  low: "bg-blue-500/20 text-blue-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};
```

### Status
```typescript
const STATUS_COLORS = {
  pending: "bg-yellow-500/20 text-yellow-400",
  under_review: "bg-blue-500/20 text-blue-400",
  resolved: "bg-green-500/20 text-green-400",
  dismissed: "bg-gray-500/20 text-gray-400",
};
```

---

## 🔔 Toasts Padrão

```typescript
import { toast } from 'sonner';

// Sucesso
toast.success('Operação realizada com sucesso');

// Erro
toast.error('Erro ao realizar operação');

// Info
toast.info('Informação importante');

// Warning
toast.warning('Atenção necessária');
```

---

## 📝 Logger

```typescript
import { logger } from '@/shared/utils/logger';

// Info
logger.info('Operação iniciada', { userId, action: 'create' });

// Warning
logger.warn('Situação incomum', { details });

// Error
logger.error('Erro crítico', error, { context });
```

---

## 🔍 Troubleshooting Rápido

### Erro: "Modo motoboy desativado"
```sql
UPDATE locations
SET motoboy_mode_enabled = true
WHERE id = 'UUID_DA_LOCALIZACAO';
```

### Erro: "Plano não permite"
```sql
-- Verificar plano
SELECT plan_tier FROM business_subscriptions
WHERE business_id = 'UUID_DA_EMPRESA';

-- Atualizar plano (se necessário)
UPDATE business_subscriptions
SET plan_tier = 'premium'
WHERE business_id = 'UUID_DA_EMPRESA';
```

### Erro: "Tabela não existe"
```bash
cd supabase
supabase db push
```

---

## 📚 Links Rápidos

- **Guia Rápido**: `MOBILIDADE_GUIA_RAPIDO.md`
- **Comandos**: `MOBILIDADE_COMANDOS_OPERADOR.md`
- **Validação**: `MOBILIDADE_VALIDACAO_RAPIDA.md`
- **Contribuindo**: `MOBILIDADE_CONTRIBUINDO.md`
- **Changelog**: `MOBILIDADE_CHANGELOG.md`
- **Índice**: `MOBILIDADE_INDICE.md`

---

**Última atualização**: 2026-04-19  
**Versão**: 1.0  
**Tempo de consulta**: < 1 minuto por tópico
