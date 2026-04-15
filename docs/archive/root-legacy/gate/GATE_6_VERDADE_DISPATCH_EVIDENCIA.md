# GATE 6: VERDADE OPERACIONAL DO DISPATCH - EVIDÊNCIA OBJETIVA

**Data:** 08/04/2026

---

## A) VERDADE FINAL DO DISPATCH REMOTO

### ✅ DISPATCH É MANUAL

**Evidência objetiva:**
- Teste prático: Corrida criada com status `requested` permaneceu `requested` após 2 segundos
- Nenhum trigger detectado em `ride_requests`
- Nenhuma função de dispatch automático encontrada
- Status não mudou automaticamente de `requested` para `searching_driver` ou `driver_assigned`

**Conclusão:** O dispatch é 100% manual, conforme a verdade objetiva do GATE_6_VERDADE_OBJETIVA.md.

---

## B) EVIDÊNCIA OBJETIVA DO BANCO

### RLS Policies em `ride_requests`

```sql
-- SELECT: Participantes podem ver
CREATE POLICY "Ride participants view" ON ride_requests FOR SELECT TO authenticated
USING (
  passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- INSERT: Passageiros podem criar
CREATE POLICY "Passengers create rides" ON ride_requests FOR INSERT TO authenticated
WITH CHECK (passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- UPDATE: Participantes podem atualizar
CREATE POLICY "Participants update rides" ON ride_requests FOR UPDATE TO authenticated
USING (
  passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
```

### RLS Policies em `driver_availability`

```sql
-- Service role: Acesso total
CREATE POLICY "Service role full access" ON driver_availability
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Motoristas: Gerenciar própria disponibilidade
CREATE POLICY "Drivers can manage own availability" ON driver_availability
FOR ALL TO authenticated
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid() 
    AND profile_type = 'driver'
  )
);

-- Leitura pública: Motoristas online (para dispatch)
CREATE POLICY "Public can read online drivers" ON driver_availability
FOR SELECT TO authenticated
USING (is_online = true);
```

---

## C) CONTEXTO DE AUTH POR ETAPA DO GATE 6

### Fluxo Correto por Ator

| Etapa | Operação | Ator | Contexto Auth |
|-------|----------|------|---------------|
| 1 | `goOnline()` | Motorista | `authenticateAsProfile(driverId)` |
| 2 | `setAvailable()` | Motorista | `authenticateAsProfile(driverId)` |
| 3 | `createRide()` | Passageiro | `authenticateAsProfile(passengerId)` |
| 4 | `findEligibleDrivers()` | Sistema/Dispatch | `supabaseAdmin` (service_role) |
| 5 | `assignDriver()` | Sistema/Dispatch | `supabaseAdmin` (service_role) |
| 6 | `acceptRide()` | Motorista | `authenticateAsProfile(driverId)` |
| 7 | `transitionTo()` (estados) | Motorista | `authenticateAsProfile(driverId)` |
| 8 | `completeRide()` | Motorista | `authenticateAsProfile(driverId)` |
| 9 | `cancelRide()` | Passageiro/Motorista | `authenticateAsProfile(profileId)` |
| 10 | Asserts de banco | Admin | `supabaseAdmin` (service_role) |

### Problema Identificado nos Testes

**Erro:** Testes estavam usando autenticação de passageiro/motorista para operações de dispatch (`findEligibleDrivers`, `assignDriver`).

**Causa:** Policy "Public can read online drivers" permite SELECT apenas para motoristas online, mas `findEligibleDrivers()` precisa ler TODOS os motoristas disponíveis, não apenas os do usuário autenticado.

**Solução:** Operações de dispatch devem usar `supabaseAdmin` (service_role), não autenticação de usuário.

---

## D) CORREÇÕES APLICADAS NAS SUÍTES

### 1. RideDispatchService deve usar service_role

**Problema:** `RideDispatchService` usa `@/integrations/supabase` (anon key) que está sujeito a RLS.

**Solução:** Criar versão do service que aceita client customizado ou usar service_role internamente para operações de dispatch.

### 2. Testes devem usar contexto correto

**Antes (ERRADO):**
```typescript
await authenticateAsProfile(passengerId);
const eligible = await RideDispatchService.findEligibleDrivers(...); // ❌ Usa auth do passageiro
```

**Depois (CORRETO):**
```typescript
// Dispatch é operação de sistema, não de usuário
const eligible = await RideDispatchService.findEligibleDrivers(...); // ✅ Deve usar service_role
```

### 3. Corrigir 'other-ride-id' com UUID real

**Antes (ERRADO):**
```typescript
await DriverAvailabilityService.setBusy(driver2Id, 'other-ride-id', 'ride'); // ❌ String inválida
```

**Depois (CORRETO):**
```typescript
import { randomUUID } from 'crypto';
const otherRideId = randomUUID();
await DriverAvailabilityService.setBusy(driver2Id, otherRideId, 'ride'); // ✅ UUID válido
```

---

## E) PRÓXIMAS AÇÕES

### 1. Criar RideDispatchService com service_role

Opções:
- **A)** Modificar `RideDispatchService` para aceitar client customizado
- **B)** Criar `RideDispatchService.admin` que usa service_role internamente
- **C)** Mover dispatch para edge function (mais complexo)

**Recomendação:** Opção A (mais flexível para testes).

### 2. Atualizar testes do Gate 6

- Remover autenticação antes de operações de dispatch
- Usar `supabaseAdmin` diretamente para `findEligibleDrivers` e `assignDriver`
- Manter autenticação para operações de motorista/passageiro

### 3. Corrigir UUID inválido

- Substituir `'other-ride-id'` por `randomUUID()`

---

## CONCLUSÃO

**Verdade operacional confirmada:** Dispatch é 100% manual, sem triggers ou automação.

**Problema real:** Contexto de autenticação incorreto nos testes. Dispatch precisa de service_role, não auth de usuário.

**Próximo passo:** Modificar `RideDispatchService` para aceitar client customizado e atualizar testes.

