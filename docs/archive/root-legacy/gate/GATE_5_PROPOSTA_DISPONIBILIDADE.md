# GATE 5: DISPONIBILIDADE DO MOTORISTA - PROPOSTA COMPLETA

**Data:** 07/04/2026  
**Status:** PROPOSTA PARA IMPLEMENTAÇÃO

---

## PARTE 1: ESTRUTURA ATUAL DE `driver_availability`

### Tabela Existente ✅

```sql
CREATE TABLE driver_availability (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT false,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Índices Existentes ✅
- `idx_driver_availability_online` - (is_online, is_available)
- `idx_driver_availability_location` - (current_lat, current_lng)

### RLS Existente ✅
- Service role: acesso total
- Authenticated: SELECT para todos (busca)
- Authenticated: UPDATE/INSERT apenas próprio profile

### Campos Atuais

**Obrigatórios:**
- `profile_id` - FK para profiles
- `is_online` - Se motorista está online
- `is_available` - Se motorista está disponível para corridas

**Opcionais:**
- `current_lat` - Latitude atual (pode ser NULL)
- `current_lng` - Longitude atual (pode ser NULL)
- `last_location_update` - Última atualização de localização
- `updated_at` - Última atualização do registro

### Estados Válidos Atuais

```
offline:     is_online = false, is_available = false
online:      is_online = true,  is_available = true
busy:        is_online = true,  is_available = false
```

### Problemas Identificados ❌

1. **Falta campo `last_seen_at`**
   - Não há como detectar motorista stale
   - Não há como marcar offline automaticamente

2. **Coordenadas opcionais**
   - Motorista pode estar online sem localização
   - Dispatch não consegue calcular distância

3. **Sem auditoria de mudanças**
   - Não há histórico de transições
   - Difícil debugar problemas

4. **Uso inconsistente no código**
   - RideDispatchService verifica disponibilidade
   - RideOperationalService libera motorista
   - TrackingService não atualiza last_seen
   - Sem service centralizado

---

## PARTE 2: PROPOSTA FINAL DO `DriverAvailabilityService`

### Estrutura do Service

```typescript
// src/modules/mobility/services/DriverAvailabilityService.ts

