/**
 * Script para gerar SQL consolidado das migrations
 * 
 * Uso: npx tsx scripts/generate-migration-sql.ts > migration.sql
 */

import { readFileSync } from 'fs';
import { join } from 'path';

function readMigration(filename: string): string {
  const filepath = join(process.cwd(), 'supabase', 'migrations', filename);
  return readFileSync(filepath, 'utf-8');
}

console.log('-- ============================================================================');
console.log('-- MIGRATIONS: tourist_points_v2');
console.log('-- ============================================================================');
console.log('-- Gerado em:', new Date().toISOString());
console.log('-- ');
console.log('-- INSTRUÇÕES:');
console.log('-- 1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
console.log('-- 2. Copie TODO o conteúdo deste arquivo');
console.log('-- 3. Cole no SQL Editor');
console.log('-- 4. Clique em "Run" para executar');
console.log('-- ============================================================================');
console.log('');

console.log('-- ============================================================================');
console.log('-- MIGRATION 1: Criar tabelas tourist_points_v2');
console.log('-- ============================================================================');
console.log('');
console.log(readMigration('20260331100001_create_guide_tourist_points_v2.sql'));
console.log('');

console.log('-- ============================================================================');
console.log('-- MIGRATION 2: Seed de dados (10 pontos turísticos de Salvador)');
console.log('-- ============================================================================');
console.log('');
console.log(readMigration('20260331100002_seed_guide_tourist_points_salvador.sql'));
console.log('');

console.log('-- ============================================================================');
console.log('-- FIM DAS MIGRATIONS');
console.log('-- ============================================================================');
