/**
 * GATE 7 - PIN VERIFICATION: ENTREGA (MOTOBOY)
 * 
 * Valida verificação operacional por PIN no runtime real:
 * - Entrega sem PIN exigido conclui normalmente
 * - Entrega com PIN exigido bloqueia confirmação sem PIN
 * - Entrega com PIN correto conclui e persiste prova
 * - Entrega com PIN inválido falha e audita
 * 
 * Este teste CONTA para fechamento do Gate 7.
 * 
 * ISOLAMENTO: Usa fixtures distintos do Gate 6 (passengerC, driverC)
 */

import { it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/core/mobility/core/RideDispatchService';
import { OperationalVerificationService } from '@/core/mobility/services/OperationalVerificationService';
import { RIDE_STATUS } from '@/core/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { 
  waitForRideStatus, 
  getRideAuditTrail,
} from '../helpers/gate6-polling-helpers';
import { 
  setupDriverAvailable,
  cleanupMultipleDrivers,
} from '../helpers/gate6-setup-helpers';
import {
  safeCleanupRides,
  safeCleanupVerifications,
} from '../helpers/test-cleanup-helpers';
import { createOperationalAdminClient, describeOperational } from '../helpers/operational-env';

// Carregar fixtures
const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

// Service role client para validações
let supabaseAdmin: SupabaseClient;

