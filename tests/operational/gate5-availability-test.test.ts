/**
 * GATE 5: TESTES OPERACIONAIS - DISPONIBILIDADE DO MOTORISTA
 * 
 * Valida:
 * - Transições de estado
 * - Integração com corrida
 * - Integração com dispatch
 * - Stale detection
 * - Tracking integration
 * - Reconexão
 * - Validação de corrida correta
 */

import { it, expect, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DriverAvailabilityService } from '@/core/mobility/services/DriverAvailabilityService';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { createOperationalAdminClient, describeOperational } from '../helpers/operational-env';

let supabaseAdmin: SupabaseClient;

function describeGate5(name: string, suite: Parameters<typeof describeOperational>[2]) {
  return describeOperational(name, { requireServiceRole: true }, suite);
}

// ============================================
// TEST SETUP
// ============================================

// Profiles privados e tecnicos, alinhados ao registry Gate 6.
const TEST_DRIVER_ID = 'b2b405cb-bf9c-405b-ad68-759de702dfb0';
const TEST_DRIVER_2_ID = 'e114b313-3d76-452b-8dca-3bb8079ca59e';
const TEST_DRIVER_3_ID = 'a1f45031-5fee-4f16-85c0-8d73356fc830';
const TEST_RIDE_ID = '00000000-0000-0000-0000-000000000101';
const TEST_RIDE_2_ID = '00000000-0000-0000-0000-000000000102';

const TEST_LOCATION = { lat: -23.5505, lng: -46.6333 }; // São Paulo

async function setupTestProfiles() {
  // Perfis existem no ambiente remoto; este setup garante capacidades operacionais
  // sem depender de estado residual de execucoes anteriores.
  const driverRows = [TEST_DRIVER_ID, TEST_DRIVER_2_ID, TEST_DRIVER_3_ID].map((profileId) => ({
    profile_id: profileId,
    is_verified: true,
    subscription_active: true,
    can_do_delivery: true,
    can_do_rides: true,
    rating: 5,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin
    .from('driver_data')
    .upsert(driverRows, { onConflict: 'profile_id' });

  if (error) throw error;

  await authenticateAsProfile(TEST_DRIVER_ID);
}

async function cleanupTestData() {
  await supabaseAdmin.from('driver_availability').delete().in('profile_id', [
    TEST_DRIVER_ID,
    TEST_DRIVER_2_ID,
    TEST_DRIVER_3_ID,
  ]);

  await supabaseAdmin
    .from('ride_requests')
    .update({
      status: 'pending',
      driver_profile_id: null,
      updated_at: new Date().toISOString(),
    })
    .in('id', [TEST_RIDE_ID, TEST_RIDE_2_ID]);
}

async function markRideFinalForRelease(rideId: string, driverProfileId = TEST_DRIVER_ID) {
  const { error } = await supabaseAdmin
    .from('ride_requests')
    .update({
      status: 'completed',
      driver_profile_id: driverProfileId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rideId);

  if (error) throw error;
}

async function markDriverBusyFixture(
  rideId: string,
  rideMode: 'ride' | 'motoboy' = 'ride',
  driverProfileId = TEST_DRIVER_ID,
) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from('driver_availability')
    .upsert({
      profile_id: driverProfileId,
      is_online: true,
      is_available: false,
      active_ride_id: rideId,
      busy_since: now,
      active_ride_mode: rideMode,
      current_lat: TEST_LOCATION.lat,
      current_lng: TEST_LOCATION.lng,
      last_location_update: now,
      last_seen_at: now,
      updated_at: now,
    }, { onConflict: 'profile_id' });

  if (error) throw error;
}

beforeEach(async () => {
  supabaseAdmin = createOperationalAdminClient();
  await setupTestProfiles();
  await cleanupTestData();
});

afterEach(async () => {
  await cleanupTestData();
  await signOut();
});

// ============================================
// SUITE 1: TRANSIÇÕES DE ESTADO
// ============================================

describeGate5('Gate 5 - Suite 1: Transições de Estado', () => {
  it('1.1. offline → online_warming_up', async () => {
    const result = await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    expect(result.success).toBe(true);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status).toBeDefined();
    expect(status!.status).toBe('online_warming_up');
    expect(status!.isOnline).toBe(true);
    expect(status!.isAvailable).toBe(false);
    expect(status!.activeRideId).toBeUndefined();
  });

  it('1.2. online_warming_up → online_available', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    
    const result = await DriverAvailabilityService.setAvailable(
      TEST_DRIVER_ID,
      TEST_LOCATION
    );
    expect(result.success).toBe(true);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.status).toBe('online_available');
    expect(status!.isAvailable).toBe(true);
    expect(status!.currentLocation).toBeDefined();
    expect(status!.currentLocation!.lat).toBe(TEST_LOCATION.lat);
    expect(status!.currentLocation!.lng).toBe(TEST_LOCATION.lng);
  });

  it('1.3. busy state is projected from server-owned ride assignment', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride');

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.status).toBe('busy');
    expect(status!.isAvailable).toBe(false);
    expect(status!.activeRideId).toBe(TEST_RIDE_ID);
    expect(status!.activeRideMode).toBe('ride');
    expect(status!.busySince).toBeDefined();
  });

  it('1.4. busy → online_available', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);
    await markRideFinalForRelease(TEST_RIDE_ID);
    
    const result = await DriverAvailabilityService.releaseBusy(
      TEST_DRIVER_ID,
      TEST_RIDE_ID
    );
    expect(result.success).toBe(true);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.status).toBe('online_available');
    expect(status!.isAvailable).toBe(true);
    expect(status!.activeRideId).toBeUndefined();
    expect(status!.busySince).toBeUndefined();
    expect(status!.activeRideMode).toBeUndefined();
  });

  it('1.5. Bloquear setAvailable sem coordenadas', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    
    const result = await DriverAvailabilityService.setAvailable(
      TEST_DRIVER_ID,
      null as unknown as typeof TEST_LOCATION
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Location is required');
  });

  it('1.6. pauseAvailable changes canonical dispatch availability', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);

    const result = await DriverAvailabilityService.pauseAvailable(TEST_DRIVER_ID);
    expect(result.success).toBe(true);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.status).toBe('online_warming_up');
    expect(status!.isAvailable).toBe(false);
    expect(status!.activeRideId).toBeUndefined();
  });

  it('1.7. Bloquear releaseBusy com rideId errado', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);
    await Promise.all([
      markRideFinalForRelease(TEST_RIDE_ID),
      markRideFinalForRelease(TEST_RIDE_2_ID),
    ]);
    
    const result = await DriverAvailabilityService.releaseBusy(
      TEST_DRIVER_ID,
      TEST_RIDE_2_ID // rideId errado
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('specified ride');

    // Verificar que active_ride_id foi preservado
    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.activeRideId).toBe(TEST_RIDE_ID);
  });

  it('1.8. Bloquear goOffline com corrida ativa', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);
    
    const result = await DriverAvailabilityService.goOffline(TEST_DRIVER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot go offline with active ride');
  });
});

