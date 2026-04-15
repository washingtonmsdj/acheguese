# GATE 3: RASTREAMENTO DE ITEM EM ENTREGAS MOTOBOY

**Data:** 07/04/2026  
**Objetivo:** Formalizar regra operacional de destino do item após coleta

---

## REGRA DE NEGÓCIO

### 1. Antes da Coleta ✅
**Estados:** `DRIVER_ASSIGNED`, `DRIVER_ACCEPTED`, `DRIVER_ARRIVING`

**Regra:**
- Motoboy pode cancelar normalmente via `cancelRide()`
- Item continua com remetente/empresa
- Entrega pode voltar para busca de outro motoboy ou expirar
- Estado final: `CANCELLED_BY_DRIVER`

**Rastreamento:**
- Item: Com remetente
- Responsável: Remetente
- Ação: Nenhuma necessária

### 2. Depois da Coleta ✅
**Estados:** `PICKUP_CONFIRMED`, `IN_DELIVERY`

**Regra:**
- NÃO existe cancelamento simples
- `cancelRide()` proibido (já implementado)
- Fluxo correto: `failDelivery()` com destino obrigatório do item

**Rastreamento:**
- Item: Com motoboy
- Responsável: Motoboy
- Ação: Definir destino obrigatório

---

## PROPOSTA TÉCNICA

### Solução Recomendada: METADATA OBRIGATÓRIA ✅

**Raciocínio:**
- Não criar novos estados (evita explosão de estados)
- Usar `FAILED_DELIVERY` com metadata rica
- Metadata obrigatória garante rastreamento
- Mais flexível para evoluir

### Estrutura de Dados

**Campos novos em `ride_requests`:**
```sql
-- Já existe:
failed_delivery_at TIMESTAMPTZ
failed_delivery_reason TEXT

-- Adicionar:
failed_delivery_metadata JSONB
```

**Estrutura do JSONB:**
```json
{
  "failure_reason": "recipient_unavailable",
  "item_destination": "return_to_sender",
  "item_current_holder": "driver",
  "resolution_notes": "Destinatário não atendeu após 3 tentativas",
  "failed_at_location": {
    "lat": -23.5505,
    "lng": -46.6333,
    "address": "Rua X, 123"
  },
  "photos": ["url1", "url2"],
  "timestamp": "2026-04-07T14:00:00Z"
}
```

### Enums Obrigatórios

**Motivo da Falha (failure_reason):**
- `recipient_unavailable` - Destinatário ausente/não atende
- `address_not_found` - Endereço não existe/incorreto
- `address_inaccessible` - Endereço existe mas inacessível
- `recipient_refused` - Destinatário recusou receber
- `vehicle_issue` - Problema com veículo do motoboy
- `driver_unavailable` - Motoboy não pode continuar
- `safety_issue` - Problema de segurança
- `package_damaged` - Pacote danificado
- `other` - Outro motivo (requer notes)

**Destino do Item (item_destination):**
- `return_to_sender` - Devolver ao remetente
- `handoff_to_another_driver` - Transferir para outro motoboy
- `awaiting_manual_resolution` - Aguardando resolução manual
- `held_at_hub` - Retido em ponto de apoio (futuro)

**Quem Está com o Item (item_current_holder):**
- `driver` - Com o motoboy
- `sender` - Devolvido ao remetente
- `recipient` - Entregue (não deveria estar em failed)
- `hub` - Em ponto de apoio (futuro)
- `other_driver` - Transferido para outro motoboy

---

## IMPLEMENTAÇÃO MÍNIMA

### 1. Migration

```sql
-- Adicionar metadata de falha
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS failed_delivery_metadata JSONB;

-- Constraint para garantir metadata quando failed_delivery
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_metadata
  CHECK (
    (status != 'failed_delivery') OR
    (
      status = 'failed_delivery' AND
      failed_delivery_metadata IS NOT NULL AND
      failed_delivery_metadata->>'failure_reason' IS NOT NULL AND
      failed_delivery_metadata->>'item_destination' IS NOT NULL AND
      failed_delivery_metadata->>'item_current_holder' IS NOT NULL
    )
  );

-- Índice para queries de falha
CREATE INDEX IF NOT EXISTS idx_ride_requests_failed_delivery_metadata
  ON ride_requests USING GIN (failed_delivery_metadata)
  WHERE status = 'failed_delivery';

COMMENT ON COLUMN ride_requests.failed_delivery_metadata IS 
  'Metadata obrigatória de falha: failure_reason, item_destination, item_current_holder';
```

