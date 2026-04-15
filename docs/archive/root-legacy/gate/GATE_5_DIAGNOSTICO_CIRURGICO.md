# GATE 5: DIAGNÓSTICO CIRÚRGICO - 3 TESTES RESTANTES

**Data:** 08/04/2026  
**Status:** 23/26 testes passando (88%)

---

## CAUSA RAIZ #1: findAvailableDrivers (caso positivo)

### Erro
```
PGRST200 - Could not find a relationship between 'driver_availability' and 'driver_data'
```

### Diagnóstico Executado
```bash
# Query testada no banco remoto
driver_availability.select('profile_id, driver_data!inner(rating, can_do_delivery)')

# Resultado
❌ Join FAILED: Could not find a relationship between 'driver_availability' 
and 'driver_data' in the schema cache
```

### Causa Raiz CONFIRMADA
**NÃO EXISTE FK entre `driver_availability` e `driver_data` no banco remoto.**

Schema verificado:
- `driver_availability` tem: `profile_id` (PK)
- `driver_data` tem: `id` (PK), `profile_id` (FK para profiles)
- **NÃO há FK direto entre as duas tabelas**

### Correção Necessária
Mudar estratégia de join:
1. Buscar `driver_availability` primeiro
2. Buscar `driver_data` separadamente por `profile_id`
3. Fazer merge em memória

---

## CAUSA RAIZ #2: markStaleDrivers (stale available)

### Erro
```
expected 0 to be greater than 0
```

### Diagnóstico Executado
```
Logs do teste:
- threshold: '2026-04-08T00:55:38.659Z' (5 min atrás)
- found: 0
- drivers: []
```

### Teste de Persistência
```javascript
// Simulação no banco real
1. Estado inicial: last_seen_at = "2026-04-08T01:01:02.31+00:00"
2. Update manual: last_seen_at = "2026-04-08T00:55:30.552Z" (6 min atrás)
3. ✅ Update SUCCESS - persistiu corretamente
4. Query markStaleDrivers: ✅ ENCONTROU 1 motorista
```

### Causa Raiz CONFIRMADA
**O update manual FUNCIONA no banco, mas o teste está falhando.**

Possíveis causas:
1. ❌ Update sem `await` no teste
2. ❌ Outro método sobrescrevendo `last_seen_at` após o update manual
3. ❌ Timing: `markStaleDrivers` executando antes do update persistir

### Correção Necessária
Adicionar `await` explícito e verificar se `setAvailable` não está atualizando `last_seen_at` automaticamente.

---

## CAUSA RAIZ #3: markStaleDrivers (stale busy)

### Erro
```
expected 0 to be greater than 0
```

### Causa Raiz
**MESMA CAUSA do teste #2** - update manual não está persistindo no contexto do teste.

### Correção Necessária
Mesma correção do teste #2.

---

## CORREÇÕES A APLICAR

### 1. DriverAvailabilityService.findAvailableDrivers
**Arquivo:** `src/modules/mobility/services/DriverAvailabilityService.ts`  
**Linha:** ~530

**Antes:**
```typescript
let query = supabase
  .from('driver_availability')
  .select(`
    profile_id,
    current_lat,
    current_lng,
    last_seen_at,
    driver_data!inner(rating, can_do_delivery)
  `)
```

**Depois:**
```typescript
// Buscar driver_availability primeiro
const { data: drivers, error } = await supabase
  .from('driver_availability')
  .select('profile_id, current_lat, current_lng, last_seen_at')
  .eq('is_online', true)
  .eq('is_available', true)
  .is('active_ride_id', null)
  .not('current_lat', 'is', null)
  .not('current_lng', 'is', null);

if (error) throw error;
if (!drivers || drivers.length === 0) return [];

// Buscar driver_data separadamente
const profileIds = drivers.map(d => d.profile_id);
const { data: driverData } = await supabase
  .from('driver_data')
  .select('profile_id, rating, can_do_delivery')
  .in('profile_id', profileIds);

// Merge em memória
const dataMap = new Map(driverData?.map(d => [d.profile_id, d]) || []);

// Filtrar por capacidade de entrega quando for motoboy
const filtered = drivers.filter(d => {
  const data = dataMap.get(d.profile_id);
  if (!data) return false;
  if (rideMode === 'motoboy' && !data.can_do_delivery) return false;
  return true;
});
```

### 2. gate5-availability-test.test.ts (testes 3.1 e 3.2)
**Arquivo:** `tests/operational/gate5-availability-test.test.ts`  
**Linhas:** ~270-310

**Problema:** Update manual pode estar sendo sobrescrito por `setAvailable`

**Solução:** Verificar se `setAvailable` atualiza `last_seen_at` automaticamente e adicionar delay.

**Antes:**
```typescript
await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);

// Simular last_seen antigo (6 minutos atrás)
await supabase
  .from('driver_availability')
  .update({
    last_seen_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  })
  .eq('profile_id', TEST_DRIVER_ID);

const result = await DriverAvailabilityService.markStaleDrivers(5);
```

**Depois:**
```typescript
await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);

// Aguardar persistência
await new Promise(resolve => setTimeout(resolve, 100));

// Simular last_seen antigo (6 minutos atrás)
const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000).toISOString();
const { error: updateErr } = await supabase
  .from('driver_availability')
  .update({ last_seen_at: oldTimestamp })
  .eq('profile_id', TEST_DRIVER_ID);

if (updateErr) throw updateErr;

// Aguardar persistência do update
await new Promise(resolve => setTimeout(resolve, 100));

const result = await DriverAvailabilityService.markStaleDrivers(5);
```

---

## PRÓXIMOS PASSOS

1. ✅ Diagnóstico cirúrgico completo
2. ⏳ Aplicar correção #1 (findAvailableDrivers)
3. ⏳ Aplicar correção #2 (testes markStaleDrivers)
4. ⏳ Executar testes até 26/26 (100%)
5. ⏳ Relatório final de fechamento

---

## VEREDITO

**Gate 5 NÃO está fechado.**

Motivo: 3 testes centrais ainda falhando.

Próximo passo: Aplicar correções e validar.
