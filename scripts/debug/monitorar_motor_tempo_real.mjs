#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('👁️  MONITORAMENTO EM TEMPO REAL DO MOTOR OPERACIONAL\n');
console.log('═══════════════════════════════════════════════════════\n');
console.log('Aguardando ações no navegador...\n');
console.log('Pressione Ctrl+C para sair\n');
console.log('═══════════════════════════════════════════════════════\n');

let lastRideCount = 0;
let lastAuditCount = 0;
let lastAvailCount = 0;
let lastRideId = null;

async function monitor() {
  // 1. Verificar corridas recentes
  const { data: rides } = await supabase
    .from('ride_requests')
    .select('id, status, passenger_profile_id, driver_profile_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (rides && rides.length > lastRideCount) {
    console.log(`\n🚗 NOVA CORRIDA DETECTADA!\n`);
    const newRide = rides[0];
    lastRideId = newRide.id;
    console.log(`   ID: ${newRide.id}`);
    console.log(`   Status: ${newRide.status}`);
    console.log(`   Passageiro: ${newRide.passenger_profile_id.substring(0, 8)}...`);
    console.log(`   Motorista: ${newRide.driver_profile_id?.substring(0, 8) || 'não atribuído'}...`);
    console.log(`   Criada: ${new Date(newRide.created_at).toLocaleTimeString()}`);
    lastRideCount = rides.length;
  } else if (rides && rides.length > 0 && lastRideId) {
    // Verificar mudanças de estado
    const currentRide = rides.find(r => r.id === lastRideId);
    if (currentRide) {
      console.log(`\n📊 Status atual: ${currentRide.status}`);
    }
  }

  // 2. Verificar auditoria
  if (lastRideId) {
    const { data: audit } = await supabase
      .from('ride_state_audit')
      .select('*')
      .eq('ride_id', lastRideId)
      .order('created_at', { ascending: true });

    if (audit && audit.length > lastAuditCount) {
      console.log(`\n📝 NOVA AUDITORIA!\n`);
      const newAudit = audit[audit.length - 1];
      console.log(`   Transição: ${newAudit.from_state} → ${newAudit.to_state}`);
      console.log(`   Por: ${newAudit.changed_by}`);
      console.log(`   Motivo: ${newAudit.reason || 'N/A'}`);
      lastAuditCount = audit.length;
    }
  }

  // 3. Verificar disponibilidade
  const { data: avail } = await supabase
    .from('driver_availability')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(3);

  if (avail && avail.length > 0) {
    const changed = avail.filter(a => {
      const updatedAt = new Date(a.updated_at);
      const now = new Date();
      return (now - updatedAt) < 10000; // Últimos 10 segundos
    });

    if (changed.length > 0) {
      console.log(`\n🚦 DISPONIBILIDADE ATUALIZADA!\n`);
      changed.forEach(a => {
        const status = a.is_online ? (a.is_available ? '🟢 Online/Disponível' : '🟡 Online/Ocupado') : '🔴 Offline';
        console.log(`   Motorista: ${a.profile_id.substring(0, 8)}...`);
        console.log(`   Status: ${status}`);
      });
    }
  }
}

// Monitorar a cada 2 segundos
setInterval(monitor, 2000);

// Primeira execução imediata
monitor();
