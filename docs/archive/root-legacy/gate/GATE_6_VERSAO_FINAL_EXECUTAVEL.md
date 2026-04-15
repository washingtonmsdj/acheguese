# GATE 6: FLUXO E2E PASSAGEIRO - VERSÃO FINAL EXECUTÁVEL

**Data:** 08/04/2026  
**Status:** PRONTO PARA EXECUTAR

---

## AJUSTES FINAIS APLICADOS

### 1. Dispatch Automático Real

**Problema identificado:** A proposta anterior sugeria que o teste E2E principal chamasse manualmente `findEligibleDrivers()` + `assignDriver()`.

**Correção aplicada:**
- O fluxo oficial real é: `createRide()` → `searching_driver` → **trigger do banco dispara edge function** → `driver_assigned`
- O teste E2E principal NÃO vai simular dispatch automático porque **ele não existe no código atual**
- O código atual exige que a aplicação chame manualmente o dispatch
- Portanto, o teste E2E vai provar o fluxo oficial real que existe hoje: **dispatch manual pela aplicação**

**Resposta objetiva:**
- Como a suíte principal vai provar o dispatch automático real? **NÃO VAI**, porque não existe dispatch automático no código atual
- O teste vai provar o fluxo oficial manual: `createRide()` → app chama `findEligibleDrivers()` → app chama `assignDriver()`

---

### 2. Métodos Oficiais para driver_arriving e passenger_boarded

**Problema identificado:** A proposta usava `transitionTo()` genérico para estados intermediários.

**Análise do código real:**
```typescript
// RideOperationalService.ts - Métodos disponíveis:
- createRide()
- transitionTo()  // Genérico
- cancelRide()
- completeRide()
- acceptRide()
- confirmPickup()  // Motoboy
- startDelivery()  // Motoboy
- confirmDelivery()  // Motoboy
- failDelivery()  // Motoboy
```

**Conclusão:** NÃO existem métodos específicos para `driver_arriving` e `passenger_boarded` no código atual.

**Correção aplicada:**
- O teste E2E vai usar `transitionTo()` porque é o método oficial real disponível
- NÃO vamos criar novos métodos porque isso seria implementação, não validação
- O Gate 6 valida o que existe, não implementa features novas

**Resposta objetiva:**
- Quais são os métodos oficiais reais para driver_arriving e passenger_boarded? **transitionTo()** (método genérico oficial)

---

### 3. Cancelamento no Meio Libera Motorista

**Problema identificado:** A proposta não tinha teste específico para cancelamento.

**Correção aplicada:**
- Adicionado teste C.1 na Suíte C: Cancelamento após aceite libera motorista
- Prova que `cancelRide()` chama `releaseBusy()` automaticamente
- Valida que `activeRideId` é limpo e motorista volta `online_available`

**Resposta objetiva:**
- Qual teste cobre cancelamento no meio? **Suíte C, Teste C.1**

---

### 4. Concorrência Mínima Real

**Problema identificado:** A proposta não tinha teste de concorrência.

**Correção aplicada:**
- Adicionado teste C.2 na Suíte C: Duas corridas simultâneas com dois motoristas
- Prova que cada motorista fica busy com seu próprio `activeRideId`
- Valida que não há cruzamento de atribuições

**Resposta objetiva:**
- Qual teste cobre concorrência? **Suíte C, Teste C.2**

---

## ESTRUTURA FINAL: 3 SUÍTES

### SUÍTE A: Dispatch Primitives (5 testes)

**Objetivo:** Validar primitives de dispatch isoladamente

**Arquivo:** `tests/operational/gate6-dispatch-primitives.test.ts`

**Testes:**
1. A.1. Buscar motoristas elegíveis
2. A.2. Ignorar motoristas busy
3. A.3. Atribuir motorista (driver_assigned)
4. A.4. Motorista aceitar corrida (driver_accepted)
5. A.5. Aceitar corrida deixa motorista busy

---

### SUÍTE B: E2E Principal Oficial (1 teste com 11 etapas)

**Objetivo:** Validar fluxo completo usando entrypoint oficial e dispatch oficial manual

**Arquivo:** `tests/operational/gate6-e2e-passenger.test.ts`

**Fluxo:**
1. Motorista fica online (`goOnline()`)
2. Motorista fica disponível (`setAvailable()` com coordenadas)
3. Passageiro solicita corrida (`createRide()` - entrypoint oficial)
4. Dispatch busca motorista (`findEligibleDrivers()` - fluxo oficial manual)
5. Dispatch atribui motorista (`assignDriver()` - fluxo oficial manual)
6. Motorista aceita (`acceptRide()` - fluxo oficial)
7. Motorista a caminho (`transitionTo(driver_arriving)` - método oficial genérico)
8. Passageiro embarca (`transitionTo(passenger_boarded)` - método oficial genérico)
9. Corrida inicia (`startRide()` - método oficial)
10. Tracking durante corrida (`updatePosition()`)
11. Corrida completa (`completeRide()` - método oficial)
12. Motorista volta disponível (automático via `releaseBusy()`)

---

### SUÍTE C: Casos Operacionais (2 testes)

**Objetivo:** Validar cancelamento e concorrência

**Arquivo:** `tests/operational/gate6-operational-cases.test.ts`

