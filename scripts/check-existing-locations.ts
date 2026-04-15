/**
 * Verificar locations existentes no banco remoto
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Locations existentes:\n');

  const { data: locations } = await supabase
    .from('locations')
    .select('id, type, slug, name, parent_id, status')
    .order('type')
    .order('name');

  if (!locations) {
    console.log('Nenhuma location encontrada');
    return;
  }

  const byType = locations.reduce((acc: any, loc) => {
    if (!acc[loc.type]) acc[loc.type] = [];
    acc[loc.type].push(loc);
    return acc;
  }, {});

  Object.entries(byType).forEach(([type, locs]: [string, any]) => {
    console.log(`\n${type.toUpperCase()} (${locs.length}):`);
    locs.forEach((loc: any) => {
      console.log(`  - ${loc.name} (${loc.slug}) [${loc.status}]`);
      if (loc.parent_id) console.log(`    parent: ${loc.parent_id}`);
    });
  });

  console.log(`\n\nTotal: ${locations.length} locations`);
}

main().catch(console.error);
