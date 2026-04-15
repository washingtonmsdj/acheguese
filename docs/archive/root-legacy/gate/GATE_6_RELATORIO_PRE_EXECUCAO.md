# GATE 6: RELATÓRIO PRÉ-EXECUÇÃO

**Data:** 08/04/2026  
**Status:** ✅ PRONTO PARA EXECUTAR

---

## ESTRUTURA FINAL DO JSON

```json
{
  "locationIds": {
    "primary": "54261f4a-03ba-47f8-8733-c031163e7535"
  },
  "addressIds": {
    "pickup": "00000000-0000-0000-0000-000000000201",
    "dropoff": "00000000-0000-0000-0000-000000000201"
  },
  "passengers": {
    "passengerA": { "id": "b374bdab-cd76-43b2-bb3c-eb844d096acb" },
    "passengerB": { "id": "6fb6aa61-7b40-4deb-867a-72688d1bccc1" }
  },
  "drivers": {
    "driverA": { "id": "2357467c-4f5e-4285-bf6b-39628c6a44ad", "lat": -23.551, "lng": -46.634 },
    "driverB": { "id": "2357467c-4f5e-4285-bf6b-39628c6a44ad", "lat": -23.552, "lng": -46.635 },
    "driverC": { "id": "2357467c-4f5e-4285-bf6b-39628c6a44ad", "lat": -23.56, "lng": -46.65 }
  },
  "coords": {
    "pickup": { "lat": -23.5505, "lng": -46.6333 },
    "dropoff": { "lat": -23.56, "lng": -46.64 }
  }
}
```

---

## IDS DISTINTOS ATRIBUÍDOS

### Passageiros (2 DISTINTOS)
- **passengerA:** `b374bdab-cd76-43b2-bb3c-eb844d096acb` ✅ DISTINTO
- **passengerB:** `6fb6aa61-7b40-4deb-867a-72688d1bccc1` ✅ DISTINTO

### Motoristas (1 único reutilizado)
- **driverA:** `2357467c-4f5e-4285-bf6b-39628c6a44ad` ⚠️ MESMO ID
- **driverB:** `2357467c-4f5e-4285-bf6b-39628c6a44ad` ⚠️ MESMO ID
- **driverC:** `2357467c-4f5e-4285-bf6b-39628c6a44ad` ⚠️ MESMO ID

**AVISO:** Apenas 1 motorista verificado disponível no banco. Testes de concorrência podem falhar.

---

## COMO A LIMPEZA FOI RESTRINGIDA

### Antes (AMPLO - PERIGOSO)
```typescript
await supabase.from('ride_requests').delete(); // ❌ Deleta TUDO
```

### Depois (RESTRITO - SEGURO)
```typescript
// Limpeza RESTRITA: apenas corridas dos passageiros das fixtures
await supabase
  .from('ride_requests')
  .delete()
  .in('passenger_profile_id', passengerIds); // ✅ Apenas fixtures do Gate 6
```

**Critério explícito:** Apenas ride_requests onde `passenger_profile_id` pertence às fixtures do Gate 6.

**Motoristas:** Apenas driver_availability onde `profile_id` pertence às fixtures do Gate 6.

---

## CONFIRMAÇÃO: NENHUM ID HARDCODED

### Suíte A (gate6-dispatch-primitives.test.ts)
✅ Lê de `fixtures.passengers.passengerA.id`  
✅ Lê de `fixtures.drivers.driverA.id`  
✅ Lê de `fixtures.addressIds.pickup`  
✅ Lê de `fixtures.locationIds.primary`  
✅ Lê de `fixtures.coords.pickup.lat`  

### Suíte B (gate6-e2e-passenger.test.ts)
✅ Lê de `fixtures.passengers.passengerB.id`  
✅ Lê de `fixtures.drivers.driverB.id`  
✅ Lê de `fixtures.addressIds.pickup`  
✅ Lê de `fixtures.locationIds.primary`  
✅ Lê de `fixtures.coords.pickup.lat`  
✅ Import corrigido: `@/core/tracking/services/TrackingService`

### Suíte C (gate6-operational-cases.test.ts)
✅ Lê de `fixtures.passengers.passengerA.id`  
✅ Lê de `fixtures.passengers.passengerB.id`  
✅ Lê de `fixtures.drivers.driverA.id`  
✅ Lê de `fixtures.drivers.driverB.id`  
✅ Lê de `fixtures.addressIds.pickup`  
✅ Lê de `fixtures.locationIds.primary`  
✅ Lê de `fixtures.coords.pickup.lat`  

**Confirmação:** ZERO IDs hardcoded. Todos lidos de `tests/fixtures/gate6-fixtures.json`.

---

## IMPORTS CORRIGIDOS

### TrackingService
**Antes:** `@/modules/mobility/services/TrackingService` ❌  
**Depois:** `@/core/tracking/services/TrackingService` ✅

**Arquivo corrigido:** `tests/operational/gate6-e2e-passenger.test.ts`

---

## LIMITAÇÕES CONHECIDAS

### Motoristas
⚠️ **Apenas 1 motorista verificado no banco**

**Impacto:**
- Teste C.2 (concorrência) pode falhar se exigir motoristas distintos
- Testes A.1 e A.2 (busca de múltiplos motoristas) podem ter comportamento limitado

**Solução futura:** Criar mais motoristas verificados no banco antes de executar Gate 6.

### Addresses
⚠️ **Mesmo address para pickup e dropoff**

**Impacto:** Distância calculada pode ser zero.

**Solução futura:** Criar addresses distintos.

---

## RESUMO EXECUTIVO

✅ Script de setup criado e executado  
✅ JSON de fixtures gerado com estrutura correta  
✅ 2 passageiros DISTINTOS  
⚠️ 1 motorista (reutilizado para driverA, driverB, driverC)  
✅ Limpeza RESTRITA (apenas fixtures do Gate 6)  
✅ ZERO IDs hardcoded nos testes  
✅ Import do TrackingService corrigido  
✅ Todos os testes leem de `tests/fixtures/gate6-fixtures.json`  

**Próximo passo:** Executar `npm test -- tests/operational/gate6`
