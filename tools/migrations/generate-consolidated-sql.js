#!/usr/bin/env node

/**
 * Script para gerar SQL consolidado para aplicar no Supabase SQL Editor
 * Gera um arquivo único com todas as migrações
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Gerando SQL consolidado para aplicar no Supabase...');

try {
  // Ler o arquivo de migração principal
  const migrationPath = join(__dirname, '../../supabase/migrations/20260412000001_add_gastronomy_reviews_enhancements.sql');
  const migrationSql = readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Arquivo de migração carregado:', migrationPath);
  
  // Criar cabeçalho explicativo
  const header = `-- =====================================================
-- MIGRAÇÃO COMPLETA: SISTEMA DE REVIEWS E FAVORITOS
-- =====================================================
-- 
-- Este arquivo contém todas as migrações necessárias para implementar
-- o sistema completo de reviews e favoritos na gastronomia.
--
-- INSTRUÇÕES:
-- 1. Copie todo o conteúdo deste arquivo
-- 2. Acesse o Supabase Dashboard > SQL Editor
-- 3. Cole o conteúdo e execute
--
-- Data de geração: ${new Date().toISOString()}
-- =====================================================

`;

  // Adicionar comentários de seção
  const processedSql = migrationSql
    .replace(/-- ===== TABELAS =====/g, '\n-- ===== CRIAÇÃO DE TABELAS =====\n')
    .replace(/-- ===== FUNÇÕES =====/g, '\n-- ===== FUNÇÕES E PROCEDURES =====\n')
    .replace(/-- ===== RLS =====/g, '\n-- ===== ROW LEVEL SECURITY (RLS) =====\n')
    .replace(/-- ===== TRIGGERS =====/g, '\n-- ===== TRIGGERS E AUTOMAÇÕES =====\n')
    .replace(/-- ===== DADOS =====/g, '\n-- ===== DADOS INICIAIS =====\n');

  // Combinar tudo
  const consolidatedSql = header + processedSql;
  
  // Salvar arquivo consolidado
  const outputPath = join(__dirname, '../../APLICAR_NO_SUPABASE_SQL_EDITOR.sql');
  writeFileSync(outputPath, consolidatedSql, 'utf8');
  
  console.log('✅ Arquivo SQL consolidado gerado com sucesso!');
  console.log(`📁 Localização: ${outputPath}`);
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Abra o arquivo: APLICAR_NO_SUPABASE_SQL_EDITOR.sql');
  console.log('2. Copie todo o conteúdo');
  console.log('3. Acesse: https://xhdowzacfujckjelqhtd.supabase.co/project/xhdowzacfujckjelqhtd/sql');
  console.log('4. Cole o conteúdo no SQL Editor');
  console.log('5. Clique em "Run" para executar');
  console.log('\n🔧 Isso criará todas as tabelas, funções e configurações necessárias.');
  
} catch (error) {
  console.error('❌ Erro ao gerar SQL consolidado:', error.message);
  process.exit(1);
}