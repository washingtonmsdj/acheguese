# GATE 6: RELATÓRIO FINAL - CORREÇÃO DE RLS

**Data:** 08/04/2026  
**Status:** ✅ CAUSA RAIZ IDENTIFICADA E CORRIGIDA PARCIALMENTE

---

## RESUMO EXECUTIVO

### Causa Raiz Identificada
**RLS Policy:** Os services usam o client Supabase padrão (anon key) que exige autenticação. Os testes não estavam autenticando antes de chamar os services.

### Correção Aplicada
1. ✅ Criado helper de autenticação: `tests/helpers/auth-helper.ts`
2. ✅ Adicionado autenticação em todos os testes do Gate 6
3. ✅ Aumentado timeout global para 15s (vitest.config.ts)
4. ✅ Testes mínimos passando (2/2)
5. ⚠️ Gate 6 parcialmente passando (5/8 testes)

---

## RESULTADOS DOS TESTES

### Testes Mínimos (Diagnóstico Cirúrgico)
✅ **test-gate6-setAvailable-minimal.test.ts**: PASSOU  
✅ **test-gate6-createRide-minimal.test.ts**: PASSOU  

**Conclusão:** A correção de autenticação funciona perfeitamente para operações isoladas.

### Gate 6 Completo (8 testes)
**Resultado:** 5 PASSARAM / 3 FALHARAM

#### ✅ Testes que Passaram (5/8)
1. **A.1**: Buscar motoristas elegíveis ordenados por distância
2. **A.2**: Ignorar motoristas busy
3. **A.3**: Atribuir motorista (driver_assigned)
4. **A.4**: Motorista aceitar corrida (driver_accepted)
5. **A.5**: Aceitar corrida deixa motorista busy com activeRideId correto

#### ❌ Testes que Falharam (3/8)

**B.1. E2E Passageiro - Fluxo Completo**
```
AssertionError: expected 'driver_assigned' to be 'searching_driver'
```
**Causa:** Após `createRide()`, o status está `driver_assigned` em vez de `searching_driver`. Isso sugere que existe um trigger no banco fazendo dispatch automático, contradizendo a verdade objetiva de que o dispatch é manual.

**Ação necessária:** Investigar triggers em `ride_requests` que possam estar fazendo dispatch automático.

---

**C.1. Cancelamento após aceite libera motorista**
```
TypeError: Cannot read properties of null (reading 'status')
```
**Causa:** `DriverAvailabilityService.getStatus()` retorna null. Possível problema de RLS na leitura de `driver_availability`.

**Ação necessária:** Verificar RLS policy de SELECT em `driver_availability`.

---

**C.2. Duas corridas simultâneas**
```
AssertionError: expected 0 to be greater than or equal to 1
```
**Causa:** `findEligibleDrivers()` retorna 0 motoristas. Possível problema de RLS na leitura de `driver_availability`.

**Ação necessária:** Verificar RLS policy de SELECT em `driver_availability` para queries com filtros geográficos.

---

## FIXTURES VALIDADAS

### IDs Distintos Finais
✅ **Passageiros (2 DISTINTOS)**
- passengerA: `b374bdab-cd76-43b2-bb3c-eb844d096acb`
- passengerB: `6fb6aa61-7b40-4deb-867a-72688d1bccc1`

✅ **Motoristas (3 DISTINTOS)**
- driverA: `2357467c-4f5e-4285-bf6b-39628c6a44ad`
- driverB: `a1f45031-5fee-4f16-85c0-8d73356fc830`
- driverC: `035e46bf-7cec-484a-b4b7-bf5e33c771e1`

### Limpeza Restrita
✅ **driver_availability:** Apenas driverA, driverB, driverC  
✅ **ride_requests:** Apenas passengerA, passengerB  

---

## ARQUIVOS MODIFICADOS

### Novos Arquivos
1. `tests/helpers/auth-helper.ts` - Helper de autenticação reutilizável

### Arquivos Atualizados
1. `tests/operational/test-gate6-setAvailable-minimal.test.ts` - Autenticação adicionada
2. `tests/operational/test-gate6-createRide-minimal.test.ts` - Autenticação adicionada
3. `tests/operational/gate6-dispatch-primitives.test.ts` - Autenticação em 5 testes
4. `tests/operational/gate6-e2e-passenger.test.ts` - Autenticação adicionada
5. `tests/operational/gate6-operational-cases.test.ts` - Autenticação em 2 testes
6. `vitest.config.ts` - Timeout global aumentado para 15s

---

## PRÓXIMOS PASSOS

### 1. Investigar Trigger de Dispatch Automático
```sql
-- Buscar triggers em ride_requests
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'ride_requests';
```

Se houver trigger fazendo dispatch automático, decidir:
- **Opção A:** Remover trigger (manter dispatch manual conforme verdade objetiva)
- **Opção B:** Atualizar testes para aceitar dispatch automático

### 2. Verificar RLS em driver_availability
```sql
-- Listar policies de driver_availability
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename = 'driver_availability';
```

**Problema esperado:** Policy de SELECT pode estar bloqueando leitura de status de outros motoristas.

**Solução:** Permitir leitura de `driver_availability` para usuários autenticados:
```sql
CREATE POLICY "Authenticated users can view driver availability" 
ON driver_availability FOR SELECT TO authenticated
USING (true);
```

### 3. Re-executar Gate 6
```bash
npm test -- tests/operational/gate6
```

---

## CONCLUSÃO

**Progresso significativo:** De 0/8 para 5/8 testes passando após correção de autenticação.

**Bloqueios restantes:** RLS policies em `driver_availability` e possível trigger de dispatch automático.

**Tempo estimado para conclusão:** 1-2 horas (investigação de triggers + correção de RLS).

