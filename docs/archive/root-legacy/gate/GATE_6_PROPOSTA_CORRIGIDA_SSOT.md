# GATE 6: FLUXO E2E PASSAGEIRO - PROPOSTA CORRIGIDA (SSOT)

**Data:** 08/04/2026  
**Status:** PROPOSTA ALINHADA AO SSOT REAL

---

## BLOCO A: DIAGNÓSTICO SSOT

### 1. Tabela ride_offers

**Status:** ❌ NÃO EXISTE no banco remoto

**Evidência:**
```
Error: Could not find the table 'public.ride_offers' in the schema cache
```

**Conclusão:** Precisa criar migration.

---

### 2. Statuses Oficiais de Corrida

**Fonte:** `src/modules/mobility/constants/index.ts`

**Estados Válidos (RIDE_STATUS):**
```typescript
// Estados iniciais
PENDING: 'pending'
REQUESTED: 'requested'
SEARCHING_DRIVER: 'searching_driver'

// Estados de atribuição
DRIVER_ASSIGNED: 'driver_assigned'
DRIVER_ACCEPTED: 'driver_accepted'
DRIVER_ARRIVING: 'driver_arriving'
DRIVER_ON_THE_WAY: 'driver_on_the_way'
DRIVER_ARRIVED: 'driver_arrived'

// Estados de execução (corrida)
PASSENGER_BOARDED: 'passenger_boarded'
PASSENGER_ON_BOARD: 'passenger_on_board'
IN_PROGRESS: 'in_progress'

// Estados de execução (motoboy)
PICKUP_CONFIRMED: 'pickup_confirmed'
IN_DELIVERY: 'in_delivery'
DELIVERED: 'delivered'
FAILED_DELIVERY: 'failed_delivery'

// Estados finais
COMPLETED: 'completed'
CANCELLED: 'cancelled'
CANCELLED_BY_PASSENGER: 'cancelled_by_passenger'
CANCELLED_BY_DRIVER: 'cancelled_by_driver'
EXPIRED: 'expired'
FAILED: 'failed'
```

**Statuses encontrados no banco:**
- `searching_driver`
- `expired`
- `pending`

**Conclusão:** Usar `RIDE_STATUS` do constants, não inventar nomes.

---

### 3. Colunas Reais de ride_requests

**Evidência do banco:**
```
id, passenger_profile_id, driver_profile_id, route_id, status, 
suggested_price, final_price, available_seats, share_token, 
share_view_count, created_at, updated_at, pickup_address_id, 
dropoff_address_id, pickup_location_id, dropoff_location_id, 
driver_assigned_at, driver_accepted_at, passenger_boarded_at, 
cancelled_at, origin, destination, departure_time, payment_method, 
observation, origin_lat, origin_lng, destination_lat, destination_lng, 
ride_mode, source_type, source_id, recipient_name, recipient_phone, 
delivery_notes, package_description, package_size, proof_of_delivery, 
pickup_confirmed_at, delivered_at, failed_delivery_at, 
failed_delivery_reason, failed_delivery_metadata
```

**Campos canônicos obrigatórios:**
- `pickup_address_id` (FK para addresses)
- `dropoff_address_id` (FK para addresses)
- `pickup_location_id` (FK para locations)
- `dropoff_location_id` (FK para locations)
- `origin_lat`, `origin_lng` (coordenadas origem)
- `destination_lat`, `destination_lng` (coordenadas destino)

---

### 4. Entrypoint Oficial para Criar Corrida

**Fonte:** `src/modules/mobility/core/RideOperationalService.ts`

**Método oficial:**
```typescript
static async createRide(input: CreateRideInput): Promise<TransitionResult>
```

**Interface:**
```typescript
interface CreateRideInput {
  passengerProfileId: string;
  // Campos canônicos (obrigatórios)
  pickupAddressId?: string;
  dropoffAddressId?: string;
  pickupLocationId?: string;
  dropoffLocationId?: string;
  // Coordenadas (obrigatórias para pricing)
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  // Opcionais
  origin?: string;
  destination?: string;
  mode?: 'ride' | 'delivery';
  suggestedPrice?: number;
  observation?: string;
  availableSeats?: number;
  paymentMethod?: string;
  departureTime?: string;
}
```

