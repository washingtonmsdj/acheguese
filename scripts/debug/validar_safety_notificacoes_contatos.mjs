#!/usr/bin/env node
/**
 * Validação Safety - Notificações e Contatos de Emergência
 * 
 * Valida:
 * 1. Tabela emergency_contacts existe
 * 2. Trigger de contato primário único funciona
 * 3. Integração com NotificationService
 * 4. Métodos deprecated do MobilityService
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VALIDAÇÃO SAFETY - NOTIFICAÇÕES E CONTATOS\n');

// ============================================
// 1. VALIDAR TABELA EMERGENCY_CONTACTS
// ============================================

console.log('1️⃣ Validando tabela emergency_contacts...');

const { data: contactsTable, error: contactsError } = await supabase
  .from('emergency_contacts')
  .select('count')
  .limit(0);

if (contactsError) {
  console.log('⚠️  Tabela emergency_contacts não existe. Criando...\n');
  
  const sql = readFileSync('CREATE_EMERGENCY_CONTACTS_TABLE.sql', 'utf-8');
  
  const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
    sql_query: sql
  });
  
  if (createError) {
    console.error('❌ Erro ao criar tabela:', createError.message);
    console.log('\n📋 Execute manualmente no SQL Editor do Supabase:');
    console.log('   CREATE_EMERGENCY_CONTACTS_TABLE.sql\n');
  } else {
    console.log('✅ Tabela emergency_contacts criada!\n');
  }
} else {
  console.log('✅ Tabela emergency_contacts existe\n');
}

// ============================================
// 2. VALIDAR TRIGGER DE CONTATO PRIMÁRIO
// ============================================

console.log('2️⃣ Validando trigger de contato primário único...');

const { data: triggers, error: triggerError } = await supabase
  .rpc('exec_sql', {
    sql_query: `
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'emergency_contacts' 
        AND trigger_name = 'emergency_contacts_primary_trigger';
    `
  });

if (triggerError || !triggers || triggers.length === 0) {
  console.log('⚠️  Trigger não encontrado\n');
} else {
  console.log('✅ Trigger ensure_single_primary_contact() ativo\n');
}

// ============================================
// 3. VALIDAR INTEGRAÇÃO COM NOTIFICATIONSERVICE
// ============================================

console.log('3️⃣ Validando integração com NotificationService...');

// Verificar se SafetyService importa NotificationService
const safetyServiceContent = readFileSync('src/core/safety/services/SafetyService.ts', 'utf-8');

const hasNotificationImport = safetyServiceContent.includes("import { notificationService }") ||
                               safetyServiceContent.includes("from '@/core/notifications'");

const hasSendNotificationMethod = safetyServiceContent.includes('sendSafetyNotification');
const hasNotifyContactsMethod = safetyServiceContent.includes('notifyEmergencyContacts');

if (hasNotificationImport && hasSendNotificationMethod && hasNotifyContactsMethod) {
  console.log('✅ SafetyService integrado com NotificationService');
  console.log('   - sendSafetyNotification() ✅');
  console.log('   - notifyEmergencyContacts() ✅\n');
} else {
  console.log('⚠️  Integração incompleta:');
  if (!hasNotificationImport) console.log('   - Import do notificationService ❌');
  if (!hasSendNotificationMethod) console.log('   - sendSafetyNotification() ❌');
  if (!hasNotifyContactsMethod) console.log('   - notifyEmergencyContacts() ❌');
  console.log();
}

// ============================================
// 4. VALIDAR MÉTODOS DEPRECATED
// ============================================

console.log('4️⃣ Validando métodos deprecated do MobilityService...');

const mobilityServiceContent = readFileSync('src/modules/mobility/services/MobilityService.impl.ts', 'utf-8');

const deprecatedMethods = [
  'createEmergencyAlert',
  'updateRideShareToken'
];

const foundDeprecated = [];
const markedDeprecated = [];

for (const method of deprecatedMethods) {
  const methodRegex = new RegExp(`async ${method}\\(`);
  if (methodRegex.test(mobilityServiceContent)) {
    foundDeprecated.push(method);
    
    // Verificar se está marcado como @deprecated
    const deprecatedRegex = new RegExp(`@deprecated[\\s\\S]*?async ${method}\\(`);
    if (deprecatedRegex.test(mobilityServiceContent)) {
      markedDeprecated.push(method);
    }
  }
}

if (foundDeprecated.length === 0) {
  console.log('✅ Nenhum método deprecated encontrado\n');
} else {
  console.log(`⚠️  Métodos deprecated encontrados: ${foundDeprecated.length}`);
  foundDeprecated.forEach(method => {
    const isMarked = markedDeprecated.includes(method);
    console.log(`   - ${method}() ${isMarked ? '✅ @deprecated' : '❌ não marcado'}`);
  });
  console.log();
}

// ============================================
// 5. VALIDAR HOOKS
// ============================================

console.log('5️⃣ Validando hooks de safety...');

const hooks = [
  'useSafetyIncidents',
  'useSafetyEvidence',
  'useEmergencyAlerts',
  'useEmergencyContacts'
];

const hooksStatus = {};

for (const hook of hooks) {
  try {
    const content = readFileSync(`src/core/safety/hooks/${hook}.ts`, 'utf-8');
    hooksStatus[hook] = content.includes('safetyService');
  } catch {
    hooksStatus[hook] = false;
  }
}

const allHooksExist = Object.values(hooksStatus).every(exists => exists);

if (allHooksExist) {
  console.log('✅ Todos os hooks existem e usam safetyService');
  hooks.forEach(hook => console.log(`   - ${hook} ✅`));
  console.log();
} else {
  console.log('⚠️  Hooks faltando:');
  Object.entries(hooksStatus).forEach(([hook, exists]) => {
    console.log(`   - ${hook} ${exists ? '✅' : '❌'}`);
  });
  console.log();
}

// ============================================
// 6. VALIDAR COMPONENTES MIGRADOS
// ============================================

console.log('6️⃣ Validando componentes migrados...');

const components = [
  { name: 'EmergencyButton', hook: 'useEmergencyAlerts' },
  { name: 'ShareRideButton', service: 'safetyService.createRideShare' }
];

const componentsStatus = {};

for (const component of components) {
  try {
    const content = readFileSync(`src/modules/mobility/components/${component.name}.tsx`, 'utf-8');
    const usesCorrectPattern = component.hook 
      ? content.includes(component.hook)
      : content.includes(component.service);
    componentsStatus[component.name] = usesCorrectPattern;
  } catch {
    componentsStatus[component.name] = false;
  }
}

const allComponentsMigrated = Object.values(componentsStatus).every(migrated => migrated);

if (allComponentsMigrated) {
  console.log('✅ Todos os componentes migrados para core/safety');
  components.forEach(comp => console.log(`   - ${comp.name} ✅`));
  console.log();
} else {
  console.log('⚠️  Componentes não migrados:');
  Object.entries(componentsStatus).forEach(([comp, migrated]) => {
    console.log(`   - ${comp} ${migrated ? '✅' : '❌'}`);
  });
  console.log();
}

// ============================================
// RESUMO FINAL
// ============================================

console.log('═══════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL\n');

const checks = [
  { name: 'Tabela emergency_contacts', status: !contactsError },
  { name: 'Trigger contato primário', status: !triggerError },
  { name: 'Integração NotificationService', status: hasNotificationImport && hasSendNotificationMethod },
  { name: 'Métodos deprecated marcados', status: foundDeprecated.length === markedDeprecated.length },
  { name: 'Hooks completos', status: allHooksExist },
  { name: 'Componentes migrados', status: allComponentsMigrated }
];

const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.status).length;

checks.forEach(check => {
  console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
});

console.log(`\n📈 Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 SAFETY NOTIFICAÇÕES E CONTATOS: 100% COMPLETO!\n');
} else {
  console.log('\n⚠️  Pendências encontradas. Revisar itens acima.\n');
}

console.log('═══════════════════════════════════════════════════════\n');