// ============================================
// SUITE 2: INTEGRAÇÃO COM DISPATCH
// ============================================

describeGate5('Gate 5 - Suite 2: Integração com Dispatch', () => {
  it('2.1. findAvailableDrivers retorna apenas disponíveis', async () => {
    // Driver 1: available
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);

    // Drivers externos ao ator autenticado entram por fixture administrativa.
    const { error: fixtureError } = await supabaseAdmin.from('driver_availability').upsert([
      {
        profile_id: TEST_DRIVER_2_ID,
        is_online: true,
        is_available: false,
        active_ride_id: TEST_RIDE_ID,
        busy_since: new Date().toISOString(),
        active_ride_mode: 'ride',
        current_lat: TEST_LOCATION.lat,
        current_lng: TEST_LOCATION.lng,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        profile_id: TEST_DRIVER_3_ID,
        is_online: false,
        is_available: false,
        active_ride_id: null,
        busy_since: null,
        active_ride_mode: null,
        current_lat: TEST_LOCATION.lat,
        current_lng: TEST_LOCATION.lng,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ], { onConflict: 'profile_id' });
    if (fixtureError) throw fixtureError;

    const available = await DriverAvailabilityService.findAvailableDrivers(
      TEST_LOCATION.lat,
      TEST_LOCATION.lng,
      10 // 10km radius
    );

    expect(available.length).toBe(1);
    expect(available[0].profileId).toBe(TEST_DRIVER_ID);
  });

  it('2.2. findAvailableDrivers ignora offline', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.goOffline(TEST_DRIVER_ID);

    const available = await DriverAvailabilityService.findAvailableDrivers(
      TEST_LOCATION.lat,
      TEST_LOCATION.lng,
      10
    );

    expect(available.find(d => d.profileId === TEST_DRIVER_ID)).toBeUndefined();
  });

  it('2.3. findAvailableDrivers ignora busy', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);

    const available = await DriverAvailabilityService.findAvailableDrivers(
      TEST_LOCATION.lat,
      TEST_LOCATION.lng,
      10
    );

    expect(available.find(d => d.profileId === TEST_DRIVER_ID)).toBeUndefined();
  });

  it('2.4. findAvailableDrivers ignora sem coordenadas', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    // Não chamar setAvailable (sem coordenadas)

    const available = await DriverAvailabilityService.findAvailableDrivers(
      TEST_LOCATION.lat,
      TEST_LOCATION.lng,
      10
    );

    expect(available.find(d => d.profileId === TEST_DRIVER_ID)).toBeUndefined();
  });

  it('2.5. findAvailableDrivers ignora active_ride_id não nulo', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);

    const available = await DriverAvailabilityService.findAvailableDrivers(
      TEST_LOCATION.lat,
      TEST_LOCATION.lng,
      10
    );

    expect(available.find(d => d.profileId === TEST_DRIVER_ID)).toBeUndefined();
  });
});