**Fluxo oficial:**
1. `RideOperationalService.createRide()` cria corrida com status `requested`
2. Transiciona automaticamente para `searching_driver`
3. Trigger do banco dispara dispatch

**Conclusão:** Usar `RideOperationalService.createRide()` nos testes E2E, não insert direto.

---

### 5. RLS de ride_offers (Correção Necessária)

**Problema identificado:** Policy `driver_profile_id = auth.uid()` está ERRADA.

**Motivo:** 
- `auth.uid()` retorna `user_id` (tabela auth.users)
- `driver_profile_id` é FK para `profiles.id`
- Relação correta: `profiles.user_id = auth.uid()`

**Correção:**
```sql
-- ERRADO (proposta original)
USING (driver_profile_id = auth.uid())

-- CORRETO (alinhado ao projeto)
USING (
  driver_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
)
```

---

## BLOCO B: IMPLEMENTAÇÃO MÍNIMA FALTANTE

### 1. Migration ride_offers (CRIAR)

**Arquivo:** `supabase/migrations/20260408000001_gate6_ride_offers.sql`

```sql
-- ============================================
-- GATE 6: RIDE OFFERS
-- ============================================

-- Tabela de ofertas de corrida
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

-- Motorista: ver apenas suas ofertas (CORREÇÃO: usar profiles.user_id)
CREATE POLICY "Drivers can view their own offers"
  ON ride_offers FOR SELECT
  TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Motorista: aceitar/rejeitar apenas suas ofertas pendentes
CREATE POLICY "Drivers can respond to their own pending offers"
  ON ride_offers FOR UPDATE
  TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND
    status = 'pending' AND
    expires_at > NOW()
  )
  WITH CHECK (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND
    status IN ('accepted', 'rejected')
  );
```

---

### 2. Completar RideDispatchService (MÉTODOS FALTANTES)

**Arquivo:** `src/modules/mobility/core/RideDispatchService.ts`

**Métodos que JÁ EXISTEM (validar apenas):**
- ✅ `findEligibleDrivers()` - busca motoristas
- ✅ `createOffer()` - cria oferta

**Métodos que PRECISAM SER IMPLEMENTADOS:**

```typescript
/**
 * Motorista aceita oferta
 */
static async acceptOffer(
  offerId: string,
  driverProfileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verificar se oferta existe e está pendente
    const { data: offer, error: offerError } = await supabase
      .from('ride_offers')
      .select('*, ride_requests!inner(status)')
      .eq('id', offerId)
      .eq('driver_profile_id', driverProfileId)
      .eq('status', 'pending')
      .single();

    if (offerError || !offer) {
      return { success: false, error: 'Oferta não encontrada ou já respondida' };
    }

    // 2. Verificar se oferta não expirou
    if (new Date(offer.expires_at) < new Date()) {
      await supabase
        .from('ride_offers')
        .update({ status: 'expired' })
        .eq('id', offerId);
      
      return { success: false, error: 'Oferta expirou' };
    }

    // 3. Verificar se corrida ainda está searching_driver
    if (offer.ride_requests.status !== RIDE_STATE.SEARCHING_DRIVER) {
      return { success: false, error: 'Corrida não está mais disponível' };
    }

    // 4. Aceitar oferta (transação atômica)
    const { error: updateError } = await supabase
      .from('ride_offers')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId)
      .eq('status', 'pending'); // Condição atômica

    if (updateError) throw updateError;

    // 5. Atribuir motorista à corrida
    const acceptResult = await RideOperationalService.acceptRide(
      offer.ride_id,
      driverProfileId
    );

    if (!acceptResult.success) {
      // Reverter oferta
      await supabase
        .from('ride_offers')
        .update({ status: 'pending' })
        .eq('id', offerId);
      
      return { success: false, error: acceptResult.error };
    }

    // 6. Cancelar outras ofertas pendentes
    await this.cancelPendingOffers(offer.ride_id, offerId);

    logger.info('RideDispatchService.acceptOffer', {
      offerId,
      rideId: offer.ride_id,
      driverProfileId,
    });

    return { success: true };
  } catch (error) {
    logger.error('RideDispatchService.acceptOffer', error as Error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Motorista rejeita oferta
 */
static async rejectOffer(
  offerId: string,
  driverProfileId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ride_offers')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', offerId)
      .eq('driver_profile_id', driverProfileId)
      .eq('status', 'pending');

    if (error) throw error;

    logger.info('RideDispatchService.rejectOffer', {
      offerId,
      driverProfileId,
      reason,
    });

    return { success: true };
  } catch (error) {
    logger.error('RideDispatchService.rejectOffer', error as Error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Expira oferta automaticamente
 */
static async expireOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ride_offers')
      .update({ status: 'expired' })
      .eq('id', offerId)
      .eq('status', 'pending');

    if (error) throw error;

    logger.info('RideDispatchService.expireOffer', { offerId });

    return { success: true };
  } catch (error) {
    logger.error('RideDispatchService.expireOffer', error as Error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Cancela ofertas pendentes de uma corrida
 */
static async cancelPendingOffers(
  rideId: string,
  exceptOfferId?: string
): Promise<number> {
  try {
    let query = supabase
      .from('ride_offers')
      .update({ status: 'cancelled' })
      .eq('ride_id', rideId)
      .eq('status', 'pending');

    if (exceptOfferId) {
      query = query.neq('id', exceptOfferId);
    }

    const { data, error } = await query.select();

    if (error) throw error;

    const count = data?.length || 0;

    logger.info('RideDispatchService.cancelPendingOffers', {
      rideId,
      exceptOfferId,
      count,
    });

    return count;
  } catch (error) {
    logger.error('RideDispatchService.cancelPendingOffers', error as Error);
    return 0;
  }
}
```