### 2. Código TypeScript

**Tipos:**
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

type ItemDestination = 
  | 'return_to_sender'
  | 'handoff_to_another_driver'
  | 'awaiting_manual_resolution'
  | 'held_at_hub';

type ItemHolder = 
  | 'driver'
  | 'sender'
  | 'recipient'
  | 'hub'
  | 'other_driver';

interface FailedDeliveryMetadata {
  failure_reason: FailureReason;
  item_destination: ItemDestination;
  item_current_holder: ItemHolder;
  resolution_notes?: string;
  failed_at_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  photos?: string[];
  timestamp: string;
}
```

**Atualizar `failDelivery()`:**
```typescript
static async failDelivery(
  rideId: string,
  driverProfileId: string,
  metadata: FailedDeliveryMetadata
): Promise<TransitionResult> {
  // Validar metadata obrigatória
  if (!metadata.failure_reason || !metadata.item_destination || !metadata.item_current_holder) {
    return {
      success: false,
      error: 'Metadata obrigatória: failure_reason, item_destination, item_current_holder',
    };
  }

  // Validar enums
  const validReasons: FailureReason[] = [
    'recipient_unavailable', 'address_not_found', 'address_inaccessible',
    'recipient_refused', 'vehicle_issue', 'driver_unavailable',
    'safety_issue', 'package_damaged', 'other'
  ];
  
  if (!validReasons.includes(metadata.failure_reason)) {
    return { success: false, error: 'Invalid failure_reason' };
  }

  // Validar que 'other' tem notes
  if (metadata.failure_reason === 'other' && !metadata.resolution_notes) {
    return { success: false, error: 'resolution_notes required for failure_reason=other' };
  }

  // Atualizar banco
  await supabase
    .from('ride_requests')
    .update({
      failed_delivery_at: new Date().toISOString(),
      failed_delivery_reason: metadata.failure_reason,
      failed_delivery_metadata: metadata,
    })
    .eq('id', rideId);

  // Transicionar para FAILED_DELIVERY
  return await this.transitionTo(
    rideId, 
    RIDE_STATE.FAILED_DELIVERY, 
    driverProfileId, 
    metadata.failure_reason
  );
}
```

---

## IMPACTOS

### 1. Pricing ✅
**Impacto:** MÍNIMO

**Regra:**
- Entrega falha = sem cobrança do destinatário
- `final_price` = NULL
- `suggested_price` permanece (custo estimado)
- Futuro: taxa de reentrega se aplicável

**Não requer mudança agora.**

### 2. Auditoria ✅
**Impacto:** POSITIVO

**Benefício:**
- Metadata rica em `failed_delivery_metadata`
- Rastreamento completo do item
- Histórico de tentativas
- Fotos de evidência

**Queries úteis:**
```sql
-- Falhas por motivo
SELECT 
  failed_delivery_metadata->>'failure_reason' as reason,
  COUNT(*) as total
FROM ride_requests
WHERE status = 'failed_delivery'
GROUP BY reason;

-- Itens aguardando resolução
SELECT *
FROM ride_requests
WHERE status = 'failed_delivery'
  AND failed_delivery_metadata->>'item_destination' = 'awaiting_manual_resolution';

-- Itens com motoboy
SELECT *
FROM ride_requests
WHERE status = 'failed_delivery'
  AND failed_delivery_metadata->>'item_current_holder' = 'driver';
