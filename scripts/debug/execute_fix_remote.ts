import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeFix() {
  console.log('🔧 Executando fix de gastronomia no banco remoto...\n');

  const sql = readFileSync('fix_gastronomy_complete.sql', 'utf-8');

  // Dividir em statements individuais (remover comentários e validações)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Pular comentários de bloco e validações SELECT
    if (statement.includes('PASSO') || statement.includes('VALIDAÇÃO') || statement.includes('status')) {
      continue;
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      
      if (error) {
        // Tentar executar diretamente via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ sql_query: statement + ';' }),
        });

        if (!response.ok) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message || 'Erro desconhecido'}`);
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } catch (err: any) {
      console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n✅ Executados: ${successCount}`);
  console.log(`⚠️  Erros: ${errorCount}`);

  // Validar resultado
  console.log('\n📊 Validando dados...\n');

  const { data, error } = await supabase
    .from('business_data')
    .select(`
      id,
      business_name,
      slug,
      location:locations!location_id(geographic_path),
      gastronomy_profile:gastronomy_profiles!business_id(cuisine_type, price_range)
    `)
    .in('slug', [
      'restaurante-barra-mar',
      'bar-do-rio',
      'casa-da-moqueca',
      'pizzaria-bella-napoli',
      'sushi-house-pituba'
    ]);

  if (error) {
    console.error('❌ Erro ao validar:', error);
  } else {
    console.log('✅ Empresas de gastronomia encontradas:', data?.length || 0);
    data?.forEach((b: any) => {
      console.log(`  - ${b.business_name} (${b.location?.geographic_path})`);
    });
  }
}

executeFix().catch(console.error);
