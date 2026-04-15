# MOBILIDADE: SSOT FINAL

**Data de Congelamento:** 08/04/2026  
**Status:** MÓDULO FECHADO - 100% VALIDADO

---

## ARQUITETURA OFICIAL

### Camadas

```
┌─────────────────────────────────────────┐
│  UI Layer (Hooks + Components)         │
├─────────────────────────────────────────┤
│  Core Services (SSOT)                   │
│  - RideOperationalService               │
│  - RideDispatchService                  │
│  - DriverAvailabilityService            │
├─────────────────────────────────────────┤
│  State Machine (RideStateMachine)       │
├─────────────────────────────────────────┤
│  Database (ride_requests + audit)       │
├─────────────────────────────────────────┤
│  Edge Functions (auto-dispatch-ride)    │
└─────────────────────────────────────────┘
```

### Entrypoints Oficiais

**Passageiro:**
- `RideOperationalService.createRide()` - Criar corrida
- `RideOperationalService.cancelRide()` - Cancelar corrida

**Motorista:**
- `RideDispatchService.acceptRide()` - Aceitar corrida
- `RideOperationalService.startRide()` - Iniciar corrida
- `RideOperationalService.completeRide()` - Completar corrida

**Motoboy:**
- `RideOperationalService.createDelivery()` - Criar entrega
- `RideOperationalService.confirmPickup()` - Confirmar coleta
- `RideOperationalService.startDelivery()` - Iniciar entrega
- `RideOperationalService.confirmDelivery()` - Confirmar entrega com proof
- `RideOperationalService.failDelivery()` - Registrar falha com metadata

**Disponibilidade:**
- `DriverAvailabilityService.goOnline()` - Ficar online
- `DriverAvailabilityService.goOffline()` - Ficar offline
- `DriverAvailabilityService.setAvailable()` - Disponível para corridas
- `DriverAvailabilityService.setBusy()` - Ocupado (automático)
- `DriverAvailabilityService.releaseBusy()` - Liberar (automático)

---

## STATE MACHINE OFICIAL

### Estados Passageiro (ride)

```
requested → searching_driver → driver_assigned → driver_accepted →
driver_arriving → passenger_boarded → in_progress → completed
```

**Estados Finais:** `completed`, `cancelled_by_passenger`, `cancelled_by_driver`, `expired`

### Estados Motoboy (motoboy)

```
requested → searching_driver → driver_assigned → driver_accepted →
driver_arriving → pickup_confirmed → in_delivery → delivered → completed
```

**Estados Finais:** `completed`, `failed_delivery`, `cancelled_by_driver`, `expired`

### Transições Críticas

- `searching_driver → driver_assigned`: Auto-dispatch (edge function)
- `driver_assigned → driver_accepted`: Motorista aceita
- `passenger_boarded → in_progress`: Corrida inicia
- `pickup_confirmed → in_delivery`: Entrega inicia
- `in_delivery → delivered`: Entrega confirmada com proof
- `in_delivery → failed_delivery`: Falha com metadata

---

## AUTO-DISPATCH OFICIAL

### Comportamento

**Edge Function:** `supabase/functions/auto-dispatch-ride/index.ts`

**Trigger:** Automático ao criar corrida/entrega (status = `searching_driver`)

**Lógica:**
1. Busca motoristas online e disponíveis
2. Se `ride_mode = 'motoboy'`: filtra por `can_do_delivery = true`
3. Calcula distância e ordena por proximidade
4. Oferece sequencialmente (timeout: 30s por motorista)
5. Se nenhum aceita: expira corrida

**Performance Observada:**
- Passageiro: 267-285ms
- Motoboy: 260-349ms
- Expiração: 260-278ms

---

## DISPONIBILIDADE DO MOTORISTA

### Estados

- `online_available`: Online e disponível para corridas
- `online_busy`: Online mas ocupado (em corrida)
- `offline`: Offline

### Regras

1. Motorista só aparece no auto-dispatch se `is_online = true` e `is_available = true`
2. Ao aceitar corrida: automaticamente `setBusy()` com `active_ride_id`
3. Ao completar/cancelar: automaticamente `releaseBusy()` volta para `available`
4. Motoboy em `failed_delivery`: permanece `busy` até resolver item

### Tabela

**Tabela:** `driver_availability`

**Colunas Críticas:**
- `is_online`: boolean
- `is_available`: boolean
- `active_ride_id`: uuid (nullable)
- `current_lat`, `current_lng`: coordenadas

---

## PROOF OF DELIVERY

### Estrutura Oficial

```typescript
{
  photo_url: string;      // URL da foto
  code: string;           // Código de confirmação
  observation?: string;   // Observação opcional
  signed_at: string;      // ISO 8601 timestamp
}
```

### Persistência

**Coluna:** `ride_requests.proof_of_delivery` (JSONB)

**Quando:** Ao chamar `confirmDelivery()`

**Validação:** Todos campos obrigatórios exceto `observation`

---

## FAILED DELIVERY METADATA

### Estrutura Oficial

```typescript
{
  // Snapshot da falha (obrigatório)
  failure_reason: FailureReason;
  item_destination: ItemDestination;
  item_current_holder: ItemHolder;
  timestamp: string;
  resolution_status: ResolutionStatus;
  resolution_notes?: string;
  
  // Resolução posterior (opcional)
  next_ride_id?: string;
  handoff_driver_profile_id?: string;
  resolved_at?: string;
}
```

