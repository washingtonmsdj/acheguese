/**
 * Script para obter credenciais do projeto Supabase
 * Execute com: node scripts/get_supabase_creds.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Tentar obter credenciais do Supabase CLI
function getSupabaseCredentials() {
  try {
    console.log('🔄 Obtendo credenciais do Supabase...');
    
    // Tentar usar o comando supabase status
    const output = execSync('supabase status -o env', { encoding: 'utf-8', timeout: 10000 });
    
    // Parse do output
    const lines = output.split('\n');
    const creds = {};
    
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        creds[match[1]] = match[2];
      }
    });
    
    return creds;
  } catch (error) {
    console.log('⚠️  Não foi possível obter credenciais via CLI');
    return null;
  }
}

// Tentar obter do arquivo de configuração local
function getLocalConfig() {
  const configPath = join(process.cwd(), 'supabase', 'config.toml');
  
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      console.log('📁 Configuração local encontrada:');
      console.log(content.substring(0, 500) + '...');
    } catch (error) {
      console.log('❌ Erro ao ler config.toml:', error.message);
    }
  } else {
    console.log('📁 Arquivo config.toml não encontrado');
  }
}

// Mostrar informações do projeto acheguese
function showProjectInfo() {
  console.log('\n📋 Informações do Projeto "acheguese":');
  console.log('   • Reference ID: xhdowzacfujckjelqhtd');
  console.log('   • Região: West US (Oregon)');
  console.log('   • Criado: 2026-03-26 05:48:09');
  console.log('\n🔗 URL do projeto: https://xhdowzacfujckjelqhtd.supabase.co');
  console.log('\n📝 Para obter as credenciais:');
  console.log('   1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/settings/api');
  console.log('   2. Anote:');
  console.log('      - Project URL');
  console.log('      - anon/public key');
  console.log('      - service_role key');
  console.log('\n   3. Crie o arquivo .env.remote:');
  console.log('      VITE_SUPABASE_URL=process.env.VITE_SUPABASE_URL!');
  console.log('      VITE_SUPABASE_PUBLISHABLE_KEY="sua_anon_key_aqui"');
  console.log('      SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"');
}

// Executar
console.log('🔍 Buscando informações do Supabase...\n');

const creds = getSupabaseCredentials();
if (creds && Object.keys(creds).length > 0) {
  console.log('✅ Credenciais obtidas:');
  Object.entries(creds).forEach(([key, value]) => {
    console.log(`   ${key}=${value}`);
  });
} else {
  console.log('❌ Não foi possível obter credenciais automaticamente');
  getLocalConfig();
  showProjectInfo();
}

console.log('\n🎯 Próximos passos:');
console.log('   1. Obter credenciais do dashboard do Supabase');
console.log('   2. Criar arquivo .env.remote');
console.log('   3. Executar: npx tsx src/scripts/createAdminRemote.ts');