# GATE 6: FLUXO E2E PASSAGEIRO - PROPOSTA COMPLETA

**Data:** 08/04/2026  
**Status:** PROPOSTA PARA IMPLEMENTAÇÃO

---

## CONTEXTO

### Gates Anteriores (Fechados)
- ✅ Gate 2: Publicação de Localização (validado)
- ✅ Gate 3: Cancelamento de Corrida (validado)
- ✅ Gate 4: Reconexão e Recuperação (validado no core)
- ✅ Gate 5: Disponibilidade do Motorista (validado)

### Gate 1 (Implementado mas NÃO Validado)
- ⚠️ RideDispatchService existe
- ⚠️ Busca de motoristas implementada
- ⚠️ Criação de ofertas implementada
- ❌ Nunca foi testado operacionalmente
- ❌ Nunca foi validado E2E

### Problema Identificado
**Nenhum fluxo E2E foi validado de ponta a ponta.**

Temos:
- Services isolados funcionando
- Testes unitários passando
- Migrations aplicadas

Mas NÃO temos:
- ❌ Fluxo completo passageiro validado
- ❌ Dispatch real funcionando
- ❌ Aceitação de corrida validada
- ❌ Tracking durante corrida validado
- ❌ Completar corrida validado

---

## ESCOPO DO GATE 6

### Objetivo
**Validar fluxo E2E completo do passageiro: solicitar → dispatch → aceitar → tracking → completar**

### O que Gate 6 DEVE provar

**1. Passageiro solicita corrida**
- ✅ Corrida criada com status `pending`
- ✅ Origem e destino salvos
- ✅ Pricing calculado
- ✅ Corrida entra na fila de dispatch

**2. Dispatch busca motorista**
- ✅ RideDispatchService.findEligibleDrivers() funciona
- ✅ Busca apenas motoristas disponíveis (Gate 5)
- ✅ Calcula distância corretamente
- ✅ Ordena por proximidade
- ✅ Cria oferta para motorista mais próximo

**3. Motorista recebe e aceita oferta**
- ✅ Oferta criada com status `pending`
- ✅ Oferta expira após timeout
- ✅ Motorista aceita oferta
- ✅ Corrida muda para `accepted`
- ✅ Motorista fica `busy` (Gate 5)
- ✅ Outras ofertas são canceladas

**4. Motorista vai buscar passageiro**
- ✅ Corrida muda para `driver_arriving`
- ✅ Tracking publica localização (Gate 2)
- ✅ Passageiro vê motorista se aproximando
- ✅ ETA atualizado em tempo real

**5. Motorista chega e inicia corrida**
- ✅ Corrida muda para `in_progress`
- ✅ Tracking continua publicando
- ✅ Passageiro vê rota em tempo real

**6. Motorista completa corrida**
- ✅ Corrida muda para `completed`
- ✅ Motorista volta `available` (Gate 5)
- ✅ Tracking para de publicar
- ✅ Passageiro pode avaliar motorista

### O que Gate 6 NÃO é escopo

❌ Pagamento (pode ser depois)
❌ Avaliação de motorista (pode ser depois)
❌ Histórico de corridas (pode ser depois)
❌ Notificações push (pode ser depois)
❌ UI completa (pode ser depois)
❌ Motoboy (Gate 7)
❌ Proof of delivery (Gate 8)

---

## IMPLEMENTAÇÃO NECESSÁRIA

### 1. Completar RideDispatchService

**Arquivo:** `src/modules/mobility/core/RideDispatchService.ts`

**Métodos que precisam validação:**

```typescript
// JÁ EXISTE - precisa validar
static async findEligibleDrivers(
  rideId: string,
  originLat: number,
  originLng: number,
  maxRadius: number,
  rideMode?: 'ride' | 'motoboy'
): Promise<EligibleDriver[]>

// JÁ EXISTE - precisa validar
static async createOffer(
  rideId: string,
  driverProfileId: string,
  expiresInSeconds: number = 30
): Promise<{ success: boolean; offerId?: string; error?: string }>

// PRECISA IMPLEMENTAR
static async acceptOffer(
  offerId: string,
  driverProfileId: string
): Promise<{ success: boolean; error?: string }>

// PRECISA IMPLEMENTAR
static async rejectOffer(
  offerId: string,
  driverProfileId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }>

// PRECISA IMPLEMENTAR
static async expireOffer(
  offerId: string
): Promise<{ success: boolean; error?: string }>

// PRECISA IMPLEMENTAR
static async cancelPendingOffers(
  rideId: string,
  exceptOfferId?: string
): Promise<number>
```

