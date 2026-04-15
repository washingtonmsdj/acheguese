/**
 * Script para verificar estrutura da tabela businesses
 * Conecta ao Supabase e retorna informações sobre colunas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('🔍 Verificando estrutura da tabela businesses...\n');

  // Query para ver estrutura da tabela
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'businesses'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.error('❌ Erro:', error);
    
    // Tentar método alternativo
    console.log('\n🔄 Tentando método alternativo...\n');
    
    const { data: sample, error: sampleError } = await supabase
      .from('businesses')
      .select('id, name, latitude, longitude, status, location_id')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Erro no método alternativo:', sampleError);
      return;
    }
    
    console.log('✅ Amostra de dados:');
    console.log(JSON.stringify(sample, null, 2));
    
    // Verificar tipos
    if (sample && sample.length > 0) {
      const row = sample[0];
      console.log('\n📊 Tipos detectados:');
      console.log('- latitude:', typeof row.latitude, '=', row.latitude);
      console.log('- longitude:', typeof row.longitude, '=', row.longitude);
    }
    
    return;
  }

  console.log('✅ Estrutura da tabela businesses:');
  console.table(data);
  
  // Verificar se tem coluna point
  const hasPoint = data.some(col => col.column_name === 'point');
  console.log(`\n${hasPoint ? '✅' : '❌'} Coluna 'point': ${hasPoint ? 'EXISTE' : 'NÃO EXISTE'}`);
  
  // Verificar tipos de latitude/longitude
  const latCol = data.find(col => col.column_name === 'latitude');
  const lngCol = data.find(col => col.column_name === 'longitude');
  
  if (latCol) {
    console.log(`\n📍 latitude: ${latCol.data_type}${latCol.numeric_precision ? `(${latCol.numeric_precision},${latCol.numeric_scale})` : ''}`);
  }
  
  if (lngCol) {
    console.log(`📍 longitude: ${lngCol.data_type}${lngCol.numeric_precision ? `(${lngCol.numeric_precision},${lngCol.numeric_scale})` : ''}`);
  }
}

checkStructure().catch(console.error);
