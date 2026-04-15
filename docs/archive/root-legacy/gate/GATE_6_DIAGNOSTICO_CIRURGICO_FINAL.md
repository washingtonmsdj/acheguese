# GATE 6: DIAGNÓSTICO CIRÚRGICO FINAL

**Data:** 08/04/2026

---

## A) IDS DISTINTOS FINAIS

### Passageiros (2 DISTINTOS)
- **passengerA:** `b374bdab-cd76-43b2-bb3c-eb844d096acb` ✅
- **passengerB:** `6fb6aa61-7b40-4deb-867a-72688d1bccc1` ✅

### Motoristas (3 DISTINTOS)
- **driverA:** `2357467c-4f5e-4285-bf6b-39628c6a44ad` ✅
- **driverB:** `a1f45031-5fee-4f16-85c0-8d73356fc830` ✅
- **driverC:** `035e46bf-7cec-484a-b4b7-bf5e33c771e1` ✅

**✅ VALIDAÇÃO:** Todos os IDs são DISTINTOS (nenhum reutilizado)

---

## B) CONFIRMAÇÃO DA LIMPEZA RESTRITA

**Limpeza de driver_availability:**
```typescript
await supabase
  .from('driver_availability')
  .delete()
  .in('profile_id', [driverAId, driverBId, driverCId]); // ✅ RESTRITO
```

**Limpeza de ride_requests:**
```typescript
await supabase
  .from('ride_requests')
  .delete()
  .in('passenger_profile_id', [passengerAId, passengerBId]); // ✅ RESTRITO
```

**✅ CONFIRMAÇÃO:** Limpeza RESTRITA apenas às fixtures do Gate 6. Nenhum delete amplo.

---

## C) ERRO BRUTO REAL DE setAvailable()

### Resultado: ✅ SUCESSO

**Teste mínimo:** `test-gate6-setAvailable-minimal.test.ts`

**Resultado:**
```
✅ 1/1 teste passou

DIAGNÓSTICO setAvailable()
INPUT:
  driverId: 2357467c-4f5e-4285-bf6b-39628c6a44ad
  lat: -23.551
  lng: -46.634

RESULTADO goOnline():
  success: true

RESULTADO setAvailable():
  success: true

STATUS FINAL:
  status: online_available
  isOnline: true
  isAvailable: true
  currentLocation: {"lat":-23.551,"lng":-46.634}
```

**Conclusão:** `setAvailable()` funciona perfeitamente. Não há problema com este método.

---

## D) ERRO BRUTO REAL DE createRide()

### Resultado: ❌ FALHA POR RLS

**Teste mínimo:** `test-gate6-createRide-minimal.test.ts`

**Erro bruto:**
```
code: N/A (RLS policy violation)
message: "new row violates row-level security policy for table \"ride_requests\""
details: N/A
hint: N/A
```

**Evidência adicional:**
- INSERT direto com service_role: ✅ FUNCIONA
- INSERT via RideOperationalService: ❌ FALHA (RLS)

**Causa raiz:** `RideOperationalService` usa um Supabase client SEM service_role, e a RLS policy de `ride_requests` está bloqueando o INSERT.

**Solução:** RideOperationalService precisa usar service_role client OU a RLS policy precisa permitir INSERT de passageiros autenticados.

---

## E) RESULTADO DA NOVA EXECUÇÃO DO GATE 6

**Status:** ⏳ NÃO EXECUTADO (aguardando correção de RLS)

**Bloqueio identificado:** RLS policy em `ride_requests` bloqueia INSERT.

**Próximo passo:** Corrigir RLS policy ou usar service_role em RideOperationalService.

---

## RESUMO EXECUTIVO

### Fixtures
✅ **3 motoristas DISTINTOS criados**  
✅ **2 passageiros DISTINTOS**  
✅ **Limpeza RESTRITA** (apenas Gate 6)  
✅ **ZERO IDs hardcoded**  

### Diagnóstico Cirúrgico
✅ **setAvailable():** FUNCIONA perfeitamente  
❌ **createRide():** BLOQUEADO por RLS policy  

### Causa Raiz
**RLS Policy:** `ride_requests` bloqueia INSERT de usuários não-service_role.

**Erro bruto:**
```
message: "new row violates row-level security policy for table \"ride_requests\""
```

**Evidência:**
- INSERT direto com service_role: ✅ FUNCIONA
- INSERT via RideOperationalService: ❌ FALHA

### Solução
**Opção 1:** Adicionar RLS policy que permite passageiros criarem suas próprias corridas:
```sql
CREATE POLICY "Passengers can create own rides" ON ride_requests
  FOR INSERT TO authenticated
  USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = passenger_profile_id));
```

**Opção 2:** RideOperationalService usar service_role client (menos seguro).

---

## PRÓXIMOS PASSOS

1. ✅ Fixtures corretas (3 motoristas distintos, 2 passageiros distintos)
2. ✅ Diagnóstico cirúrgico completo
3. ⏳ Corrigir RLS policy em `ride_requests`
4. ⏳ Re-executar Gate 6

**Tempo estimado:** 30 minutos (correção de RLS + re-execução)