**Integrações necessárias:**

```typescript
// Ao aceitar oferta
await RideOperationalService.acceptRide(rideId, driverProfileId);
await DriverAvailabilityService.setBusy(driverProfileId, rideId, rideMode);
await this.cancelPendingOffers(rideId, offerId);

// Ao expirar oferta
await this.expireOffer(offerId);
// Buscar próximo motorista elegível
```

---

### 2. Completar RideOperationalService

**Arquivo:** `src/modules/mobility/core/RideOperationalService.ts`

**Métodos que precisam validação:**

```typescript
// JÁ EXISTE - precisa validar
static async acceptRide(
  rideId: string,
  driverProfileId: string
): Promise<{ success: boolean; error?: string }>

// JÁ EXISTE - precisa validar
static async startRide(
  rideId: string,
  driverProfileId: string
): Promise<{ success: boolean; error?: string }>

// JÁ EXISTE - precisa validar
static async completeRide(
  rideId: string,
  driverProfileId: string,
  metadata?: CompleteRideMetadata
): Promise<{ success: boolean; error?: string }>
```

**Integrações necessárias:**

```typescript
// Ao aceitar corrida
await DriverAvailabilityService.setBusy(driverProfileId, rideId, rideMode);

// Ao completar corrida
await DriverAvailabilityService.setAvailable(driverProfileId);
await TrackingService.stopTracking(driverProfileId, 'driver');
```

---

### 3. Migration para Ofertas (se não existir)

**Arquivo:** `supabase/migrations/20260408000001_gate6_ride_offers.sql`

```sql
-- Tabela de ofertas (se não existir)
CREATE TABLE IF NOT EXISTS ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ride_offers_ride_id ON ride_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_driver_profile_id ON ride_offers(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_status ON ride_offers(status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_expires_at ON ride_offers(expires_at) WHERE status = 'pending';

-- RLS
ALTER TABLE ride_offers ENABLE ROW LEVEL SECURITY;

-- Service role: acesso total
CREATE POLICY "Service role has full access to ride_offers"
  ON ride_offers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Motorista: ver apenas suas ofertas
CREATE POLICY "Drivers can view their own offers"
  ON ride_offers FOR SELECT
  TO authenticated
  USING (driver_profile_id = auth.uid());

-- Motorista: aceitar/rejeitar apenas suas ofertas pendentes
CREATE POLICY "Drivers can respond to their own pending offers"
  ON ride_offers FOR UPDATE
  TO authenticated
  USING (
    driver_profile_id = auth.uid() AND
    status = 'pending' AND
    expires_at > NOW()
  )
  WITH CHECK (
    driver_profile_id = auth.uid() AND
    status IN ('accepted', 'rejected')
  );
```

---

## TESTES OPERACIONAIS

### Suite 1: Dispatch Básico (5 testes)