export class DriverAvailabilityService {
  /**
   * Motorista fica online
   * Transição: offline → online
   */
  static async goOnline(
    driverProfileId: string,
    initialLocation?: { lat: number; lng: number }
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Motorista fica offline
   * Transição: online/busy → offline
   */
  static async goOffline(
    driverProfileId: string
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Motorista fica ocupado (corrida aceita)
   * Transição: available → busy
   */
  static async setBusy(
    driverProfileId: string,
    rideId: string
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Motorista fica disponível (corrida encerrada)
   * Transição: busy → available
   */
  static async setAvailable(
    driverProfileId: string
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Busca status atual
   */
  static async getStatus(
    driverProfileId: string
  ): Promise<DriverAvailabilityStatus | null>;

  /**
   * Atualiza last_seen_at (chamado por tracking/heartbeat)
   */
  static async markLastSeen(
    driverProfileId: string
  ): Promise<void>;

  /**
   * Marca motoristas stale como offline
   * Chamado por cron/health check
   */
  static async markOfflineIfStale(
    staleThresholdMinutes: number = 5
  ): Promise<number>;

  /**
   * Busca motoristas disponíveis em raio
   * Usado por dispatch
   */
  static async findAvailableDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
    rideMode?: 'ride' | 'motoboy'
  ): Promise<AvailableDriver[]>;
}
```

### Tipos

```typescript
export interface DriverAvailabilityStatus {
  profileId: string;
  isOnline: boolean;
  isAvailable: boolean;
  status: 'offline' | 'online' | 'busy';
  currentLocation?: { lat: number; lng: number };
  lastLocationUpdate?: string;
  lastSeenAt?: string;
  updatedAt: string;
}

export interface AvailableDriver {
  profileId: string;
  distance: number;
  rating: number;
  currentLocation: { lat: number; lng: number };
  lastSeenAt: string;
}
```

---

## PARTE 3: INTEGRAÇÕES NECESSÁRIAS

### 3.1. RideDispatchService

**Arquivo:** `src/modules/mobility/core/RideDispatchService.ts`

**Mudanças:**

```typescript
// ANTES (linha ~70)
let query = supabase
  .from('driver_availability')
  .select(...)
  .eq('is_online', true)
  .eq('is_available', true);

// DEPOIS
const availableDrivers = await DriverAvailabilityService.findAvailableDrivers(
  originLat,
  originLng,
  maxRadius,
  rideMode
);
```

**Benefícios:**
- Lógica de busca centralizada
- Validação de stale automática
- Filtro de coordenadas obrigatório
- Remoção de acesso direto ao Supabase

---

### 3.2. RideOperationalService

**Arquivo:** `src/modules/mobility/core/RideOperationalService.ts`

**Mudanças:**

**Ao aceitar corrida (linha ~200):**
```typescript
// ANTES
// Nada

// DEPOIS
await DriverAvailabilityService.setBusy(driverProfileId, rideId);
```

**Ao completar corrida (linha ~420):**
```typescript
// ANTES
await supabase
  .from('driver_availability')
  .update({ is_available: true })
  .eq('profile_id', driverProfileId);

// DEPOIS
await DriverAvailabilityService.setAvailable(driverProfileId);
```

**Ao cancelar corrida (linha ~810):**
```typescript
// ANTES
await supabase
  .from('driver_availability')
  .update({ is_available: true })
  .eq('profile_id', driverProfileId);

// DEPOIS
await DriverAvailabilityService.setAvailable(driverProfileId);
```

**Ao falhar entrega:**
```typescript
// ADICIONAR
await DriverAvailabilityService.setAvailable(driverProfileId);
```

**Benefícios:**
- Transições explícitas
- Validação de estado
- Auditoria automática
- Sem acesso direto ao banco

---

### 3.3. TrackingService

**Arquivo:** `src/core/tracking/services/TrackingService.ts`

**Mudanças:**

**Ao publicar localização (linha ~150):**
```typescript
// ADICIONAR após updatePosition
await DriverAvailabilityService.markLastSeen(entityId);
```

**Ao enviar heartbeat (linha ~300):**
```typescript
// ADICIONAR
await DriverAvailabilityService.markLastSeen(payload.entityId);
```

**Benefícios:**
- Last seen atualizado automaticamente
- Detecção de stale funciona
- Motorista não fica "preso" online

---

### 3.4. ReconnectionManager

**Arquivo:** `src/core/tracking/services/ReconnectionManager.ts`

**Mudanças:**

**Ao reconectar (após sucesso):**
```typescript
// ADICIONAR
// Sincronizar status de disponibilidade
const status = await DriverAvailabilityService.getStatus(driverProfileId);
if (status) {
  await DriverAvailabilityService.markLastSeen(driverProfileId);
}
```

**Benefícios:**
- Reconexão mantém estado coerente
- Last seen atualizado após reconexão
- Motorista não fica stale após desconexão

---

## PARTE 4: REGRAS EXATAS DE TRANSIÇÃO

### Estados Válidos

```
offline:     is_online = false, is_available = false
online:      is_online = true,  is_available = true
busy:        is_online = true,  is_available = false
```

### Transições Permitidas

```
offline → online       (goOnline)
online → offline       (goOffline)
online → busy          (setBusy - corrida aceita)
busy → online          (setAvailable - corrida encerrada)
busy → offline         (goOffline - forçado)
```

### Transições Proibidas

```
offline → busy         ❌ Deve passar por online
busy → online (direto) ❌ Deve usar setAvailable
```

### Regras de Negócio

**1. goOnline()**
- Só pode se `is_online = false`
- Define `is_online = true, is_available = true`
- Atualiza `last_seen_at = NOW()`
- Se fornecido, atualiza `current_lat, current_lng`

**2. goOffline()**
- Pode de qualquer estado
- Define `is_online = false, is_available = false`
- Atualiza `last_seen_at = NOW()`
- Se tem corrida ativa, retorna erro

**3. setBusy()**
- Só pode se `is_online = true AND is_available = true`
- Define `is_available = false`
- Mantém `is_online = true`
- Atualiza `last_seen_at = NOW()`
- Registra `ride_id` em metadata

**4. setAvailable()**
- Só pode se `is_online = true AND is_available = false`
- Define `is_available = true`
- Mantém `is_online = true`
- Atualiza `last_seen_at = NOW()`
- Remove `ride_id` de metadata

**5. markLastSeen()**
- Atualiza apenas `last_seen_at = NOW()`
- Não muda `is_online` ou `is_available`
- Chamado por tracking/heartbeat

**6. markOfflineIfStale()**
- Busca motoristas com `last_seen_at < NOW() - threshold`
- Define `is_online = false, is_available = false`
- Retorna quantidade de motoristas marcados
- Chamado por cron/health check

---

## PARTE 5: TESTES OPERACIONAIS

### Teste 1: Transições de Estado ✅

**Objetivo:** Validar todas as transições permitidas

```typescript
it('1.1. Deve permitir offline → online', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online');
  expect(status.isOnline).toBe(true);
  expect(status.isAvailable).toBe(true);
});

it('1.2. Deve permitir online → busy', async () => {
  await DriverAvailabilityService.setBusy(driverProfileId, rideId);
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('busy');
  expect(status.isOnline).toBe(true);
  expect(status.isAvailable).toBe(false);
});

it('1.3. Deve permitir busy → online', async () => {
  await DriverAvailabilityService.setAvailable(driverProfileId);
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online');
  expect(status.isAvailable).toBe(true);
});

it('1.4. Deve permitir online → offline', async () => {
  await DriverAvailabilityService.goOffline(driverProfileId);
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('offline');
  expect(status.isOnline).toBe(false);
});

it('1.5. Deve bloquear offline → busy', async () => {
  const result = await DriverAvailabilityService.setBusy(driverProfileId, rideId);
  expect(result.success).toBe(false);
  expect(result.error).toContain('not online');
});
```

---

### Teste 2: Integração com Corrida ✅

**Objetivo:** Validar integração com fluxo de corrida

```typescript
it('2.1. Aceitar corrida deve deixar busy', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  await RideDispatchService.acceptRide(rideId, driverProfileId);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('busy');
});

it('2.2. Completar corrida deve deixar available', async () => {
  await RideOperationalService.completeRide(rideId, driverProfileId);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online');
  expect(status.isAvailable).toBe(true);
});

it('2.3. Cancelar corrida deve deixar available', async () => {
  await RideOperationalService.cancelRide({
    rideId,
    cancelledBy: 'driver',
    profileId: driverProfileId,
  });
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.isAvailable).toBe(true);
});

