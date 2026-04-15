import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  console.log('🚀 Criando tabela profile_favorites_new via SQL direto...\n');

  try {
    // Tentar criar via query direta
    const { data, error } = await (supabase as any)
      .from('profile_favorites_new')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('✅ Tabela já existe!');
      return;
    }

    if (error.code === '42P01') {
      console.log('⚠️  Tabela não existe. Você precisa criar manualmente via SQL Editor no Supabase:');
      console.log('\n--- Cole este SQL no SQL Editor do Supabase ---\n');
      console.log(`
CREATE TABLE IF NOT EXISTS profile_favorites_new (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  favoriting_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorited_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(favoriting_profile_id, favorited_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_pfn_favoriting ON profile_favorites_new(favoriting_profile_id);
CREATE INDEX IF NOT EXISTS idx_pfn_favorited  ON profile_favorites_new(favorited_profile_id);

ALTER TABLE profile_favorites_new ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON profile_favorites_new FOR ALL TO authenticated
  USING (
    favoriting_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can read favorites"
  ON profile_favorites_new FOR SELECT TO authenticated
  USING (true);
      `);
      console.log('\n--- Fim do SQL ---\n');
    } else {
      console.log('✅ Tabela existe e está acessível');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createTable();
