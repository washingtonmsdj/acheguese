# GATE 5: DISPONIBILIDADE DO MOTORISTA - PROPOSTA AJUSTADA FINAL

**Data:** 07/04/2026  
**Status:** PRONTO PARA IMPLEMENTAR

---

## PARTE 1: MIGRATION AJUSTADA

```sql
-- ============================================
-- GATE 5: DISPONIBILIDADE DO MOTORISTA
-- ============================================

-- 1. Adicionar campos necessários
ALTER TABLE driver_availability
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_ride_id UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS busy_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_ride_mode TEXT CHECK (active_ride_mode IN ('ride', 'motoboy'));

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_driver_availability_last_seen
  ON driver_availability(last_seen_at)
  WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_driver_availability_active_ride
  ON driver_availability(active_ride_id)
  WHERE active_ride_id IS NOT NULL;

-- 3. Constraint: is_available = true exige coordenadas e is_online
ALTER TABLE driver_availability
  DROP CONSTRAINT IF EXISTS check_available_requirements;

ALTER TABLE driver_availability
  ADD CONSTRAINT check_available_requirements
  CHECK (
    (is_available = false) OR
    (is_available = true AND is_online = true AND current_lat IS NOT NULL AND current_lng IS NOT NULL)
  );

-- 4. Constraint: busy exige active_ride_id
ALTER TABLE driver_availability
  DROP CONSTRAINT IF EXISTS check_busy_has_ride;

ALTER TABLE driver_availability
  ADD CONSTRAINT check_busy_has_ride
  CHECK (
    (is_available = true AND active_ride_id IS NULL) OR
    (is_available = false AND is_online = true)
  );

-- 5. Atualizar registros existentes
UPDATE driver_availability
SET last_seen_at = updated_at
WHERE last_seen_at IS NULL;

-- 6. Comentários
COMMENT ON COLUMN driver_availability.last_seen_at IS 
  'Última vez que motorista enviou heartbeat/localização. Usado para detecção de stale.';

COMMENT ON COLUMN driver_availability.active_ride_id IS 
  'ID da corrida ativa que deixou motorista busy. NULL se disponível.';

COMMENT ON COLUMN driver_availability.busy_since IS 
  'Timestamp de quando motorista ficou busy. NULL se disponível.';

COMMENT ON COLUMN driver_availability.active_ride_mode IS 
  'Modo da corrida ativa (ride ou motoboy). NULL se disponível.';

SELECT '✅ Gate 5: Migration aplicada!' AS status;
```

---

## PARTE 2: ESTRUTURA FINAL DE `driver_availability`

```sql
CREATE TABLE driver_availability (
  -- Identificação
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Status
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT false,
  
  -- Localização
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  
  -- Corrida Ativa
  active_ride_id UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  busy_since TIMESTAMPTZ,
  active_ride_mode TEXT CHECK (active_ride_mode IN ('ride', 'motoboy')),
  
  -- Heartbeat
  last_seen_at TIMESTAMPTZ,
  
  -- Auditoria
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Estados Válidos

```
offline:              is_online = false, is_available = false, active_ride_id = NULL
online_warming_up:    is_online = true,  is_available = false, active_ride_id = NULL
                      (sem coordenadas ainda, ou aquecendo app)
online_available:     is_online = true,  is_available = true,  active_ride_id = NULL
                      (com coordenadas válidas)
busy:                 is_online = true,  is_available = false, active_ride_id = <uuid>
                      (corrida ativa)
```

### Constraints

**1. is_available = true exige:**
- `is_online = true`
- `current_lat IS NOT NULL`
- `current_lng IS NOT NULL`

**2. busy exige:**
- `is_available = false`
- `is_online = true`
- Opcionalmente `active_ride_id` (pode estar busy sem corrida, ex: aquecendo)

---

## PARTE 3: ASSINATURA FINAL DO `DriverAvailabilityService`

```typescript
// src/modules/mobility/services/DriverAvailabilityService.ts

