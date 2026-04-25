import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readFileSync } from 'fs';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function applyRpcFix() {
  console.log('🔧 Aplicando correção SSOT nas RPCs...');
  
  try {
    // Ler o arquivo SQL
    const sqlContent = readFileSync('scripts/fix-rpc-ssot.sql', 'utf8');
    
    // Dividir em comandos individuais
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executando ${statements.length} comandos SQL...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);
      
      try {
        // Usar o client Supabase para executar SQL via RPC
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Tentar método alternativo via HTTP
          const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (response.ok) {
            console.log('✅');
          } else {
            console.log('❌');
            console.log('   Erro:', await response.text());
          }
        } else {
          console.log('✅');
        }
      } catch (err) {
        console.log('❌');
        console.log('   Exceção:', err.message);
      }
    }
    
    console.log('\n🎯 Aguardando aplicação das mudanças...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Testar as RPCs após a correção
    console.log('\n🧪 Testando RPCs corrigidas...');
    
    const { data: gastroResult, error: gastroError } = await supabase
      .rpc('get_public_gastronomy_snapshot_by_slug', {
        p_state: 'ba',
        p_city: 'salvador',
        p_district: 'itaigara',
        p_slug: 'pizzaria-bella-napoli'
      });
    
    if (gastroError) {
      console.log('❌ Erro na RPC de gastronomia:', gastroError.message);
    } else if (gastroResult?.gastronomy?.business?.id) {
      const businessId = gastroResult.gastronomy.business.id;
      const correctId = 'cd709a71-03e0-4edb-8114-743599ac960d';
      
      console.log('✅ RPC de gastronomia corrigida:');
      console.log(`   - Business ID: ${businessId}`);
      console.log(`   - SSOT correto: ${businessId === correctId ? '✅' : '❌'}`);
      
      if (businessId === correctId) {
        console.log('\n🎉 SUCESSO! SSOT corrigido nas RPCs!');
        console.log('   Agora gastronomia usa o mesmo SSOT que business');
      }
    }
    
    // Testar RPC de business também
    const { data: businessResult, error: businessError } = await supabase
      .rpc('get_public_business_snapshot_by_slug', {
        p_state: 'ba',
        p_city: 'salvador',
        p_district: 'itaigara',
        p_slug: 'pizzaria-bella-napoli'
      });
    
    if (!businessError && businessResult?.institutional?.business?.id) {
      const businessId = businessResult.institutional.business.id;
      const correctId = 'cd709a71-03e0-4edb-8114-743599ac960d';
      
      console.log('✅ RPC de business também corrigida:');
      console.log(`   - Business ID: ${businessId}`);
      console.log(`   - SSOT correto: ${businessId === correctId ? '✅' : '❌'}`);
    }
    
  } catch (err) {
    console.log('❌ Erro ao ler/executar SQL:', err.message);
  }
}

applyRpcFix();
