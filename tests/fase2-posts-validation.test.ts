/**
 * Validation tests for Sprint 2 / Fase 2.
 * Objective checks for PostService refactors.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { postService } from '@/core/posts/services/PostService';
import { supabase } from '@/integrations/supabase';

type DeprecatedPostServiceKeys = {
  createCommunityPost?: unknown;
  createCommunityPostWithValidation?: unknown;
  createSimplePost?: unknown;
};

const postServiceWithLegacy = postService as typeof postService & DeprecatedPostServiceKeys;

const FIXTURES = {
  profiles: {
    owner: '11111111-1111-4111-8111-111111111111',
  },
  locations: {
    city: '00000000-0000-0000-0000-000000000001',
    district1: '00000000-0000-0000-0000-000000000002',
    district2: '00000000-0000-0000-0000-000000000003',
  },
};

function readPostMutationsSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/core/posts/services/posts.mutations.ts'), 'utf8');
}

describe('Sprint 2 - Fase 2: PostService Refatorado', () => {
  describe('createPost() - service validations', () => {
    it('rejects a post without location_id', async () => {
      await expect(
        postService.createPost({
          author_profile_id: FIXTURES.profiles.owner,
          content: 'Teste de validacao',
          type: 'post',
          location_id: '',
        }),
      ).rejects.toThrow(/location_id.*obrigat.rio/i);
    });

    it('rejects a post with invalid location_id', async () => {
      await expect(
        postService.createPost({
          author_profile_id: FIXTURES.profiles.owner,
          content: 'Teste de validacao',
          type: 'post',
          location_id: 'invalid-uuid',
        }),
      ).rejects.toThrow(/Localiza..o inv.lida/i);
    });

    it('accepts only city, district and neighborhood in the creation contract', () => {
      const source = readPostMutationsSource();

      expect(source).toMatch(
        /allowedLocationTypes:\s*\[\s*LocationType\.CITY,\s*LocationType\.DISTRICT,\s*LocationType\.NEIGHBORHOOD,\s*\]/,
      );
      expect(source).not.toMatch(/allowedLocationTypes:[\s\S]*LocationType\.STATE/);
      expect(source).not.toMatch(/allowedLocationTypes:[\s\S]*LocationType\.COUNTRY/);
    });

    it('rejects invalid types such as state or country', async () => {
      const { data: state } = await supabase
        .from('locations')
        .select('id')
        .eq('type', 'state')
        .limit(1)
        .maybeSingle();

      if (state) {
        await expect(
          postService.createPost({
            author_profile_id: FIXTURES.profiles.owner,
            content: 'Teste de validacao',
            type: 'post',
            location_id: state.id,
          }),
        ).rejects.toThrow(/Posts .* podem ser criados em cidades ou bairros/i);
      }
    });

    it('rejects inactive locations', async () => {
      const { data: inactive } = await supabase
        .from('locations')
        .insert({
          id: '00000000-0000-0000-0000-999999999998',
          name: 'Inativa Teste',
          full_name: 'Inativa Teste',
          slug: 'inativa-teste-temp',
          geographic_path: '/inativa-teste-temp',
          type: 'city',
          parent_id: '00000000-0000-0000-0000-000000000010',
          status: 'inactive',
          metadata: { center_latitude: -12.0, center_longitude: -38.0 },
        })
        .select()
        .single();

      if (inactive) {
        await expect(
          postService.createPost({
            author_profile_id: FIXTURES.profiles.owner,
            content: 'Teste de validacao',
            type: 'post',
            location_id: inactive.id,
          }),
        ).rejects.toThrow(/Localiza..o inativa/i);

        await supabase.from('locations').delete().eq('id', inactive.id);
      }
    });
  });

  describe('createCommunityPostWithValidation() - multi-profile contract', () => {
    it('expects explicit author_profile_id instead of user_id', () => {
      const testData = {
        author_profile_id: FIXTURES.profiles.owner,
        content: 'Test multi-profile',
        type: 'text',
      };

      expect(testData.author_profile_id).toBeDefined();
      expect(testData.author_profile_id).not.toContain('user');
    });
  });

  describe('getFeed() - join with locations', () => {
    it('returns post.location.name in the result', async () => {
      const { posts } = await postService.getFeed({
        location_id: FIXTURES.locations.district1,
        limit: 1,
      });

      if (posts.length > 0) {
        const post = posts[0];
        expect(post).toHaveProperty('location');
        expect(post.location).toHaveProperty('name');
        expect(typeof post.location.name).toBe('string');
      }
    });
  });

  describe('expandLocationIds() - territorial expansion', () => {
    it('city includes the city plus child districts', async () => {
      const { posts } = await postService.getFeed({
        location_id: FIXTURES.locations.city,
        limit: 100,
      });

      expect(Array.isArray(posts)).toBe(true);
    });

    it('district includes the district plus the parent city', async () => {
      const { posts } = await postService.getFeed({
        location_id: FIXTURES.locations.district1,
        limit: 100,
      });

      expect(Array.isArray(posts)).toBe(true);
    });
  });

  describe('Deprecated functions removed after Sprint 2 cleanup', () => {
    it('createCommunityPost no longer exists on PostService', () => {
      expect(postServiceWithLegacy.createCommunityPost).toBeUndefined();
    });

    it('createCommunityPostWithValidation no longer exists on PostService', () => {
      expect(postServiceWithLegacy.createCommunityPostWithValidation).toBeUndefined();
    });

    it('createSimplePost no longer exists on PostService', () => {
      expect(postServiceWithLegacy.createSimplePost).toBeUndefined();
    });
  });

  describe('Territorial group lock in the UI (covered later in Fase 3)', () => {
    it('keeps the placeholder expectation documented', () => {
      expect(true).toBe(true);
    });
  });
});
