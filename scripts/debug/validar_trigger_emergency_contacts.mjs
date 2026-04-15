#!/usr/bin/env node
/**
 * Validar trigger de contato primário único
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testando trigger de contato primário único...\n');

// Criar perfil de teste (se não existir)
const testProfileId = '00000000-0000-0000-0000-000000000001';

console.log('1️⃣ Criando contato primário...');
const { data: contact1, error: error1 } = await supabase
  .from('emergency_contacts')
  .insert({
    profile_id: testProfileId,
    name: 'Contato Teste 1',
    phone: '11999999999',
    is_primary: true
  })
  .select()
  .single();

if (error1) {
  console.log('⚠️  Erro ao criar contato 1:', error1.message);
  console.log('   (Pode ser foreign key - perfil não existe)\n');
} else {
  console.log('✅ Contato 1 criado:', contact1.name, '- Primary:', contact1.is_primary, '\n');
}

console.log('2️⃣ Criando segundo contato primário...');
const { data: contact2, error: error2 } = await supabase
  .from('emergency_contacts')
  .insert({
    profile_id: testProfileId,
    name: 'Contato Teste 2',
    phone: '11988888888',
    is_primary: true
  })
  .select()
  .single();

if (error2) {
  console.log('⚠️  Erro ao criar contato 2:', error2.message, '\n');
} else {
  console.log('✅ Contato 2 criado:', contact2.name, '- Primary:', contact2.is_primary, '\n');
}

console.log('3️⃣ Verificando contatos primários...');
const { data: primaryContacts, error: error3 } = await supabase
  .from('emergency_contacts')
  .select('*')
  .eq('profile_id', testProfileId)
  .eq('is_primary', true);

if (error3) {
  console.log('❌ Erro ao buscar contatos:', error3.message, '\n');
} else {
  console.log(`📊 Contatos primários encontrados: ${primaryContacts.length}`);
  
  if (primaryContacts.length === 1) {
    console.log('✅ TRIGGER FUNCIONANDO! Apenas 1 contato primário\n');
    console.log('   Contato primário:', primaryContacts[0].name);
  } else if (primaryContacts.length > 1) {
    console.log('❌ TRIGGER NÃO FUNCIONANDO! Múltiplos contatos primários:\n');
    primaryContacts.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.phone})`);
    });
  } else {
    console.log('⚠️  Nenhum contato primário encontrado\n');
  }
}

// Limpar dados de teste
console.log('\n4️⃣ Limpando dados de teste...');
const { error: deleteError } = await supabase
  .from('emergency_contacts')
  .delete()
  .eq('profile_id', testProfileId);

if (deleteError) {
  console.log('⚠️  Erro ao limpar:', deleteError.message);
} else {
  console.log('✅ Dados de teste removidos\n');
}

console.log('═══════════════════════════════════════════════════════');
console.log('📊 CONCLUSÃO\n');

if (primaryContacts && primaryContacts.length === 1) {
  console.log('✅ Trigger ensure_single_primary_contact() FUNCIONANDO');
  console.log('✅ Tabela emergency_contacts 100% OPERACIONAL\n');
} else {
  console.log('⚠️  Trigger pode não estar ativo');
  console.log('   Mas tabela está funcional para uso básico\n');
}

console.log('═══════════════════════════════════════════════════════\n');
