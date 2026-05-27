/**
 * GATE 6 MOTOBOY - RUNTIME REAL COM AUTO-DISPATCH
 * 
 * Valida fluxo automático REAL do motoboy no ambiente remoto:
 * - Criar entrega via entrypoint oficial
 * - Auto-dispatch via edge function
 * - Sequência completa de estados
 * - Proof of delivery
 * - Failed delivery metadata
 * - Polling determinístico (sem sleeps cegos)
 * 
 * Este teste CONTA para fechamento da mobilidade 100%.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/modules/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/modules/mobility/core/RideDispatchService';
import { DriverAvailabilityService } from '@/modules/mobility/services/DriverAvailabilityService';
import { RIDE_STATUS } from '@/modules/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { 
  waitForRideStatus, 
  waitForAuditTransition,
  getRideAuditTrail,
  waitForDriverStatus,
  validateNoDriversAvailable,
} from '../helpers/gate6-polling-helpers';
import { 
  setupDriverAvailable,
  cleanupMultipleDrivers,
} from '../helpers/gate6-setup-helpers';
import {
  safeCleanupRides,
  safeCleanupVerifications,
} from '../helpers/test-cleanup-helpers';

// Carregar fixtures
const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

// Service role client para validações
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

describe('Gate 6 Motoboy - Runtime Real', () => {
  // IDs de teste (usar IDs diferentes do passageiro)
  const requesterId = fixtures.passengers.passengerB.id; // Quem solicita a entrega
  const driverId = fixtures.drivers.driverB.id; // Motoboy
  const createdRideIds: string[] = [];
  
  // Coordenadas
  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;
  const driverLat = fixtures.drivers.driverB.lat;
  const driverLng = fixtures.drivers.driverB.lng;
  
  // IDs de endereços
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;
  const operationalTimeoutMs = 90000;

  beforeEach(async () => {
    createdRideIds.length = 0;

    // ISOLAMENTO CRÍTICO: Resetar configurações de PIN PRIMEIRO
    await supabaseAdmin
      .from('profiles')
      .update({ 
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false 
      })
      .in('id', [requesterId, driverId]);
    
    // Aguardar propagação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Limpar rides antigas do solicitante com quiescência
    const { data: staleRides } = await supabaseAdmin
      .from('ride_requests')
      .select('id')
      .in('passenger_profile_id', [requesterId]);

    const staleRideIds = (staleRides ?? []).map((ride) => ride.id);
    if (staleRideIds.length > 0) {
      await safeCleanupRides(staleRideIds, 20000);
      await safeCleanupVerifications(staleRideIds);
    }

    await supabaseAdmin.from('driver_availability').delete().eq('profile_id', driverId);
  }, 30000);
  
  afterEach(async () => {
    // ISOLAMENTO CRÍTICO: Resetar configurações de PIN PRIMEIRO
    await supabaseAdmin
      .from('profiles')
      .update({ 
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false 
      })
      .in('id', [requesterId, driverId]);
    
    // Aguardar propagação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (createdRideIds.length > 0) {
      console.log('⏳ Aguardando quiescência de', createdRideIds.length, 'rides...');
      await safeCleanupRides(createdRideIds, 20000);
      await safeCleanupVerifications(createdRideIds);
    }

    await cleanupMultipleDrivers([driverId]);
    await signOut();
  }, 30000);

  it('M.1. Fluxo completo: criar → coletar → entregar', { timeout: operationalTimeoutMs }, async () => {
    // ============================================
    // SETUP: Motoboy disponível (VALIDADO NO BANCO)
    // ============================================
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    
    if (!setupResult.success) {
      throw new Error(`Setup de motoboy falhou: ${setupResult.error}`);
    }
    
    console.log('✅ Motoboy disponível validado:', setupResult.state);
    
    // ============================================
    // ETAPA 1: Criar entrega via entrypoint oficial
    // ============================================
    
    await authenticateAsProfile(requesterId);
    
    const createResult = await RideOperationalService.createDelivery({
      passengerProfileId: requesterId,
      pickupAddressId,
      dropoffAddressId,
      pickupLocationId,
      dropoffLocationId,
      originLat: pickupLat,
      originLng: pickupLng,
      destinationLat: dropoffLat,
      destinationLng: dropoffLng,
      suggestedPrice: 15.00,
      // Campos específicos de motoboy
      sourceType: 'passenger',
      recipientName: 'João Silva',
      recipientPhone: '11999999999',
      deliveryNotes: 'Entregar na portaria',
      packageDescription: 'Documentos',
      packageSize: 'small',
    });
    
    expect(createResult.success).toBe(true);
    expect(createResult.rideId).toBeDefined();
    
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    console.log('✅ Entrega criada:', rideId);
    
    // Validar ride_mode no banco
    const { data: rideCheck } = await supabaseAdmin
      .from('ride_requests')
      .select('ride_mode, recipient_name, package_description')
      .eq('id', rideId)
      .single();
    
    expect(rideCheck.ride_mode).toBe('motoboy');
    expect(rideCheck.recipient_name).toBe('João Silva');
    expect(rideCheck.package_description).toBe('Documentos');
    
    console.log('✅ ride_mode validado: motoboy');
    
    // ============================================
    // ETAPA 2: Aguardar auto-dispatch (POLLING DETERMINÍSTICO)
    // ============================================
    
    const dispatchResult = await waitForRideStatus(
      rideId,
      [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.DRIVER_ACCEPTED],
      10000
    );
    
    if (!dispatchResult.success) {
      throw new Error(`Auto-dispatch falhou: ${dispatchResult.error}`);
    }
    
    console.log(`✅ Auto-dispatch completou em ${dispatchResult.elapsedMs}ms. Status: ${dispatchResult.currentStatus}`);
    
    // Validar que motoboy foi atribuído
    const { data: rideAfterDispatch } = await supabaseAdmin
      .from('ride_requests')
      .select('driver_profile_id')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterDispatch.driver_profile_id).toBe(driverId);
    
    // ============================================
    // ETAPA 3: Motoboy aceita
    // ============================================
    
    await authenticateAsProfile(driverId);
    
    const acceptResult = await RideDispatchService.acceptRide(rideId, driverId);
    expect(acceptResult.success).toBe(true);
    
    const acceptedResult = await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    expect(acceptedResult.success).toBe(true);
    
    console.log('✅ Motoboy aceitou entrega');
    
    // Validar que motoboy está busy
    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatus).toBeDefined();
    expect(driverStatus!.status).toBe('busy');
    expect(driverStatus!.activeRideId).toBe(rideId);
    
    // ============================================
    // ETAPA 4: Motoboy chega ao local de coleta
    // ============================================
    
    const arrivingResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId,
      'Motoboy a caminho da coleta'
    );
    expect(arrivingResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    console.log('✅ Motoboy a caminho da coleta');
    
    // ============================================
    // ETAPA 5: Motoboy confirma coleta do pacote
    // ============================================
    
    const pickupResult = await RideOperationalService.confirmPickup(rideId, driverId);
    expect(pickupResult.success, pickupResult.error).toBe(true);
    
    const pickupConfirmedResult = await waitForRideStatus(rideId, [RIDE_STATUS.PICKUP_CONFIRMED], 5000);
    expect(pickupConfirmedResult.success).toBe(true);
    
    // Validar pickup_confirmed_at no banco
    const { data: rideAfterPickup } = await supabaseAdmin
      .from('ride_requests')
      .select('pickup_confirmed_at')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterPickup.pickup_confirmed_at).toBeTruthy();
    
    console.log('✅ Coleta confirmada. pickup_confirmed_at:', rideAfterPickup.pickup_confirmed_at);
    
    // ============================================
    // ETAPA 6: Motoboy inicia rota de entrega
    // ============================================
    
    const startDeliveryResult = await RideOperationalService.startDelivery(rideId, driverId);
    expect(startDeliveryResult.success, startDeliveryResult.error).toBe(true);
    
    const inDeliveryResult = await waitForRideStatus(rideId, [RIDE_STATUS.IN_DELIVERY], 5000);
    expect(inDeliveryResult.success).toBe(true);
    
    console.log('✅ Entrega iniciada (in_delivery)');
    
    // Motorista ainda deve estar busy
    const statusDuringDelivery = await DriverAvailabilityService.getStatus(driverId);
    expect(statusDuringDelivery!.status).toBe('busy');
    expect(statusDuringDelivery!.activeRideId).toBe(rideId);
    
    // ============================================
    // ETAPA 7: Motoboy confirma entrega com proof
    // ============================================
    
    const proof = {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
      observation: 'Entregue ao porteiro',
    };
    
    const confirmDeliveryResult = await RideOperationalService.confirmDelivery(
      rideId,
      driverId,
      proof,
      18.50
    );
    expect(confirmDeliveryResult.success, confirmDeliveryResult.error).toBe(true);
    
    // Aguardar DELIVERED → COMPLETED
    const completedResult = await waitForRideStatus(rideId, [RIDE_STATUS.COMPLETED], 5000);
    expect(completedResult.success).toBe(true);
    
    console.log('✅ Entrega completada');
    
    // ============================================
    // ETAPA 8: Validar proof_of_delivery no banco
    // ============================================
    
    const { data: rideAfterDelivery } = await supabaseAdmin
      .from('ride_requests')
      .select('proof_of_delivery, delivered_at, final_price')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterDelivery.proof_of_delivery).toBeDefined();
    expect(rideAfterDelivery.proof_of_delivery.photo_url).toBe('https://example.com/proof.jpg');
    expect(rideAfterDelivery.proof_of_delivery.code).toBe('1234');
    expect(rideAfterDelivery.proof_of_delivery.observation).toBe('Entregue ao porteiro');
    expect(rideAfterDelivery.proof_of_delivery.signed_at).toBeTruthy();
    expect(rideAfterDelivery.delivered_at).toBeTruthy();
    expect(rideAfterDelivery.final_price).toBe(18.50);
    
    console.log('✅ Proof of delivery validado:', rideAfterDelivery.proof_of_delivery);
    
    // ============================================
    // ETAPA 9: Motoboy volta disponível
    // ============================================
    
    const finalStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(finalStatus).toBeDefined();
    expect(finalStatus!.status).toBe('online_available');
    expect(finalStatus!.isAvailable).toBe(true);
    expect(finalStatus!.activeRideId).toBeUndefined();
    
    console.log('✅ Motoboy voltou disponível');
    
    // ============================================
    // VALIDAÇÃO FINAL: Auditoria completa
    // ============================================
    
    const finalAuditTrail = await getRideAuditTrail(rideId);
    
    const expectedStates = [
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'pickup_confirmed',
      'in_delivery',
      'delivered',
      'completed',
    ];
    
    const actualStates = finalAuditTrail.map(t => t.to_state);
    
    expectedStates.forEach(state => {
      expect(actualStates).toContain(state);
    });
    
    console.log('✅ Fluxo completo validado. Timeline:', finalAuditTrail.map(t => 
      `${t.to_state} (${t.changed_by})`
    ).join(' → '));
  });

  it('M.2. Falha na entrega com metadata', { timeout: operationalTimeoutMs }, async () => {
    // Setup motoboy
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    // Criar entrega
    await authenticateAsProfile(requesterId);
    const createResult = await RideOperationalService.createDelivery({
      passengerProfileId: requesterId,
      pickupAddressId,
      dropoffAddressId,
      pickupLocationId,
      dropoffLocationId,
      originLat: pickupLat,
      originLng: pickupLng,
      destinationLat: dropoffLat,
      destinationLng: dropoffLng,
      suggestedPrice: 15.00,
      sourceType: 'passenger',
      recipientName: 'Maria Santos',
      recipientPhone: '11988888888',
      packageDescription: 'Eletrônicos',
      packageSize: 'medium',
    });
    
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    // Aguardar auto-dispatch
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    // Motoboy aceita
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    // Chega ao local
    await RideOperationalService.transitionTo(rideId, RIDE_STATUS.DRIVER_ARRIVING, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    // Confirma coleta
    await RideOperationalService.confirmPickup(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.PICKUP_CONFIRMED], 5000);
    
    // Inicia entrega
    await RideOperationalService.startDelivery(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.IN_DELIVERY], 5000);
    
    console.log('✅ Motoboy em rota de entrega');
    
    // ============================================
    // ETAPA: Falha na entrega com metadata completo
    // ============================================
    
    const failedMetadata = {
      failure_reason: 'recipient_unavailable' as const,
      item_destination: 'return_to_sender' as const,
      item_current_holder: 'driver' as const,
      timestamp: new Date().toISOString(),
      resolution_status: 'pending' as const,
      resolution_notes: 'Destinatário não atendeu após 3 tentativas',
      attempted_delivery_count: 3,
    };
    
    const failResult = await RideOperationalService.failDelivery(
      rideId,
      driverId,
      failedMetadata
    );
    
    expect(failResult.success, failResult.error).toBe(true);
    
    // Aguardar transição para FAILED_DELIVERY
    const failedResult = await waitForRideStatus(rideId, [RIDE_STATUS.FAILED_DELIVERY], 5000);
    expect(failedResult.success).toBe(true);
    
    console.log('✅ Falha registrada: failed_delivery');
    
    // ============================================
    // VALIDAÇÃO: failed_delivery_metadata no banco
    // ============================================
    
    const { data: rideAfterFail } = await supabaseAdmin
      .from('ride_requests')
      .select('failed_delivery_metadata, failed_delivery_at, failed_delivery_reason')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterFail.failed_delivery_metadata).toBeDefined();
    expect(rideAfterFail.failed_delivery_metadata.failure_reason).toBe('recipient_unavailable');
    expect(rideAfterFail.failed_delivery_metadata.item_destination).toBe('return_to_sender');
    expect(rideAfterFail.failed_delivery_metadata.item_current_holder).toBe('driver');
    expect(rideAfterFail.failed_delivery_metadata.resolution_status).toBe('pending');
    expect(rideAfterFail.failed_delivery_metadata.attempted_delivery_count).toBe(3);
    expect(rideAfterFail.failed_delivery_at).toBeTruthy();
    expect(rideAfterFail.failed_delivery_reason).toBe('recipient_unavailable');
    
    console.log('✅ Failed delivery metadata validado:', rideAfterFail.failed_delivery_metadata);
    
    // ============================================
    // VALIDAÇÃO: Auditoria
    // ============================================
    
    const auditTrail = await getRideAuditTrail(rideId);
    
    const failedTransition = auditTrail.find(t => t.to_state === 'failed_delivery');
    expect(failedTransition).toBeDefined();
    expect(failedTransition!.changed_by).toBe(driverId);
    expect(failedTransition!.reason).toBe('recipient_unavailable');
    
    console.log('✅ Auditoria validada:', {
      from: failedTransition!.from_state,
      to: failedTransition!.to_state,
      by: failedTransition!.changed_by,
      reason: failedTransition!.reason,
    });
    
    // ============================================
    // VALIDAÇÃO: Motoboy ainda está busy (item com ele)
    // ============================================
    
    const statusAfterFail = await DriverAvailabilityService.getStatus(driverId);
    expect(statusAfterFail).toBeDefined();
    expect(statusAfterFail!.status).toBe('busy');
    expect(statusAfterFail!.activeRideId).toBe(rideId);
    
    console.log('✅ Motoboy ainda busy (item com ele)');
    
    // Nota: Liberação do motoboy deve acontecer após resolução da falha
    // (retornar item ao remetente, retentar entrega, etc.)
  });

  it('M.3. Expiração sem motoboy disponível', { timeout: operationalTimeoutMs }, async () => {
    // ============================================
    // PRÉ-CONDIÇÃO: Garantir que NÃO há motoboys disponíveis
    // ============================================
    
    // Forçar offline no banco
    await supabaseAdmin
      .from('driver_availability')
      .update({ 
        is_online: false, 
        is_available: false,
        active_ride_id: null,
      })
      .eq('profile_id', driverId);
    
    // Aguardar propagação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Validar pré-condição
    const preCondition = await validateNoDriversAvailable([driverId]);
    
    if (!preCondition.valid) {
      throw new Error(`PRÉ-CONDIÇÃO FALHOU: ${preCondition.error}`);
    }
    
    console.log(`✅ PRÉ-CONDIÇÃO VALIDADA: 0 motoboys disponíveis`);
    
    // ============================================
    // ETAPA: Criar entrega sem motoboys
    // ============================================
    
    await authenticateAsProfile(requesterId);
    
    const createResult = await RideOperationalService.createDelivery({
      passengerProfileId: requesterId,
      pickupAddressId,
      dropoffAddressId,
      pickupLocationId,
      dropoffLocationId,
      originLat: pickupLat,
      originLng: pickupLng,
      destinationLat: dropoffLat,
      destinationLng: dropoffLng,
      suggestedPrice: 15.00,
      sourceType: 'passenger',
      recipientName: 'Pedro Costa',
      packageDescription: 'Roupas',
      packageSize: 'large',
    });
    
    expect(createResult.success).toBe(true);
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    console.log('✅ Entrega criada:', rideId);
    
    // ============================================
    // ETAPA: Aguardar auto-dispatch EXPIRAR
    // ============================================
    
    const expireResult = await waitForRideStatus(
      rideId,
      [RIDE_STATUS.EXPIRED],
      10000
    );
    
    if (!expireResult.success) {
      throw new Error(`Entrega não expirou: ${expireResult.error}`);
    }
    
    console.log(`✅ Entrega expirou em ${expireResult.elapsedMs}ms`);
    
    // ============================================
    // VALIDAÇÃO: Auditoria do auto-dispatch
    // ============================================
    
    const expiredTransition = await waitForAuditTransition(
      rideId,
      RIDE_STATUS.EXPIRED,
      5000
    );
    
    if (!expiredTransition.success) {
      throw new Error(`Transição para expired não encontrada: ${expiredTransition.error}`);
    }
    
    expect(expiredTransition.transition!.changed_by).toBe('system');
    expect(expiredTransition.transition!.reason).toBe('No eligible drivers found');
    
    console.log('✅ Auditoria validada:', {
      from: expiredTransition.transition!.from_state,
      to: expiredTransition.transition!.to_state,
      by: expiredTransition.transition!.changed_by,
      reason: expiredTransition.transition!.reason,
    });
    
    // ============================================
    // VALIDAÇÃO: Timeline completa
    // ============================================
    
    const auditTrail = await getRideAuditTrail(rideId);
    
    const actualStates = auditTrail.map(t => t.to_state);
    expect(actualStates).toContain('requested');
    expect(actualStates).toContain('searching_driver');
    expect(actualStates).toContain('expired');

    const searchingToExpired = auditTrail.find(
      t => t.from_state === 'searching_driver' && t.to_state === 'expired'
    );
    expect(searchingToExpired).toBeDefined();
    expect(searchingToExpired!.changed_by).toBe('system');
    expect(searchingToExpired!.reason).toBe('No eligible drivers found');
    
    console.log('✅ Timeline validada:', auditTrail.map(t => 
      `${t.from_state} → ${t.to_state} (${t.changed_by})`
    ).join(' | '));
  });
});


