# GATE 3: CONTRATO AJUSTADO - SNAPSHOT DE FALHA + RESOLUÇÃO

**Data:** 07/04/2026  
**Status:** PRONTO PARA IMPLEMENTAR

---

## CONCEITO: SEPARAÇÃO DE RESPONSABILIDADES

### Snapshot da Falha (Imediato)
O que o motoboy registra no momento da falha:
- O que aconteceu
- Onde está o item
- Qual o destino pretendido

### Resolução da Falha (Posterior)
O que o sistema/admin preenche depois:
- Próxima corrida criada
- Motorista que recebeu
- Responsável pela resolução

---

## CONTRATO AJUSTADO FINAL

### Estrutura Completa

```typescript
interface FailedDeliveryMetadata {
  // ============================================
  // SNAPSHOT DA FALHA (Obrigatório no failDelivery)
  // ============================================
  
  /** Motivo da falha - OBRIGATÓRIO */
  failure_reason: FailureReason;
  
  /** Destino pretendido do item - OBRIGATÓRIO */
  item_destination: ItemDestination;
  
  /** Com quem o item está agora - OBRIGATÓRIO */
  item_current_holder: ItemHolder;
  
  /** Timestamp da falha - OBRIGATÓRIO */
  timestamp: string; // ISO 8601
  
  /** Status da resolução - OBRIGATÓRIO (default: 'pending') */
  resolution_status: ResolutionStatus;
  
  /** Notas de resolução - OBRIGATÓRIO se failure_reason = 'other' */
  resolution_notes?: string;
  
  /** Localização onde falhou - OPCIONAL */
  failed_at_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  
  /** Fotos de evidência - OPCIONAL */
  photos?: string[];
  
  /** Número da tentativa - OPCIONAL */
  attempt_number?: number;
  
  // ============================================
  // RESOLUÇÃO POSTERIOR (Preenchido depois)
  // ============================================
  
  /** ID da próxima corrida - OPCIONAL (preenchido ao criar reentrega) */
  next_ride_id?: string;
  
  /** ID do motorista que recebeu - OPCIONAL (preenchido ao transferir) */
  handoff_driver_profile_id?: string;
  
  /** Responsável pela resolução manual - OPCIONAL (preenchido ao escalar) */
  manual_resolution_owner_profile_id?: string;
  
  /** Timestamp da resolução - OPCIONAL (preenchido ao resolver) */
  resolved_at?: string;
  
  /** Notas da resolução - OPCIONAL (preenchido ao resolver) */
  resolution_action_notes?: string;
}
```

---

## ENUMS

### FailureReason
```typescript
type FailureReason = 
  | 'recipient_unavailable'
  | 'address_not_found'
  | 'address_inaccessible'
  | 'recipient_refused'
  | 'vehicle_issue'
  | 'driver_unavailable'
  | 'safety_issue'
  | 'package_damaged'
  | 'other';
```

### ItemDestination
```typescript
type ItemDestination = 
  | 'return_to_sender'
  | 'handoff_to_another_driver'
  | 'awaiting_manual_resolution'
  | 'held_at_hub';
```

### ItemHolder
```typescript
type ItemHolder = 
  | 'driver'
  | 'sender'
  | 'other_driver'
  | 'hub'
  | 'recipient';
```

### ResolutionStatus
```typescript
type ResolutionStatus = 
  | 'pending'        // Aguardando ação (default)
  | 'in_progress'    // Em resolução
  | 'resolved'       // Resolvido
  | 'escalated';     // Escalado para suporte
```

---

## O QUE É OBRIGATÓRIO NO `failDelivery()` INICIAL

### Campos Obrigatórios ✅
1. `failure_reason` - Motivo da falha
2. `item_destination` - Destino pretendido
3. `item_current_holder` - Com quem está
4. `timestamp` - Quando falhou
5. `resolution_status` - Status (default: 'pending')

### Campos Condicionais ✅
- `resolution_notes` - OBRIGATÓRIO se `failure_reason = 'other'`

### Campos Opcionais ✅
- `failed_at_location` - Localização da falha
- `photos` - Fotos de evidência
- `attempt_number` - Número da tentativa

### Exemplo de Chamada Inicial

```typescript
await RideOperationalService.failDelivery(
  rideId,
  driverProfileId,
  {
    failure_reason: 'recipient_unavailable',
    item_destination: 'return_to_sender',
    item_current_holder: 'driver',
    timestamp: new Date().toISOString(),
    resolution_status: 'pending',
    failed_at_location: {
      lat: -23.5505,
      lng: -46.6333,
      address: 'Rua X, 123'
    },
    photos: ['url1', 'url2'],
    attempt_number: 1
  }
);
```

---

## O QUE FICA PARA RESOLUÇÃO POSTERIOR

### Campos de Resolução (Opcionais no Início) ✅

1. **`next_ride_id`**
   - Preenchido quando: Sistema cria corrida de reentrega/devolução
   - Quem preenche: Sistema automaticamente ou admin manualmente
   - Exemplo: Criar corrida de devolução ao remetente

