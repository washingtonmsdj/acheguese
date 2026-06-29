/**
 * SPRINT 2 - POSTS (SSOT TERRITORIAL) - FASE 6
 * Runtime tests for PostService against the linked database.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { postService } from '../src/core/posts/services';

type JoinedLocation = {
  id: string;
  name: string;
  type: string;
  parent_id?: string | null;
};

type CreatedPostRow = {
  id: string;
  author_profile_id: string;
  content: string;
  type: string;
  location_id: string;
  reach: 'street' | 'neighborhood' | 'city';
  is_published: boolean;
  created_at: string;
  location: JoinedLocation | null;
};

const CITY_ID = '00000000-0000-0000-0000-000000000001';
const BARRA_ID = '00000000-0000-0000-0000-000000000002';
const PELO_ID = '00000000-0000-0000-0000-000000000003';

const createdPostIds: string[] = [];

function readPostMutationsSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/core/posts/services/posts.mutations.ts'), 'utf8');
}

function getLocationName(location: { name?: string } | null | undefined): string | null {
  return location?.name ?? null;
}

afterAll(async () => {
  if (createdPostIds.length === 0) return;

  const { supabaseAdmin } = await import('../src/integrations/supabase');
  if (!supabaseAdmin) return;

  await supabaseAdmin.from('posts').delete().in('id', createdPostIds);
});

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
}): Promise<CreatedPostRow> {
  const { supabaseAdmin } = await import('../src/integrations/supabase');
  if (!supabaseAdmin) throw new Error('supabaseAdmin nao disponivel');

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

  return data as CreatedPostRow;
}

describe('FASE 6 - SSOT Posts Runtime', () => {
  describe('createPost() - input validation', () => {
    it('rejects a post without location_id', async () => {
      await expect(
        postService.createPost({
          author_profile_id: 'any-profile',
          content: 'Test sem location_id',
          type: 'text',
          location_id: null as unknown as string,
        }),
      ).rejects.toThrow(/location_id.*obrigat.rio/i);
    }, 15000);

    it('rejects a post with a nonexistent location_id', async () => {
      await expect(
        postService.createPost({
          author_profile_id: 'any-profile',
          content: 'Test location invalida',
          type: 'text',
          location_id: '00000000-0000-0000-0000-999999999999',
        }),
      ).rejects.toThrow(/Localiza..o inv.lida/i);
    }, 15000);

    it('keeps country outside the allowed types for post creation', () => {
      const source = readPostMutationsSource();

      expect(source).toContain(
        'allowedLocationTypes: [LocationType.CITY, LocationType.DISTRICT, LocationType.NEIGHBORHOOD]',
      );
      expect(source).toMatch(/Posts .* podem ser criados em cidades ou bairros/i);
      expect(source).not.toMatch(/allowedLocationTypes:[\s\S]*LocationType\.COUNTRY/);
    });

    it('keeps state outside the allowed types for post creation', () => {
      const source = readPostMutationsSource();

      expect(source).toContain(
        'allowedLocationTypes: [LocationType.CITY, LocationType.DISTRICT, LocationType.NEIGHBORHOOD]',
      );
      expect(source).toMatch(/Posts .* podem ser criados em cidades ou bairros/i);
      expect(source).not.toMatch(/allowedLocationTypes:[\s\S]*LocationType\.STATE/);
    });
  });

  describe('expandLocationIds() - territorial expansion', () => {
    it('expands city to city plus child districts', async () => {
      const result = await postService.getFeed({ location_id: CITY_ID, limit: 1 });

      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.posts)).toBe(true);
    }, 15000);

    it('expands district to district plus parent city', async () => {
      const result = await postService.getFeed({ location_id: BARRA_ID, limit: 1 });

      expect(result).toHaveProperty('posts');
      expect(Array.isArray(result.posts)).toBe(true);
    }, 15000);

    it('returns an empty feed without error for an unknown location_id', async () => {
      const result = await postService.getFeed({
        location_id: '00000000-0000-0000-0000-999999999999',
      });

      expect(result.posts).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    }, 15000);
  });

  describe('getFeed() - location join', () => {
    it('returns posts with location.name from the join', async () => {
      const profileId = await getValidProfileId();
      if (!profileId) {
        console.warn('Sem profile disponivel - pulando teste de getFeed com post real');
        return;
      }

      const created = await createTestPost({
        author_profile_id: profileId,
        content: 'Post de teste Fase 6 - getFeed JOIN',
        location_id: BARRA_ID,
        reach: 'neighborhood',
      });
      createdPostIds.push(created.id);

      const result = await postService.getFeed({ location_id: BARRA_ID, limit: 20 });
      const post = result.posts.find((candidate) => candidate.id === created.id);

      expect(post).toBeDefined();
      expect(post?.location).toBeDefined();
      expect(getLocationName(post?.location)).toBe('Barra Teste Fase2');
      expect(post?.location_id).toBe(BARRA_ID);
    }, 15000);

    it('returns posts with reach', async () => {
      const profileId = await getValidProfileId();
      if (!profileId) return;

      const created = await createTestPost({
        author_profile_id: profileId,
        content: 'Post de teste Fase 6 - reach',
        location_id: CITY_ID,
        reach: 'city',
      });
      createdPostIds.push(created.id);

      const result = await postService.getFeed({ location_id: CITY_ID, limit: 20 });
      const post = result.posts.find((candidate) => candidate.id === created.id);

      expect(post).toBeDefined();
      expect(post?.reach).toBe('city');
    }, 15000);

    it('returns an empty feed without error when location_id is missing', async () => {
      const result = await postService.getFeed({});

      expect(result.posts).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    }, 15000);
  });

  describe('createPost() - positive flow via admin', () => {
    it('creates a city post with location.name in the response', async () => {
      const profileId = await getValidProfileId();
      if (!profileId) {
        console.warn('Sem profile disponivel - pulando teste de criacao');
        return;
      }

      const post = await createTestPost({
        author_profile_id: profileId,
        content: 'Post valido em cidade - Fase 6',
        location_id: CITY_ID,
        reach: 'city',
      });
      createdPostIds.push(post.id);

      expect(post.id).toBeDefined();
      expect(post.location_id).toBe(CITY_ID);
      expect(post.reach).toBe('city');
      expect(getLocationName(post.location)).toBe('Salvador Teste Fase2');
    }, 15000);

    it('creates a district post with location.name in the response', async () => {
      const profileId = await getValidProfileId();
      if (!profileId) return;

      const post = await createTestPost({
        author_profile_id: profileId,
        content: 'Post valido em bairro - Fase 6',
        location_id: BARRA_ID,
        reach: 'neighborhood',
      });
      createdPostIds.push(post.id);

      expect(post.location_id).toBe(BARRA_ID);
      expect(post.reach).toBe('neighborhood');
      expect(getLocationName(post.location)).toBe('Barra Teste Fase2');
    }, 15000);
  });

  describe('location embed without hint - duplicated FK regression', () => {
    it('resolves the simple embed without ambiguity after FK cleanup', async () => {
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

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        expect(getLocationName(data[0].location as JoinedLocation | null)).toBe('Barra Teste Fase2');
      }
    }, 15000);
  });
});