it('2.4. Falhar entrega deve deixar available', async () => {
  await RideOperationalService.failDelivery(rideId, driverProfileId, metadata);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.isAvailable).toBe(true);
});
```

---

### Teste 3: Integração com Dispatch ✅

**Objetivo:** Validar que dispatch respeita disponibilidade

```typescript
it('3.1. Dispatch deve buscar apenas disponíveis', async () => {
  // Motorista 1: online
  await DriverAvailabilityService.goOnline(driver1Id, { lat, lng });
  
  // Motorista 2: busy
  await DriverAvailabilityService.goOnline(driver2Id, { lat, lng });
  await DriverAvailabilityService.setBusy(driver2Id, 'other-ride');
  
  // Motorista 3: offline
  await DriverAvailabilityService.goOffline(driver3Id);
  
  const eligible = await RideDispatchService.findEligibleDrivers(
    rideId, lat, lng, 10
  );
  
  expect(eligible.length).toBe(1);
  expect(eligible[0].profileId).toBe(driver1Id);
});

it('3.2. Dispatch deve ignorar offline', async () => {
  await DriverAvailabilityService.goOffline(driverProfileId);
  
  const eligible = await RideDispatchService.findEligibleDrivers(
    rideId, lat, lng, 10
  );
  
  expect(eligible.find(d => d.profileId === driverProfileId)).toBeUndefined();
});

it('3.3. Dispatch deve ignorar busy', async () => {
  await DriverAvailabilityService.setBusy(driverProfileId, 'other-ride');
  
  const eligible = await RideDispatchService.findEligibleDrivers(
    rideId, lat, lng, 10
  );
  
  expect(eligible.find(d => d.profileId === driverProfileId)).toBeUndefined();
});
```

---

### Teste 4: Integração com Tracking ✅

**Objetivo:** Validar que tracking atualiza last_seen

```typescript
it('4.1. Publicar localização deve atualizar last_seen', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  
  const before = await DriverAvailabilityService.getStatus(driverProfileId);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await TrackingService.updatePosition(driverProfileId, position, 'driver');
  
  const after = await DriverAvailabilityService.getStatus(driverProfileId);
  
  expect(new Date(after.lastSeenAt!).getTime())
    .toBeGreaterThan(new Date(before.lastSeenAt!).getTime());
});

