# GATE 3: CONTRATO FINAL - RASTREAMENTO OPERACIONAL DE ITEM

**Data:** 07/04/2026  
**Status:** PRONTO PARA IMPLEMENTAR

---

## CONTRATO FINAL DE `failed_delivery_metadata`

### Estrutura Completa

```typescript
interface FailedDeliveryMetadata {
  // ============================================
  // CAMPOS OBRIGATÓRIOS
  // ============================================
  
  /** Motivo da falha */
  failure_reason: FailureReason;
  
  /** Destino pretendido do item */
  item_destination: ItemDestination;
  
  /** Com quem o item está agora */
  item_current_holder: ItemHolder;
  
  /** Timestamp da falha */
  timestamp: string; // ISO 8601
  
  // ============================================
  // CAMPOS CONDICIONAIS (obrigatórios em certos cenários)
  // ============================================
  
  /** Notas de resolução - OBRIGATÓRIO se failure_reason = 'other' */
  resolution_notes?: string;
  
  /** ID da próxima corrida - OBRIGATÓRIO se item_destination = 'handoff_to_another_driver' ou 'return_to_sender' */
  next_ride_id?: string;
  
  /** ID do motorista que recebeu - OBRIGATÓRIO se item_destination = 'handoff_to_another_driver' */
  handoff_driver_profile_id?: string;
  
  /** Responsável pela resolução manual - OBRIGATÓRIO se item_destination = 'awaiting_manual_resolution' */
  manual_resolution_owner_profile_id?: string;
  
  // ============================================
  // CAMPOS OPERACIONAIS ADICIONAIS
  // ============================================
  
  /** Status da resolução */
  resolution_status?: ResolutionStatus;
  
  /** Localização onde falhou */
  failed_at_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  
  /** Fotos de evidência */
  photos?: string[];
  
  /** Tentativas anteriores */
  attempt_number?: number;
  
  /** Histórico de ações */
  action_history?: Array<{
    action: string;
    timestamp: string;
    actor_profile_id: string;
    notes?: string;
  }>;
}
```

---

## ENUMS

### FailureReason (Obrigatório)
```typescript
type FailureReason = 
  | 'recipient_unavailable'    // Destinatário ausente/não atende
  | 'address_not_found'        // Endereço não existe/incorreto
  | 'address_inaccessible'     // Endereço existe mas inacessível
  | 'recipient_refused'        // Destinatário recusou receber
  | 'vehicle_issue'            // Problema com veículo
  | 'driver_unavailable'       // Motoboy não pode continuar
  | 'safety_issue'             // Problema de segurança
  | 'package_damaged'          // Pacote danificado
  | 'other';                   // Outro (requer resolution_notes)
```

### ItemDestination (Obrigatório)
```typescript
type ItemDestination = 
  | 'return_to_sender'              // Devolver ao remetente
  | 'handoff_to_another_driver'     // Transferir para outro motoboy
  | 'awaiting_manual_resolution'    // Aguardando resolução manual
  | 'held_at_hub';                  // Retido em ponto de apoio (futuro)
```

### ItemHolder (Obrigatório)
```typescript
type ItemHolder = 
  | 'driver'         // Com o motoboy original
  | 'sender'         // Devolvido ao remetente
  | 'other_driver'   // Transferido para outro motoboy
  | 'hub'            // Em ponto de apoio
  | 'recipient';     // Entregue (não deveria estar em failed)
```

### ResolutionStatus (Opcional)
```typescript
type ResolutionStatus = 
  | 'pending'        // Aguardando ação
  | 'in_progress'    // Em resolução
  | 'resolved'       // Resolvido
  | 'escalated';     // Escalado para suporte
```

---

## CAMPOS OBRIGATÓRIOS

### Sempre Obrigatórios ✅
1. `failure_reason` - Motivo da falha
2. `item_destination` - Destino pretendido
3. `item_current_holder` - Com quem está agora
4. `timestamp` - Quando falhou

**Validação:**
```typescript
if (!metadata.failure_reason || 
    !metadata.item_destination || 
    !metadata.item_current_holder || 
    !metadata.timestamp) {
  throw new Error('Campos obrigatórios ausentes');
}
```

---

## CAMPOS CONDICIONAIS

### 1. `resolution_notes` ✅
**Obrigatório quando:** `failure_reason = 'other'`

