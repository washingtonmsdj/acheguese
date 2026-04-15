# GATE 6: DESBLOQUEIO FINAL - RELATÓRIO CURTO

**Data:** 08/04/2026

---

## A) MECANISMO EXATO QUE MUDA searching_driver → expired

### ✅ CAUSA RAIZ COMPROVADA

**Edge Function `auto-dispatch-ride`** (Supabase Functions)

**Localização:** `supabase/functions/auto-dispatch-ride/index.ts`

**Comportamento:**
1. Database Webhook dispara edge function quando `status = 'searching_driver'`
2. Edge function busca motoristas elegíveis via `findEligibleDrivers()`
3. Se `eligibleDrivers.length === 0`, chama `expireRide()` IMEDIATAMENTE
4. `expireRide()` muda status para `expired` com reason "No eligible drivers found"

**Código relevante (linhas 118-122):**
```typescript
if (eligibleDrivers.length === 0) {
  await expireRide(supabase, rideId, 'No eligible drivers found');
  return new Response(
    JSON.stringify({ success: false, reason: 'no_drivers' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

## B) EVIDÊNCIA OBJETIVA

### Timeline Observada

```
T+0s: createRide() retorna success, newState="searching_driver"
T+1s: Edge function executa
T+3s: Status no banco = "expired"
```

### Auditoria de Transições (ride_state_audit)

```sql
SELECT from_state, to_state, changed_by, reason, created_at
FROM ride_state_audit
WHERE ride_id = 'c34eaddf-e431-4f8d-acd9-c895611a4d6a'
ORDER BY created_at;
```

**Resultado:**
```
1. none → requested
   changed_by: b374bdab-cd76-43b2-bb3c-eb844d096acb (passageiro)
   reason: Ride created
   created_at: 2026-04-08T03:53:09.273+00:00

2. requested → searching_driver
   changed_by: system
   reason: N/A
   created_at: 2026-04-08T03:53:10.456+00:00

3. searching_driver → expired  ← EVIDÊNCIA OBJETIVA
   changed_by: system
   reason: No eligible drivers found
   created_at: 2026-04-08T03:53:11.282553+00:00
```

**Diferença temporal:** ~1 segundo entre `searching_driver` e `expired`

### Logs da Edge Function

```
[AutoDispatch] Starting for ride: c34eaddf-e431-4f8d-acd9-c895611a4d6a
[AutoDispatch] Found 0 eligible drivers
[AutoDispatch] Ride expired: No eligible drivers found
```

---

## C) RUNTIME OFICIAL OU RESÍDUO INDEVIDO?

### ✅ RUNTIME OFICIAL

**Evidências:**
1. ✅ Edge function deployada e ativa no ambiente remoto
2. ✅ Código profissional com auditoria completa
3. ✅ Configurações profissionais (timeouts, retry attempts)
4. ✅ Registra tentativas em `ride_dispatch_audit`
5. ✅ Comportamento consistente e determinístico

**Problema identificado:**
- ❌ Comentário ENGANOSO em `RideOperationalService.createRide()` (linha 147)
- Dizia: "Dispatch will be triggered by database trigger"
- Realidade: NÃO há trigger SQL. Mecanismo é Database Webhook (configurado via Dashboard)

**Correção aplicada:**
```typescript
// ANTES (ERRADO):
logger.info('RideOperationalService.createRide - Dispatch will be triggered by database trigger', {
  rideId: ride.id,
});