describeOperational('Gate 7 - PIN Verification: Entrega', {
  requireServiceRole: true,
}, () => {
  // ISOLAMENTO: Usar fixtures DISTINTOS do Gate 6
  // Gate 6 usa: passengerB, driverB
  // Gate 7 delivery tenta passengerC/driverC, mas faz fallback para perfis válidos.
  const requesterId = fixtures.passengers.passengerC?.id || fixtures.passengers.passengerB.id;
  const driverCandidates = [
    fixtures.drivers.driverC,
    fixtures.drivers.driverB,
    fixtures.drivers.driverA,
  ].filter(Boolean) as Array<{ id: string; lat: number; lng: number }>;

  let driverId = fixtures.drivers.driverB.id;
  let driverLat = fixtures.drivers.driverB.lat;
  let driverLng = fixtures.drivers.driverB.lng;
  
  // Rastrear rides criadas para cleanup seguro
  const createdRideIds: string[] = [];
  
  // Coordenadas
  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;
  
  // IDs de endereços
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;

  beforeAll(async () => {
    supabaseAdmin = createOperationalAdminClient();

    for (const candidate of driverCandidates) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, profile_type')
        .eq('id', candidate.id)
        .maybeSingle();

      if (!profile || profile.profile_type !== 'driver') {
        continue;
      }

      const { data: driverData } = await supabaseAdmin
        .from('driver_data')
        .select('can_do_delivery')
        .eq('profile_id', candidate.id)
        .maybeSingle();

      if (driverData?.can_do_delivery === false) {
        continue;
      }

      driverId = candidate.id;
      driverLat = candidate.lat;
      driverLng = candidate.lng;
      break;
    }
  });

  beforeEach(async () => {
    // Limpar array de rides criadas
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
      .eq('passenger_profile_id', requesterId);

    const staleRideIds = (staleRides ?? []).map((ride) => ride.id);
    if (staleRideIds.length > 0) {
      await safeCleanupRides(staleRideIds, 20000);
      await safeCleanupVerifications(staleRideIds);
    }

    await supabaseAdmin.from('driver_availability').delete().eq('profile_id', driverId);
  });
  
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

    // BARREIRA DE QUIESCÊNCIA: Aguardar rides chegarem em estado terminal
    if (createdRideIds.length > 0) {
      console.log('⏳ Aguardando quiescência de', createdRideIds.length, 'rides...');
      await safeCleanupRides(createdRideIds, 15000);
      await safeCleanupVerifications(createdRideIds);
    }
    
    await cleanupMultipleDrivers([driverId]);
    await signOut();
  });

  it('D.1. Entrega sem PIN exigido conclui normalmente', async () => {
    // ============================================
    // SETUP: Motoboy disponível
    // ============================================
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    console.log('✅ Motoboy disponível');
    
    // ============================================
    // ETAPA 1: Criar entrega SEM exigir PIN
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
      recipientName: 'João Silva',
      recipientPhone: '11999999999',
      packageDescription: 'Documentos',
      packageSize: 'small',
    });
    
    expect(createResult.success).toBe(true);
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    console.log('✅ Entrega criada:', rideId);
    
    // ============================================
    // ETAPA 2: Validar que operational_verifications NÃO foi criado
    // ============================================
    
    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verification).toBeNull();
    
    console.log('✅ Nenhuma verificação criada (correto)');
    
    // ============================================
    // ETAPA 3: Fluxo completo até in_delivery
    // ============================================
    
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    await RideOperationalService.transitionTo(rideId, RIDE_STATUS.DRIVER_ARRIVING, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    await RideOperationalService.confirmPickup(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.PICKUP_CONFIRMED], 5000);
    
    await RideOperationalService.startDelivery(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.IN_DELIVERY], 5000);
    
    // ============================================
    // ETAPA 4: Confirmar entrega SEM PIN
    // ============================================
    
    const proof = {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
      observation: 'Entregue ao porteiro',
    };
    
    const confirmResult = await RideOperationalService.confirmDelivery(
      rideId,
      driverId,
      proof,
      18.50
      // Sem fornecer PIN
    );
    
    expect(confirmResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.COMPLETED], 5000);
    
    console.log('✅ Entrega concluída normalmente (sem PIN)');
    
    // ============================================
    // ETAPA 5: Validar proof_of_delivery
    // ============================================
    
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('proof_of_delivery')
      .eq('id', rideId)
      .single();
    
    expect(ride.proof_of_delivery).toBeDefined();
    expect(ride.proof_of_delivery.photo_url).toBe('https://example.com/proof.jpg');
    
    console.log('✅ Proof of delivery persistido');
  });

  it('D.2. Entrega com PIN exigido bloqueia confirmação sem PIN', async () => {
    // ============================================
    // SETUP: Configurar remetente para exigir PIN
    // ============================================
    
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_deliveries: true })
      .eq('id', requesterId);
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    console.log('✅ Remetente configurado para exigir PIN');
    
    // ============================================
    // ETAPA 1: Criar entrega (verificação criada automaticamente)
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
      recipientName: 'Maria Santos',
      packageDescription: 'Eletrônicos',
      packageSize: 'medium',
    });
    
    expect(createResult.success).toBe(true);
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    console.log('✅ Entrega criada:', rideId);
    
    // ============================================
    // ETAPA 2: Validar que verificação foi criada automaticamente
    // ============================================
    
    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verification).toBeTruthy();
    expect(verification.is_required).toBe(true);
    expect(verification.required_by).toBe('sender');
    expect(verification.status).toBe('pending');
    
    console.log('✅ Verificação criada automaticamente:', verification.id);
    
    // ============================================
    // ETAPA 3: Fluxo completo até in_delivery
    // ============================================
    
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    await RideOperationalService.transitionTo(rideId, RIDE_STATUS.DRIVER_ARRIVING, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    await RideOperationalService.confirmPickup(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.PICKUP_CONFIRMED], 5000);
    
    await RideOperationalService.startDelivery(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.IN_DELIVERY], 5000);
    
    // ============================================
    // ETAPA 4: Tentar confirmar entrega SEM PIN
    // ============================================
    
    const proof = {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
    };
    
    const confirmResult = await RideOperationalService.confirmDelivery(
      rideId,
      driverId,
      proof,
      18.50
      // Sem fornecer PIN
    );
    
    expect(confirmResult.success).toBe(false);
    expect(confirmResult.error).toContain('PIN required');
    
    console.log('✅ Confirmação bloqueada sem PIN:', confirmResult.error);
    
    // ============================================
    // ETAPA 5: Validar que estado não mudou
    // ============================================
    
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(ride.status).toBe(RIDE_STATUS.IN_DELIVERY);
    
    console.log('✅ Estado permaneceu in_delivery (bloqueado)');
  });

  it('D.3. Entrega com PIN correto conclui e persiste prova', async () => {
    // ============================================
    // SETUP: Configurar remetente para exigir PIN
    // ============================================
    
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_deliveries: true })
      .eq('id', requesterId);
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    console.log('✅ Remetente configurado para exigir PIN');
    
    // ============================================
    // ETAPA 1: Criar entrega (verificação criada automaticamente)
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
    // ETAPA 2: Buscar PIN gerado automaticamente
    // ============================================
    
    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('pin_hash')
      .eq('ride_id', rideId)
      .single();
    
    expect(verification).toBeTruthy();
    expect(verification.pin_hash).toBeNull();
    
    const pinResult = await OperationalVerificationService.refreshRequesterPIN(rideId);
    expect(pinResult.success).toBe(true);
    expect(pinResult.data?.pin).toMatch(/^\\d{4}$/);
    const testPIN = pinResult.data!.pin;
    
    console.log('✅ PIN emitido pelo fluxo oficial para o remetente');
    
    // ============================================
    // ETAPA 3: Fluxo completo até in_delivery
    // ============================================
    
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    await RideOperationalService.transitionTo(rideId, RIDE_STATUS.DRIVER_ARRIVING, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    await RideOperationalService.confirmPickup(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.PICKUP_CONFIRMED], 5000);
    
    await RideOperationalService.startDelivery(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.IN_DELIVERY], 5000);
    
    // ============================================
    // ETAPA 4: Confirmar entrega COM PIN CORRETO
    // ============================================
    
    const proof = {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
      observation: 'Entregue ao destinatário',
    };
    
    const confirmResult = await RideOperationalService.confirmDelivery(
      rideId,
      driverId,
      proof,
      18.50,
      testPIN // PIN correto
    );
    
    expect(confirmResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.COMPLETED], 5000);
    
    console.log('✅ Entrega concluída com PIN correto');
    
    // ============================================
    // ETAPA 5: Validar que verificação foi marcada como verified
    // ============================================
    
    const { data: verificationFinal } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verificationFinal.status).toBe('verified');
    expect(verificationFinal.verified_at).toBeTruthy();
    expect(verificationFinal.verified_by).toBe(driverId);
    expect(verificationFinal.verification_attempts).toBe(1);
    
    console.log('✅ Verificação marcada como verified');
    
    // ============================================
    // ETAPA 6: Validar proof_of_delivery
    // ============================================
    
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('proof_of_delivery')
      .eq('id', rideId)
      .single();
    
    expect(ride.proof_of_delivery).toBeDefined();
    expect(ride.proof_of_delivery.photo_url).toBe('https://example.com/proof.jpg');
    expect(ride.proof_of_delivery.code).toBe('1234');
    
    console.log('✅ Proof of delivery persistido com PIN verificado');
  });

  it('D.4. Entrega com PIN inválido falha e audita', async () => {
    // ============================================
    // SETUP: Configurar remetente para exigir PIN
    // ============================================
    
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_deliveries: true })
      .eq('id', requesterId);
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    console.log('✅ Remetente configurado para exigir PIN');
    
    // ============================================
    // ETAPA 1: Criar entrega (verificação criada automaticamente)
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
      recipientName: 'Ana Lima',
      packageDescription: 'Livros',
      packageSize: 'small',
    });
    
    expect(createResult.success).toBe(true);
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    console.log('✅ Entrega criada:', rideId);
    
    // ============================================
    // ETAPA 2: Buscar PIN gerado automaticamente
    // ============================================
    
    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('pin_hash')
      .eq('ride_id', rideId)
      .single();
    
    expect(verification).toBeTruthy();
    expect(verification.pin_hash).toBeNull();
    
    const pinResult = await OperationalVerificationService.refreshRequesterPIN(rideId);
    expect(pinResult.success).toBe(true);
    expect(pinResult.data?.pin).toMatch(/^\\d{4}$/);
    const testPIN = pinResult.data!.pin;
    
    console.log('✅ PIN emitido pelo fluxo oficial para o remetente');
    
    // ============================================
    // ETAPA 3: Fluxo completo até in_delivery
    // ============================================
    
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    await RideOperationalService.transitionTo(rideId, RIDE_STATUS.DRIVER_ARRIVING, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    await RideOperationalService.confirmPickup(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.PICKUP_CONFIRMED], 5000);
    
    await RideOperationalService.startDelivery(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.IN_DELIVERY], 5000);
    
    // ============================================
    // ETAPA 4: Tentar confirmar entrega COM PIN INVÁLIDO
    // ============================================
    
    const proof = {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
    };
    
    const confirmResult = await RideOperationalService.confirmDelivery(
      rideId,
      driverId,
      proof,
      18.50,
      '9999' // PIN inválido
    );
    
    expect(confirmResult.success).toBe(false);
    expect(confirmResult.error).toContain('Invalid PIN');
    
    console.log('✅ Confirmação bloqueada com PIN inválido:', confirmResult.error);
    
    // ============================================
    // ETAPA 5: Validar que tentativas foram incrementadas
    // ============================================
    
    const { data: verificationFinal } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verificationFinal.status).toBe('pending');
    expect(verificationFinal.verification_attempts).toBe(1);
    expect(verificationFinal.last_attempt_at).toBeTruthy();
    
    console.log('✅ Tentativas incrementadas:', verificationFinal.verification_attempts);
    
    // ============================================
    // ETAPA 6: Validar que estado não mudou
    // ============================================
    
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(ride.status).toBe(RIDE_STATUS.IN_DELIVERY);
    
    console.log('✅ Estado permaneceu in_delivery (bloqueado)');
  });
});

