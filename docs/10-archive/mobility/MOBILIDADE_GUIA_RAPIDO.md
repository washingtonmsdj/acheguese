# MOBILIDADE (MOTOBOY) - GUIA RÁPIDO DE INÍCIO

**Objetivo**: Começar a usar o módulo de mobilidade em 10 minutos  
**Público**: Desenvolvedores

---

## 🚀 Setup Inicial (5 minutos)

### 1. Aplicar Migrações
```bash
cd supabase
supabase db push
```

### 2. Verificar Ambiente
```bash
# Verificar se as tabelas existem
supabase db diff
```

---

## 💻 Uso Básico

### Solicitar Motoboy (Frontend)

#### Em Dashboard de Empresa
```tsx
import { RequestMotoboyButton } from '@/modules/mobility/components';

function EmpresaDashboard({ businessId }: { businessId: string }) {
  return (
    <RequestMotoboyButton
      sourceType="business"
      sourceId={businessId}
      businessName="Minha Empresa"
    />
  );
}
```

#### Em Dashboard de Gastronomia
```tsx
import { useDelivery } from '@/modules/mobility/hooks/useDelivery';

function GastronomyDashboard({ businessId }: { businessId: string }) {
  const { createDelivery, isSubmitting } = useDelivery('gastronomy', businessId);

  const handleCreateDelivery = async () => {
    const result = await createDelivery({
      pickupAddressId: '...',
      dropoffAddressId: '...',
      pickupLocationId: '...',
      dropoffLocationId: '...',
      originLat: -23.5505,
      originLng: -46.6333,
      destinationLat: -23.5629,
      destinationLng: -46.6544,
      recipientName: 'Cliente',
      packageDescription: 'Pedido #123',
      sourceType: 'gastronomy',
      sourceId: businessId,
    });

    if (result.success) {
      console.log('Entrega criada!');
    }
  };

  return (
    <button onClick={handleCreateDelivery} disabled={isSubmitting}>
      Solicitar Motoboy
    </button>
  );
}
```

### Listar Entregas
```tsx
import { useDelivery } from '@/modules/mobility/hooks/useDelivery';

function MyDeliveries({ businessId }: { businessId: string }) {
  const { deliveries, isLoading } = useDelivery('business', businessId);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {deliveries.map((delivery) => (
        <div key={delivery.id}>
          <p>Status: {delivery.status}</p>
          <p>Origem: {delivery.pickup_address}</p>
          <p>Destino: {delivery.dropoff_address}</p>
        </div>
      ))}
    </div>
  );
}
```

### Criar Report
```tsx
import { CreateReportModal } from '@/modules/mobility/components';

function RideDetails({ rideId }: { rideId: string }) {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <button onClick={() => setReportOpen(true)}>
        Reportar Problema
      </button>

      <CreateReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        rideId={rideId}
        rideSummary="Origem → Destino"
      />
    </>
  );
}
```

### Histórico Consolidado
```tsx
import { RideHistoryUnified } from '@/modules/mobility/components';

function HistoryPage() {
  return (
    <RideHistoryUnified
      variant="full"
      onRate={(ride) => console.log('Avaliar:', ride)}
    />
  );
}
```

---

## 🔐 Validação de Permissões

### Backend (Automático)
O `MotoboyAuthorizationService` valida automaticamente:
- ✅ Rollout territorial
- ✅ Entitlements do plano
- ✅ Ownership/association

Não é necessário validar no frontend.

### Frontend (UI Feedback)
```tsx
import { RequestMotoboyButton } from '@/modules/mobility/components';

// O componente já valida e mostra feedback
<RequestMotoboyButton
  sourceType="business"
  sourceId={businessId}
/>
// Se o plano não permite, mostra mensagem de erro automaticamente
```

---

## 🛠️ Admin

### Console de Operações
```
Rota: /admin/motoboy-operations
Componente: AdminMotoboyOperations
```

**Funcionalidades**:
- Listar entregas motoboy
- Filtrar por status, território, source_type
- Métricas SLA
- Cancelar entregas

