# GATE 6 MOTOBOY: INSTRUÇÕES FINAIS

**Data:** 08/04/2026  
**Status:** BLOQUEADO - Precisa aplicar correções

---

## SITUAÇÃO ATUAL

**Testes:** 1/3 passando (33%)

- ✅ M.3. Expiração sem motoboy (PASSOU)
- ❌ M.1. Fluxo completo (FALHOU - auto-dispatch expirou)
- ❌ M.2. Falha na entrega (FALHOU - auto-dispatch expirou)

**Causa raiz:** Edge function não considera `ride_mode` ou `can_do_delivery`

---

## CORREÇÕES APLICADAS

### 1. Edge Function Atualizada ✅

**Arquivo:** `supabase/functions/auto-dispatch-ride/index.ts`

**Mudanças:**
1. Busca `ride_mode` da corrida
2. Se `ride_mode = 'motoboy'`, filtra apenas motoristas com `can_do_delivery = true`
3. Se `ride_mode = 'ride'`, usa todos motoristas

**Status:** Código atualizado localmente

### 2. Script SQL Criado ✅

**Arquivo:** `APLICAR_MOTOBOY_CAN_DO_DELIVERY.sql`

**Ação:** Garante que driverB tem `can_do_delivery = true`

**Status:** Pronto para aplicar

---

## PRÓXIMOS PASSOS

### PASSO 1: Aplicar can_do_delivery no Banco

```sql
-- Executar no SQL Editor do Supabase
UPDATE driver_data
SET can_do_delivery = true
WHERE profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';
```

**Verificar:**
```sql
SELECT profile_id, can_do_delivery
FROM driver_data
WHERE profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';
```

### PASSO 2: Deploy da Edge Function

```bash
# Via Supabase CLI
supabase functions deploy auto-dispatch-ride
```

**Ou via Dashboard:**
1. Abrir Supabase Dashboard → Edge Functions
2. Selecionar `auto-dispatch-ride`
3. Copiar conteúdo de `supabase/functions/auto-dispatch-ride/index.ts`
4. Colar e salvar

### PASSO 3: Executar Testes Novamente

```bash
npm test tests/operational/gate6-motoboy-runtime.test.ts
```

**Resultado esperado:** 3/3 testes passando

---

## VALIDAÇÕES ESPERADAS

### M.1. Fluxo Completo

**Timeline esperada:**
```
requested → searching_driver → driver_assigned (auto-dispatch) →
driver_accepted → driver_arriving → pickup_confirmed →
in_delivery → delivered → completed
```

**Evidências esperadas:**
- ✅ Auto-dispatch atribui motoboy (não expira)
- ✅ `ride_mode = 'motoboy'` persistido
- ✅ `pickup_confirmed_at` registrado
- ✅ `delivered_at` registrado
- ✅ `proof_of_delivery` persistido com:
  - `photo_url`
  - `code`
  - `observation`
  - `signed_at`
- ✅ `final_price` atualizado
- ✅ Motoboy liberado (online_available)
- ✅ Auditoria completa (9 transições)

### M.2. Falha na Entrega

**Timeline esperada:**
```
requested → searching_driver → driver_assigned → driver_accepted →
driver_arriving → pickup_confirmed → in_delivery → failed_delivery
```

**Evidências esperadas:**
- ✅ `failed_delivery_metadata` persistido com:
  - `failure_reason`
  - `item_destination`
  - `item_current_holder`
  - `timestamp`
  - `resolution_status`
  - `resolution_notes`
  - `attempted_delivery_count`
- ✅ `failed_delivery_at` registrado
- ✅ `failed_delivery_reason` registrado
- ✅ Auditoria com `reason = recipient_unavailable`
- ✅ Motoboy ainda busy (item com ele)

### M.3. Expiração

**Status:** ✅ JÁ PASSOU

**Evidência:**
- ✅ Expiração em 278ms
- ✅ Auditoria: `changed_by = system`, `reason = No eligible drivers found`

---

## ESTIMATIVA

**Tempo para aplicar correções:** 15-30 minutos

**Tempo para executar testes:** 2-3 minutos

**Total:** 20-35 minutos

---

## APÓS TESTES PASSAREM

### Criar Relatório Final

**Arquivo:** `GATE_6_MOTOBOY_FECHAMENTO_FINAL.md`

**Conteúdo:**
- A) Quantos testes passaram (3/3)
- B) Timeline real dos status do motoboy
- C) Evidência do audit
- D) Evidência de proof_of_delivery
- E) Evidência de failed_delivery_metadata
- F) Resposta binária: Mobilidade 100% fechada

---

## VEREDITO ESPERADO

**Após correções:**

**Gate 6 Motoboy:** ✅ FECHADO (3/3 testes)

**Mobilidade:** ✅ 100% FECHADA

**Justificativa:**
- Passageiro: 100% validado (Gate 6 fechado)
- Motoboy: 100% validado (Gate 6 fechado)
- Auto-dispatch: Funciona para ambos os modos
- Proof of delivery: Validado
- Failed delivery: Validado
- Auditoria: Completa

---

## PRÓXIMA AÇÃO

**Aplicar `APLICAR_MOTOBOY_CAN_DO_DELIVERY.sql` no SQL Editor do Supabase**

Depois:
1. Deploy edge function
2. Executar testes
3. Criar relatório final
4. Marcar mobilidade como 100% fechada
