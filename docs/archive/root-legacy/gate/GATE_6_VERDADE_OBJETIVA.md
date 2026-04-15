# GATE 6: VERDADE OBJETIVA DO CÓDIGO

**Data:** 08/04/2026

---

## A) VERDADE ATUAL DO DISPATCH OFICIAL

### ✅ ATUALIZAÇÃO: DISPATCH É AUTOMÁTICO VIA EDGE FUNCTION

**Data da atualização:** 08/04/2026

### Evidência 1: Edge Function auto-dispatch-ride EXISTE e está ATIVA

**Localização:** `supabase/functions/auto-dispatch-ride/index.ts`

**Comportamento confirmado:**
1. Corrida entra em `searching_driver`
2. Database Webhook (configurado via Dashboard) dispara edge function
3. Edge function busca motoristas elegíveis via `findEligibleDrivers()`
4. Se `eligibleDrivers.length === 0`, chama `expireRide()` IMEDIATAMENTE
5. Se há motoristas, oferece sequencialmente com timeout de 30s

**Evidência objetiva da auditoria:**
```
searching_driver → expired
changed_by: system
reason: No eligible drivers found
created_at: 2026-04-08T03:53:11.282553+00:00
```

**Timeline observada:**
- T+0s: createRide() retorna `searching_driver`
- T+1s: Edge function executa
- T+3s: Status = `expired`

### Evidência 2: NÃO há trigger SQL no banco

**Busca em migrations aplicadas:**
```bash
grep -r "CREATE TRIGGER.*dispatch" supabase/migrations/
```

**Resultado:** NENHUM trigger SQL de dispatch encontrado.

**Conclusão:** O mecanismo de disparo é Database Webhook (configurado via Dashboard), NÃO trigger SQL.

### Evidência 3: Comentário ENGANOSO foi corrigido

**Arquivo:** `src/modules/mobility/core/RideOperationalService.ts` (linha ~145)

**ANTES (ERRADO):**
```typescript
logger.info('RideOperationalService.createRide - Dispatch will be triggered by database trigger', {
  rideId: ride.id,
});
```

**DEPOIS (CORRETO):**
```typescript
logger.info('RideOperationalService.createRide - Auto-dispatch edge function will be triggered', {
  rideId: ride.id,
});
```

### RESPOSTA OBJETIVA ATUALIZADA

1. **Dispatch é automático ou manual?** ✅ AUTOMÁTICO via Edge Function
2. **Trigger SQL existe?** ❌ NÃO (mecanismo é Database Webhook)
3. **Edge function existe?** ✅ SIM (`auto-dispatch-ride`)
4. **Qual é o caminho oficial real em produção hoje?** AUTOMÁTICO:
   - `createRide()` → Status: `searching_driver`
   - Database Webhook dispara `auto-dispatch-ride` automaticamente
   - Edge function busca motoristas e atribui ou expira
   - Se não há motoristas, expira IMEDIATAMENTE (~1s)

### IMPLICAÇÃO PARA TESTES DO GATE 6

**Decisão:** ALINHAR testes ao runtime real (dispatch automático é legítimo)

**Estratégias de teste:**

**Opção A - Validar Expiração (quando não há motoristas):**
```typescript
// Garantir que NÃO há motoristas disponíveis
await cleanupAllDrivers();

// Criar corrida
const result = await RideOperationalService.createRide({...});

// Aguardar auto-dispatch
await new Promise(resolve => setTimeout(resolve, 5000));

// Validar que expirou
expect(ride.status).toBe('expired');
```

**Opção B - Validar Dispatch Automático (quando há motoristas):**
```typescript
// Criar motorista disponível ANTES de criar corrida
await authenticateAsProfile(driverId);
await DriverAvailabilityService.goOnline(driverId);
await DriverAvailabilityService.setAvailable(driverId, { lat, lng });

// Criar corrida
await authenticateAsProfile(passengerId);
const result = await RideOperationalService.createRide({...});

// Aguardar auto-dispatch
await new Promise(resolve => setTimeout(resolve, 5000));

// Validar que foi atribuído automaticamente
expect(ride.status).toBe('driver_assigned');
expect(ride.driver_profile_id).toBe(driverId);
```

**Opção C - Controle Manual para Testes (secundário):**
- Modificar `RideDispatchService` para aceitar `clientOverride` opcional
- Permite testes chamarem dispatch manualmente quando necessário
- Útil para testes que precisam controle fino sobre o timing

---

## B) ASSINATURA REAL DE startRide()

### Evidência: Método NÃO existe em RideOperationalService

**Busca:**
```bash
grep "startRide" src/modules/mobility/core/*.ts
```

