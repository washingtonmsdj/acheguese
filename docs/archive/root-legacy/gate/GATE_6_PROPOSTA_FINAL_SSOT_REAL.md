# GATE 6: FLUXO E2E PASSAGEIRO - PROPOSTA FINAL (SSOT REAL)

**Data:** 08/04/2026  
**Status:** PROPOSTA FINAL ALINHADA AO CÓDIGO REAL

---

## DIAGNÓSTICO SSOT REAL

### 1. Caminho Oficial Real do Dispatch em Produção

**Fonte:** `src/modules/mobility/core/RideDispatchService.ts`

**Fluxo oficial:**
```
1. RideOperationalService.createRide()
   └─> Status: requested
   └─> Transição automática: searching_driver
   └─> Trigger do banco dispara dispatch

2. RideDispatchService.findEligibleDrivers()
   └─> Usa DriverAvailabilityService.findAvailableDrivers()
   └─> Retorna motoristas ordenados por distância

3. RideDispatchService.assignDriver()
   └─> Status: driver_assigned
   └─> Atribui driver_profile_id

4. RideDispatchService.acceptRide()
   └─> Status: driver_accepted
   └─> Chama DriverAvailabilityService.setBusy()
```

**Conclusão:** O fluxo oficial NÃO usa ride_offers. Usa atribuição direta + aceite.

---

### 2. Sequência Oficial Real de Estados da Corrida

**Fonte:** `src/modules/mobility/core/RideStateMachine.ts`

**Fluxo completo passageiro:**
```
requested
  ↓
searching_driver
  ↓
driver_assigned      ← Dispatch atribui motorista
  ↓
driver_accepted      ← Motorista aceita
  ↓
driver_arriving      ← Motorista a caminho
  ↓
passenger_boarded    ← Passageiro embarcou
  ↓
in_progress          ← Corrida iniciada
  ↓
completed            ← Corrida completada
```

**Estados intermediários obrigatórios:**
- ✅ `driver_assigned` (não pode pular)
- ✅ `driver_arriving` (não pode pular)
- ✅ `passenger_boarded` (não pode pular)

**Conclusão:** Teste E2E deve passar por TODOS os estados.

---

### 3. Assinatura Real do DriverAvailabilityService

**Fonte:** `src/modules/mobility/services/DriverAvailabilityService.ts`

**Métodos reais:**
```typescript
// Motorista fica online (sem disponibilidade ainda)
static async goOnline(driverProfileId: string): Promise<{ success: boolean; error?: string }>

// Motorista fica disponível (exige coordenadas)
static async setAvailable(
  driverProfileId: string,
  location: { lat: number; lng: number }
): Promise<{ success: boolean; error?: string }>

// Motorista fica ocupado
static async setBusy(
  driverProfileId: string,
  rideId: string,
  rideMode: 'ride' | 'motoboy'
): Promise<{ success: boolean; error?: string }>

// Motorista fica disponível novamente (exige rideId correto)
static async releaseBusy(
  driverProfileId: string,
  rideId: string
): Promise<{ success: boolean; error?: string }>

// Busca status
static async getStatus(driverProfileId: string): Promise<DriverAvailabilityStatus | null>
```

**Status conceituais reais:**
```typescript
type AvailabilityStatus = 'offline' | 'online_warming_up' | 'online_available' | 'busy';
```

**Conclusão:** Usar assinatura real, não versão conceitual.

---

### 4. ride_offers NÃO é usado no fluxo oficial

**Evidência:**
- RideDispatchService usa `assignDriver()` + `acceptRide()`
- Não há criação de ofertas no fluxo oficial
- ride_offers aparece apenas em teste de concorrência (Gate 3)

**Conclusão:** Gate 6 NÃO precisa implementar ride_offers. Usar fluxo oficial real.

---

## PROPOSTA FINAL: 2 SUÍTES SEPARADAS

### SUÍTE A: Dispatch/Assign (Primitives)

**Objetivo:** Validar primitives de dispatch isoladamente

**Arquivo:** `tests/operational/gate6-dispatch-primitives.test.ts`

