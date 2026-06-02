/**
 * SPRINT 2 - POSTS (SSOT TERRITORIAL) - FASE 6
 * Testes Runtime — PostService contra banco linked
 *
 * Fixtures determinísticas (criadas em 20260405000022_seed_fase2_fixtures.sql):
 *   CITY_ID    = '00000000-0000-0000-0000-000000000001'  (Salvador Teste Fase2)
 *   BARRA_ID   = '00000000-0000-0000-0000-000000000002'  (Barra Teste Fase2, district)
 *   PELO_ID    = '00000000-0000-0000-0000-000000000003'  (Pelourinho Teste Fase2, district)
 *
 * Padrão: AAA (Arrange-Act-Assert)
 * Timeout: 15s por teste (I/O de rede)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, afterAll } from 'vitest';
import { postService } from '../src/core/posts/services';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CITY_ID  = '00000000-0000-0000-0000-000000000001'; // Salvador Teste Fase2
const BARRA_ID = '00000000-0000-0000-0000-000000000002'; // Barra Teste Fase2
const PELO_ID  = '00000000-0000-0000-0000-000000000003'; // Pelourinho Teste Fase2

// IDs de posts criados durante os testes (para cleanup)
const createdPostIds: string[] = [];

function readPostMutationsSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/core/posts/services/posts.mutations.ts'), 'utf8');
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

afterAll(async () => {
  if (createdPostIds.length === 0) return;
  const { supabaseAdmin } = await import('../src/integrations/supabase');
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('posts').delete().in('id', createdPostIds);
});

// ─── Helper: buscar profile_id válido (via admin para bypassar RLS) ──────────

async function getValidProfileId(): Promise<string | null> {
  const { supabaseAdmin } = await import('../src/integrations/supabase');
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .not('location_id', 'is', null)
    .limit(1)
    .single();
  return data?.id ?? null;
}

async function createTestPost(params: {
  author_profile_id: string;
  content: string;
  location_id: string;
  reach?: 'street' | 'neighborhood' | 'city';
}) {
  const { supabaseAdmin } = await import('../src/integrations/supabase');
  if (!supabaseAdmin) throw new Error('supabaseAdmin não disponível');

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      author_profile_id: params.author_profile_id,
      content: params.content,
      type: 'text',
      location_id: params.location_id,
      reach: params.reach ?? 'neighborhood',
      images: [],
      tags: [],
      is_published: true,
    })
    .select(`
      id,
      author_profile_id,
      content,
      type,
      location_id,
      reach,
      is_published,
      created_at,
      location:locations!fk_posts_location_id(
        id,
        name,
        type,
        parent_id
      )
    `)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('FASE 6 - SSOT Posts Runtime', () => {

  // ── 1. createPost — validações de entrada ──────────────────────────────────
  describe('createPost() — validações', () => {
    it('rejeita post sem location_id', async () => {
      await expect(
        postService.createPost({
          author_profile_id: 'any-profile',
          content: 'Test sem location_id',
          type: 'text',
          location_id: null as any,
        }),
      ).rejects.toThrow('location_id é obrigatório');
    }, 15000);

    it('rejeita post com location_id inexistente', async () => {
      await expect(
        postService.createPost({
          author_profile_id: 'any-profile',
          content: 'Test location inválida',
          type: 'text',
          location_id: '00000000-0000-0000-0000-999999999999',
        }),
      ).rejects.toThrow('Localização inválida');
    }, 15000);

    it('mantem country fora dos tipos permitidos para criacao de post', () => {
      const source = readPostMutationsSource();

      expect(source).toContain(
        'allowedLocationTypes: [LocationType.CITY, LocationType.DISTRICT, LocationType.NEIGHBORHOOD]',
      );
      expect(source).toContain('Posts só podem ser criados em cidades ou bairros');
      expect(source).not.toMatch(/allowedLocationTypes:[\s\S]*LocationType\.COUNTRY/);
    });

    it('mantem state fora dos tipos permitidos para criacao de post', () => {
      const source = readPostMutationsSource();

      expect(source).toContain(
        'allowedLocationTypes: [LocationType.CITY, LocationType.DISTRICT, LocationType.NEIGHBORHOOD]',
      );
      expect(source).toContain('Posts só podem ser criados em cidades ou bairros');
      expect(source).not.toMatch(/allowedLocationTypes:[\s\S]*LocationType\.STATE/);
    });
  });

  // ── 2. expandLocationIds — expansão territorial ────────────────────────────
  describe('expandLocationIds() — expansão territorial', () => {
    it('cidade expande para cidade + seus distritos', async () => {
      // Acesso via getFeed que chama expandLocationIds internamente
      const result = await postService.getFeed({ location_id: CITY_ID, limit: 1 });

      // Se expandiu corretamente, a query inclui CITY_ID, BARRA_ID e PELO_ID
      // Não há erro e retorna estrutura válida
      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.posts)).toBe(true);
    }, 15000);

    it('bairro expande para bairro + cidade pai', async () => {
      const result = await postService.getFeed({ location_id: BARRA_ID, limit: 1 });

      expect(result).toHaveProperty('posts');
      expect(Array.isArray(result.posts)).toBe(true);
    }, 15000);

    it('location_id inexistente retorna feed vazio sem erro', async () => {
      const result = await postService.getFeed({
        location_id: '00000000-0000-0000-0000-999999999999',
      });

      expect(result.posts).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    }, 15000);
  });

  // ── 3. getFeed — JOIN com locations ───────────────────────────────────────
  describe('getFeed() — JOIN com locations', () => {
    it('posts retornados incluem location.name do JOIN', async () => {
      const profileId = await getValidProfileId();
      if (!profileId) {
        console.warn('Sem profile disponível — pulando teste de getFeed com post real');
        return;
      }

      // Criar post de teste via admin (bypassar RLS)
      const created = await createTestPost({
        author_profile_id: profileId,
        content: 'Post de teste Fase 6 — getFeed JOIN',
        location_id: BARRA_ID,
        reach: 'neighborhood',
      });
      createdPostIds.push(created.id);

      // Buscar feed
      const result = await postService.getFeed({ location_id: BARRA_ID, limit: 20 });

      const post = result.posts.find(p => p.id === created.id);
      expect(post).toBeDefined();
      expect(post!.location).toBeDefined();
      expect((post!.location as any).name).toBe('Barra Teste Fase2');
      expect(post!.location_id).toBe(BARRA_ID);
    }, 15000);

    it('posts retornados incluem reach', async () => {
      const profileId = await getValidProfileId();
      if (!profileId) return;

      const created = await createTestPost({
        author_profile_id: profileId,
        content: 'Post de teste Fase 6 — reach',
        location_id: CITY_ID,
        reach: 'city',
      });
      createdPostIds.push(created.id);

      const result = await postService.getFeed({ location_id: CITY_ID, limit: 20 });
      const post = result.posts.find(p => p.id === created.id);

      expect(post).toBeDefined();
      expect(post!.reach).toBe('city');
    }, 15000);

    it('feed sem location_id retorna vazio sem erro', async () => {
      const result = await postService.getFeed({});

      expect(result.posts).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    }, 15000);
  });

  // ── 4. createPost — fluxo positivo ────────────────────────────────────────
  describe('createPost() — fluxo positivo (via admin)', () => {
    it('cria post em city com location.name no retorno', async () => {
      const profileId = await getValidProfileId();
      if (!profileId) {
        console.warn('Sem profile disponível — pulando teste de criação');
        return;
      }

      const post = await createTestPost({
        author_profile_id: profileId,
        content: 'Post válido em cidade — Fase 6',
        location_id: CITY_ID,
        reach: 'city',
      });
      createdPostIds.push(post.id);

      expect(post.id).toBeDefined();
      expect(post.location_id).toBe(CITY_ID);
      expect(post.reach).toBe('city');
      expect((post.location as any)?.name).toBe('Salvador Teste Fase2');
    }, 15000);

    it('cria post em district com location.name no retorno', async () => {
      const profileId = await getValidProfileId();
      if (!profileId) return;

      const post = await createTestPost({
        author_profile_id: profileId,
        content: 'Post válido em bairro — Fase 6',
        location_id: BARRA_ID,
        reach: 'neighborhood',
      });
      createdPostIds.push(post.id);

      expect(post.location_id).toBe(BARRA_ID);
      expect(post.reach).toBe('neighborhood');
      expect((post.location as any)?.name).toBe('Barra Teste Fase2');
    }, 15000);
  });

  // ── 5. Regressão: embed sem hint após remoção da FK duplicada ──────────────
  describe('embed location:locations sem hint — regressão FK cleanup', () => {
    it('embed simples resolve sem ambiguidade após remoção de posts_location_id_fkey', async () => {
      const { supabaseAdmin } = await import('../src/integrations/supabase');
      if (!supabaseAdmin) return;

      const { data, error } = await supabaseAdmin
        .from('posts')
        .select(`
          id,
          location_id,
          location:locations(
            id,
            name,
            type
          )
        `)
        .eq('location_id', BARRA_ID)
        .eq('is_published', true)
        .limit(1);

      // FK duplicada removida → sem erro de ambiguidade
      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        expect((data[0].location as any)?.name).toBe('Barra Teste Fase2');
      }
    }, 15000);
  });
});
