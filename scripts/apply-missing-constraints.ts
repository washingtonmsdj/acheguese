/**
 * Aplica constraints NOT NULL que falharam nas migrations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyConstraint(table: string, column: string): Promise<boolean> {
  console.log(`🔧 Aplicando NOT NULL em ${table}.${column}...`);
  
  const sql = `ALTER TABLE ${table} ALTER COLUMN ${column} SET NOT NULL;`;
  
  try {
    // Usar SQL direto via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`  ❌ Erro: ${error}`);
      return false;
    }
    
    console.log(`  ✅ Constraint aplicado`);
    return true;
  } catch (err) {
    console.log(`  ❌ Erro: ${err}`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  APLICAÇÃO DE CONSTRAINTS FALTANTES');
  console.log('═══════════════════════════════════════════════════\n');
  
  const constraints = [
    { table: 'business_data', column: 'location_id' },
    { table: 'professional_data', column: 'location_id' },
    { table: 'ride_requests', column: 'pickup_address_id' },
    { table: 'ride_requests', column: 'dropoff_address_id' },
    { table: 'ride_requests', column: 'pickup_location_id' },
    { table: 'ride_requests', column: 'dropoff_location_id' },
  ];
  
  const results = [];
  
  for (const c of constraints) {
    const success = await applyConstraint(c.table, c.column);
    results.push({ ...c, success });
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  RESUMO');
  console.log('═══════════════════════════════════════════════════\n');
  
  const allSuccess = results.every(r => r.success);
  
  if (allSuccess) {
    console.log('✅ TODOS OS CONSTRAINTS APLICADOS\n');
  } else {
    console.log('⚠️  ALGUNS CONSTRAINTS FALHARAM\n');
    results.forEach(r => {
      if (!r.success) {
        console.log(`  ❌ ${r.table}.${r.column}`);
      }
    });
  }
}

main();
