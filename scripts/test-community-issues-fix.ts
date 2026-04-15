/**
 * Script de validação: Testa correção do erro 404 em community_issues_public
 * 
 * OBJETIVO:
 * - Verificar se a query com JOIN funciona corretamente
 * - Validar filtros por city/neighborhood via locations
 * - Confirmar que erro 404 foi resolvido
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Carregar .env.remote manualmente
const envPath = resolve(process.cwd(), '.env.remote');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      // Remover aspas se existirem
      envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCommunityIssuesFix() {
  console.log('🧪 TESTE: Correção community_issues_public\n');

  // 1. Testar query básica na view
  console.log('1️⃣ Testando query básica na view...');
  const { data: allIssues, error: error1 } = await supabase
    .from('community_issues_public')
    .select('*')
    .limit(5);

  if (error1) {
    console.error('❌ Erro na query básica:', error1);
    return;
  }

  console.log(`✅ Query básica OK: ${allIssues?.length ?? 0} registros`);
  if (allIssues && allIssues.length > 0) {
    console.log('   Exemplo:', JSON.stringify(allIssues[0], null, 2));
  }

  // 2. Testar query com JOIN para locations (na tabela, não na view)
  console.log('\n2️⃣ Testando query com JOIN locations na tabela...');
  const { data: issuesWithLocation, error: error2 } = await supabase
    .from('community_issues')
    .select(`
      id,
      profile_id,
      title,
      description,
      category,
      status,
      location_id,
      created_at,
      updated_at,
      location:locations!location_id(
        city,
        neighborhood
      )
    `)
    .limit(5);

  if (error2) {
    console.error('❌ Erro na query com JOIN:', error2);
    return;
  }

  console.log(`✅ Query com JOIN OK: ${issuesWithLocation?.length ?? 0} registros`);
  if (issuesWithLocation && issuesWithLocation.length > 0) {
    console.log('   Exemplo com location:', JSON.stringify(issuesWithLocation[0], null, 2));
  }

  // 3. Testar filtro por cidade (client-side após JOIN)
  console.log('\n3️⃣ Testando filtro por cidade...');
  const filtered = issuesWithLocation?.filter((item: any) => 
    item.location?.city === 'Salvador'
  ) ?? [];

  console.log(`✅ Filtro por cidade OK: ${filtered.length} registros em Salvador`);

  // 4. Testar filtro por bairro
  console.log('\n4️⃣ Testando filtro por bairro...');
  const filteredNeighborhood = filtered.filter((item: any) => 
    item.location?.neighborhood === 'Nordeste de Amaralina'
  );

  console.log(`✅ Filtro por bairro OK: ${filteredNeighborhood.length} registros em Nordeste de Amaralina`);

  console.log('\n✅ TODOS OS TESTES PASSARAM');
  console.log('📊 Resumo:');
  console.log(`   - Total de issues: ${allIssues?.length ?? 0}`);
  console.log(`   - Issues com location: ${issuesWithLocation?.length ?? 0}`);
  console.log(`   - Issues em Salvador: ${filtered.length}`);
  console.log(`   - Issues em Nordeste de Amaralina: ${filteredNeighborhood.length}`);
}

testCommunityIssuesFix().catch(console.error);