```typescript
describe('Gate 6 - Suite 1: Dispatch Básico', () => {
  it('1.1. Deve buscar motoristas elegíveis', async () => {
    // Setup: 2 motoristas online, 1 offline
    await DriverAvailabilityService.goOnline(driver1Id, location1);
    await DriverAvailabilityService.goOnline(driver2Id, location2);
    await DriverAvailabilityService.goOffline(driver3Id);
    
    const eligible = await RideDispatchService.findEligibleDrivers(
      rideId, originLat, originLng, 10
    );
    
    expect(eligible.length).toBe(2);
    expect(eligible[0].profileId).toBe(driver1Id); // Mais próximo
  });
  
  it('1.2. Deve criar oferta para motorista', async () => {
    const result = await RideDispatchService.createOffer(rideId, driverId, 30);
    
    expect(result.success).toBe(true);
    expect(result.offerId).toBeDefined();
    
    const offer = await supabase
      .from('ride_offers')
      .select('*')
      .eq('id', result.offerId)
      .single();
    
    expect(offer.data.status).toBe('pending');
    expect(offer.data.ride_id).toBe(rideId);
    expect(offer.data.driver_profile_id).toBe(driverId);
  });
  
  it('1.3. Deve ignorar motoristas busy', async () => {
    await DriverAvailabilityService.goOnline(driver1Id, location1);
    await DriverAvailabilityService.setBusy(driver1Id, otherRideId, 'ride');
    
    const eligible = await RideDispatchService.findEligibleDrivers(
      rideId, originLat, originLng, 10
    );
    
    expect(eligible.find(d => d.profileId === driver1Id)).toBeUndefined();
  });
  
  it('1.4. Deve ordenar por proximidade', async () => {
    // driver1: 1km, driver2: 5km, driver3: 10km
    await DriverAvailabilityService.goOnline(driver1Id, nearLocation);
    await DriverAvailabilityService.goOnline(driver2Id, midLocation);
    await DriverAvailabilityService.goOnline(driver3Id, farLocation);
    
    const eligible = await RideDispatchService.findEligibleDrivers(
      rideId, originLat, originLng, 15
    );
    
    expect(eligible[0].profileId).toBe(driver1Id);
    expect(eligible[1].profileId).toBe(driver2Id);
    expect(eligible[2].profileId).toBe(driver3Id);
  });
  
  it('1.5. Deve respeitar raio máximo', async () => {
    await DriverAvailabilityService.goOnline(driver1Id, farLocation); // 20km
    
    const eligible = await RideDispatchService.findEligibleDrivers(
      rideId, originLat, originLng, 10 // Raio 10km
    );
    
    expect(eligible.length).toBe(0);
  });
});
```

---

### Suite 2: Aceitação de Oferta (5 testes)

```typescript
describe('Gate 6 - Suite 2: Aceitação de Oferta', () => {
  it('2.1. Motorista deve aceitar oferta', async () => {
    const { offerId } = await RideDispatchService.createOffer(rideId, driverId, 30);
    
    const result = await RideDispatchService.acceptOffer(offerId, driverId);
    
    expect(result.success).toBe(true);
    
    const offer = await supabase
      .from('ride_offers')
      .select('*')
      .eq('id', offerId)
      .single();
    
    expect(offer.data.status).toBe('accepted');
    expect(offer.data.responded_at).toBeDefined();
  });
  
  it('2.2. Aceitar oferta deve mudar corrida para accepted', async () => {
    const { offerId } = await RideDispatchService.createOffer(rideId, driverId, 30);
    await RideDispatchService.acceptOffer(offerId, driverId);
    
    const ride = await supabase
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', rideId)
      .single();
    
    expect(ride.data.status).toBe('accepted');
    expect(ride.data.driver_profile_id).toBe(driverId);
  });
  
  it('2.3. Aceitar oferta deve deixar motorista busy', async () => {
    const { offerId } = await RideDispatchService.createOffer(rideId, driverId, 30);
    await RideDispatchService.acceptOffer(offerId, driverId);
    
    const status = await DriverAvailabilityService.getStatus(driverId);
    
    expect(status.status).toBe('busy');
    expect(status.activeRideId).toBe(rideId);
  });
  
  it('2.4. Aceitar oferta deve cancelar outras ofertas', async () => {
    const { offerId: offer1 } = await RideDispatchService.createOffer(rideId, driver1Id, 30);
    const { offerId: offer2 } = await RideDispatchService.createOffer(rideId, driver2Id, 30);
    
    await RideDispatchService.acceptOffer(offer1, driver1Id);
    
    const offer2Data = await supabase
      .from('ride_offers')
      .select('status')
      .eq('id', offer2)
      .single();
    
    expect(offer2Data.data.status).toBe('cancelled');
  });
  
  it('2.5. Não deve aceitar oferta expirada', async () => {
    const { offerId } = await RideDispatchService.createOffer(rideId, driverId, 1);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar expirar
    
    const result = await RideDispatchService.acceptOffer(offerId, driverId);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('expired');
  });
});
```

---

### Suite 3: Fluxo Completo E2E (6 testes)

