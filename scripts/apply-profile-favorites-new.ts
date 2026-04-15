import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function applyMigration() {
  console.log('🚀 Aplicando migração profile_favorites_new...\n');

  try {
    // Criar tabela
    console.log('📝 Criando tabela profile_favorites_new...');
    const { error: createError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS profile_favorites_new (
          id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          favoriting_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          favorited_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(favoriting_profile_id, favorited_profile_id)
        );
      `
    });

    if (createError && !createError.message?.includes('already exists')) {
      console.error('❌ Erro ao criar tabela:', createError);
    } else {
      console.log('✅ Tabela criada');
    }

    // Criar índices
    console.log('📝 Criando índices...');
    await supabase.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_pfn_favoriting ON profile_favorites_new(favoriting_profile_id);
        CREATE INDEX IF NOT EXISTS idx_pfn_favorited  ON profile_favorites_new(favorited_profile_id);
      `
    });
    console.log('✅ Índices criados');

    // Habilitar RLS
    console.log('📝 Habilitando RLS...');
    await supabase.rpc('exec', {
      sql: `ALTER TABLE profile_favorites_new ENABLE ROW LEVEL SECURITY;`
    });
    console.log('✅ RLS habilitado');

    // Criar políticas
    console.log('📝 Criando políticas...');
    await supabase.rpc('exec', {
      sql: `
        DROP POLICY IF EXISTS "Users manage own favorites" ON profile_favorites_new;
        CREATE POLICY "Users manage own favorites"
          ON profile_favorites_new FOR ALL TO authenticated
          USING (
            favoriting_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          );

        DROP POLICY IF EXISTS "Anyone can read favorites" ON profile_favorites_new;
        CREATE POLICY "Anyone can read favorites"
          ON profile_favorites_new FOR SELECT TO authenticated
          USING (true);
      `
    });
    console.log('✅ Políticas criadas');

    // Verificar
    const { count, error: checkError } = await supabase
      .from('profile_favorites_new' as any)
      .select('*', { count: 'exact', head: true });
    
    if (checkError) {
      console.error('⚠️  Erro ao verificar tabela:', checkError);
    } else {
      console.log(`✅ Tabela verificada (${count || 0} registros)`);
    }
    
    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

applyMigration();
