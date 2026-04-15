/**
 * Aplicar FKs ausentes em business_data e professional_data
 * Necessário para PostgREST reconhecer joins via !location_id
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFkExists(table: string, constraint: string): Promise<boolean> {
  const { data } = await supabase
    .from('information_schema.table_constraints')
    .select('constraint_name')
    .eq('table_name', table)
    .eq('constraint_name', constraint)
    .eq('constraint_type', 'FOREIGN KEY')
    .maybeSingle();
  return !!data;
}

async function main() {
  console.log('Aplicando FKs ausentes...\n');

  // Verificar se FKs já existem via query direta
  const { data: constraints } = await supabase
    .from('information_schema.table_constraints' as any)
    .select('table_name, constraint_name')
    .in('constraint_name', [
      'business_data_location_id_fkey',
      'professional_data_location_id_fkey',
    ]);

  const existing = new Set((constraints || []).map((c: any) => c.constraint_name));

  console.log('FKs existentes:', existing.size > 0 ? [...existing].join(', ') : 'nenhuma');

  if (existing.has('business_data_location_id_fkey') && existing.has('professional_data_location_id_fkey')) {
    console.log('✅ Ambas as FKs já existem');
    return;
  }

  console.log('\nSQL para aplicar no Dashboard:');
  console.log('https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql\n');
  console.log('---');
  console.log(`
ALTER TABLE business_data
  ADD CONSTRAINT business_data_location_id_fkey
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE professional_data
  ADD CONSTRAINT professional_data_location_id_fkey
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
  `);
  console.log('---');
}

main().catch(console.error);