```typescript
describe('Gate 6 - Suite 3: Fluxo Completo E2E', () => {
  it('3.1. Fluxo completo: solicitar → dispatch → aceitar → completar', async () => {
    // 1. Motorista fica online
    await DriverAvailabilityService.goOnline(driverId, driverLocation);
    
    // 2. Passageiro solicita corrida
    const { data: ride } = await supabase
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        status: 'pending',
      })
      .select()
      .single();
    
    expect(ride.status).toBe('pending');
    
    // 3. Dispatch busca motorista
    const eligible = await RideDispatchService.findEligibleDrivers(
      ride.id, pickupLat, pickupLng, 10
    );
    
    expect(eligible.length).toBeGreaterThan(0);
    
    // 4. Criar oferta
    const { offerId } = await RideDispatchService.createOffer(ride.id, driverId, 30);
    expect(offerId).toBeDefined();
    
    // 5. Motorista aceita
    await RideDispatchService.acceptOffer(offerId, driverId);
    
    const rideAfterAccept = await supabase
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', ride.id)
      .single();
    
    expect(rideAfterAccept.data.status).toBe('accepted');
    expect(rideAfterAccept.data.driver_profile_id).toBe(driverId);
    
    // 6. Motorista inicia corrida
    await RideOperationalService.startRide(ride.id, driverId);
    
    const rideAfterStart = await supabase
      .from('ride_requests')
      .select('status')
      .eq('id', ride.id)
      .single();
    
    expect(rideAfterStart.data.status).toBe('in_progress');
    
    // 7. Motorista completa corrida
    await RideOperationalService.completeRide(ride.id, driverId);
    
    const rideAfterComplete = await supabase
      .from('ride_requests')
      .select('status')
      .eq('id', ride.id)
      .single();
    
    expect(rideAfterComplete.data.status).toBe('completed');
    
    // 8. Motorista volta disponível
    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatus.status).toBe('online');
    expect(driverStatus.isAvailable).toBe(true);
  });
  
  it('3.2. Cancelamento durante dispatch deve liberar motorista', async () => {
    await DriverAvailabilityService.goOnline(driverId, driverLocation);
    
    const { data: ride } = await supabase
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        status: 'pending',
      })
      .select()
      .single();
    
    const { offerId } = await RideDispatchService.createOffer(ride.id, driverId, 30);
    await RideDispatchService.acceptOffer(offerId, driverId);
    
    // Cancelar corrida
    await RideOperationalService.cancelRide({
      rideId: ride.id,
      cancelledBy: 'passenger',
      profileId: passengerId,
    });
    
    // Motorista deve voltar disponível
    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatus.isAvailable).toBe(true);
  });
  
  it('3.3. Múltiplas corridas simultâneas devem funcionar', async () => {
    // 2 motoristas online
    await DriverAvailabilityService.goOnline(driver1Id, location1);
    await DriverAvailabilityService.goOnline(driver2Id, location2);
    
    // 2 passageiros solicitam corridas
    const { data: ride1 } = await supabase
      .from('ride_requests')
      .insert({
        passenger_profile_id: passenger1Id,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        status: 'pending',
      })
      .select()
      .single();
    
    const { data: ride2 } = await supabase
      .from('ride_requests')
      .insert({
        passenger_profile_id: passenger2Id,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        status: 'pending',
      })
      .select()
      .single();
    
    // Dispatch para ambas
    const { offerId: offer1 } = await RideDispatchService.createOffer(ride1.id, driver1Id, 30);
    const { offerId: offer2 } = await RideDispatchService.createOffer(ride2.id, driver2Id, 30);
    
    // Ambos aceitam
    await RideDispatchService.acceptOffer(offer1, driver1Id);
    await RideDispatchService.acceptOffer(offer2, driver2Id);
    
    // Ambos devem estar busy
    const status1 = await DriverAvailabilityService.getStatus(driver1Id);
    const status2 = await DriverAvailabilityService.getStatus(driver2Id);
    
    expect(status1.status).toBe('busy');
    expect(status2.status).toBe('busy');
  });
  
  it('3.4. Tracking durante corrida deve funcionar', async () => {
    await DriverAvailabilityService.goOnline(driverId, driverLocation);
    
    const { data: ride } = await supabase
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        status: 'pending',
      })
      .select()
      .single();
    
    const { offerId } = await RideDispatchService.createOffer(ride.id, driverId, 30);
    await RideDispatchService.acceptOffer(offerId, driverId);
    await RideOperationalService.startRide(ride.id, driverId);
    
    // Publicar localização
    await TrackingService.updatePosition(driverId, newPosition, 'driver');
    
    // Verificar que last_seen_at foi atualizado
    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatus.lastSeenAt).toBeDefined();
  });
  
  it('3.5. Completar corrida deve parar tracking', async () => {
    await DriverAvailabilityService.goOnline(driverId, driverLocation);
    
    const { data: ride } = await supabase
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        status: 'pending',
      })
      .select()
      .single();
    
    const { offerId } = await RideDispatchService.createOffer(ride.id, driverId, 30);
    await RideDispatchService.acceptOffer(offerId, driverId);
    await RideOperationalService.startRide(ride.id, driverId);
    
    // Completar corrida
    await RideOperationalService.completeRide(ride.id, driverId);
    
    // Tracking deve ter parado
    const subscriptions = TrackingService.getActiveSubscriptions();
    expect(subscriptions.find(s => s.entityId === driverId)).toBeUndefined();
  });
  
  it('3.6. Rejeitar oferta deve buscar próximo motorista', async () => {
    await DriverAvailabilityService.goOnline(driver1Id, location1);
    await DriverAvailabilityService.goOnline(driver2Id, location2);
    
    const { data: ride } = await supabase
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        status: 'pending',
      })
      .select()
      .single();
    
    // Oferta para driver1
    const { offerId: offer1 } = await RideDispatchService.createOffer(ride.id, driver1Id, 30);
    
    // driver1 rejeita
    await RideDispatchService.rejectOffer(offer1, driver1Id, 'too far');
    
    // Buscar próximo motorista
    const eligible = await RideDispatchService.findEligibleDrivers(
      ride.id, pickupLat, pickupLng, 10
    );
    
    expect(eligible.find(d => d.profileId === driver2Id)).toBeDefined();
    
    // Oferta para driver2
    const { offerId: offer2 } = await RideDispatchService.createOffer(ride.id, driver2Id, 30);
    await RideDispatchService.acceptOffer(offer2, driver2Id);
    
    const rideAfterAccept = await supabase
      .from('ride_requests')
      .select('driver_profile_id')
      .eq('id', ride.id)
      .single();
    
    expect(rideAfterAccept.data.driver_profile_id).toBe(driver2Id);
  });
});
```