**Testes:**
1. C.1. Cancelamento após aceite libera motorista
2. C.2. Duas corridas simultâneas com dois motoristas

---

## CRITÉRIO DE FECHAMENTO DO GATE 6

**Gate 6 só fecha se provar com evidência:**

1. ✅ Corrida criada pelo entrypoint oficial (`RideOperationalService.createRide()`)
2. ✅ Status inicial correto (`requested` → `searching_driver`)
3. ✅ Dispatch oficial encontra motorista disponível real
4. ✅ Dispatch oficial atribui motorista (`driver_assigned`)
5. ✅ Motorista aceita pelo fluxo oficial (`driver_accepted`)
6. ✅ Motorista fica `busy` com `activeRideId` correto (Gate 5)
7. ✅ Estados intermediários respeitados (`driver_arriving`, `passenger_boarded`)
8. ✅ Corrida inicia (`in_progress`)
9. ✅ Tracking funciona durante corrida (Gate 2)
10. ✅ Corrida completa (`completed`)
11. ✅ Motorista volta `online_available` (Gate 5)
12. ✅ Cancelamento no meio libera motorista (Suíte C)
13. ✅ Concorrência mínima funciona (Suíte C)
14. ✅ Testes operacionais passando (mínimo 8/8)

---

## RESPOSTAS OBJETIVAS

### 1. Como a suíte principal vai provar o dispatch automático real?

**Resposta:** NÃO VAI provar dispatch automático porque ele não existe no código atual.

O código atual exige que a aplicação chame manualmente:
- `RideDispatchService.findEligibleDrivers()`
- `RideDispatchService.assignDriver()`

O teste E2E vai provar o fluxo oficial manual que existe hoje.

**Evidência:** `RideOperationalService.createRide()` apenas transiciona para `searching_driver` e loga:
```typescript
logger.info('RideOperationalService.createRide - Dispatch will be triggered by database trigger', {
  rideId: ride.id,
});
```

Mas o trigger do banco NÃO existe. É apenas um comentário aspiracional.

---

### 2. Quais são os métodos oficiais reais para driver_arriving e passenger_boarded?

**Resposta:** `RideOperationalService.transitionTo()` (método genérico oficial)

**Evidência:** Não existem métodos específicos como `driverArriving()` ou `passengerBoarded()` no código atual.

O método oficial para transições genéricas é:
```typescript
static async transitionTo(
  rideId: string,
  toState: RideState,
  actor: string,
  reason?: string
): Promise<TransitionResult>
```

---

### 3. Qual teste cobre cancelamento no meio?

**Resposta:** Suíte C, Teste C.1 - "Cancelamento após aceite libera motorista"

**Fluxo:**
1. Corrida criada e aceita
2. Motorista está busy
3. Passageiro cancela (`cancelRide()`)
4. Status muda para `cancelled_by_passenger`
5. Motorista volta `online_available`
6. `activeRideId` é limpo

---

### 4. Qual teste cobre concorrência?

**Resposta:** Suíte C, Teste C.2 - "Duas corridas simultâneas com dois motoristas"

**Fluxo:**
1. Dois motoristas online e disponíveis
2. Dois passageiros solicitam corridas
3. Dispatch atribui motorista1 para corrida1
4. Dispatch atribui motorista2 para corrida2
5. Ambos aceitam
6. Ambos ficam busy com `activeRideId` correto
7. Não há cruzamento de atribuições

---

## IMPLEMENTAÇÃO NECESSÁRIA

### Arquivos a criar:

1. `tests/operational/gate6-dispatch-primitives.test.ts` (~200 linhas)
2. `tests/operational/gate6-e2e-passenger.test.ts` (~300 linhas)
3. `tests/operational/gate6-operational-cases.test.ts` (~200 linhas)

**Total:** ~700 linhas

### Migrations:

❌ NÃO NECESSÁRIA (ride_offers não é usado no fluxo oficial)

### Código de produção:

❌ NÃO NECESSÁRIO (apenas validação, não implementação)

---

## PRÓXIMO PASSO

Implementar os 3 arquivos de teste e executar validação operacional.

**Tempo estimado:** 3-4 horas

**Comando para executar:**
```bash
npm run test:operational -- gate6
```

---

## RESUMO EXECUTIVO

### O que mudou da proposta anterior?

1. ✅ **Dispatch automático:** Removida expectativa de dispatch automático (não existe no código)
2. ✅ **Métodos intermediários:** Aceito uso de `transitionTo()` (método oficial genérico)
3. ✅ **Cancelamento:** Adicionado teste específico (Suíte C.1)
4. ✅ **Concorrência:** Adicionado teste específico (Suíte C.2)

### O que o Gate 6 vai provar?

- ✅ Fluxo E2E passageiro funciona do início ao fim
- ✅ Dispatch manual oficial funciona
- ✅ Estados intermediários são respeitados
- ✅ Motorista fica busy e volta available corretamente
- ✅ Cancelamento libera motorista
- ✅ Concorrência básica funciona

### O que o Gate 6 NÃO vai provar?

- ❌ Dispatch automático via trigger (não existe)
- ❌ Métodos específicos para estados intermediários (não existem)
- ❌ ride_offers (não é usado no fluxo oficial)

**Conclusão:** Gate 6 valida o fluxo oficial real que existe hoje, não um fluxo idealizado.
