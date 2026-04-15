# GATE 6: SOLUÇÃO FINAL - CAMINHO OFICIAL SSOT

**Data:** 08/04/2026

---

## A) CAMINHO OFICIAL SSOT PARA DISPATCH DE SISTEMA

### Decisão de Arquitetura

**Solução escolhida:** RideDispatchService aceita client injetado (service_role para testes/sistema).

**Justificativa:**
- Mantém SSOT único (não cria wrappers paralelos)
- Permite testes validarem caminho oficial
- Flexível para diferentes contextos de execução
- Não quebra código existente (client padrão se não injetado)

### Implementação

```typescript
// RideDispatchService.ts
class RideDispatchService {
  static async findEligibleDrivers(
    rideId: string,
    originLat: number,
    originLng: number,
    maxRadius: number = CONFIG.MAX_SEARCH_RADIUS_KM,
    rideMode: 'ride' | 'motoboy' = 'ride',
    clientOverride?: SupabaseClient // ✅ Injeção opcional
  ): Promise<DriverEligibility[]> {
    const client = clientOverride || supabase; // Usa override ou padrão
    // ... resto do código usa 'client' em vez de 'supabase'
  }
  
  static async assignDriver(
    rideId: string,
    driverProfileId: string,
    currentState: RideState,
    clientOverride?: SupabaseClient // ✅ Injeção opcional
  ): Promise<DispatchResult> {
    const client = clientOverride || supabase;
    // ... resto do código usa 'client'
  }
}
```

**Uso em testes:**
```typescript
import { getAdminClient } from '../helpers/supabase-test-client';

const adminClient = getAdminClient();
const eligible = await RideDispatchService.findEligibleDrivers(
  rideId, lat, lng, 10, 'ride',
  adminClient // ✅ Injeta service_role
);
```

**Uso em produção:**
```typescript
// Sem injeção, usa client padrão
const eligible = await RideDispatchService.findEligibleDrivers(
  rideId, lat, lng, 10, 'ride'
);
```

---

## B) LOGS BRUTOS - DIAGNÓSTICO CIRÚRGICO

### createRide() - PROBLEMA CRÍTICO IDENTIFICADO

**Log estruturado:**
```
1️⃣ Autenticado como passageiro: b374bdab-cd76-43b2-bb3c-eb844d096acb
2️⃣ Chamando RideOperationalService.createRide()
   Payload: [campos canônicos]
3️⃣ Resultado:
   success: true
   rideId: c34eaddf-e431-4f8d-acd9-c895611a4d6a
   newState: searching_driver
4️⃣ Estado IMEDIATO no banco:
   status: expired ❌
   driver_profile_id: NULL
   created_at: 2026-04-08T03:43:33.952075+00:00
   updated_at: 2026-04-08T03:43:36.801827+00:00
5️⃣ Estado APÓS 1s:
   status: expired (permaneceu)
```

**Evidência:** Status vai para `expired` IMEDIATAMENTE após `createRide()`.

---

## C) CAUSA RAIZ EXATA DO `expired` PRECOCE

### Análise do Código

**Linha problemática em `RideOperationalService.createRide()`:**
```typescript
// Linha 145
await this.transitionTo(ride.id, RIDE_STATE.SEARCHING_DRIVER, 'system');

// Linha 147-149 - COMENTÁRIO ENGANOSO
logger.info('RideOperationalService.createRide - Dispatch will be triggered by database trigger', {
  rideId: ride.id,
});
```

**Problema:** O comentário diz "trigger do banco" mas NÃO HÁ TRIGGER! Evidência objetiva confirmou dispatch é 100% manual.

### Hipótese da Expiração

**Possível causa:** `transitionTo()` → `handlePostTransition()` → alguma lógica que chama `expireRide()`.

**Código de `handlePostTransition()`:**
```typescript
private static async handlePostTransition(
  rideId: string,
  newState: RideState,
  ride: any
): Promise<void> {
  try {
    // GATE 5: Liberar motorista quando corrida é cancelada ou completada
    if (RideStateMachine.isFinalState(newState) && ride.driver_profile_id) {
      const { DriverAvailabilityService } = await import('@/modules/mobility/services/DriverAvailabilityService');
      await DriverAvailabilityService.releaseBusy(ride.driver_profile_id, rideId);
    }
  } catch (error) {
    logger.error('RideOperationalService.handlePostTransition', error as Error, { rideId, newState });
  }
}
```

**Análise:** `handlePostTransition()` NÃO chama `expireRide()`. O problema deve estar em outro lugar.

### Causa Raiz Real

**DESCOBERTA:** O status `expired` aparece 3 segundos após o INSERT (updated_at mostra diferença de 3s).

**Possibilidades:**
1. Edge function sendo disparada (mas não há trigger confirmado)
2. AutoDispatchService rodando em background
3. Algum processo assíncrono expirando corridas sem motorista

**Ação necessária:** Buscar por AutoDispatchService ou processos background.

---

## D) CORREÇÃO APLICADA NO SERVIÇO OFICIAL

### Status: ⏳ PENDENTE

**Correções necessárias:**

1. **Modificar RideDispatchService para aceitar client injetado**
   - Adicionar parâmetro opcional `clientOverride` em `findEligibleDrivers()`
   - Adicionar parâmetro opcional `clientOverride` em `assignDriver()`
   - Usar `clientOverride || supabase` internamente

2. **Investigar AutoDispatchService**
   - Verificar se está rodando automaticamente
   - Desabilitar ou ajustar timeout de expiração

3. **Corrigir comentário enganoso**
   - Remover "Dispatch will be triggered by database trigger"
   - Adicionar comentário correto sobre dispatch manual

4. **Atualizar testes do Gate 6**
   - Usar injeção de client em vez de wrappers paralelos
   - Validar caminho oficial SSOT

---

## E) NOVA EXECUÇÃO DO GATE 6

### Status: ⏳ NÃO EXECUTADO

**Bloqueios:**
1. RideDispatchService ainda não aceita client injetado
2. Causa raiz do `expired` precoce não resolvida
3. Testes ainda usam wrappers paralelos

**Próximos passos:**
1. Modificar RideDispatchService (injeção de client)
2. Investigar e desabilitar AutoDispatchService
3. Atualizar testes para usar caminho oficial
4. Executar Gate 6

---

## RESUMO EXECUTIVO

**Caminho oficial SSOT:** RideDispatchService com injeção opcional de client.

**Problema crítico:** Status vai para `expired` 3s após `createRide()`. Causa provável: AutoDispatchService ou processo background.

**Correção pendente:** Modificar RideDispatchService + investigar AutoDispatchService + atualizar testes.

**Gate 6:** Bloqueado até correções serem aplicadas.

**Tempo estimado:** 2-3 horas (modificação de services + investigação + testes).