---

## CRITÉRIO DE FECHAMENTO DO GATE 6

**Gate 6 só fecha se provar:**

1. ✅ Passageiro solicita corrida (status `pending`)
2. ✅ Dispatch busca motoristas disponíveis
3. ✅ Dispatch cria oferta para motorista
4. ✅ Motorista aceita oferta
5. ✅ Corrida muda para `accepted`
6. ✅ Motorista fica `busy`
7. ✅ Motorista inicia corrida (`in_progress`)
8. ✅ Tracking publica localização durante corrida
9. ✅ Motorista completa corrida (`completed`)
10. ✅ Motorista volta `available`
11. ✅ Tracking para após completar
12. ✅ Cancelamento libera motorista
13. ✅ Múltiplas corridas simultâneas funcionam
14. ✅ Rejeição de oferta busca próximo motorista
15. ✅ Oferta expira após timeout
16. ✅ Testes operacionais passando (mínimo 16/16)

---

## RESUMO EXECUTIVO

### O que Gate 6 valida
- ✅ Fluxo E2E completo do passageiro
- ✅ Dispatch real funcionando
- ✅ Aceitação de corrida funcionando
- ✅ Tracking durante corrida funcionando
- ✅ Completar corrida funcionando
- ✅ Integração entre todos os Gates anteriores

### O que Gate 6 NÃO valida
- ❌ Motoboy (Gate 7)
- ❌ Proof of delivery (Gate 8)
- ❌ Pagamento (futuro)
- ❌ Avaliação (futuro)
- ❌ UI completa (futuro)

### Implementação necessária
- Migration: ~50 linhas (se ride_offers não existir)
- RideDispatchService: ~200 linhas (completar métodos)
- RideOperationalService: ~50 linhas (integrações)
- Testes: ~800 linhas
- Total: ~1.100 linhas

**Tempo estimado:** 6-8 horas

**Próximo passo:** Implementar métodos faltantes + migration + testes operacionais
