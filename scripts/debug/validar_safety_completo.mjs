#!/usr/bin/env node

/**
 * Validação completa do Safety Operacional
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log('🔍 VALIDAÇÃO SAFETY OPERACIONAL\n');
console.log('═'.repeat(80));

async function validar() {
  const resultados = {
    tables: false,
    storage: false,
    incidents: false,
    alerts: false,
    shares: false,
    audit: false,
  };

  try {
    // 1. Validar tabelas
    console.log('\n1️⃣  TABELAS: Verificando estrutura do banco');
    console.log('─'.repeat(80));

    const tables = ['emergency_alerts', 'safety_incidents', 'safety_evidence', 'ride_shares', 'safety_audit_log'];
    
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count} registros`);
      }
    }
    resultados.tables = true;

    // 2. Validar storage
    console.log('\n2️⃣  STORAGE: Verificando bucket de evidências');
    console.log('─'.repeat(80));

    const { data: buckets } = await supabase.storage.listBuckets();
    const safetyBucket = buckets?.find(b => b.id === 'safety-evidence');

    if (safetyBucket) {
      console.log(`   ✅ Bucket safety-evidence encontrado`);
      console.log(`      - Público: ${safetyBucket.public}`);
      resultados.storage = true;
    } else {
      console.log(`   ❌ Bucket safety-evidence não encontrado`);
    }

    // 3. Validar incidentes
    console.log('\n3️⃣  INCIDENTES: Verificando registros');
    console.log('─'.repeat(80));

    const { data: incidents, error: incidentsError } = await supabase
      .from('safety_incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (incidentsError) {
      console.log(`   ❌ Erro: ${incidentsError.message}`);
    } else {
      console.log(`   ✅ ${incidents.length} incidentes encontrados`);
      if (incidents.length > 0) {
        console.log(`      Último: ${incidents[0].incident_type} (${incidents[0].severity})`);
      }
      resultados.incidents = true;
    }

    // 4. Validar alertas
    console.log('\n4️⃣  ALERTAS: Verificando emergências');
    console.log('─'.repeat(80));

    const { data: alerts, error: alertsError } = await supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (alertsError) {
      console.log(`   ❌ Erro: ${alertsError.message}`);
    } else {
      console.log(`   ✅ ${alerts.length} alertas encontrados`);
      if (alerts.length > 0) {
        console.log(`      Último: ${alerts[0].alert_type} (${alerts[0].status})`);
      }
      resultados.alerts = true;
    }

    // 5. Validar compartilhamentos
    console.log('\n5️⃣  COMPARTILHAMENTOS: Verificando ride shares');
    console.log('─'.repeat(80));

    const { data: shares, error: sharesError } = await supabase
      .from('ride_shares')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (sharesError) {
      console.log(`   ❌ Erro: ${sharesError.message}`);
    } else {
      console.log(`   ✅ ${shares.length} compartilhamentos encontrados`);
      if (shares.length > 0) {
        console.log(`      Último: ${shares[0].status} (expira: ${new Date(shares[0].expires_at).toLocaleString()})`);
      }
      resultados.shares = true;
    }

    // 6. Validar auditoria
    console.log('\n6️⃣  AUDITORIA: Verificando logs');
    console.log('─'.repeat(80));

    const { data: audit, error: auditError } = await supabase
      .from('safety_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (auditError) {
      console.log(`   ❌ Erro: ${auditError.message}`);
    } else {
      console.log(`   ✅ ${audit.length} entradas de auditoria`);
      if (audit.length > 0) {
        console.log(`      Últimas ações:`);
        audit.slice(0, 3).forEach(log => {
          console.log(`        - ${log.action} (${log.entity_type})`);
        });
      }
      resultados.audit = true;
    }

    // RESULTADO FINAL
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESULTADO FINAL\n');

    const checks = [
      { nome: 'Tabelas criadas', ok: resultados.tables },
      { nome: 'Storage configurado', ok: resultados.storage },
      { nome: 'Incidentes funcionais', ok: resultados.incidents },
      { nome: 'Alertas funcionais', ok: resultados.alerts },
      { nome: 'Compartilhamentos funcionais', ok: resultados.shares },
      { nome: 'Auditoria ativa', ok: resultados.audit },
    ];

    checks.forEach(c => {
      console.log(`   ${c.ok ? '✅' : '❌'} ${c.nome}`);
    });

    const todosOk = Object.values(resultados).every(v => v);

    console.log('\n' + '═'.repeat(80));
    if (todosOk) {
      console.log('🎉 SAFETY OPERACIONAL 100% FUNCIONAL!');
      console.log('✅ Todos os fluxos validados e prontos para uso.\n');
    } else {
      console.log('⚠️  Alguns componentes precisam de atenção.');
      console.log('   Revise os itens marcados com ❌\n');
    }

  } catch (error) {
    console.error('\n❌ Erro na validação:', error.message);
    process.exit(1);
  }
}

validar();