```

### 3. Dispatch ✅
**Impacto:** MÉDIO

**Cenários:**

**A) `return_to_sender`:**
- Criar nova corrida de devolução
- Origem: localização atual do motoboy
- Destino: endereço do remetente
- Vincular à corrida original

**B) `handoff_to_another_driver`:**
- Criar nova corrida de transferência
- Origem: localização atual do motoboy
- Destino: endereço original
- Vincular à corrida original
- Buscar novo motoboy

**C) `awaiting_manual_resolution`:**
- Não criar nova corrida automaticamente
- Aguardar ação manual do admin/remetente

**Implementação futura:** Fluxo de reentrega automática.

### 4. Realtime ✅
**Impacto:** MÍNIMO

**Notificações:**
- Remetente recebe notificação de falha
- Metadata disponível via realtime
- UI mostra destino do item

---

## MODELAGEM RECOMENDADA

### Opção Escolhida: METADATA OBRIGATÓRIA ✅

**Vantagens:**
- ✅ Não infla state machine
- ✅ Flexível para evoluir
- ✅ Metadata rica e estruturada
- ✅ Constraint garante obrigatoriedade
- ✅ Queries eficientes com GIN index
- ✅ Fácil adicionar novos campos

**Desvantagens:**
- ⚠️ Validação de enum no código (não no banco)
- ⚠️ Requer parsing de JSON em queries

### Opção Descartada: NOVOS ESTADOS ❌

**Seria:**
- `FAILED_DELIVERY_RETURN_TO_SENDER`
- `FAILED_DELIVERY_HANDOFF`
- `FAILED_DELIVERY_AWAITING_RESOLUTION`

**Por que não:**
- ❌ Explosão de estados (3 novos)
- ❌ Dificulta queries agregadas
- ❌ Menos flexível para novos destinos
- ❌ State machine fica complexa

---

## MUDANÇAS NECESSÁRIAS

### 1. Migration ✅
```sql
-- Arquivo: supabase/migrations/20260407000006_gate3_motoboy_item_tracking.sql
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS failed_delivery_metadata JSONB;

ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_metadata
  CHECK (
    (status != 'failed_delivery') OR
    (failed_delivery_metadata IS NOT NULL AND
     failed_delivery_metadata->>'failure_reason' IS NOT NULL AND
     failed_delivery_metadata->>'item_destination' IS NOT NULL AND
     failed_delivery_metadata->>'item_current_holder' IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_ride_requests_failed_delivery_metadata
  ON ride_requests USING GIN (failed_delivery_metadata)
  WHERE status = 'failed_delivery';
```

### 2. Código TypeScript ✅
- Adicionar tipos `FailureReason`, `ItemDestination`, `ItemHolder`
- Adicionar interface `FailedDeliveryMetadata`
- Atualizar `failDelivery()` para exigir metadata
- Adicionar validação de enums
- Adicionar validação de `resolution_notes` quando `other`

### 3. Testes ✅
- Testar `failDelivery()` com metadata válida
- Testar rejeição sem metadata
- Testar rejeição com enum inválido
- Testar rejeição de `other` sem notes
- Testar constraint no banco

### 4. UI (Futuro) ⏳
- Formulário de falha com dropdowns
- Campo de notes obrigatório para `other`
- Upload de fotos
- Mapa de localização da falha

---

## VEREDITO

### Regra Final Antes da Coleta ✅
- Motoboy pode cancelar via `cancelRide()`
- Item fica com remetente
- Estado final: `CANCELLED_BY_DRIVER`

### Regra Final Depois da Coleta ✅
- `cancelRide()` proibido
- Usar `failDelivery()` com metadata obrigatória
- Estado final: `FAILED_DELIVERY`

### Destino Obrigatório do Item ✅
- `return_to_sender`
- `handoff_to_another_driver`
- `awaiting_manual_resolution`
- `held_at_hub` (futuro)

### Motivo Obrigatório ✅
- `recipient_unavailable`
- `address_not_found`
- `address_inaccessible`
- `recipient_refused`
- `vehicle_issue`
- `driver_unavailable`
- `safety_issue`
- `package_damaged`
- `other` (requer notes)

### Modelagem Recomendada ✅
**METADATA OBRIGATÓRIA em `failed_delivery_metadata` JSONB**

**Motivo:** Flexível, não infla state machine, metadata rica, constraint garante obrigatoriedade.

### Mudanças Necessárias ✅
1. Migration: adicionar coluna + constraint
2. Código: tipos + validação + atualizar `failDelivery()`
3. Testes: validar metadata obrigatória
4. UI: formulário de falha (futuro)

---

## CONCLUSÃO

Solução técnica mínima e robusta que garante rastreamento completo do item após coleta sem inflar a state machine. Metadata obrigatória via constraint do banco garante que sistema sempre responde onde está o item, qual foi a falha e qual será o destino.

**Implementação:** ~2h (migration + código + testes)  
**Complexidade:** Baixa  
**Manutenibilidade:** Alta  
**Flexibilidade:** Alta

---

**RECOMENDAÇÃO:** Implementar metadata obrigatória antes de fechar Gate 3.