// ============================================
// SUITE 3: STALE DETECTION
// ============================================

describeGate5('Gate 5 - Suite 3: Stale Detection', () => {
  it('3.1. Motorista DISPONÍVEL stale deve ser marcado offline', async () => {
    // Criar estado inicial diretamente no banco (sem usar service que atualiza last_seen_at)
    const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    
    const { error: insertErr } = await supabaseAdmin
      .from('driver_availability')
      .upsert({
        profile_id: TEST_DRIVER_ID,
        is_online: true,
        is_available: true,
        current_lat: TEST_LOCATION.lat,
        current_lng: TEST_LOCATION.lng,
        last_location_update: oldTimestamp,
        last_seen_at: oldTimestamp, // 6 minutos atrás
        updated_at: oldTimestamp,
        active_ride_id: null,
        busy_since: null,
        active_ride_mode: null,
      });

    if (insertErr) throw insertErr;

    // Aguardar persistência e verificar
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se o timestamp antigo persistiu
    const { data: check } = await supabaseAdmin
      .from('driver_availability')
      .select('last_seen_at')
      .eq('profile_id', TEST_DRIVER_ID)
      .single();
    
    console.log('🔍 [TEST] last_seen_at após upsert:', check?.last_seen_at);
    console.log('🔍 [TEST] oldTimestamp:', oldTimestamp);

    const result = await DriverAvailabilityService.markStaleDrivers(5);

    expect(result.markedOffline).toBeGreaterThan(0);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.status).toBe('offline');
    expect(status!.isOnline).toBe(false);
  });

  it('3.2. Motorista BUSY stale NÃO deve ser liberado', async () => {
    // Criar estado inicial diretamente no banco (busy com last_seen antigo)
    const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    
    const { error: insertErr } = await supabaseAdmin
      .from('driver_availability')
      .upsert({
        profile_id: TEST_DRIVER_ID,
        is_online: true,
        is_available: false,
        current_lat: TEST_LOCATION.lat,
        current_lng: TEST_LOCATION.lng,
        last_location_update: oldTimestamp,
        last_seen_at: oldTimestamp, // 6 minutos atrás
        updated_at: oldTimestamp,
        active_ride_id: TEST_RIDE_ID,
        busy_since: oldTimestamp,
        active_ride_mode: 'ride',
      });

    if (insertErr) throw insertErr;

    // Aguardar persistência e verificar
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se o timestamp antigo persistiu
    const { data: check } = await supabaseAdmin
      .from('driver_availability')
      .select('last_seen_at')
      .eq('profile_id', TEST_DRIVER_ID)
      .single();
    
    console.log('🔍 [TEST] last_seen_at após upsert:', check?.last_seen_at);
    console.log('🔍 [TEST] oldTimestamp:', oldTimestamp);

    const result = await DriverAvailabilityService.markStaleDrivers(5);

    expect(result.staleBusy).toBeGreaterThan(0);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.status).toBe('busy'); // Ainda busy
    expect(status!.activeRideId).toBe(TEST_RIDE_ID); // Corrida preservada
    expect(status!.isOnline).toBe(true); // Ainda online
  });

  it('3.3. Motorista ativo não deve ser marcado stale', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await DriverAvailabilityService.markLastSeen(TEST_DRIVER_ID);

    const result = await DriverAvailabilityService.markStaleDrivers(5);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.status).toBe('online_available');
    expect(status!.isOnline).toBe(true);
  });
});

// ============================================
// SUITE 4: TRACKING INTEGRATION
// ============================================