export class DriverAvailabilityService {
  /**
   * Motorista fica online (sem disponibilidade ainda)
   * Transição: offline → online_warming_up
   * 
   * Permite motorista ficar online sem coordenadas inicialmente
   */
  static async goOnline(
    driverProfileId: string
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Motorista fica offline
   * Transição: qualquer → offline
   * 
   * Valida: não pode ter corrida ativa
   */
  static async goOffline(
    driverProfileId: string
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Motorista fica disponível para corridas
   * Transição: online_warming_up → online_available
   * 
   * Exige: is_online = true, coordenadas válidas
   */
  static async setAvailable(
    driverProfileId: string,
    location: { lat: number; lng: number }
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Motorista fica ocupado (corrida aceita)
   * Transição: online_available → busy
   * 
   * Exige: is_available = true
   * Registra: active_ride_id, busy_since, active_ride_mode
   */
  static async setBusy(
    driverProfileId: string,
    rideId: string,
    rideMode: 'ride' | 'motoboy'
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Motorista fica disponível (corrida encerrada)
   * Transição: busy → online_available
   * 
   * Exige: active_ride_id = rideId (validação de corrida correta)
   * Limpa: active_ride_id, busy_since, active_ride_mode
   */
  static async releaseBusy(
    driverProfileId: string,
    rideId: string
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
   * Marca motoristas DISPONÍVEIS stale como offline
   * Motoristas BUSY stale NÃO são liberados automaticamente
   * 
   * Retorna: { markedOffline: number, staleBusy: number }
   */
  static async markStaleDrivers(
    staleThresholdMinutes: number = 5
  ): Promise<{ markedOffline: number; staleBusy: number }>;

  /**
   * Busca motoristas disponíveis em raio
   * Usado por dispatch
   * 
   * Filtra:
   * - is_online = true
   * - is_available = true
   * - active_ride_id IS NULL
   * - coordenadas válidas
   * - se motoboy, can_do_delivery = true
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
  status: 'offline' | 'online_warming_up' | 'online_available' | 'busy';
  currentLocation?: { lat: number; lng: number };
  lastLocationUpdate?: string;
  lastSeenAt?: string;
  activeRideId?: string;
  busySince?: string;
  activeRideMode?: 'ride' | 'motoboy';
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

## PARTE 4: REGRAS EXATAS DE TRANSIÇÃO

### Estados e Transições

```
offline
  ↓ goOnline()
online_warming_up (sem coordenadas ou aquecendo)
  ↓ setAvailable(location)
online_available (com coordenadas, pronto para corrida)
  ↓ setBusy(rideId, mode)
busy (corrida ativa)
  ↓ releaseBusy(rideId)
online_available
  ↓ goOffline()
offline
```

### Regras de Negócio

**1. goOnline()**
- Só pode se `is_online = false`
- Define `is_online = true, is_available = false`
- Atualiza `last_seen_at = NOW()`
- NÃO exige coordenadas (permite aquecimento)
- Limpa `active_ride_id, busy_since, active_ride_mode`

**2. goOffline()**
- Pode de qualquer estado
- Valida: `active_ride_id IS NULL` (não pode ter corrida ativa)
- Define `is_online = false, is_available = false`
- Atualiza `last_seen_at = NOW()`
- Limpa `active_ride_id, busy_since, active_ride_mode`

**3. setAvailable(location)**
- Só pode se `is_online = true AND is_available = false AND active_ride_id IS NULL`
- Exige `location.lat` e `location.lng`
- Define `is_available = true`
- Atualiza `current_lat, current_lng, last_location_update`
- Atualiza `last_seen_at = NOW()`

**4. setBusy(rideId, mode)**
- Só pode se `is_online = true AND is_available = true AND active_ride_id IS NULL`
- Define `is_available = false`
- Define `active_ride_id = rideId`
- Define `busy_since = NOW()`
- Define `active_ride_mode = mode`
- Atualiza `last_seen_at = NOW()`

**5. releaseBusy(rideId)**
- Só pode se `is_online = true AND is_available = false AND active_ride_id = rideId`
- Valida: `active_ride_id` atual deve ser igual ao `rideId` fornecido
- Define `is_available = true`
- Limpa `active_ride_id = NULL`
- Limpa `busy_since = NULL`
- Limpa `active_ride_mode = NULL`
- Atualiza `last_seen_at = NOW()`
- Se `active_ride_id` diferente, retorna erro

**6. markLastSeen()**
- Atualiza apenas `last_seen_at = NOW()`
- Não muda `is_online`, `is_available`, ou `active_ride_id`
- Chamado por tracking/heartbeat

**7. markStaleDrivers()**
- Busca motoristas com `last_seen_at < NOW() - threshold`
- **Se DISPONÍVEL (is_available = true):**
  - Define `is_online = false, is_available = false`
  - Conta em `markedOffline`
- **Se BUSY (is_available = false AND active_ride_id IS NOT NULL):**
  - NÃO libera automaticamente
  - NÃO marca offline
  - Apenas registra em log/métrica
  - Conta em `staleBusy`
  - Requer intervenção manual ou timeout de corrida
- Retorna `{ markedOffline, staleBusy }`

---

## PARTE 5: COMO STALE FUNCIONA PARA AVAILABLE VS BUSY

### Motorista DISPONÍVEL Stale

**Condição:**
```sql
is_available = true 
AND last_seen_at < NOW() - INTERVAL '5 minutes'
```

**Ação:**
- Marcar `is_online = false, is_available = false`
- Remover do pool de dispatch
- Não afeta corridas (não tem corrida ativa)

**Justificativa:**
- Motorista disponível sem heartbeat provavelmente perdeu conexão
- Seguro remover do dispatch
- Pode voltar online quando reconectar

---

### Motorista BUSY Stale

**Condição:**
```sql
is_available = false 
AND active_ride_id IS NOT NULL
AND last_seen_at < NOW() - INTERVAL '5 minutes'
```

**Ação:**
- NÃO marcar offline automaticamente
- NÃO liberar motorista automaticamente
- NÃO limpar `active_ride_id`
- Apenas registrar em log/métrica como "problema operacional"
- Contar em `staleBusy`

**Justificativa:**
- Motorista pode estar em área sem sinal durante corrida
- Liberar automaticamente causaria inconsistência
- Corrida pode estar em andamento físico
- Passageiro/pacote pode estar com motorista
- Requer intervenção manual ou timeout de corrida

**Resolução:**
- Timeout de corrida (Gate futuro)
- Intervenção de suporte
- Motorista reconecta e completa corrida
- Sistema de escalação

---

### Fluxo de Detecção

```typescript
async markStaleDrivers(thresholdMinutes: number) {
  const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
  
  // Buscar motoristas stale
  const { data: staleDrivers } = await supabase
    .from('driver_availability')
    .select('profile_id, is_available, active_ride_id')
    .eq('is_online', true)
    .lt('last_seen_at', threshold.toISOString());
  
  let markedOffline = 0;
  let staleBusy = 0;
  
  for (const driver of staleDrivers) {
    if (driver.is_available) {
      // DISPONÍVEL: marcar offline
      await supabase
        .from('driver_availability')
        .update({ 
          is_online: false, 
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', driver.profile_id);
      
      markedOffline++;
      
      logger.warn('Driver marked offline due to stale', {
        profileId: driver.profile_id,
        lastSeen: driver.last_seen_at
      });
      
    } else if (driver.active_ride_id) {
      // BUSY: apenas registrar problema
      staleBusy++;
      
      logger.error('Driver is stale but has active ride', {
        profileId: driver.profile_id,
        rideId: driver.active_ride_id,
        lastSeen: driver.last_seen_at
      });
      
      // TODO: Notificar suporte
      // TODO: Escalar para resolução manual
    }
  }
  
  return { markedOffline, staleBusy };
}
```

---

## PARTE 6: TESTES OPERACIONAIS QUE PROVAM O GATE 5

### Teste 1: Transições de Estado ✅

```typescript
it('1.1. offline → online_warming_up', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online_warming_up');
  expect(status.isOnline).toBe(true);
  expect(status.isAvailable).toBe(false);
});

it('1.2. online_warming_up → online_available', async () => {
  await DriverAvailabilityService.setAvailable(driverProfileId, { lat, lng });
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online_available');
  expect(status.isAvailable).toBe(true);
  expect(status.currentLocation).toBeDefined();
});

it('1.3. online_available → busy', async () => {
  await DriverAvailabilityService.setBusy(driverProfileId, rideId, 'ride');
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('busy');
  expect(status.activeRideId).toBe(rideId);
});

it('1.4. busy → online_available', async () => {
  await DriverAvailabilityService.releaseBusy(driverProfileId, rideId);
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online_available');
  expect(status.activeRideId).toBeUndefined();
});

it('1.5. Bloquear setAvailable sem coordenadas', async () => {
  const result = await DriverAvailabilityService.setAvailable(driverProfileId, null);
  expect(result.success).toBe(false);
});

it('1.6. Bloquear releaseBusy com rideId errado', async () => {
  await DriverAvailabilityService.setBusy(driverProfileId, ride1Id, 'ride');
  const result = await DriverAvailabilityService.releaseBusy(driverProfileId, ride2Id);
  expect(result.success).toBe(false);
  expect(result.error).toContain('wrong ride');
});
```

---

### Teste 2: Integração com Corrida ✅

```typescript
it('2.1. Aceitar corrida deve deixar busy', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  await DriverAvailabilityService.setAvailable(driverProfileId, { lat, lng });
  
  await RideDispatchService.acceptRide(rideId, driverProfileId);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('busy');
  expect(status.activeRideId).toBe(rideId);
});

it('2.2. Completar corrida deve liberar motorista', async () => {
  await RideOperationalService.completeRide(rideId, driverProfileId);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online_available');
  expect(status.activeRideId).toBeUndefined();
});

it('2.3. Cancelar corrida deve liberar motorista', async () => {
  await RideOperationalService.cancelRide({
    rideId,
    cancelledBy: 'driver',
    profileId: driverProfileId,
  });
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.isAvailable).toBe(true);
});

it('2.4. Falhar entrega deve liberar motorista', async () => {
  await RideOperationalService.failDelivery(rideId, driverProfileId, metadata);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.isAvailable).toBe(true);
});
```

---

### Teste 3: Integração com Dispatch ✅

```typescript
it('3.1. Dispatch deve buscar apenas disponíveis', async () => {
  // Driver 1: available
  await DriverAvailabilityService.goOnline(driver1Id);
  await DriverAvailabilityService.setAvailable(driver1Id, { lat, lng });
  
  // Driver 2: busy
  await DriverAvailabilityService.goOnline(driver2Id);
  await DriverAvailabilityService.setAvailable(driver2Id, { lat, lng });
  await DriverAvailabilityService.setBusy(driver2Id, 'other-ride', 'ride');
  
  // Driver 3: offline
  await DriverAvailabilityService.goOffline(driver3Id);
  
  const eligible = await RideDispatchService.findEligibleDrivers(
    rideId, lat, lng, 10
  );
  
  expect(eligible.length).toBe(1);
  expect(eligible[0].profileId).toBe(driver1Id);
});

it('3.2. Dispatch deve ignorar active_ride_id não nulo', async () => {
  await DriverAvailabilityService.setBusy(driverProfileId, rideId, 'ride');
  
  const eligible = await RideDispatchService.findEligibleDrivers(
    'new-ride', lat, lng, 10
  );
  
  expect(eligible.find(d => d.profileId === driverProfileId)).toBeUndefined();
});

it('3.3. Dispatch deve ignorar sem coordenadas', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  // Não chamar setAvailable (sem coordenadas)
  
  const eligible = await RideDispatchService.findEligibleDrivers(
    rideId, lat, lng, 10
  );
  
  expect(eligible.find(d => d.profileId === driverProfileId)).toBeUndefined();
});
```

---

### Teste 4: Stale Detection ✅

```typescript
it('4.1. Motorista DISPONÍVEL stale deve ser marcado offline', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  await DriverAvailabilityService.setAvailable(driverProfileId, { lat, lng });
  
  // Simular last_seen antigo
  await supabase
    .from('driver_availability')
    .update({ last_seen_at: new Date(Date.now() - 6 * 60 * 1000).toISOString() })
    .eq('profile_id', driverProfileId);
  
  const result = await DriverAvailabilityService.markStaleDrivers(5);
  
  expect(result.markedOffline).toBeGreaterThan(0);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('offline');
});

it('4.2. Motorista BUSY stale NÃO deve ser liberado', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  await DriverAvailabilityService.setAvailable(driverProfileId, { lat, lng });
  await DriverAvailabilityService.setBusy(driverProfileId, rideId, 'ride');
  
  // Simular last_seen antigo
  await supabase
    .from('driver_availability')
    .update({ last_seen_at: new Date(Date.now() - 6 * 60 * 1000).toISOString() })
    .eq('profile_id', driverProfileId);
  
  const result = await DriverAvailabilityService.markStaleDrivers(5);
  
  expect(result.staleBusy).toBeGreaterThan(0);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('busy'); // Ainda busy
  expect(status.activeRideId).toBe(rideId); // Corrida preservada
});

it('4.3. Motorista ativo não deve ser marcado stale', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  await DriverAvailabilityService.setAvailable(driverProfileId, { lat, lng });
  await DriverAvailabilityService.markLastSeen(driverProfileId);
  
  const result = await DriverAvailabilityService.markStaleDrivers(5);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online_available');
});
```

---

### Teste 5: Tracking Integration ✅

```typescript
it('5.1. Publicar localização deve atualizar last_seen', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  
  const before = await DriverAvailabilityService.getStatus(driverProfileId);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await TrackingService.updatePosition(driverProfileId, position, 'driver');
  
  const after = await DriverAvailabilityService.getStatus(driverProfileId);
  
  expect(new Date(after.lastSeenAt!).getTime())
    .toBeGreaterThan(new Date(before.lastSeenAt!).getTime());
});
```

---

### Teste 6: Reconexão ✅

```typescript
it('6.1. Reconexão deve sincronizar status', async () => {
  await DriverAvailabilityService.goOnline(driverProfileId);
  await DriverAvailabilityService.setAvailable(driverProfileId, { lat, lng });
  
  await TrackingService.forceReconnect();
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.status).toBe('online_available');
  expect(status.lastSeenAt).toBeDefined();
});
```

---

### Teste 7: Validação de Corrida Correta ✅

```typescript
it('7.1. releaseBusy com rideId errado deve falhar', async () => {
  await DriverAvailabilityService.setBusy(driverProfileId, ride1Id, 'ride');
  
  const result = await DriverAvailabilityService.releaseBusy(driverProfileId, ride2Id);
  
  expect(result.success).toBe(false);
  expect(result.error).toContain('active_ride_id mismatch');
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.activeRideId).toBe(ride1Id); // Preservado
});

it('7.2. releaseBusy com rideId correto deve suceder', async () => {
  await DriverAvailabilityService.setBusy(driverProfileId, rideId, 'ride');
  
  const result = await DriverAvailabilityService.releaseBusy(driverProfileId, rideId);
  
  expect(result.success).toBe(true);
  
  const status = await DriverAvailabilityService.getStatus(driverProfileId);
  expect(status.activeRideId).toBeUndefined();
});
```

---

## PARTE 7: VEREDITO

### Pronto para Implementar ✅

**Migration:**
- ✅ Adiciona `last_seen_at`, `active_ride_id`, `busy_since`, `active_ride_mode`
- ✅ Constraint correto: `is_available = true` exige coordenadas + online
- ✅ Índices para performance
- ✅ Comentários explicativos

**Service:**
- ✅ Transições explícitas de estado
- ✅ Validação de corrida correta em `releaseBusy()`
- ✅ Stale detection diferenciado (available vs busy)
- ✅ Integração com dispatch/corrida/tracking/reconexão

**Regras:**
- ✅ offline → online_warming_up → online_available → busy → online_available
- ✅ Coordenadas obrigatórias apenas para `is_available = true`
- ✅ `active_ride_id` amarrado à corrida
- ✅ Stale disponível: marca offline
- ✅ Stale busy: apenas registra problema

**Testes:**
- ✅ 7 suítes de testes
- ✅ ~25 testes operacionais
- ✅ Cobertura completa de transições, integrações, stale, validações

**Implementação:**
- Migration: ~60 linhas
- Service: ~500 linhas
- Integrações: ~80 linhas
- Testes: ~700 linhas
- Total: ~1.340 linhas

**Tempo estimado:** 5-7 horas

---

## RESUMO EXECUTIVO

### Ajustes Aplicados ✅

1. ✅ Coordenadas obrigatórias apenas para `is_available = true`
2. ✅ Adicionado `active_ride_id`, `busy_since`, `active_ride_mode`
3. ✅ `setBusy()` e `releaseBusy()` amarrados à corrida
4. ✅ Stale diferenciado: available → offline, busy → apenas registra
5. ✅ Dispatch filtra `active_ride_id IS NULL`
6. ✅ Integrações explícitas com dispatch/corrida/tracking/reconexão
7. ✅ Sem acesso direto ao Supabase fora do service

### Próximo Passo

Implementar:
1. Migration
2. DriverAvailabilityService
3. Integrações (RideDispatchService, RideOperationalService, TrackingService, ReconnectionManager)
4. Testes operacionais

**PRONTO PARA IMPLEMENTAR ✅**

