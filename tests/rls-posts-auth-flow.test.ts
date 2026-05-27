/// <reference types="vite/client" />

/**
 * VALIDAÇÃO RLS/AUTH FLOW — Posts
 * Prova ponta a ponta com usuário autenticado comum (sem service_role)
 *
 * Fixtures (criadas em 20260405000028_seed_rls_test_users.sql):
 *
 *   USER_A  = 'fa000000-0000-0000-0000-000000000001'  rls-user-a@test.local
 *   PROF_A  = '68d9110d-5c11-4394-a205-bea06c2a9105'  personal, Barra Teste Fase2
 *
 *   USER_B  = 'fb000000-0000-0000-0000-000000000001'  rls-user-b@test.local
 *   PROF_B  = '24e5306d-4bcc-4081-8464-85ac70ebec6b'  personal, Salvador Teste Fase2
 *   PROF_B2 = 'fb000000-0000-0000-0000-000000000002'  business, Salvador Teste Fase2
 *
 * Regras:
 *   - supabaseAdmin usado APENAS em setup/teardown
 *   - Ações validadas usam cliente autenticado como usuário comum
 *   - Timeout 20s por teste (I/O de rede + auth)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// ─── Constantes ──────────────────────────────────────────────────────────────

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const RUN_RLS_REAL_TESTS = process.env.RUN_RLS_REAL_TESTS === '1';
const describeRls = RUN_RLS_REAL_TESTS ? describe : describe.skip;

const USER_A_EMAIL = process.env.RLS_USER_A_EMAIL ?? 'rls-user-a@test.local';
const USER_A_PASS  = process.env.RLS_USER_A_PASS ?? 'RlsTestA123!';
const USER_B_EMAIL = process.env.RLS_USER_B_EMAIL ?? 'rls-user-b@test.local';
const USER_B_PASS  = process.env.RLS_USER_B_PASS ?? 'RlsTestB123!';

const PROF_A  = 'e114b313-3d76-452b-8dca-3bb8079ca59e'; // personal User A
const PROF_B  = '6fb6aa61-7b40-4deb-867a-72688d1bccc1'; // personal User B
const PROF_B2 = '5acc8b86-8dc7-44c6-8ab6-707f86e101f2'; // business User B

const LOC_BARRA    = process.env.RLS_LOC_BARRA_ID ?? '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3';
const LOC_SALVADOR = process.env.RLS_LOC_SALVADOR_ID ?? '63c41c29-adce-40f5-a552-e52d176123c3';
const LOC_INVALID  = '00000000-0000-0000-0000-999999999999';

// ─── Clientes autenticados ────────────────────────────────────────────────────

// Clientes separados por usuário — cada um mantém sua própria sessão
const clientA = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const clientB = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});
// Cliente anon puro (sem autenticação)
const clientAnon = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── IDs de posts criados nos testes (para cleanup) ──────────────────────────

const createdPostIds: string[] = [];

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Autenticar User A e User B
  const [resA, resB] = await Promise.all([
    clientA.auth.signInWithPassword({ email: USER_A_EMAIL, password: USER_A_PASS }),
    clientB.auth.signInWithPassword({ email: USER_B_EMAIL, password: USER_B_PASS }),
  ]);

  if (resA.error) throw new Error(`Auth User A falhou: ${resA.error.message}`);
  if (resB.error) throw new Error(`Auth User B falhou: ${resB.error.message}`);
}, 30000);

afterAll(async () => {
  // Cleanup via admin (não via RLS)
  if (createdPostIds.length > 0) {
    const { supabaseAdmin } = await import('../src/integrations/supabase');
    if (supabaseAdmin) {
      await supabaseAdmin.from('posts').delete().in('id', createdPostIds);
    }
  }
  await Promise.all([clientA.auth.signOut(), clientB.auth.signOut()]);
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function insertPost(client: any, params: {
  profile_id: string;
  location_id: string;
  content?: string;
  reach?: string;
}) {
  return client.from('posts').insert({
    author_profile_id: params.profile_id,
    content: params.content ?? 'Post de teste RLS',
    type: 'text',
    location_id: params.location_id,
    reach: params.reach ?? 'neighborhood',
    images: [],
    tags: [],
    is_published: true,
  }).select('id, author_profile_id, location_id, reach').single();
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describeRls('RLS Posts — Auth Flow Real', () => {

  // ── 1. posts_create ────────────────────────────────────────────────────────
  describe('posts_create', () => {
    it('User A cria post com profile próprio → sucesso', async () => {
      const { data, error } = await insertPost(clientA, {
        profile_id: PROF_A,
        location_id: LOC_BARRA,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.author_profile_id).toBe(PROF_A);
      createdPostIds.push(data!.id);
    }, 20000);

    it('User A tenta criar post com profile de User B → falha RLS', async () => {
      const { data, error } = await insertPost(clientA, {
        profile_id: PROF_B,  // profile de outro usuário
        location_id: LOC_BARRA,
      });

      expect(error).not.toBeNull();
      // RLS rejeita: profiles.user_id ≠ auth.uid()
      expect(data).toBeNull();
    }, 20000);

    it('User A tenta criar post com location_id inválido → falha (trigger/FK)', async () => {
      const { data, error } = await insertPost(clientA, {
        profile_id: PROF_A,
        location_id: LOC_INVALID,
      });

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    }, 20000);

    it('User B cria post com profile business próprio (multi-profile) → sucesso', async () => {
      const { data, error } = await insertPost(clientB, {
        profile_id: PROF_B2,  // profile business de B
        location_id: LOC_SALVADOR,
        content: 'Post multi-profile business User B',
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.author_profile_id).toBe(PROF_B2);
      createdPostIds.push(data!.id);
    }, 20000);
  });

  // ── 2. posts_read_published ────────────────────────────────────────────────
  describe('posts_read_published', () => {
    let publicPostId: string;

    beforeAll(async () => {
      // Criar post público de User A via admin (setup)
      const { supabaseAdmin } = await import('../src/integrations/supabase');
      const { data } = await supabaseAdmin!.from('posts').insert({
        author_profile_id: PROF_A,
        content: 'Post público para leitura RLS',
        type: 'text',
        location_id: LOC_BARRA,
        reach: 'city',
        images: [], tags: [],
        is_published: true,
      }).select('id').single();
      publicPostId = data!.id;
      createdPostIds.push(publicPostId);
    }, 20000);

    it('User B lê post publicado de User A → sucesso (leitura pública)', async () => {
      const { data, error } = await clientB
        .from('posts')
        .select('id, author_profile_id, is_published')
        .eq('id', publicPostId)
        .single();

      expect(error).toBeNull();
      expect(data!.id).toBe(publicPostId);
      expect(data!.is_published).toBe(true);
    }, 20000);

    it('Cliente anon lê post publicado → sucesso (sem autenticação)', async () => {
      const { data, error } = await clientAnon
        .from('posts')
        .select('id, is_published')
        .eq('id', publicPostId)
        .single();

      expect(error).toBeNull();
      expect(data!.is_published).toBe(true);
    }, 20000);
  });

  // ── 3. posts_read_own ──────────────────────────────────────────────────────
  describe('posts_read_own', () => {
    let ownPostId: string;

    beforeAll(async () => {
      // Criar post não publicado de User A via admin
      const { supabaseAdmin } = await import('../src/integrations/supabase');
      const { data } = await supabaseAdmin!.from('posts').insert({
        author_profile_id: PROF_A,
        content: 'Post não publicado — só User A vê',
        type: 'text',
        location_id: LOC_BARRA,
        reach: 'neighborhood',
        images: [], tags: [],
        is_published: false,
      }).select('id').single();
      ownPostId = data!.id;
      createdPostIds.push(ownPostId);
    }, 20000);

    it('User A lê próprio post não publicado → sucesso (posts_read_own)', async () => {
      const { data, error } = await clientA
        .from('posts')
        .select('id, is_published')
        .eq('id', ownPostId)
        .single();

      expect(error).toBeNull();
      expect(data!.id).toBe(ownPostId);
    }, 20000);

    it('User B não vê post não publicado de User A → retorna vazio', async () => {
      const { data, error } = await clientB
        .from('posts')
        .select('id')
        .eq('id', ownPostId)
        .maybeSingle();

      // RLS: is_published=false e não é dono → não retorna
      expect(error).toBeNull();
      expect(data).toBeNull();
    }, 20000);
  });

  // ── 4. posts_update_own ────────────────────────────────────────────────────
  describe('posts_update_own', () => {
    let postToUpdate: string;

    beforeAll(async () => {
      const { supabaseAdmin } = await import('../src/integrations/supabase');
      const { data } = await supabaseAdmin!.from('posts').insert({
        author_profile_id: PROF_A,
        content: 'Post para atualizar',
        type: 'text',
        location_id: LOC_BARRA,
        reach: 'neighborhood',
        images: [], tags: [],
        is_published: true,
      }).select('id').single();
      postToUpdate = data!.id;
      createdPostIds.push(postToUpdate);
    }, 20000);

    it('User A edita próprio post → sucesso', async () => {
      const { error } = await clientA
        .from('posts')
        .update({ content: 'Conteúdo atualizado por User A' })
        .eq('id', postToUpdate);

      expect(error).toBeNull();
    }, 20000);

    it('User B tenta editar post de User A → falha RLS', async () => {
      const { error, count } = await clientB
        .from('posts')
        .update({ content: 'Tentativa de edição indevida' })
        .eq('id', postToUpdate);

      // RLS bloqueia: nenhuma linha afetada ou erro
      // Supabase retorna error null mas 0 rows afetadas quando RLS bloqueia UPDATE
      if (error) {
        expect(error).not.toBeNull();
      } else {
        // Verificar que o conteúdo não foi alterado
        const { supabaseAdmin } = await import('../src/integrations/supabase');
        const { data } = await supabaseAdmin!
          .from('posts').select('content').eq('id', postToUpdate).single();
        expect(data!.content).toBe('Conteúdo atualizado por User A');
      }
    }, 20000);
  });

  // ── 5. posts_delete_own ────────────────────────────────────────────────────
  describe('posts_delete_own', () => {
    let postToDeleteA: string;
    let postToDeleteB: string;

    beforeAll(async () => {
      const { supabaseAdmin } = await import('../src/integrations/supabase');
      const [resA, resB] = await Promise.all([
        supabaseAdmin!.from('posts').insert({
          author_profile_id: PROF_A, content: 'Post A para deletar',
          type: 'text', location_id: LOC_BARRA, reach: 'neighborhood',
          images: [], tags: [], is_published: true,
        }).select('id').single(),
        supabaseAdmin!.from('posts').insert({
          author_profile_id: PROF_B, content: 'Post B para deletar',
          type: 'text', location_id: LOC_SALVADOR, reach: 'neighborhood',
          images: [], tags: [], is_published: true,
        }).select('id').single(),
      ]);
      postToDeleteA = resA.data!.id;
      postToDeleteB = resB.data!.id;
      createdPostIds.push(postToDeleteA, postToDeleteB);
    }, 20000);

    it('User A tenta deletar post de User B → falha RLS (post permanece)', async () => {
      await clientA.from('posts').delete().eq('id', postToDeleteB);

      // Verificar via admin que o post ainda existe
      const { supabaseAdmin } = await import('../src/integrations/supabase');
      const { data } = await supabaseAdmin!
        .from('posts').select('id').eq('id', postToDeleteB).maybeSingle();
      expect(data).not.toBeNull();
    }, 20000);

    it('User A deleta próprio post → sucesso (post removido)', async () => {
      const { error } = await clientA
        .from('posts').delete().eq('id', postToDeleteA);

      expect(error).toBeNull();

      // Verificar via admin que o post foi removido
      const { supabaseAdmin } = await import('../src/integrations/supabase');
      const { data } = await supabaseAdmin!
        .from('posts').select('id').eq('id', postToDeleteA).maybeSingle();
      expect(data).toBeNull();

      // Remover da lista de cleanup (já deletado)
      const idx = createdPostIds.indexOf(postToDeleteA);
      if (idx > -1) createdPostIds.splice(idx, 1);
    }, 20000);
  });

  // ── 6. Multi-profile ───────────────────────────────────────────────────────
  describe('multi-profile', () => {
    it('User B cria post com profile pessoal → author_profile_id = PROF_B', async () => {
      const { data, error } = await insertPost(clientB, {
        profile_id: PROF_B,
        location_id: LOC_SALVADOR,
        content: 'Post multi-profile pessoal',
      });

      expect(error).toBeNull();
      expect(data!.author_profile_id).toBe(PROF_B);
      createdPostIds.push(data!.id);
    }, 20000);

    it('User B cria post com profile business → author_profile_id = PROF_B2', async () => {
      const { data, error } = await insertPost(clientB, {
        profile_id: PROF_B2,
        location_id: LOC_SALVADOR,
        content: 'Post multi-profile business',
      });

      expect(error).toBeNull();
      expect(data!.author_profile_id).toBe(PROF_B2);
      createdPostIds.push(data!.id);
    }, 20000);

    it('User B não consegue criar post com profile de User A (mesmo autenticado)', async () => {
      const { data, error } = await insertPost(clientB, {
        profile_id: PROF_A,  // profile de outro user
        location_id: LOC_SALVADOR,
      });

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    }, 20000);
  });
});