// DEPOIS (CORRETO):
logger.info('RideOperationalService.createRide - Auto-dispatch edge function will be triggered', {
  rideId: ride.id,
});
```

---

## D) DECISÃO: ALINHAR OU NEUTRALIZAR?

### ✅ ALINHAR TESTES AO RUNTIME REAL

**Justificativa:**
- Edge function é parte legítima do runtime de produção
- Comportamento é profissional e bem implementado
- Auditoria completa e rastreável
- Testes devem validar o comportamento REAL do sistema

**Ação:**
1. ✅ Documentar que dispatch é AUTOMÁTICO via edge function
2. ✅ Atualizar `GATE_6_VERDADE_OBJETIVA.md` com a verdade real
3. ✅ Ajustar testes do Gate 6 para criar motoristas disponíveis ANTES de criar corrida
4. ✅ Remover comentário enganoso sobre "database trigger"
5. ⏳ Executar Gate 6 completo

---

## E) PLANO FINAL PARA DESTRAVAR GATE 6

### Correções Aplicadas

#### 1. ✅ Comentário Enganoso Corrigido

**Arquivo:** `src/modules/mobility/core/RideOperationalService.ts` (linha 145-149)

**Status:** CORRIGIDO

#### 2. ✅ Verdade Objetiva Atualizada

**Arquivo:** `GATE_6_VERDADE_OBJETIVA.md`

**Atualização:**
- Documentado que dispatch é AUTOMÁTICO via edge function
- Documentado que mecanismo é Database Webhook (não trigger SQL)
- Adicionadas estratégias de teste para alinhar ao runtime real

**Status:** ATUALIZADO

#### 3. ✅ Suítes de Teste Atualizadas

**Arquivos atualizados:**
- `tests/operational/gate6-dispatch-primitives.test.ts` (Suíte A)
- `tests/operational/gate6-e2e-passenger.test.ts` (Suíte B)
- `tests/operational/gate6-operational-cases.test.ts` (Suíte C)

**Mudanças:**
- Removidas chamadas manuais a `findAvailableDriversAdmin()` e `assignDriverAdmin()` da Suíte B
- Adicionado `await new Promise(resolve => setTimeout(resolve, 5000))` para aguardar dispatch automático
- Atualizada documentação dos testes para refletir dispatch automático
- Suíte C.2 agora valida que motoristas diferentes são atribuídos automaticamente

**Status:** ATUALIZADO

#### 4. ⏳ Modificar RideDispatchService (Secundário)

**Objetivo:** Adicionar parâmetro opcional `clientOverride` para testes que precisam controle manual

**Status:** PENDENTE (não é bloqueador para Gate 6)

**Justificativa:** Suíte A (dispatch primitives) ainda usa helpers admin para testes unitários isolados. Isso é aceitável pois valida primitives, não fluxo E2E.

### Próximos Passos

#### 1. ⏳ Executar Gate 6 Completo

```bash
npm test -- tests/operational/gate6
```

**Expectativa:**
- Suíte A: 5/5 testes passando (primitives isoladas)
- Suíte B: 1/1 teste passando (E2E com dispatch automático)
- Suíte C: 2/2 testes passando (casos operacionais)

**Total esperado:** 8/8 testes passando

#### 2. ⏳ Validar Comportamento Real

**Cenário 1 - Sem motoristas disponíveis:**
- Criar corrida sem motoristas online
- Validar que expira em ~1-3s
- Validar auditoria: `changed_by: system`, `reason: No eligible drivers found`

**Cenário 2 - Com motoristas disponíveis:**
- Criar motorista online e disponível
- Criar corrida
- Validar que motorista é atribuído automaticamente em ~1-3s
- Validar auditoria: `changed_by: system`, `reason: Driver assigned by auto-dispatch`

#### 3. ⏳ Documentar Webhook

**Criar:** `docs/DISPATCH_AUTOMATICO.md`

**Conteúdo:**
- Como o Database Webhook está configurado
- Como a edge function funciona
- Como desabilitar para testes locais (se necessário)
- Fluxo completo do dispatch automático

---

## RESUMO EXECUTIVO

### Causa Raiz

**Edge Function `auto-dispatch-ride`** disparada por Database Webhook expira corridas sem motoristas IMEDIATAMENTE (~1s).

### Evidência

Auditoria mostra `changed_by: system`, `reason: No eligible drivers found` em ~1s após `searching_driver`.

### Decisão

ALINHAR testes ao runtime real (dispatch automático é legítimo e profissional).

### Correções Aplicadas

1. ✅ Comentário enganoso corrigido em `RideOperationalService.ts`
2. ✅ Verdade objetiva atualizada em `GATE_6_VERDADE_OBJETIVA.md`
3. ✅ Suítes de teste atualizadas para dispatch automático

### Bloqueio Removido

Gate 6 pode prosseguir validando comportamento REAL do sistema. Testes agora criam motoristas disponíveis ANTES de criar corrida, ou validam expiração correta quando não há motoristas.

### Próximo Passo

Executar `npm test -- tests/operational/gate6` e validar 8/8 testes passando.

---

## APRENDIZADOS

### 1. Comentários Enganosos São Perigosos

Comentário dizia "database trigger" mas não havia trigger. Isso causou confusão e perda de tempo.

**Lição:** Comentários devem refletir a realidade do código, não aspirações ou implementações antigas.

### 2. Database Webhooks Não Aparecem em Migrations

Webhooks são configurados via Dashboard/API, não via SQL migrations. Isso dificulta rastreabilidade.

**Lição:** Documentar webhooks explicitamente em `docs/` para visibilidade.

### 3. Testes Devem Validar Comportamento Real

Testes que não alinham ao runtime real não validam o sistema de produção.

**Lição:** Sempre investigar comportamento real antes de escrever testes.

### 4. Auditoria É Essencial

Sem `ride_state_audit`, seria impossível identificar a causa raiz com certeza.

**Lição:** Auditoria completa de transições de estado é investimento que se paga.

