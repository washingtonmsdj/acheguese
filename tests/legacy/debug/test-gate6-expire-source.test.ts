/**
 * DIAGNÓSTICO CIRÚRGICO: Fonte do EXPIRED Precoce
 * 
 * Objetivo: Identificar QUAL mecanismo muda searching_driver → expired
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/modules/mobility/core/RideOperationalService';
import { authenticateAsProfile } from '../helpers/auth-helper';

const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

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

describe('DIAGNÓSTICO: Fonte do EXPIRED', () => {
  it('Deve rastrear QUEM muda o status para expired', async () => {
    const passengerId = fixtures.passengers.passengerA.id;
    const pickupAddressId = fixtures.addressIds.pickup;
    const dropoffAddressId = fixtures.addressIds.dropoff;
    const pickupLocationId = fixtures.locationIds.primary;
    const dropoffLocationId = fixtures.locationIds.primary;
    const pickupLat = fixtures.coords.pickup.lat;
    const pickupLng = fixtures.coords.pickup.lng;
    const dropoffLat = fixtures.coords.dropoff.lat;
    const dropoffLng = fixtures.coords.dropoff.lng;

    // Limpar
    await supabaseAdmin
      .from('ride_requests')
      .delete()
      .eq('passenger_profile_id', passengerId);

    console.log('\n🔍 DIAGNÓSTICO CIRÚRGICO: Fonte do EXPIRED');
    console.log('=' .repeat(80));
    
    // Autenticar
    await authenticateAsProfile(passengerId);
    
    // Criar corrida
    console.log('\n1️⃣ Criando corrida...');
    const startTime = Date.now();
    
    const result = await RideOperationalService.createRide({
      passengerProfileId: passengerId,
      pickupAddressId,
      dropoffAddressId,
      pickupLocationId,
      dropoffLocationId,
      originLat: pickupLat,
      originLng: pickupLng,
      destinationLat: dropoffLat,
      destinationLng: dropoffLng,
      mode: 'ride',
      suggestedPrice: 15.00,
    });
    
    if (!result.success || !result.rideId) {
      throw new Error('createRide() falhou');
    }
    
    const rideId = result.rideId;
    console.log(`   ✅ Corrida criada: ${rideId}`);
    console.log(`   newState retornado: ${result.newState}`);
    
    // Timeline de observação
    const timeline: Array<{time: number, status: string, driver: string | null}> = [];
    
    // Consulta imediata
    console.log('\n2️⃣ Timeline de status:');
    
    for (const delay of [0, 1000, 2000, 3000, 4000, 5000]) {
      await new Promise(resolve => setTimeout(resolve, delay === 0 ? 100 : 1000));
      
      const { data: ride } = await supabaseAdmin
        .from('ride_requests')
        .select('status, driver_profile_id, updated_at')
        .eq('id', rideId)
        .single();
      
      if (ride) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        timeline.push({
          time: elapsed,
          status: ride.status,
          driver: ride.driver_profile_id,
        });
        
        console.log(`   T+${elapsed}s: status="${ride.status}" driver=${ride.driver_profile_id || 'NULL'}`);
      }
    }
    
    // Buscar auditoria
    console.log('\n3️⃣ Auditoria de transições (ride_state_audit):');
    
    const { data: auditRecords, error: auditError } = await supabaseAdmin
      .from('ride_state_audit')
      .select('*')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });
    
    if (auditError) {
      console.log(`   ❌ Erro ao buscar auditoria: ${auditError.message}`);
      console.log(`   Code: ${auditError.code}`);
      console.log(`   Details: ${auditError.details}`);
    } else if (!auditRecords || auditRecords.length === 0) {
      console.log('   ⚠️ Nenhum registro de auditoria encontrado');
    } else {
      auditRecords.forEach((record, i) => {
        console.log(`   ${i + 1}. ${record.from_state} → ${record.to_state}`);
        console.log(`      changed_by: ${record.changed_by}`);
        console.log(`      reason: ${record.reason || 'N/A'}`);
        console.log(`      created_at: ${record.created_at}`);
      });
    }
    
    // Buscar logs de edge functions (se existir tabela)
    console.log('\n4️⃣ Logs de edge functions:');
    console.log('   (Pulando - tabela pode não existir)');
    
    // Buscar cron jobs ativos
    console.log('\n5️⃣ Cron jobs ativos (pg_cron):');
    console.log('   (Pulando - requer função exec_sql)');
    
    // Buscar triggers em ride_requests
    console.log('\n6️⃣ Triggers em ride_requests:');
    console.log('   (Pulando - requer função exec_sql)');
    
    // Análise final
    console.log('\n7️⃣ ANÁLISE:');
    
    const finalStatus = timeline[timeline.length - 1]?.status;
    const statusChanges = new Set(timeline.map(t => t.status)).size;
    
    console.log(`   Status final: ${finalStatus}`);
    console.log(`   Mudanças de status: ${statusChanges - 1}`);
    
    if (finalStatus === 'expired') {
      console.log('\n   🚨 CONFIRMADO: Status mudou para EXPIRED');
      
      const expiredAt = timeline.findIndex(t => t.status === 'expired');
      if (expiredAt >= 0) {
        console.log(`   Tempo até expiração: ~${timeline[expiredAt].time}s`);
      }
      
      if (auditRecords && auditRecords.length > 0) {
        const expiredTransition = auditRecords.find(r => r.to_state === 'expired');
        if (expiredTransition) {
          console.log(`\n   📋 Transição para EXPIRED:`);
          console.log(`      changed_by: ${expiredTransition.changed_by}`);
          console.log(`      reason: ${expiredTransition.reason}`);
          console.log(`      from_state: ${expiredTransition.from_state}`);
        } else {
          console.log('\n   ⚠️ Transição para EXPIRED não encontrada na auditoria!');
          console.log('   Isso indica que a mudança foi feita FORA do RideOperationalService');
        }
      } else {
        console.log('\n   ⚠️ Nenhuma auditoria encontrada!');
        console.log('   Isso indica que a mudança foi feita DIRETAMENTE no banco');
      }
    } else {
      console.log('\n   ✅ Status NÃO mudou para expired (comportamento esperado)');
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Limpar
    await supabaseAdmin.from('ride_requests').delete().eq('id', rideId);
    
    expect(result.success).toBe(true);
  }, 20000); // 20s timeout
});