it('4.2. Heartbeat deve atualizar last_seen', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  
  const before = await DriverAvailabilityService.getStatus(driverProfileId);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await TrackingService.sendHeartbeat({
    entityId: driverProfileId,
    entityType: 'driver',
    timestamp: new Date().toISOString(),
  });
  
  const after = await DriverAvailabilityService.getStatus(driverProfileId);
  
  expect(new Date(after.lastSeenAt!).getTime())
    .toBeGreaterThan(new Date(before.lastSeenAt!).getTime());
});
```

---

### Teste 5: Detecção de Stale ✅

**Objetivo:** Validar que motoristas stale são marcados offline

```typescript
it('5.1. Motorista stale deve ser marcado offline', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  
  // Simular last_seen antigo
  await supabase
    .from('driver_availability')
    .update({ last_seen_at: new Date(Date.now() - 6 * 60 * 1000).toISOString() })
    .eq('profile_id', driverProfileId);
  
  const count = await DriverAvailabilityService.markOfflineIfStale(5);
  
  expect(count).toBeGreaterThan(0);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('offline');
});

it('5.2. Motorista ativo não deve ser marcado offline', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  await DriverAvailabilityService.markLastSeen(driverProfileId);
  
  const count = await DriverAvailabilityService.markOfflineIfStale(5);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online');
});
```

---

### Teste 6: Reconexão ✅

**Objetivo:** Validar que reconexão mantém estado coerente

```typescript
it('6.1. Reconexão deve sincronizar status', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  
  // Simular desconexão
  await TrackingService.unsubscribeAll();
  
  // Simular reconexão
  await TrackingService.forceReconnect();
  await TrackingService.syncStateAfterReconnection(driverProfileId, 'driver');
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online');
  expect(status.lastSeenAt).toBeDefined();
});

it('6.2. Reconexão deve atualizar last_seen', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  
  const before = await DriverAvailabilityService.getStatus(driverProfileId);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await TrackingService.forceReconnect();
  
  const after = await DriverAvailabilityService.getStatus(driverProfileId);
  
  expect(new Date(after.lastSeenAt!).getTime())
    .toBeGreaterThan(new Date(before.lastSeenAt!).getTime());
});
```

---

### Teste 7: Concorrência ✅

**Objetivo:** Validar que não há race conditions

```typescript
it('7.1. Múltiplas corridas não deixam motorista disponível', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  await DriverAvailabilityService.setBusy(driverProfileId, ride1Id);
  
  // Tentar aceitar segunda corrida
  const result = await DriverAvailabilityService.setBusy(driverProfileId, ride2Id);
  
  expect(result.success).toBe(false);
  expect(result.error).toContain('not available');
});

it('7.2. Liberar motorista sem corrida ativa deve falhar', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  
  const result = await DriverAvailabilityService.setAvailable(driverProfileId);
  
  expect(result.success).toBe(false);
  expect(result.error).toContain('not busy');
});
```

---

### Teste 8: Coordenadas Obrigatórias ✅

**Objetivo:** Validar que motorista online tem coordenadas

```typescript
it('8.1. goOnline sem coordenadas deve falhar', async () => {
  const result = await DriverAvailabilityService.goOnline(driverProfileId);
  
  expect(result.success).toBe(false);
  expect(result.error).toContain('location required');
});

it('8.2. goOnline com coordenadas deve suceder', async () => {
  const result = await DriverAvailabilityService.goOnline(
    driverProfileId,
    { lat: -23.5505, lng: -46.6333 }
  );
  
  expect(result.success).toBe(true);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.currentLocation).toBeDefined();
});

it('8.3. Dispatch deve ignorar motorista sem coordenadas', async () => {
  // Forçar motorista online sem coordenadas (bypass)
  await supabase
    .from('driver_availability')
    .update({ is_online: true, is_available: true })
    .eq('profile_id', driverProfileId);
  
  const eligible = await RideDispatchService.findEligibleDrivers(
    rideId, lat, lng, 10
  );
  
  expect(eligible.find(d => d.profileId === driverProfileId)).toBeUndefined();
});
```

---

## PARTE 6: VEREDITO DO QUE PRECISA SER IMPLEMENTADO AGORA

### Migration Necessária ✅

```sql
-- Adicionar campo last_seen_at
ALTER TABLE driver_availability
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Índice para detecção de stale
CREATE INDEX IF NOT EXISTS idx_driver_availability_last_seen
  ON driver_availability(last_seen_at)
  WHERE is_online = true;

