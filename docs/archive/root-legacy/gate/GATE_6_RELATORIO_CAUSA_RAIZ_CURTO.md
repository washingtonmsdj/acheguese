# GATE 6: CAUSA RAIZ DO EXPIRED - RELATÓRIO CURTO

**Data:** 08/04/2026

---

## A) MECANISMO EXATO

**Edge Function `auto-dispatch-ride`** (Supabase Functions)

Localização: `supabase/functions/auto-dispatch-ride/index.ts`

Comportamento: Busca motoristas elegíveis. Se `length === 0`, expira IMEDIATAMENTE.

---

## B) EVIDÊNCIA OBJETIVA

### Auditoria (ride_state_audit)

```
3. searching_driver → expired
   changed_by: system
   reason: No eligible drivers found
   created_at: 2026-04-08T03:53:11.282553+00:00
```

### Timeline

- T+0s: createRide() retorna `searching_driver`
- T+1s: Edge function executa
- T+3s: Status = `expired`

### Código (linha 118-122)

```typescript
if (eligibleDrivers.length === 0) {
  await expireRide(supabase, rideId, 'No eligible drivers found');
  // ...
}
```

---

## C) RUNTIME OFICIAL OU RESÍDUO?

### ✅ RUNTIME OFICIAL

**Evidências:**
- Edge function deployada e ativa
- Código profissional com auditoria completa
- Comportamento consistente e determinístico
- Registra tentativas em `ride_dispatch_audit`

**Problema:** Comentário ENGANOSO em `RideOperationalService.createRide()` diz "database trigger" mas NÃO HÁ TRIGGER.

**Realidade:** Database Webhook (configurado via Dashboard) dispara a edge function quando `status = 'searching_driver'`.

---

## D) DECISÃO

### ✅ ALINHAR TESTES AO RUNTIME REAL

**Justificativa:** Edge function é parte legítima do sistema de produção. Testes devem validar comportamento REAL.

**Ação:**
1. Atualizar `GATE_6_VERDADE_OBJETIVA.md`: Dispatch é AUTOMÁTICO via edge function
2. Corrigir comentário enganoso sobre "database trigger"
3. Ajustar testes: Criar motoristas disponíveis ANTES de criar corrida
4. Ou validar que corrida expira corretamente quando não há motoristas

---

## E) PLANO FINAL

### 1. Corrigir Comentário (RideOperationalService.ts linha 147)

```typescript
// ANTES:
logger.info('Dispatch will be triggered by database trigger', {...});

// DEPOIS:
logger.info('Auto-dispatch edge function will be triggered', {...});
```

### 2. Ajustar Testes do Gate 6

**Opção A - Validar Expiração:**
```typescript
// Garantir que NÃO há motoristas
await cleanupAllDrivers();
const result = await createRide({...});
await sleep(5000); // Aguardar auto-dispatch
expect(ride.status).toBe('expired');
```

**Opção B - Validar Dispatch Automático:**
```typescript
// Criar motorista disponível ANTES
await setDriverAvailable(driverId, lat, lng);
const result = await createRide({...});
await sleep(5000); // Aguardar auto-dispatch
expect(ride.status).toBe('driver_assigned');
expect(ride.driver_profile_id).toBe(driverId);
```

### 3. Modificar RideDispatchService (Secundário)

Adicionar `clientOverride` opcional para testes que precisam controle manual.

### 4. Documentar Webhook

Criar `docs/DISPATCH_AUTOMÁTICO.md` explicando o mecanismo completo.

---

## RESUMO

**Causa:** Edge function `auto-dispatch-ride` expira corridas sem motoristas em ~1s.

**Evidência:** Auditoria mostra `system` / `No eligible drivers found`.

**Decisão:** Alinhar testes ao runtime real (dispatch automático é legítimo).

**Desbloqueio:** Gate 6 pode prosseguir criando motoristas disponíveis nos testes.