---

## BLOCO C: TESTES SEPARADOS

### Suite 1: Testes de Offers/Dispatch (5 testes)

**Arquivo:** `tests/operational/gate6-dispatch-offers.test.ts`

```typescript
describe('Gate 6 - Suite 1: Dispatch e Ofertas', () => {
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
    
    const { data: offer } = await supabaseAdmin
      .from('ride_offers')
      .select('*')
      .eq('id', result.offerId)
      .single();
    
    expect(offer.status).toBe('pending');
    expect(offer.ride_id).toBe(rideId);
    expect(offer.driver_profile_id).toBe(driverId);
  });
  
  it('1.3. Motorista deve aceitar oferta', async () => {
    const { offerId } = await RideDispatchService.createOffer(rideId, driverId, 30);
    
    const result = await RideDispatchService.acceptOffer(offerId, driverId);
    
    expect(result.success).toBe(true);
    
    const { data: offer } = await supabaseAdmin
      .from('ride_offers')
      .select('*')
      .eq('id', offerId)
      .single();
    
    expect(offer.status).toBe('accepted');
    expect(offer.responded_at).toBeDefined();
  });
  
  it('1.4. Aceitar oferta deve mudar corrida para driver_accepted', async () => {
    const { offerId } = await RideDispatchService.createOffer(rideId, driverId, 30);
    await RideDispatchService.acceptOffer(offerId, driverId);
    
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', rideId)
      .single();
    
    expect(ride.status).toBe(RIDE_STATUS.DRIVER_ACCEPTED);
    expect(ride.driver_profile_id).toBe(driverId);
  });
  
  it('1.5. Aceitar oferta deve cancelar outras ofertas', async () => {
    const { offerId: offer1 } = await RideDispatchService.createOffer(rideId, driver1Id, 30);
    const { offerId: offer2 } = await RideDispatchService.createOffer(rideId, driver2Id, 30);
    
    await RideDispatchService.acceptOffer(offer1, driver1Id);
    
    const { data: offer2Data } = await supabaseAdmin
      .from('ride_offers')
      .select('status')
      .eq('id', offer2)
      .single();
    
    expect(offer2Data.status).toBe('cancelled');
  });
});
```

---

### Suite 2: Teste E2E Principal (1 teste)

**Arquivo:** `tests/operational/gate6-e2e-passenger.test.ts`