```typescript
describe('Gate 6 - Suite A: Dispatch Primitives', () => {
  beforeEach(async () => {
    // Limpar dados de teste
    await supabaseAdmin.from('driver_availability').delete().in('profile_id', [driver1Id, driver2Id, driver3Id]);
    await supabaseAdmin.from('ride_requests').delete().eq('passenger_profile_id', passengerId);
  });

  it('A.1. Deve buscar motoristas elegíveis', async () => {
    // Setup: 2 motoristas online+available, 1 offline
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, location1);
    
    await DriverAvailabilityService.goOnline(driver2Id);
    await DriverAvailabilityService.setAvailable(driver2Id, location2);
    
    await DriverAvailabilityService.goOffline(driver3Id);
    
    const eligible = await RideDispatchService.findEligibleDrivers(
      rideId, originLat, originLng, 10, 'ride'
    );
    
    expect(eligible.length).toBe(2);
    expect(eligible[0].profileId).toBe(driver1Id); // Mais próximo
    expect(eligible[0].isAvailable).toBe(true);
    expect(eligible[0].hasActiveRide).toBe(false);
  });
  
  it('A.2. Deve ignorar motoristas busy', async () => {
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, location1);
    await DriverAvailabilityService.setBusy(driver1Id, otherRideId, 'ride');
    
    const eligible = await RideDispatchService.findEligibleDrivers(
      rideId, originLat, originLng, 10, 'ride'
    );
    
    expect(eligible.find(d => d.profileId === driver1Id)).toBeUndefined();
  });
  
  it('A.3. Deve atribuir motorista (driver_assigned)', async () => {
    await DriverAvailabilityService.goOnline(driverId);
    await DriverAvailabilityService.setAvailable(driverId, driverLocation);
    
    // Criar corrida em searching_driver
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        origin_lat: pickupLat,
        origin_lng: pickupLng,
        destination_lat: dropoffLat,
        destination_lng: dropoffLng,
        status: RIDE_STATUS.SEARCHING_DRIVER,
        suggested_price: 15.00,
      })
      .select()
      .single();
    
    const result = await RideDispatchService.assignDriver(
      ride.id,
      driverId,
      RIDE_STATUS.SEARCHING_DRIVER
    );
    
    expect(result.success).toBe(true);
    
    const { data: rideAfter } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', ride.id)
      .single();
    
    expect(rideAfter.status).toBe(RIDE_STATUS.DRIVER_ASSIGNED);
    expect(rideAfter.driver_profile_id).toBe(driverId);
  });
  
  it('A.4. Motorista deve aceitar corrida (driver_accepted)', async () => {
    await DriverAvailabilityService.goOnline(driverId);
    await DriverAvailabilityService.setAvailable(driverId, driverLocation);
    
    // Criar corrida em driver_assigned
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        driver_profile_id: driverId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        origin_lat: pickupLat,
        origin_lng: pickupLng,
        destination_lat: dropoffLat,
        destination_lng: dropoffLng,
        status: RIDE_STATUS.DRIVER_ASSIGNED,
        suggested_price: 15.00,
        ride_mode: 'ride',
      })
      .select()
      .single();
    
    const result = await RideDispatchService.acceptRide(ride.id, driverId);
    
    expect(result.success).toBe(true);
    
    const { data: rideAfter } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', ride.id)
      .single();
    
    expect(rideAfter.status).toBe(RIDE_STATUS.DRIVER_ACCEPTED);
    
    // Motorista deve estar busy
    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatus.status).toBe('busy');
    expect(driverStatus.activeRideId).toBe(ride.id);
  });
  
  it('A.5. Aceitar corrida deve deixar motorista busy', async () => {
    await DriverAvailabilityService.goOnline(driverId);
    await DriverAvailabilityService.setAvailable(driverId, driverLocation);
    
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        driver_profile_id: driverId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        origin_lat: pickupLat,
        origin_lng: pickupLng,
        destination_lat: dropoffLat,
        destination_lng: dropoffLng,
        status: RIDE_STATUS.DRIVER_ASSIGNED,
        suggested_price: 15.00,
        ride_mode: 'ride',
      })
      .select()
      .single();
    
    await RideDispatchService.acceptRide(ride.id, driverId);
    
    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    
    expect(driverStatus.status).toBe('busy');
    expect(driverStatus.isOnline).toBe(true);
    expect(driverStatus.isAvailable).toBe(false);
    expect(driverStatus.activeRideId).toBe(ride.id);
    expect(driverStatus.activeRideMode).toBe('ride');
  });
});
```