**Validação:**
```typescript
if (metadata.failure_reason === 'other' && !metadata.resolution_notes) {
  throw new Error('resolution_notes obrigatório quando failure_reason = other');
}
```

### 2. `next_ride_id` ✅
**Obrigatório quando:** 
- `item_destination = 'handoff_to_another_driver'` OU
- `item_destination = 'return_to_sender'`

**Validação:**
```typescript
if ((metadata.item_destination === 'handoff_to_another_driver' || 
     metadata.item_destination === 'return_to_sender') && 
    !metadata.next_ride_id) {
  throw new Error('next_ride_id obrigatório para handoff ou return');
}
```

### 3. `handoff_driver_profile_id` ✅
**Obrigatório quando:** `item_destination = 'handoff_to_another_driver'`

**Validação:**
```typescript
if (metadata.item_destination === 'handoff_to_another_driver' && 
    !metadata.handoff_driver_profile_id) {
  throw new Error('handoff_driver_profile_id obrigatório para handoff');
}
```

### 4. `manual_resolution_owner_profile_id` ✅
**Obrigatório quando:** `item_destination = 'awaiting_manual_resolution'`

**Validação:**
```typescript
if (metadata.item_destination === 'awaiting_manual_resolution' && 
    !metadata.manual_resolution_owner_profile_id) {
  throw new Error('manual_resolution_owner_profile_id obrigatório para manual resolution');
}
```

---

## VALIDAÇÕES DE CONSISTÊNCIA

### 1. Consistência de `item_current_holder` ✅

**Regra:** `item_current_holder` deve ser consistente com `item_destination`

```typescript
// Se destino é handoff, holder deve ser driver ou other_driver
if (metadata.item_destination === 'handoff_to_another_driver') {
  if (metadata.item_current_holder !== 'driver' && 
      metadata.item_current_holder !== 'other_driver') {
    throw new Error('item_current_holder inconsistente com handoff');
  }
}

// Se destino é return, holder deve ser driver ou sender
if (metadata.item_destination === 'return_to_sender') {
  if (metadata.item_current_holder !== 'driver' && 
      metadata.item_current_holder !== 'sender') {
    throw new Error('item_current_holder inconsistente com return');
  }
}

// Se holder é recipient, não deveria estar em failed_delivery
if (metadata.item_current_holder === 'recipient') {
  throw new Error('item_current_holder não pode ser recipient em failed_delivery');
}
```

### 2. Consistência de `next_ride_id` ✅

**Regra:** Se `next_ride_id` existe, corrida deve existir e estar válida

```typescript
if (metadata.next_ride_id) {
  const nextRide = await supabase
    .from('ride_requests')
    .select('id, status, ride_mode')
    .eq('id', metadata.next_ride_id)
    .single();
  
  if (!nextRide.data) {
    throw new Error('next_ride_id inválido: corrida não existe');
  }
  
  if (nextRide.data.ride_mode !== 'motoboy') {
    throw new Error('next_ride_id deve ser corrida de motoboy');
  }
}
```

### 3. Consistência de `handoff_driver_profile_id` ✅

**Regra:** Se `handoff_driver_profile_id` existe, motorista deve existir e estar disponível

```typescript
if (metadata.handoff_driver_profile_id) {
  const driver = await supabase
    .from('driver_data')
    .select('profile_id, can_do_delivery')
    .eq('profile_id', metadata.handoff_driver_profile_id)
    .single();
  
  if (!driver.data) {
    throw new Error('handoff_driver_profile_id inválido: motorista não existe');
  }
  
  if (!driver.data.can_do_delivery) {
    throw new Error('Motorista não habilitado para entregas');
  }
}
```

### 4. Consistência de `manual_resolution_owner_profile_id` ✅

**Regra:** Se `manual_resolution_owner_profile_id` existe, perfil deve existir

```typescript
if (metadata.manual_resolution_owner_profile_id) {
  const owner = await supabase
    .from('profiles')
    .select('id')
    .eq('id', metadata.manual_resolution_owner_profile_id)
    .single();
  
  if (!owner.data) {
    throw new Error('manual_resolution_owner_profile_id inválido: perfil não existe');
  }
}
```

---

## REGRA FINAL DOCUMENTADA