### Gestão de Reports
```
Rota: /admin/reports-passageiros
Componente: AdminReportsPassageirosV2
```

**Funcionalidades**:
- Listar reports
- Filtrar por status, severidade, tipo
- Atualizar status (pending → under_review → resolved/dismissed)
- Adicionar notas de resolução

---

## 📊 Query Keys

Use as query keys centralizadas:

```tsx
import { MOBILITY_QUERY_KEYS } from '@/modules/mobility/constants/queryKeys';
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();

  // Invalidar após mutação
  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: MOBILITY_QUERY_KEYS.deliveries('business', businessId)
    });
  };
}
```

---

## 🔍 Troubleshooting

### Erro: "Modo motoboy desativado"
**Causa**: Rollout não habilitado para a localização  
**Solução**: Verificar `locations.motoboy_mode_enabled`

```sql
SELECT id, name, motoboy_mode_enabled
FROM locations
WHERE id = 'UUID_DA_LOCALIZACAO';
```

### Erro: "Plano não permite"
**Causa**: Entitlements insuficientes  
**Solução**: Verificar plano da empresa

```sql
SELECT bp.id, bp.name, bs.plan_tier
FROM business_profiles bp
JOIN business_subscriptions bs ON bp.id = bs.business_id
WHERE bp.id = 'UUID_DA_EMPRESA';
```

### Erro: "Perfil não encontrado"
**Causa**: Usuário sem perfil ativo  
**Solução**: Criar perfil via ProfileService

---

## 📚 Documentação Completa

- **Implementação**: `MOBILIDADE_IMPLEMENTACAO_PROGRESSO.md`
- **Comandos SQL**: `MOBILIDADE_COMANDOS_OPERADOR.md`
- **Validação**: `MOBILIDADE_CHECKLIST_VALIDACAO.md`
- **Índice**: `MOBILIDADE_INDICE.md`

---

## 🎯 Exemplos Completos

### Fluxo Completo: Business → Motoboy → Conclusão

```tsx
import { useDelivery } from '@/modules/mobility/hooks/useDelivery';

function BusinessDeliveryFlow({ businessId }: { businessId: string }) {
  const {
    createDelivery,
    activeDelivery,
    cancelDelivery,
    isSubmitting,
  } = useDelivery('business', businessId);

  // 1. Criar entrega
  const handleCreate = async () => {
    const result = await createDelivery({
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

    if (result.success) {
      console.log('Entrega criada!');
    }
  };

  // 2. Cancelar entrega
  const handleCancel = async () => {
    if (!activeDelivery) return;
    
    const result = await cancelDelivery(
      activeDelivery.id,
      'Cancelado pelo solicitante'
    );

    if (result.success) {
      console.log('Entrega cancelada!');
    }
  };

  return (
    <div>
      {!activeDelivery ? (
        <button onClick={handleCreate} disabled={isSubmitting}>
          Solicitar Motoboy
        </button>
      ) : (
        <div>
          <p>Status: {activeDelivery.status}</p>
          <button onClick={handleCancel}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
```

---

## ⚡ Dicas Rápidas

### Performance
- Use `staleTime` nas queries para reduzir requisições
- Invalide apenas as queries necessárias
- Use `enabled: false` para queries condicionais

### Segurança
- Nunca valide permissões apenas no frontend
- Sempre use o service layer (MotoboyAuthorizationService)
- Auditoria é automática via logger

### UX
- Sempre mostre estados de loading
- Feedback ao usuário via toasts
- Trate estados vazios e erros

---

## 🆘 Suporte

### Dúvidas Técnicas
- Código: JSDoc completo
- Decisões: `ADR-001`
- Progresso: `MOBILIDADE_IMPLEMENTACAO_PROGRESSO.md`

### Dúvidas Operacionais
- Comandos: `MOBILIDADE_COMANDOS_OPERADOR.md`
- Troubleshooting: Queries SQL documentadas

---

**Última atualização**: 2026-04-19  
**Versão**: 1.0  
**Tempo de leitura**: 10 minutos
