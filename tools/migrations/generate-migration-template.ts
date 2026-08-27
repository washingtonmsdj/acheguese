/**
 * GERADOR DE TEMPLATE DE MIGRATION
 * 
 * Uso: npm run generate:migration <nome>
 * Exemplo: npm run generate:migration create_pricing_rules
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Erro: Nome da migration é obrigatório');
  console.log('Uso: npm run generate:migration <nome>');
  console.log('Exemplo: npm run generate:migration create_pricing_rules');
  process.exit(1);
}

// Gerar timestamp
const now = new Date();
const timestamp = now.toISOString()
  .replace(/[-:]/g, '')
  .replace(/\..+/, '')
  .replace('T', '');

const fileName = `${timestamp}_${migrationName}.sql`;
const filePath = join('supabase', 'migrations', fileName);

const template = `-- ══════════════════════════════════════════════════════════════════════════
-- ${migrationName.toUpperCase().replace(/_/g, ' ')}
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Descrição: [Descreva o propósito desta migration]
-- 
-- Autor: [Seu nome]
-- Data: ${now.toISOString().split('T')[0]}
-- 
-- ══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CRIAR TABELA
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campos principais
  name TEXT NOT NULL,
  description TEXT,
  
  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_table_name_active 
  ON table_name(is_active) 
  WHERE is_active = true;

CREATE INDEX idx_table_name_name 
  ON table_name(name);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RLS (ROW LEVEL SECURITY)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública de registros ativos
CREATE POLICY "table_name_public_read"
  ON table_name
  FOR SELECT
  USING (is_active = true);

-- Política: Admin pode tudo
CREATE POLICY "table_name_admin_all"
  ON table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────

-- Trigger de updated_at
CREATE TRIGGER set_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────
-- 5. SEED (DADOS INICIAIS)
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO table_name (name, description) VALUES
  ('Exemplo 1', 'Descrição do exemplo 1'),
  ('Exemplo 2', 'Descrição do exemplo 2')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. COMENTÁRIOS
-- ─────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE table_name IS 'SSOT: [Descrição da tabela]';
COMMENT ON COLUMN table_name.name IS 'Nome do registro';
COMMENT ON COLUMN table_name.is_active IS 'Indica se o registro está ativo';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
`;

try {
  writeFileSync(filePath, template);
  console.log('✅ Migration criada com sucesso!');
  console.log(`📄 Arquivo: ${filePath}`);
  console.log('\n📝 Próximos passos:');
  console.log('   1. Edite o arquivo e preencha os campos');
  console.log('   2. Aplique a migration: npm run db:migrate');
  console.log('   3. Valide a estrutura: npm run db:validate');
} catch (error) {
  console.error('❌ Erro ao criar migration:', error);
  process.exit(1);
}
