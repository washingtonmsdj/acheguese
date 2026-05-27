/**
 * REGRESSÃO: Cleanup Pós-Sprint 2 — Campos Legados Posts
 *
 * Garante que ninguém reintroduza:
 *   - campos legados (city, neighborhood, street, autor_id, texto) em posts
 *   - referências a community_posts no código
 *   - funções deprecated (createCommunityPost, createCommunityPostWithValidation, createSimplePost)
 *   - LocationFilter com campos legados
 *
 * Estes testes são estáticos (AST/grep) — não precisam de conexão com banco.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readSrc(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), 'utf-8');
}

function grepFiles(pattern: RegExp, globs: string[]): string[] {
  const matches: string[] = [];
  for (const g of globs) {
    const files = glob.sync(g, { cwd: process.cwd() });
    for (const file of files) {
      const content = readSrc(file);
      if (pattern.test(content)) {
        matches.push(file);
      }
    }
  }
  return matches;
}

const SRC_GLOBS = [
  'src/**/*.ts',
  'src/**/*.tsx',
];

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('Regressão: Cleanup Pós-Sprint 2', () => {

  // ── Funções deprecated ────────────────────────────────────────────────────

  it('zero chamadas a createCommunityPost()', () => {
    const files = grepFiles(/createCommunityPost\s*\(/, SRC_GLOBS);
    expect(files, `Chamadas a createCommunityPost encontradas em: ${files.join(', ')}`).toHaveLength(0);
  });

  it('zero chamadas a createCommunityPostWithValidation()', () => {
    const files = grepFiles(/createCommunityPostWithValidation\s*\(/, SRC_GLOBS);
    expect(files, `Chamadas a createCommunityPostWithValidation encontradas em: ${files.join(', ')}`).toHaveLength(0);
  });

  it('zero chamadas a createSimplePost()', () => {
    const files = grepFiles(/createSimplePost\s*\(/, SRC_GLOBS);
    expect(files, `Chamadas a createSimplePost encontradas em: ${files.join(', ')}`).toHaveLength(0);
  });

  // ── Tabela community_posts ────────────────────────────────────────────────

  it('zero referências a community_posts no módulo posts (src/core/posts)', () => {
    // Escopo: apenas src/core/posts — CommunityQAService (src/core/community)
    // ainda usa community_posts para Q&A (débito técnico separado, fora deste escopo).
    const files = grepFiles(/community_posts/, ['src/core/posts/**/*.ts', 'src/core/posts/**/*.tsx']);
    expect(files, `Referências a community_posts em src/core/posts: ${files.join(', ')}`).toHaveLength(0);
  });

  it('zero referências a community_posts nos hooks de posts (src/core/community/hooks)', () => {
    const files = grepFiles(/community_posts/, [
      'src/core/community/hooks/composer/**/*.ts',
      'src/core/community/hooks/feed/**/*.ts',
      'src/core/community/hooks/posts/**/*.ts',
    ]);
    expect(files, `Referências a community_posts em hooks de posts: ${files.join(', ')}`).toHaveLength(0);
  });

  // ── Campos legados em posts ───────────────────────────────────────────────

  it('PostService não usa city/neighborhood/street como filtro de posts', () => {
    const content = readSrc('src/core/posts/services/PostService.ts');
    // Permitir apenas em comentários ou strings de profile (neighborhood de profile é legítimo)
    // Proibir: .eq("city", ...) ou .eq("neighborhood", ...) ou .eq("street", ...) em contexto de posts
    expect(content).not.toMatch(/\.eq\("city"/);
    expect(content).not.toMatch(/\.eq\("neighborhood"/);
    expect(content).not.toMatch(/\.eq\("street"/);
  });

  it('PostService não escreve texto/autor_id em posts', () => {
    const content = readSrc('src/core/posts/services/PostService.ts');
    expect(content).not.toMatch(/updateData\.texto\s*=/);
    expect(content).not.toMatch(/updateData\.autor_id\s*=/);
    expect(content).not.toMatch(/insert.*autor_id/s);
  });

  it('types.ts não tem LocationFilter com city/neighborhood/street', () => {
    const content = readSrc('src/core/posts/types.ts');
    // LocationFilter não deve mais existir
    expect(content).not.toMatch(/interface LocationFilter/);
  });

  it('UnifiedPost não tem city/neighborhood/street/autor_id/texto', () => {
    const content = readSrc('src/shared/types/posts.ts');
    expect(content).not.toMatch(/\bcity\?:/);
    expect(content).not.toMatch(/\bneighborhood\?:/);
    expect(content).not.toMatch(/\bstreet\?:/);
    expect(content).not.toMatch(/\bautor_id\b/);
    expect(content).not.toMatch(/\btexto\?:/);
  });

  it('CommunityPost (Post.ts) não tem city/neighborhood/rua/street', () => {
    const content = readSrc('src/core/posts/types/Post.ts');
    expect(content).not.toMatch(/\bcity\?:/);
    expect(content).not.toMatch(/\bneighborhood\?:/);
    expect(content).not.toMatch(/\brua\?:/);
    expect(content).not.toMatch(/\bstreet\?:/);
  });

  // ── PostAdapter sem passthrough legado ───────────────────────────────────

  it('PostAdapter não passa city/neighborhood/street para UnifiedPost', () => {
    const content = readSrc('src/core/posts/adapters/PostAdapter.ts');
    expect(content).not.toMatch(/city:\s*post\./);
    expect(content).not.toMatch(/neighborhood:\s*post\./);
    expect(content).not.toMatch(/street:\s*post\./);
  });

  // ── usePostCard sem fallback legado ──────────────────────────────────────

  it('usePostCard não usa city/neighborhood/street como fallback de localização', () => {
    // Buscar o arquivo usePostCard em qualquer subpasta
    const files = glob.sync('src/**/usePostCard.ts', { cwd: process.cwd() });
    expect(files.length).toBeGreaterThan(0);
    const content = readSrc(files[0]);
    expect(content).not.toMatch(/\|\|\s*city/);
    expect(content).not.toMatch(/\|\|\s*neighborhood/);
    expect(content).not.toMatch(/\|\|\s*street/);
  });

  // ── createPost com location_id obrigatório ────────────────────────────────

  it('createPost no PostService exige location_id', () => {
    const content = readSrc('src/core/posts/services/PostService.ts');
    expect(content).toMatch(/location_id.*obrigatório|LOCATION_REQUIRED/);
  });

  it('useCreatePost usa location_id do activeProfile', () => {
    const files = glob.sync('src/**/useCreatePost.ts', { cwd: process.cwd() });
    expect(files.length).toBeGreaterThan(0);
    const content = readSrc(files[0]);
    expect(content).toMatch(/location_id.*activeProfile|activeProfile.*location/i);
  });

});