### Depois da Coleta, o Sistema Sempre Responde:

#### 1. Qual foi a falha? ✅
**Campo:** `failure_reason`

**Resposta:** Um dos 9 motivos padronizados ou 'other' com notes

#### 2. Com quem o item está agora? ✅
**Campo:** `item_current_holder`

**Resposta:** driver | sender | other_driver | hub | recipient

#### 3. Qual é o destino do item? ✅
**Campo:** `item_destination`

**Resposta:** return_to_sender | handoff_to_another_driver | awaiting_manual_resolution | held_at_hub

#### 4. Qual é o próximo passo operacional? ✅
**Campos:** `next_ride_id`, `handoff_driver_profile_id`, `manual_resolution_owner_profile_id`, `resolution_status`

**Resposta:**
- Se `return_to_sender`: `next_ride_id` aponta para corrida de devolução
- Se `handoff_to_another_driver`: `next_ride_id` + `handoff_driver_profile_id` apontam para transferência
- Se `awaiting_manual_resolution`: `manual_resolution_owner_profile_id` indica responsável
- Se `held_at_hub`: Localização do hub (futuro)

---

## PRICING

### Regra Atual ✅
- `suggested_price`: Preservado (custo estimado)
- `final_price`: NULL em `failed_delivery`
- Sem cobrança do destinatário em falha

### Futuro (Não Implementar Agora) ⏳
- Taxa de reentrega
- Cobrança parcial por tentativa
- Cobrança de devolução

---

## IMPACTO NO FLUXO ATUAL

### 1. `failDelivery()` - Atualização Obrigatória ✅

**Antes:**
```typescript
static async failDelivery(
  rideId: string,
  driverProfileId: string,
  reason: string
)
```

**Depois:**
```typescript
static async failDelivery(
  rideId: string,
  driverProfileId: string,
  metadata: FailedDeliveryMetadata
): Promise<TransitionResult> {
  // 1. Validar campos obrigatórios
  validateRequiredFields(metadata);
  
  // 2. Validar campos condicionais
  validateConditionalFields(metadata);
  
  // 3. Validar consistência
  await validateConsistency(metadata);
  
  // 4. Atualizar banco
  await supabase
    .from('ride_requests')
    .update({
      failed_delivery_at: new Date().toISOString(),
      failed_delivery_reason: metadata.failure_reason,
      failed_delivery_metadata: metadata,
    })
    .eq('id', rideId);
  
  // 5. Transicionar estado
  return await this.transitionTo(
    rideId,
    RIDE_STATE.FAILED_DELIVERY,
    driverProfileId,
    metadata.failure_reason
  );
}
```

### 2. Migration - Nova Coluna + Constraint ✅

```sql
-- Adicionar coluna
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS failed_delivery_metadata JSONB;

-- Constraint de campos obrigatórios
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_metadata_required
  CHECK (
    (status != 'failed_delivery') OR
    (
      status = 'failed_delivery' AND
      failed_delivery_metadata IS NOT NULL AND
      failed_delivery_metadata->>'failure_reason' IS NOT NULL AND
      failed_delivery_metadata->>'item_destination' IS NOT NULL AND
      failed_delivery_metadata->>'item_current_holder' IS NOT NULL AND
      failed_delivery_metadata->>'timestamp' IS NOT NULL
    )
  );

-- Constraint de campos condicionais
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_metadata_conditional
  CHECK (
    (status != 'failed_delivery') OR
    (
      -- Se failure_reason = 'other', resolution_notes obrigatório
      (failed_delivery_metadata->>'failure_reason' != 'other' OR 
       failed_delivery_metadata->>'resolution_notes' IS NOT NULL) AND
      
      -- Se handoff, next_ride_id e handoff_driver obrigatórios
      (failed_delivery_metadata->>'item_destination' != 'handoff_to_another_driver' OR 
       (failed_delivery_metadata->>'next_ride_id' IS NOT NULL AND
        failed_delivery_metadata->>'handoff_driver_profile_id' IS NOT NULL)) AND
      
      -- Se return, next_ride_id obrigatório
      (failed_delivery_metadata->>'item_destination' != 'return_to_sender' OR 
       failed_delivery_metadata->>'next_ride_id' IS NOT NULL) AND
      
      -- Se manual resolution, owner obrigatório
      (failed_delivery_metadata->>'item_destination' != 'awaiting_manual_resolution' OR 
       failed_delivery_metadata->>'manual_resolution_owner_profile_id' IS NOT NULL)
    )
  );

-- Índice GIN para queries
CREATE INDEX IF NOT EXISTS idx_ride_requests_failed_delivery_metadata
  ON ride_requests USING GIN (failed_delivery_metadata)
  WHERE status = 'failed_delivery';

-- Comentário
COMMENT ON COLUMN ride_requests.failed_delivery_metadata IS 
  'Metadata obrigatória de falha com rastreamento operacional completo do item';
```