2. **`handoff_driver_profile_id`**
   - Preenchido quando: Item transferido para outro motoboy
   - Quem preenche: Sistema ao atribuir novo motorista
   - Exemplo: Transferir para motoboy mais próximo

3. **`manual_resolution_owner_profile_id`**
   - Preenchido quando: Caso escalado para resolução manual
   - Quem preenche: Admin ao assumir responsabilidade
   - Exemplo: Suporte assume caso complexo

4. **`resolved_at`**
   - Preenchido quando: Resolução concluída
   - Quem preenche: Sistema ao finalizar resolução
   - Exemplo: Item devolvido com sucesso

5. **`resolution_action_notes`**
   - Preenchido quando: Resolução concluída
   - Quem preenche: Sistema ou admin
   - Exemplo: "Item devolvido ao remetente em 07/04/2026"

### Fluxo de Resolução

```typescript
// 1. Motoboy registra falha (imediato)
await failDelivery(rideId, driverProfileId, {
  failure_reason: 'recipient_unavailable',
  item_destination: 'return_to_sender',
  item_current_holder: 'driver',
  timestamp: new Date().toISOString(),
  resolution_status: 'pending'
});

// 2. Sistema cria corrida de devolução (posterior)
const returnRideId = await createReturnRide(originalRideId);

// 3. Sistema atualiza metadata com resolução (posterior)
await updateFailedDeliveryResolution(originalRideId, {
  next_ride_id: returnRideId,
  resolution_status: 'in_progress'
});

// 4. Devolução concluída (posterior)
await updateFailedDeliveryResolution(originalRideId, {
  resolution_status: 'resolved',
  resolved_at: new Date().toISOString(),
  resolution_action_notes: 'Item devolvido ao remetente com sucesso'
});
```

---

## COMO FICA O `resolution_status`

### Estados do `resolution_status` ✅

**1. `pending` (Default)**
- Estado inicial ao registrar falha
- Item aguardando ação
- Nenhum campo de resolução preenchido

**2. `in_progress`**
- Resolução iniciada
- Pode ter `next_ride_id` ou `handoff_driver_profile_id` preenchido
- Ação em andamento

**3. `resolved`**
- Resolução concluída
- `resolved_at` preenchido
- Item chegou ao destino final

**4. `escalated`**
- Caso escalado para suporte
- `manual_resolution_owner_profile_id` preenchido
- Requer intervenção manual

### Transições Válidas

```
pending → in_progress → resolved
pending → escalated → resolved
pending → escalated → in_progress → resolved
```

### Exemplo de Uso

```typescript
// Ao registrar falha
resolution_status: 'pending'

// Ao criar corrida de devolução
resolution_status: 'in_progress'

// Ao escalar para suporte
resolution_status: 'escalated'

// Ao concluir devolução
resolution_status: 'resolved'
```

---

## MIGRATION/CONSTRAINT AJUSTADA

### Migration SQL

```sql
-- Adicionar coluna
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS failed_delivery_metadata JSONB;

-- Constraint: Campos obrigatórios no snapshot da falha
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_snapshot
  CHECK (
    (status != 'failed_delivery') OR
    (
      status = 'failed_delivery' AND
      failed_delivery_metadata IS NOT NULL AND
      failed_delivery_metadata->>'failure_reason' IS NOT NULL AND
      failed_delivery_metadata->>'item_destination' IS NOT NULL AND
      failed_delivery_metadata->>'item_current_holder' IS NOT NULL AND
      failed_delivery_metadata->>'timestamp' IS NOT NULL AND
      failed_delivery_metadata->>'resolution_status' IS NOT NULL
    )
  );

-- Constraint: resolution_notes obrigatório se failure_reason = 'other'
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_other_notes
  CHECK (
    (status != 'failed_delivery') OR
    (failed_delivery_metadata->>'failure_reason' != 'other' OR 
     failed_delivery_metadata->>'resolution_notes' IS NOT NULL)
  );

-- Constraint: item_current_holder não pode ser 'recipient' em failed
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_holder
  CHECK (
    (status != 'failed_delivery') OR
    (failed_delivery_metadata->>'item_current_holder' != 'recipient')
  );

-- Índice GIN para queries
CREATE INDEX IF NOT EXISTS idx_ride_requests_failed_delivery_metadata
  ON ride_requests USING GIN (failed_delivery_metadata)
  WHERE status = 'failed_delivery';

-- Índice para resolution_status
CREATE INDEX IF NOT EXISTS idx_ride_requests_resolution_status
  ON ride_requests ((failed_delivery_metadata->>'resolution_status'))
  WHERE status = 'failed_delivery';

COMMENT ON COLUMN ride_requests.failed_delivery_metadata IS 
  'Snapshot da falha (imediato) + resolução posterior (opcional)';
```

### Mudanças em Relação ao Contrato Anterior

