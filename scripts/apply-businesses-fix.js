/**
 * Script para aplicar correção da tabela businesses
 * Executa SQL via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySQLFix() {
  console.log('🔧 Aplicando correção da tabela businesses...\n');

  const sql = readFileSync('ETAPA_1.3B_CORRECAO_FINAL_BUSINESSES.sql', 'utf8');
  
  // Dividir em comandos individuais (separados por ponto e vírgula)
  const commands = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  console.log(`📝 Total de comandos SQL: ${commands.length}\n`);

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    
    // Pular comentários e linhas vazias
    if (cmd.startsWith('--') || cmd.trim().length === 0) continue;
    
    console.log(`\n[${i + 1}/${commands.length}] Executando comando...`);
    console.log(`Primeiras 100 chars: ${cmd.substring(0, 100)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: cmd + ';' });
      
      if (error) {
        // Tentar executar diretamente via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ query: cmd + ';' })
        });
        
        if (!response.ok) {
          console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error(`Detalhes: ${errorText}`);
          
          // Continuar com próximo comando
          continue;
        }
        
        console.log('✅ Comando executado com sucesso (via REST API)');
      } else {
        console.log('✅ Comando executado com sucesso');
        if (data) {
          console.log('Resultado:', JSON.stringify(data, null, 2));
        }
      }
    } catch (err) {
      console.error(`❌ Erro ao executar comando:`, err.message);
      // Continuar com próximo comando
    }
  }
  
  console.log('\n✅ Processo concluído!');
  console.log('\n🧪 Testando busca espacial...\n');
  
  // Testar busca espacial
  try {
    const { data, error } = await supabase.rpc('search_entities_by_radius', {
      p_latitude: -12.9822,
      p_longitude: -38.4812,
      p_radius_km: 10.0,
      p_entity_type: 'business',
      p_location_id: null,
      p_limit: 10,
      p_offset: 0
    });
    
    if (error) {
      console.error('❌ Erro no teste:', error);
    } else {
      console.log(`✅ Teste bem-sucedido! Encontradas ${data?.length || 0} empresas`);
      if (data && data.length > 0) {
        console.log('\nPrimeira empresa:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Erro no teste:', err.message);
  }
}

applySQLFix().catch(console.error);
