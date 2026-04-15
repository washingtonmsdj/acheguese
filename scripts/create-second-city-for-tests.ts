/**
 * Criar segunda cidade para testes de grupos territoriais
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Criando Lauro de Freitas...\n');

  // Buscar Bahia
  const { data: bahia } = await supabase
    .from('locations')
    .select('id')
    .eq('type', 'state')
    .eq('slug', 'ba')
    .maybeSingle();

  if (!bahia) {
    console.error('❌ Bahia não encontrada');
    process.exit(1);
  }

  // Criar Lauro de Freitas
  const { data: lauro, error: cityError } = await supabase
    .from('locations')
    .insert({
      parent_id: bahia.id,
      type: 'city',
      slug: 'lauro-de-freitas',
      name: 'Lauro de Freitas',
      full_name: 'Lauro de Freitas, Bahia, Brasil',
      geographic_path: `/brasil/ba/lauro-de-freitas`,
      status: 'active',
      metadata: { canonical_lat: -12.8944, canonical_lng: -38.3222 },
    })
    .select()
    .single();

  if (cityError) {
    if (cityError.message.includes('duplicate key')) {
      console.log('✓ Lauro de Freitas já existe');
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', 'lauro-de-freitas')
        .eq('type', 'city')
        .single();
      
      if (existing) {
        console.log('ID:', existing.id);
      }
      return;
    }
    throw cityError;
  }

  console.log('✅ Lauro de Freitas criado:', lauro.id);

  // Criar bairros
  const districts = [
    { slug: 'centro', name: 'Centro' },
    { slug: 'itinga', name: 'Itinga' },
    { slug: 'vilas-do-atlantico', name: 'Vilas do Atlântico' },
  ];

  console.log('\nCriando bairros...');
  for (const d of districts) {
    const { error } = await supabase
      .from('locations')
      .insert({
        parent_id: lauro.id,
        type: 'district',
        slug: d.slug,
        name: d.name,
        full_name: `${d.name}, Lauro de Freitas, Bahia, Brasil`,
        geographic_path: `/brasil/ba/lauro-de-freitas/${d.slug}`,
        status: 'active',
        metadata: {},
      });

    if (error && !error.message.includes('duplicate key')) {
      console.error(`❌ ${d.name}:`, error.message);
    } else {
      console.log(`  ✅ ${d.name}`);
    }
  }

  console.log('\n✅ Segunda cidade criada com sucesso');
}

main().catch(console.error);