### Enums Válidos

**FailureReason:**
- `recipient_unavailable`, `address_not_found`, `address_inaccessible`
- `recipient_refused`, `vehicle_issue`, `driver_unavailable`
- `safety_issue`, `package_damaged`, `other`

**ItemDestination:**
- `return_to_sender`, `handoff_to_another_driver`, `awaiting_manual_resolution`

**ItemHolder:**
- `driver`, `sender`, `other_driver`, `hub`

**ResolutionStatus:**
- `pending`, `in_progress`, `resolved`, `escalated`

### Persistência

**Coluna:** `ride_requests.failed_delivery_metadata` (JSONB)

**Quando:** Ao chamar `failDelivery()`

---

## AUDITORIA

### Tabela

**Tabela:** `ride_state_audit`

**Colunas:**
- `ride_id`: uuid
- `from_state`: text
- `to_state`: text
- `changed_by`: uuid (profile_id ou 'system')
- `reason`: text (opcional)
- `created_at`: timestamptz

### Comportamento

- Toda transição de estado gera registro automático
- Auto-dispatch: `changed_by = 'system'`
- Ações do usuário: `changed_by = profile_id`

---

## LEGADO vs SSOT

### ✅ SSOT (Usar Sempre)

**Services:**
- `RideOperationalService` - Orquestrador principal
- `RideDispatchService` - Dispatch e aceite
- `DriverAvailabilityService` - Disponibilidade
- `RideStateMachine` - State machine

**Constantes:**
- `src/modules/mobility/constants/index.ts` - RIDE_STATUS oficial

**Types:**
- `src/modules/mobility/types/FailedDeliveryMetadata.ts`

**Testes:**
- `tests/operational/gate6-runtime-with-drivers.test.ts` - Passageiro E2E
- `tests/operational/gate6-runtime-no-drivers.test.ts` - Passageiro sem motoristas
- `tests/operational/gate6-motoboy-runtime.test.ts` - Motoboy E2E

### ⚠️ DEPRECATED (Não Usar)

**Helpers Antigos:**
- `tests/helpers/ride-test-helpers.ts` - Superseded por gate6-*-helpers
- Qualquer helper que não seja `gate6-*-helpers.ts`

**Testes Antigos:**
- `tests/operational/gate6-primitives/*` - Arquivados (validação primitiva)
- Testes que usam mocks ao invés de runtime real

**Campos Legados:**
- `ride_requests.status IN ('pending', 'accepted', 'cancelled')` - Mantidos por compatibilidade
- Usar novos status: `requested`, `driver_accepted`, `cancelled_by_*`

---

## MIGRATIONS OFICIAIS

### Aplicadas e Validadas

1. `20260407000002_gate2_driver_locations_minimal.sql` - Localização
2. `20260407000005_gate3_fix_ride_requests_constraint.sql` - Constraint status
3. `20260407000006_gate3_failed_delivery_metadata.sql` - Failed delivery
4. `20260407000007_gate5_driver_availability.sql` - Disponibilidade
5. `20260408000001_add_ride_operational_timestamps.sql` - Timestamps operacionais

### Colunas Críticas Adicionadas

**ride_requests:**
- `ride_mode`: 'ride' | 'motoboy'
- `pickup_confirmed_at`: timestamptz
- `delivered_at`: timestamptz
- `failed_delivery_at`: timestamptz
- `proof_of_delivery`: jsonb
- `failed_delivery_metadata`: jsonb
- `failed_delivery_reason`: text

**driver_data:**
- `can_do_delivery`: boolean

---

## EDGE FUNCTIONS

### auto-dispatch-ride

**Localização:** `supabase/functions/auto-dispatch-ride/index.ts`

**Responsabilidade:** Atribuir motorista automaticamente

**Comportamento:**
1. Triggered ao criar corrida (status = `searching_driver`)
2. Busca motoristas elegíveis (online, disponíveis, próximos)
3. Filtra por `can_do_delivery` se `ride_mode = 'motoboy'`
4. Oferece sequencialmente com timeout de 30s
5. Expira se nenhum aceita

**Deploy:**
```bash
supabase functions deploy auto-dispatch-ride
```

---

## REGRAS DE NEGÓCIO

### Cancelamento

**Passageiro pode cancelar:**
- Até `passenger_boarded` (corrida)
- Até `pickup_confirmed` (entrega)

**Motorista pode cancelar:**
- Até `pickup_confirmed` (ambos)
- Durante `in_delivery`: usar `failDelivery()` ao invés de cancelar

### Pricing

**Sugerido:** Calculado no frontend  
**Final:** Atualizado ao completar corrida  
**Coluna:** `ride_requests.final_price`

### Liberação de Motorista

**Automática em:**
- `completeRide()`
- `cancelRide()` (se motorista estava atribuído)

**Manual em:**
- `failed_delivery` - Requer resolução do item primeiro

---

## CONGELAMENTO

**Data:** 08/04/2026  
**Versão:** 1.0.0  
**Status:** PRODUÇÃO

**Não modificar sem:**
1. Validação E2E completa
2. Aprovação de arquitetura
3. Atualização deste documento

**Testes obrigatórios antes de qualquer mudança:**
- Gate 6 Passageiro (4/4 testes)
- Gate 6 Motoboy (3/3 testes)

