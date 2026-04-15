/**
 * Script de Verificação: Checar location_id das empresas
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBusinessLocation() {
  const { data, error } = await supabase
    .from('business_data')
    .select('profile_id, business_name, slug, location_id')
    .eq('status', 'active');

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('Empresas ativas:\n');
  data?.forEach((b: any) => {
    console.log(`${b.business_name}`);
    console.log(`  Profile ID: ${b.profile_id}`);
    console.log(`  Slug: ${b.slug || 'N/A'}`);
    console.log(`  Location ID: ${b.location_id || 'NULL'}\n`);
  });
}

checkBusinessLocation();