describeGate5('Gate 5 - Suite 4: Tracking Integration', () => {
  it('4.1. markLastSeen atualiza last_seen_at', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);

    const before = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);

    await new Promise(resolve => setTimeout(resolve, 1000));

    await DriverAvailabilityService.markLastSeen(TEST_DRIVER_ID);

    const after = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);

    expect(new Date(after!.lastSeenAt!).getTime()).toBeGreaterThan(
      new Date(before!.lastSeenAt!).getTime()
    );
  });

  it('4.2. markLastSeen não muda is_online', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);

    await DriverAvailabilityService.markLastSeen(TEST_DRIVER_ID);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.isOnline).toBe(true);
    expect(status!.isAvailable).toBe(true);
  });

  it('4.3. markLastSeen não muda active_ride_id', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);

    await DriverAvailabilityService.markLastSeen(TEST_DRIVER_ID);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.activeRideId).toBe(TEST_RIDE_ID);
  });
});

// ============================================
// SUITE 5: VALIDAÇÃO DE CORRIDA CORRETA
// ============================================

describeGate5('Gate 5 - Suite 5: Validação de Corrida Correta', () => {
  it('5.1. releaseBusy com rideId correto deve suceder', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);
    await markRideFinalForRelease(TEST_RIDE_ID);

    const result = await DriverAvailabilityService.releaseBusy(
      TEST_DRIVER_ID,
      TEST_RIDE_ID
    );

    expect(result.success).toBe(true);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.activeRideId).toBeUndefined();
    expect(status!.isAvailable).toBe(true);
  });

  it('5.2. active_ride_id não fica preso após release', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);
    await markRideFinalForRelease(TEST_RIDE_ID);
    await DriverAvailabilityService.releaseBusy(TEST_DRIVER_ID, TEST_RIDE_ID);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.activeRideId).toBeUndefined();
    expect(status!.busySince).toBeUndefined();
    expect(status!.activeRideMode).toBeUndefined();
  });

  it('5.3. Múltiplas corridas sequenciais não deixam active_ride_id preso', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);

    // Corrida 1
    await markDriverBusyFixture(TEST_RIDE_ID, 'ride', TEST_DRIVER_ID);
    await markRideFinalForRelease(TEST_RIDE_ID);
    await DriverAvailabilityService.releaseBusy(TEST_DRIVER_ID, TEST_RIDE_ID);

    // Corrida 2
    await markDriverBusyFixture(TEST_RIDE_2_ID, 'ride', TEST_DRIVER_ID);
    await markRideFinalForRelease(TEST_RIDE_2_ID);
    await DriverAvailabilityService.releaseBusy(TEST_DRIVER_ID, TEST_RIDE_2_ID);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.activeRideId).toBeUndefined();
    expect(status!.isAvailable).toBe(true);
  });
});

// ============================================
// SUITE 6: BOOTSTRAP AUTOMÁTICO
// ============================================

describeGate5('Gate 5 - Suite 6: Bootstrap Automático', () => {
  it('6.1. goOnline cria registro se não existir', async () => {
    // Garantir que não existe
    await supabaseAdmin
      .from('driver_availability')
      .delete()
      .eq('profile_id', TEST_DRIVER_ID);

    const result = await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    expect(result.success).toBe(true);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status).toBeDefined();
    expect(status!.isOnline).toBe(true);
  });

  it('6.2. goOnline atualiza registro se já existir', async () => {
    // Criar registro offline
    await supabaseAdmin.from('driver_availability').insert({
      profile_id: TEST_DRIVER_ID,
      is_online: false,
      is_available: false,
    });

    const result = await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    expect(result.success).toBe(true);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.isOnline).toBe(true);
  });
});

// ============================================
// SUITE 7: MOTOBOY MODE
// ============================================

describeGate5('Gate 5 - Suite 7: Motoboy Mode', () => {
  it('7.1. server-owned busy fixture preserves motoboy mode', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'motoboy', TEST_DRIVER_ID);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.activeRideMode).toBe('motoboy');
  });

  it('7.2. releaseBusy limpa active_ride_mode', async () => {
    await DriverAvailabilityService.goOnline(TEST_DRIVER_ID);
    await DriverAvailabilityService.setAvailable(TEST_DRIVER_ID, TEST_LOCATION);
    await markDriverBusyFixture(TEST_RIDE_ID, 'motoboy', TEST_DRIVER_ID);
    await markRideFinalForRelease(TEST_RIDE_ID);

    await DriverAvailabilityService.releaseBusy(TEST_DRIVER_ID, TEST_RIDE_ID);

    const status = await DriverAvailabilityService.getStatus(TEST_DRIVER_ID);
    expect(status!.activeRideMode).toBeUndefined();
  });
});