---

### SUÍTE B: E2E Principal do Passageiro (Fluxo Oficial Real)

**Objetivo:** Validar fluxo completo usando entrypoint oficial e dispatch oficial

**Arquivo:** `tests/operational/gate6-e2e-passenger.test.ts`

```typescript
describe('Gate 6 - Suite B: E2E Passageiro (Fluxo Oficial)', () => {
  beforeEach(async () => {
    // Limpar dados de teste
    await supabaseAdmin.from('driver_availability').delete().in('profile_id', [driverId]);
    await supabaseAdmin.from('ride_requests').delete().eq('passenger_profile_id', passengerId);
  });

  it('B.1. Fluxo completo: criar → dispatch → aceitar → estados intermediários → completar', async () => {
    // ============================================
    // ETAPA 1: Motorista fica online e disponível
    // ============================================
    
    const goOnlineResult = await DriverAvailabilityService.goOnline(driverId);
    expect(goOnlineResult.success).toBe(true);
    
    const setAvailableResult = await DriverAvailabilityService.setAvailable(
      driverId,
      { lat: driverLat, lng: driverLng }
    );
    expect(setAvailableResult.success).toBe(true);
    
    const driverStatusBefore = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatusBefore.status).toBe('online_available');
    expect(driverStatusBefore.isOnline).toBe(true);
    expect(driverStatusBefore.isAvailable).toBe(true);
    
    // ============================================
    // ETAPA 2: Passageiro solicita corrida (ENTRYPOINT OFICIAL)
    // ============================================
    
    const createResult = await RideOperationalService.createRide({
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
    
    expect(createResult.success).toBe(true);
    expect(createResult.rideId).toBeDefined();
    expect(createResult.newState).toBe(RIDE_STATUS.SEARCHING_DRIVER);
    
    const rideId = createResult.rideId!;
    
    // ============================================
    // ETAPA 3: Dispatch busca motorista (FLUXO OFICIAL)
    // ============================================
    
    const eligible = await RideDispatchService.findEligibleDrivers(
      rideId,
      pickupLat,
      pickupLng,
      10,
      'ride'
    );
    
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible[0].profileId).toBe(driverId);
    expect(eligible[0].isAvailable).toBe(true);
    
    // ============================================
    // ETAPA 4: Dispatch atribui motorista (FLUXO OFICIAL)
    // ============================================
    
    const assignResult = await RideDispatchService.assignDriver(
      rideId,
      driverId,
      RIDE_STATUS.SEARCHING_DRIVER
    );
    
    expect(assignResult.success).toBe(true);
    
    const { data: rideAfterAssign } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterAssign.status).toBe(RIDE_STATUS.DRIVER_ASSIGNED);
    expect(rideAfterAssign.driver_profile_id).toBe(driverId);
    
    // ============================================
    // ETAPA 5: Motorista aceita (FLUXO OFICIAL)
    // ============================================
    
    const acceptResult = await RideDispatchService.acceptRide(rideId, driverId);
    
    expect(acceptResult.success).toBe(true);
    
    const { data: rideAfterAccept } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterAccept.status).toBe(RIDE_STATUS.DRIVER_ACCEPTED);
    
    // Motorista deve estar busy
    const driverStatusBusy = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatusBusy.status).toBe('busy');
    expect(driverStatusBusy.isOnline).toBe(true);
    expect(driverStatusBusy.isAvailable).toBe(false);
    expect(driverStatusBusy.activeRideId).toBe(rideId);
    expect(driverStatusBusy.activeRideMode).toBe('ride');
    
    // ============================================
    // ETAPA 6: Motorista a caminho (driver_arriving)
    // ============================================
    
    const arrivingResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId
    );
    
    expect(arrivingResult.success).toBe(true);
    
    const { data: rideArriving } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideArriving.status).toBe(RIDE_STATUS.DRIVER_ARRIVING);
    
    // ============================================
    // ETAPA 7: Passageiro embarca (passenger_boarded)
    // ============================================
    
    const boardedResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId
    );
    
    expect(boardedResult.success).toBe(true);
    
    const { data: rideBoarded } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideBoarded.status).toBe(RIDE_STATUS.PASSENGER_BOARDED);
    
    // ============================================
    // ETAPA 8: Corrida inicia (in_progress)
    // ============================================
    
    const startResult = await RideOperationalService.startRide(rideId, driverId);
    
    expect(startResult.success).toBe(true);
    
    const { data: rideInProgress } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideInProgress.status).toBe(RIDE_STATUS.IN_PROGRESS);
    
    // ============================================
    // ETAPA 9: Tracking durante corrida
    // ============================================
    
    await TrackingService.updatePosition(
      driverId,
      { lat: newLat, lng: newLng, heading: 90, speed: 30 },
      'driver'
    );
    
    const driverStatusDuringRide = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatusDuringRide.lastSeenAt).toBeDefined();
    expect(driverStatusDuringRide.status).toBe('busy');
    
    // ============================================
    // ETAPA 10: Corrida completa
    // ============================================
    
    const completeResult = await RideOperationalService.completeRide(rideId, driverId);
    
    expect(completeResult.success).toBe(true);
    
    const { data: rideCompleted } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideCompleted.status).toBe(RIDE_STATUS.COMPLETED);
    
    // ============================================
    // ETAPA 11: Motorista volta disponível
    // ============================================
    
    const driverStatusAfter = await DriverAvailabilityService.getStatus(driverId);
    
    expect(driverStatusAfter.status).toBe('online_available');
    expect(driverStatusAfter.isOnline).toBe(true);
    expect(driverStatusAfter.isAvailable).toBe(true);
    expect(driverStatusAfter.activeRideId).toBeNull();
    expect(driverStatusAfter.busySince).toBeNull();
    expect(driverStatusAfter.activeRideMode).toBeNull();
  });
});
```

