# GATE 6 MOTOBOY: INSTRUÇÕES DE DEPLOY

**Data:** 08/04/2026  
**Status:** PRONTO PARA DEPLOY

---

## SITUAÇÃO ATUAL

✅ **SQL aplicado:** `can_do_delivery = true` para driverB  
✅ **Edge function atualizada localmente:** `supabase/functions/auto-dispatch-ride/index.ts`  
✅ **Testes criados:** `tests/operational/gate6-motoboy-runtime.test.ts`  
❌ **Edge function NÃO deployada no Supabase remoto**

**Resultado dos testes:** 0/3 passando (aguardando deploy)

---

## PRÓXIMO PASSO: DEPLOY DA EDGE FUNCTION

### Opção 1: Via Supabase CLI (RECOMENDADO)

```bash
# Verificar se CLI está instalado
supabase --version

# Deploy da edge function
supabase functions deploy auto-dispatch-ride

# Verificar logs
supabase functions logs auto-dispatch-ride
```

### Opção 2: Via Supabase Dashboard (MANUAL)

1. Abrir: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/functions
2. Selecionar função: `auto-dispatch-ride`
3. Clicar em "Edit"
4. Copiar conteúdo completo de: `supabase/functions/auto-dispatch-ride/index.ts`
5. Colar no editor
6. Clicar em "Deploy"

---

## O QUE FOI ALTERADO NA EDGE FUNCTION

### Mudança 1: Buscar ride_mode da corrida

```typescript
// ANTES
const { data: ride, error: rideError } = await supabase
  .from('ride_requests')
  .select(`
    id,
    status,
    created_at,
    pickup_address_id,
    addresses!pickup_address_id(latitude, longitude)
  `)
  .eq('id', rideId)
  .single();

// DEPOIS
const { data: ride, error: rideError } = await supabase
  .from('ride_requests')
  .select(`
    id,
    status,
    created_at,
    ride_mode,  // ← ADICIONADO
    pickup_address_id,
    addresses!pickup_address_id(latitude, longitude)
  `)
  .eq('id', rideId)
  .single();
```

### Mudança 2: Passar ride_mode para findEligibleDrivers

```typescript
// ANTES
const eligibleDrivers = await findEligibleDrivers(
  supabase,
  rideId,
  pickupLat,
  pickupLng
);

// DEPOIS
const eligibleDrivers = await findEligibleDrivers(
  supabase,
  rideId,
  pickupLat,
  pickupLng,
  ride.ride_mode || 'ride'  // ← ADICIONADO
);
```

### Mudança 3: Filtrar motoristas por can_do_delivery

```typescript
// ANTES
let query = supabase
  .from('driver_availability')
  .select(`
    profile_id,
    current_lat,
    current_lng,
    profiles!inner(rating)
  `)
  .eq('is_online', true)
  .eq('is_available', true);

// DEPOIS
let query = supabase
  .from('driver_availability')
  .select(`
    profile_id,
    current_lat,
    current_lng,
    profiles!inner(rating),
    driver_data!inner(can_do_delivery)  // ← ADICIONADO
  `)
  .eq('is_online', true)
  .eq('is_available', true);

// Filtrar por tipo de corrida
if (rideMode === 'motoboy') {
  query = query.eq('driver_data.can_do_delivery', true);  // ← ADICIONADO
}
```

---

## APÓS O DEPLOY

### 1. Executar Testes

```bash
npm test tests/operational/gate6-motoboy-runtime.test.ts
```

### 2. Resultado Esperado

```
✅ M.1. Fluxo completo: criar → coletar → entregar (PASSOU)
✅ M.2. Falha na entrega com metadata (PASSOU)
✅ M.3. Expiração sem motoboy disponível (PASSOU)

Test Files  1 passed (1)
     Tests  3 passed (3)
```

### 3. Evidências Esperadas

**M.1 - Fluxo Completo:**
- ✅ Auto-dispatch atribui motoboy (não expira)
- ✅ `ride_mode = 'motoboy'` persistido
- ✅ `proof_of_delivery` persistido com photo_url, code, observation
- ✅ Motoboy liberado após entrega
- ✅ Auditoria completa (9 transições)

**M.2 - Falha na Entrega:**
- ✅ `failed_delivery_metadata` persistido
- ✅ `failure_reason`, `item_destination`, `item_current_holder`
- ✅ Motoboy ainda busy (item com ele)
- ✅ Auditoria com reason correto

**M.3 - Expiração:**
- ✅ Expiração automática (~300ms)
- ✅ Auditoria: `changed_by = system`, `reason = No eligible drivers found`

---

## APÓS TESTES PASSAREM

### Criar Relatório Final

```bash
# Arquivo: GATE_6_MOTOBOY_FECHAMENTO_FINAL.md
```

**Conteúdo:**
- A) Quantos testes passaram (3/3)
- B) Timeline real dos status do motoboy
- C) Evidência do audit
- D) Evidência de proof_of_delivery
- E) Evidência de failed_delivery_metadata
- F) Resposta binária: ✅ MOBILIDADE 100% FECHADA

---

## VEREDITO ESPERADO

**Gate 6 Passageiro:** ✅ FECHADO (4/4 testes)  
**Gate 6 Motoboy:** ✅ FECHADO (3/3 testes)  
**Mobilidade:** ✅ 100% FECHADA

**Justificativa:**
- Passageiro: 100% validado no runtime real
- Motoboy: 100% validado no runtime real
- Auto-dispatch: Funciona para ambos os modos
- Proof of delivery: Validado
- Failed delivery: Validado
- Auditoria: Completa

---

## ESTIMATIVA

**Tempo para deploy:** 5-10 minutos  
**Tempo para executar testes:** 2-3 minutos  
**Tempo para criar relatório:** 10-15 minutos  
**Total:** 20-30 minutos

---

## PRÓXIMA AÇÃO IMEDIATA

**DEPLOY DA EDGE FUNCTION VIA CLI OU DASHBOARD**

Comando:
```bash
supabase functions deploy auto-dispatch-ride
```

Ou via Dashboard:
https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/functions

Após deploy, executar:
```bash
npm test tests/operational/gate6-motoboy-runtime.test.ts
```

---

## ARQUIVOS RELEVANTES

- `supabase/functions/auto-dispatch-ride/index.ts` - Edge function atualizada
- `tests/operational/gate6-motoboy-runtime.test.ts` - Testes oficiais
- `EDGE_FUNCTION_ATUALIZADA_MOTOBOY.ts` - Versão completa para copiar
- `APLICAR_MOTOBOY_CAN_DO_DELIVERY.sql` - SQL já aplicado ✅

---

## SUPORTE

Se o deploy via CLI falhar, use a opção manual via Dashboard.

Se os testes ainda falharem após deploy, verificar:
1. Edge function foi deployada corretamente
2. `can_do_delivery = true` no banco
3. Logs da edge function: `supabase functions logs auto-dispatch-ride`