### 3. Validação TypeScript - Função Helper ✅

```typescript
function validateFailedDeliveryMetadata(metadata: FailedDeliveryMetadata): void {
  // Campos obrigatórios
  if (!metadata.failure_reason || !metadata.item_destination || 
      !metadata.item_current_holder || !metadata.timestamp) {
    throw new Error('Campos obrigatórios ausentes');
  }
  
  // Validar enums
  const validReasons: FailureReason[] = [
    'recipient_unavailable', 'address_not_found', 'address_inaccessible',
    'recipient_refused', 'vehicle_issue', 'driver_unavailable',
    'safety_issue', 'package_damaged', 'other'
  ];
  
  if (!validReasons.includes(metadata.failure_reason)) {
    throw new Error('failure_reason inválido');
  }
  
  // Campos condicionais
  if (metadata.failure_reason === 'other' && !metadata.resolution_notes) {
    throw new Error('resolution_notes obrigatório para failure_reason=other');
  }
  
  if ((metadata.item_destination === 'handoff_to_another_driver' || 
       metadata.item_destination === 'return_to_sender') && 
      !metadata.next_ride_id) {
    throw new Error('next_ride_id obrigatório para handoff ou return');
  }
  
  if (metadata.item_destination === 'handoff_to_another_driver' && 
      !metadata.handoff_driver_profile_id) {
    throw new Error('handoff_driver_profile_id obrigatório para handoff');
  }
  
  if (metadata.item_destination === 'awaiting_manual_resolution' && 
      !metadata.manual_resolution_owner_profile_id) {
    throw new Error('manual_resolution_owner_profile_id obrigatório para manual resolution');
  }
  
  // Consistência
  if (metadata.item_current_holder === 'recipient') {
    throw new Error('item_current_holder não pode ser recipient em failed_delivery');
  }
}
```

---

## VEREDITO

### Contrato Final ✅
- Estrutura completa definida
- Campos obrigatórios claros
- Campos condicionais documentados
- Campos operacionais adicionais incluídos

### Campos Obrigatórios ✅
- `failure_reason`
- `item_destination`
- `item_current_holder`
- `timestamp`

### Campos Condicionais ✅
- `resolution_notes` (se `failure_reason = 'other'`)
- `next_ride_id` (se handoff ou return)
- `handoff_driver_profile_id` (se handoff)
- `manual_resolution_owner_profile_id` (se manual resolution)

### Campos Operacionais Adicionais ✅
- `resolution_status`
- `failed_at_location`
- `photos`
- `attempt_number`
- `action_history`

### Validações de Consistência ✅
- Consistência de `item_current_holder` com `item_destination`
- Validação de `next_ride_id` (corrida existe e é motoboy)
- Validação de `handoff_driver_profile_id` (motorista existe e habilitado)
- Validação de `manual_resolution_owner_profile_id` (perfil existe)
- Bloqueio de `item_current_holder = 'recipient'` em failed

### Impacto no Fluxo Atual ✅
- `failDelivery()` atualizado com validações
- Migration com constraints no banco
- Função helper de validação TypeScript
- Sem explosão de estados

---

## CONCLUSÃO

**PRONTO PARA IMPLEMENTAR ✅**

Solução completa com:
- Rastreamento operacional do item
- Validações de consistência
- Encadeamento de próximos passos
- Constraints no banco
- Sem inflar state machine

**Implementação:** ~3h (migration + código + validações + testes)  
**Complexidade:** Média  
**Manutenibilidade:** Alta  
**Rastreabilidade:** Completa

---

**RECOMENDAÇÃO:** Implementar antes de fechar Gate 3 para garantir rastreamento operacional completo.