---

## CRITÉRIO DE FECHAMENTO DO GATE 6

**Gate 6 só fecha se provar com evidência:**

1. ✅ Corrida criada pelo entrypoint oficial (`RideOperationalService.createRide()`)
2. ✅ Status inicial correto (`requested` → `searching_driver`)
3. ✅ Dispatch oficial encontra motorista disponível real
4. ✅ Dispatch oficial atribui motorista (`driver_assigned`)
5. ✅ Motorista aceita pelo fluxo oficial (`driver_accepted`)
6. ✅ Motorista fica `busy` com `activeRideId` correto (Gate 5)
7. ✅ Estados intermediários respeitados (`driver_arriving`, `passenger_boarded`)
8. ✅ Corrida inicia (`in_progress`)
9. ✅ Tracking funciona durante corrida (Gate 2)
10. ✅ Corrida completa (`completed`)
11. ✅ Motorista volta `online_available` (Gate 5)
12. ✅ Cancelamento no meio libera motorista (Gate 3)
13. ✅ Testes operacionais passando (mínimo 6/6)

---

## RESUMO EXECUTIVO

### Correções Finais Aplicadas

1. ✅ **ride_offers:** NÃO implementar (não é usado no fluxo oficial)
2. ✅ **Dispatch:** Usar `assignDriver()` + `acceptRide()` (fluxo oficial real)
3. ✅ **Estados:** Passar por TODOS os intermediários (não pular)
4. ✅ **DriverAvailabilityService:** Usar assinatura real (`goOnline()` + `setAvailable()`)
5. ✅ **Status:** Usar `online_available`, `busy`, `online_warming_up` (SSOT Gate 5)
6. ✅ **E2E:** Usar entrypoint oficial + dispatch oficial (não montar à mão)

### Implementação Necessária

- Migration: ❌ NÃO NECESSÁRIA (ride_offers não é usado)
- RideDispatchService: ✅ JÁ EXISTE (apenas validar)
- RideOperationalService: ✅ JÁ EXISTE (apenas validar)
- Testes: ~600 linhas (5 testes primitives + 1 teste E2E)
- Total: ~600 linhas

**Tempo estimado:** 3-4 horas

**Próximo passo:** Implementar testes operacionais e executar validação