**Removido:**
- ❌ Obrigatoriedade de `next_ride_id` no momento da falha
- ❌ Obrigatoriedade de `handoff_driver_profile_id` no momento da falha
- ❌ Obrigatoriedade de `manual_resolution_owner_profile_id` no momento da falha
- ❌ Constraints condicionais complexos de resolução

**Adicionado:**
- ✅ `resolution_status` obrigatório (default: 'pending')
- ✅ Separação clara entre snapshot e resolução
- ✅ Constraint simples apenas para snapshot

**Mantido:**
- ✅ Campos obrigatórios do snapshot
- ✅ `resolution_notes` obrigatório se `failure_reason = 'other'`
- ✅ Bloqueio de `item_current_holder = 'recipient'`

---

## VALIDAÇÃO TYPESCRIPT AJUSTADA

### Validação no `failDelivery()`

```typescript
function validateFailedDeliverySnapshot(metadata: FailedDeliveryMetadata): void {
  // Campos obrigatórios do snapshot
  if (!metadata.failure_reason || 
      !metadata.item_destination || 
      !metadata.item_current_holder || 
      !metadata.timestamp) {
    throw new Error('Campos obrigatórios do snapshot ausentes');
  }
  
  // Default de resolution_status
  if (!metadata.resolution_status) {
    metadata.resolution_status = 'pending';
  }
  
  // Validar enum de failure_reason
  const validReasons: FailureReason[] = [
    'recipient_unavailable', 'address_not_found', 'address_inaccessible',
    'recipient_refused', 'vehicle_issue', 'driver_unavailable',
    'safety_issue', 'package_damaged', 'other'
  ];
  
  if (!validReasons.includes(metadata.failure_reason)) {
    throw new Error('failure_reason inválido');
  }
  
  // resolution_notes obrigatório se failure_reason = 'other'
  if (metadata.failure_reason === 'other' && !metadata.resolution_notes) {
    throw new Error('resolution_notes obrigatório quando failure_reason = other');
  }
  
  // Bloquear item_current_holder = 'recipient'
  if (metadata.item_current_holder === 'recipient') {
    throw new Error('item_current_holder não pode ser recipient em failed_delivery');
  }
}
```

### Função de Atualização de Resolução (Nova)

```typescript
static async updateFailedDeliveryResolution(
  rideId: string,
  resolutionUpdate: {
    next_ride_id?: string;
    handoff_driver_profile_id?: string;
    manual_resolution_owner_profile_id?: string;
    resolution_status?: ResolutionStatus;
    resolved_at?: string;
    resolution_action_notes?: string;
  }
): Promise<TransitionResult> {
  // Buscar metadata atual
  const { data: ride } = await supabase
    .from('ride_requests')
    .select('failed_delivery_metadata')
    .eq('id', rideId)
    .single();
  
  if (!ride || !ride.failed_delivery_metadata) {
    return { success: false, error: 'Falha não encontrada' };
  }
  
  // Merge com metadata existente
  const updatedMetadata = {
    ...ride.failed_delivery_metadata,
    ...resolutionUpdate
  };
  
  // Atualizar banco
  await supabase
    .from('ride_requests')
    .update({ failed_delivery_metadata: updatedMetadata })
    .eq('id', rideId);
  
  return { success: true, rideId };
}
```

---

## VEREDITO

### Contrato Ajustado Final ✅
- Separação clara entre snapshot e resolução
- Campos obrigatórios apenas no momento da falha
- Campos de resolução opcionais e preenchidos depois

### O que é Obrigatório no `failDelivery()` Inicial ✅
- `failure_reason`
- `item_destination`
- `item_current_holder`
- `timestamp`
- `resolution_status` (default: 'pending')
- `resolution_notes` (se `failure_reason = 'other'`)

### O que Fica para Resolução Posterior ✅
- `next_ride_id`
- `handoff_driver_profile_id`
- `manual_resolution_owner_profile_id`
- `resolved_at`
- `resolution_action_notes`

### Como Fica o `resolution_status` ✅
- Obrigatório no snapshot (default: 'pending')
- Estados: pending → in_progress → resolved
- Pode escalar: pending → escalated → resolved

### Migration/Constraint Mudou ✅
- Constraint simplificada (apenas snapshot)
- Removida obrigatoriedade de campos de resolução
- Adicionado índice para `resolution_status`

---

## CONCLUSÃO

**PRONTO PARA IMPLEMENTAR ✅**

Contrato ajustado que:
- Não trava operação do motoboy
- Permite registro imediato da falha
- Permite resolução posterior assíncrona
- Mantém rastreamento completo
- Sem inflar state machine

**Implementação:** ~2h (migration + código + testes)  
**Complexidade:** Baixa  
**Operacionalidade:** Alta (não bloqueia motoboy)  
**Rastreabilidade:** Completa

---

**RECOMENDAÇÃO:** Implementar agora para fechar Gate 3 com rastreamento operacional completo.