-- Constraint: coordenadas obrigatórias se online
ALTER TABLE driver_availability
  ADD CONSTRAINT check_online_has_location
  CHECK (
    (is_online = false) OR
    (is_online = true AND current_lat IS NOT NULL AND current_lng IS NOT NULL)
  );

-- Atualizar registros existentes
UPDATE driver_availability
SET last_seen_at = updated_at
WHERE last_seen_at IS NULL;
```

---

### Implementação Necessária ✅

**1. DriverAvailabilityService** (novo)
- Arquivo: `src/modules/mobility/services/DriverAvailabilityService.ts`
- ~400 linhas
- Todas as operações de disponibilidade

**2. Integração com RideDispatchService** (modificar)
- Arquivo: `src/modules/mobility/core/RideDispatchService.ts`
- Substituir acesso direto por `DriverAvailabilityService.findAvailableDrivers()`
- ~20 linhas modificadas

**3. Integração com RideOperationalService** (modificar)
- Arquivo: `src/modules/mobility/core/RideOperationalService.ts`
- Adicionar `setBusy()` ao aceitar corrida
- Substituir updates diretos por `setAvailable()`
- ~30 linhas modificadas

**4. Integração com TrackingService** (modificar)
- Arquivo: `src/core/tracking/services/TrackingService.ts`
- Adicionar `markLastSeen()` após updatePosition
- Adicionar `markLastSeen()` após sendHeartbeat
- ~10 linhas modificadas

**5. Integração com ReconnectionManager** (modificar)
- Arquivo: `src/core/tracking/services/ReconnectionManager.ts`
- Adicionar sincronização de status após reconexão
- ~15 linhas modificadas

**6. Testes Operacionais** (novo)
- Arquivo: `tests/operational/gate5-availability-test.test.ts`
- 8 suítes de testes
- ~600 linhas

**7. Cron/Health Check** (novo)
- Arquivo: `supabase/functions/mark-stale-drivers-offline/index.ts`
- Edge function para marcar motoristas stale
- ~50 linhas

---

### Critério de Fechamento do Gate 5

**Gate 5 só fecha se provar:**

1. ✅ Motorista online/available entra no dispatch
2. ✅ Motorista busy não entra no dispatch
3. ✅ Motorista offline não entra no dispatch
4. ✅ Corrida aceita deixa busy
5. ✅ Corrida encerrada libera para available
6. ✅ Stale driver sai automaticamente
7. ✅ Reconexão mantém estado coerente
8. ✅ Nenhum fluxo deixa motorista "preso" errado
9. ✅ Coordenadas obrigatórias para online
10. ✅ Testes operacionais passando (mínimo 20/20)

---

## RESUMO EXECUTIVO

### Estrutura Atual
- ✅ Tabela `driver_availability` existe
- ✅ RLS configurado
- ✅ Índices básicos criados
- ❌ Falta campo `last_seen_at`
- ❌ Coordenadas opcionais (devem ser obrigatórias)
- ❌ Uso inconsistente no código

### Proposta Final
- ✅ `DriverAvailabilityService` centralizado
- ✅ Transições explícitas de estado
- ✅ Integração com dispatch/corrida/tracking/reconexão
- ✅ Detecção de stale automática
- ✅ Coordenadas obrigatórias
- ✅ 20+ testes operacionais

### Integrações
- ✅ RideDispatchService: usar `findAvailableDrivers()`
- ✅ RideOperationalService: `setBusy()` e `setAvailable()`
- ✅ TrackingService: `markLastSeen()`
- ✅ ReconnectionManager: sincronizar status

### Regras
- ✅ offline → online → busy → online → offline
- ✅ Coordenadas obrigatórias para online
- ✅ Stale detection (5min sem last_seen)
- ✅ Dispatch respeita disponibilidade
- ✅ Corrida libera motorista automaticamente

### Implementação
- Migration: ~30 linhas
- Service: ~400 linhas
- Integrações: ~75 linhas
- Testes: ~600 linhas
- Total: ~1.100 linhas

**Tempo estimado:** 4-6 horas

**Próximo passo:** Implementar migration + service + integrações + testes