```typescript
describe('Gate 6 - Suite 2: Fluxo E2E Passageiro', () => {
  it('2.1. Fluxo completo: criar → dispatch → aceitar → iniciar → completar', async () => {
    // 1. Motorista fica online
    await DriverAvailabilityService.goOnline(driverId, driverLocation);
    
    // 2. Passageiro solicita corrida (USAR ENTRYPOINT OFICIAL)
    const result = await RideOperationalService.createRide({
      passengerProfileId: passengerId,
      pickupAddressId: pickupAddressId,
      dropoffAddressId: dropoffAddressId,
      pickupLocationId: pickupLocationId,
      dropoffLocationId: dropoffLocationId,
      originLat: pickupLat,
      originLng: pickupLng,
      destinationLat: dropoffLat,
      destinationLng: dropoffLng,
      mode: 'ride',
      suggestedPrice: 15.00,
    });
    
    expect(result.success).toBe(true);
    expect(result.rideId).toBeDefined();
    expect(result.newState).toBe(RIDE_STATUS.SEARCHING_DRIVER);
    
    const rideId = result.rideId!;
    
    // 3. Dispatch busca motorista
    const eligible = await RideDispatchService.findEligibleDrivers(
      rideId, pickupLat, pickupLng, 10
    );
    
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible[0].profileId).toBe(driverId);
    
    // 4. Criar oferta
    const { offerId } = await RideDispatchService.createOffer(rideId, driverId, 30);
    expect(offerId).toBeDefined();
    
    // 5. Motorista aceita
    const acceptResult = await RideDispatchService.acceptOffer(offerId, driverId);
    expect(acceptResult.success).toBe(true);
    
    const { data: rideAfterAccept } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterAccept.status).toBe(RIDE_STATUS.DRIVER_ACCEPTED);
    expect(rideAfterAccept.driver_profile_id).toBe(driverId);
    
    // 6. Motorista fica busy
    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatus.status).toBe('busy');
    expect(driverStatus.activeRideId).toBe(rideId);
    
    // 7. Motorista inicia corrida
    const startResult = await RideOperationalService.startRide(rideId, driverId);
    expect(startResult.success).toBe(true);
    
    const { data: rideAfterStart } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterStart.status).toBe(RIDE_STATUS.IN_PROGRESS);
    
    // 8. Tracking durante corrida
    await TrackingService.updatePosition(driverId, newPosition, 'driver');
    
    const driverStatusDuringRide = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatusDuringRide.lastSeenAt).toBeDefined();
    
    // 9. Motorista completa corrida
    const completeResult = await RideOperationalService.completeRide(rideId, driverId);
    expect(completeResult.success).toBe(true);
    
    const { data: rideAfterComplete } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterComplete.status).toBe(RIDE_STATUS.COMPLETED);
    
    // 10. Motorista volta disponível
    const driverStatusAfterComplete = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatusAfterComplete.status).toBe('online');
    expect(driverStatusAfterComplete.isAvailable).toBe(true);
    expect(driverStatusAfterComplete.activeRideId).toBeNull();
  });
});
```

---

## BLOCO D: CRITÉRIO DE FECHAMENTO

**Gate 6 só fecha se provar com evidência:**

1. ✅ Corrida criada pelo fluxo oficial (`RideOperationalService.createRide()`)
2. ✅ Status inicial correto (`requested` → `searching_driver`)
3. ✅ Dispatch encontra motorista disponível real
4. ✅ Oferta criada corretamente (tabela `ride_offers`)
5. ✅ Motorista aceita oferta
6. ✅ Corrida muda para `driver_accepted` (status oficial)
7. ✅ Motorista fica `busy` (Gate 5)
8. ✅ Motorista inicia corrida (`in_progress`)
9. ✅ Tracking funciona durante corrida (Gate 2)
10. ✅ Motorista completa corrida (`completed`)
11. ✅ Motorista volta `available` (Gate 5)
12. ✅ Cancelamento no meio libera motorista (Gate 3)
13. ✅ Múltiplas corridas simultâneas não quebram
14. ✅ Testes operacionais passando (mínimo 6/6)

---

## RESUMO EXECUTIVO

### Correções Aplicadas

1. ✅ **ride_offers:** Migration criada (não existia)
2. ✅ **Statuses:** Usando `RIDE_STATUS` oficial do constants
3. ✅ **Entrypoint:** Usando `RideOperationalService.createRide()` nos testes E2E
4. ✅ **RLS:** Corrigido para usar `profiles.user_id = auth.uid()`

### Implementação Necessária

- Migration: ~80 linhas
- RideDispatchService: ~150 linhas (4 métodos novos)
- Testes: ~400 linhas (6 testes)
- Total: ~630 linhas

**Tempo estimado:** 4-6 horas

**Próximo passo:** Aplicar migration + implementar métodos + executar testes