**Resultado:** No matches found.

**Arquivo:** `src/modules/mobility/core/RideOperationalService.ts`

**Métodos que EXISTEM:**
```typescript
- createRide()
- transitionTo()
- cancelRide()
- completeRide()
- acceptRide()
- createDelivery()
- confirmPickup()
- startDelivery()      // ← Motoboy only
- confirmDelivery()
- failDelivery()
```

**Métodos que NÃO EXISTEM:**
```typescript
- startRide()          // ❌ NÃO EXISTE
```

### Evidência: startRide() existe apenas em RideService (legado)

**Arquivo:** `src/modules/mobility/services/RideService.ts` (linha 81)

```typescript
async startRide(rideId: string): Promise<RideRequest> {
  return this.updateRide(rideId, { status: 'in_progress' });
}
```

**Análise:** Este é um service legado, NÃO é o motor oficial (RideOperationalService).

### RESPOSTA OBJETIVA

**startRide() existe?** 
- ❌ NÃO EXISTE em `RideOperationalService` (motor oficial)
- ✅ EXISTE em `RideService` (legado, não é SSOT)

**Método oficial correto:**
```typescript
RideOperationalService.transitionTo(
  rideId,
  RIDE_STATUS.IN_PROGRESS,
  driverId,
  'Ride started'
)
```

---

## C) VERSÃO CORRIGIDA FINAL DAS SUÍTES

### Correção 1: Remover startRide() da Suíte B

**Linha incorreta:**
```typescript
const startResult = await RideOperationalService.startRide(rideId, driverId);
```

**Linha correta:**
```typescript
const startResult = await RideOperationalService.transitionTo(
  rideId,
  RIDE_STATUS.IN_PROGRESS,
  driverId,
  'Ride started'
);
```

### Correção 2: Documentar que dispatch é manual

**Adicionar comentário explícito na Suíte B:**
```typescript
// ============================================
// ETAPA 4: Dispatch busca motorista (FLUXO OFICIAL MANUAL)
// IMPORTANTE: Não existe dispatch automático via trigger no banco atual
// A aplicação precisa chamar manualmente findEligibleDrivers()
// ============================================
```

---

## D) CLASSIFICAÇÃO HONESTA DO GATE 6

### O que o Gate 6 realmente é

**NÃO É:**
- ❌ E2E de produto completo (usuário final → UI → backend → banco)
- ❌ Validação de métodos específicos de estados intermediários (não existem)

**É:**
- ✅ E2E de service/core (validação do motor operacional)
- ✅ Validação de fluxo AUTOMÁTICO de dispatch via edge function
- ✅ Validação de transições de estado via método genérico
- ✅ Validação de integração entre services (RideOperationalService + RideDispatchService + DriverAvailabilityService)
- ✅ Validação de comportamento real de produção (dispatch automático)

### Classificação correta

**Gate 6 = E2E de Service/Core com Dispatch Automático**

**Escopo:**
- Valida que o motor operacional funciona do início ao fim
- Valida que os services se integram corretamente
- Valida que as transições de estado respeitam a state machine
- Valida que a disponibilidade do motorista é gerenciada corretamente
- Valida que dispatch automático via edge function funciona corretamente
- Valida que corridas expiram quando não há motoristas disponíveis

**Limitações:**
- NÃO valida UI
- NÃO valida métodos específicos de estados (não existem, usa `transitionTo()` genérico)
- NÃO valida configuração do Database Webhook (assumido como configurado)

### Linguagem honesta para o relatório

**ANTES (desatualizado):**
> "Gate 6 valida o fluxo E2E do passageiro com dispatch manual"

**DEPOIS (honesto e atualizado):**
> "Gate 6 valida o motor operacional (service/core) do fluxo de corrida, incluindo dispatch AUTOMÁTICO via edge function. Valida comportamento real de produção: corridas expiram se não há motoristas, ou são atribuídas automaticamente se há motoristas disponíveis."

---

## RESUMO EXECUTIVO

### Contradições resolvidas

1. ✅ **Dispatch:** Confirmado que NÃO existe trigger automático no banco
2. ✅ **startRide():** Confirmado que NÃO existe em RideOperationalService
3. ✅ **Classificação:** Gate 6 é E2E de service/core, não de produto completo

### Correções necessárias

1. Remover `startRide()` da Suíte B
2. Usar `transitionTo(IN_PROGRESS)` no lugar
3. Adicionar comentário explícito sobre dispatch manual
4. Reclassificar Gate 6 como "E2E de Service/Core" no relatório

### Próximo passo

Aplicar correções nas suítes e re-gerar relatório com linguagem honesta.
