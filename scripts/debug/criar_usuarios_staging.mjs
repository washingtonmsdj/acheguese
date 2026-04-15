#!/usr/bin/env node
/**
 * Criar usuários de teste para staging
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('👥 CRIANDO USUÁRIOS DE TESTE PARA STAGING\n');
console.log('═══════════════════════════════════════════════════════\n');

const usuarios = [
  {
    email: 'admin@staging.local',
    password: 'Admin123!@#',
    role: 'admin',
    name: 'Admin Staging'
  },
  {
    email: 'passageiro@staging.local',
    password: 'Pass123!@#',
    role: 'passenger',
    name: 'Passageiro Staging'
  },
  {
    email: 'motorista@staging.local',
    password: 'Driver123!@#',
    role: 'driver',
    name: 'Motorista Staging'
  }
];

let created = 0;
let existing = 0;
let failed = 0;

for (const usuario of usuarios) {
  console.log(`Criando: ${usuario.email}...`);
  
  try {
    // Criar usuário via Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: usuario.email,
      password: usuario.password,
      email_confirm: true, // Auto-confirmar
      user_metadata: {
        name: usuario.name,
        role: usuario.role
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`   ⚠️  Já existe\n`);
        existing++;
      } else {
        console.log(`   ❌ Erro: ${error.message}\n`);
        failed++;
      }
    } else {
      console.log(`   ✅ Criado: ${data.user.id}`);
      
      // Criar profile associado
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          user_id: data.user.id,
          name: usuario.name,
          email: usuario.email,
          role: usuario.role
        });
      
      if (profileError && !profileError.message.includes('duplicate')) {
        console.log(`   ⚠️  Profile: ${profileError.message}`);
      } else {
        console.log(`   ✅ Profile criado`);
      }
      
      console.log();
      created++;
    }
  } catch (e) {
    console.log(`   ❌ Erro: ${e.message}\n`);
    failed++;
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log(`📊 RESUMO: ${created} criados, ${existing} já existiam, ${failed} falharam\n`);

if (created > 0 || existing > 0) {
  console.log('✅ USUÁRIOS DISPONÍVEIS PARA TESTE:\n');
  usuarios.forEach(u => {
    console.log(`   ${u.role.toUpperCase()}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Password: ${u.password}`);
    console.log();
  });
  
  console.log('🎉 PRONTO PARA VALIDAR RLS COM AUTH REAL!\n');
  process.exit(0);
} else {
  console.log('❌ Nenhum usuário disponível\n');
  process.exit(1);
}
