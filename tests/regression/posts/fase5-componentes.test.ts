/**
 * SPRINT 2 - POSTS (SSOT TERRITORIAL) - FASE 5
 * Testes de Componentes
 * 
 * Objetivo: Validar que componentes usam location.name e location_id (SSOT)
 */

import { describe, it, expect } from 'vitest';
import { PostAdapter } from '@/core/posts/adapters/PostAdapter';
import type { UnifiedPost } from '@/shared/types/posts';

describe('FASE 5 - Componentes', () => {
  describe('PostAdapter.fromServicePost()', () => {
    it('deve incluir location do JOIN', () => {
      const servicePost = {
        id: 'post-1',
        author_profile_id: 'profile-1',
        content: 'Test post',
        type: 'text',
        location_id: 'location-1',
        location: {
          id: 'location-1',
          name: 'Barra',
          type: 'district',
        },
        author_profile: {
          name: 'Test User',
        },
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
      };

      const unified = PostAdapter.fromServicePost(servicePost);

      expect(unified.location).toEqual({
        id: 'location-1',
        name: 'Barra',
        type: 'district',
      });
      expect(unified.location_id).toBe('location-1');
    });

    it('deve incluir location_id para cálculo de proximidade', () => {
      const servicePost = {
        id: 'post-1',
        author_profile_id: 'profile-1',
        content: 'Test post',
        type: 'text',
        location_id: 'location-1',
        author_profile: {
          name: 'Test User',
        },
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
      };

      const unified = PostAdapter.fromServicePost(servicePost);

      expect(unified.location_id).toBe('location-1');
    });
  });

  describe('PostAdapter.calculateProximity()', () => {
    it('posts do mesmo location_id devem ranquear acima', () => {
      const posts: UnifiedPost[] = [
        {
          id: 'post-1',
          type: 'text',
          author_profile_id: 'profile-1',
          author_name: 'User 1',
          content: 'Post 1',
          location_id: 'location-1',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
        {
          id: 'post-2',
          type: 'text',
          author_profile_id: 'profile-2',
          author_name: 'User 2',
          content: 'Post 2',
          location_id: 'location-2',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
        {
          id: 'post-3',
          type: 'text',
          author_profile_id: 'profile-3',
          author_name: 'User 3',
          content: 'Post 3',
          location_id: 'location-1',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'nearby', {
        location_id: 'location-1',
      });

      expect(sorted[0].id).toBe('post-1');
      expect(sorted[1].id).toBe('post-3');
      expect(sorted[2].id).toBe('post-2');
    });

    it('posts sem location_id devem ter menor prioridade', () => {
      const posts: UnifiedPost[] = [
        {
          id: 'post-1',
          type: 'text',
          author_profile_id: 'profile-1',
          author_name: 'User 1',
          content: 'Post sem location_id',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
        {
          id: 'post-2',
          type: 'text',
          author_profile_id: 'profile-2',
          author_name: 'User 2',
          content: 'Post com location_id',
          location_id: 'location-1',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'nearby', {
        location_id: 'location-1',
      });

      expect(sorted[0].id).toBe('post-2');
      expect(sorted[1].id).toBe('post-1');
    });
  });

  describe('Arquitetura Conceitual', () => {
    it('PostAdapter NÃO deve usar comparação textual de localização como regra principal', () => {
      const posts: UnifiedPost[] = [
        {
          id: 'post-1',
          type: 'text',
          author_profile_id: 'profile-1',
          author_name: 'User 1',
          content: 'Post 1',
          location_id: 'location-1',
          neighborhood: 'Barra',
          city: 'Salvador',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
        {
          id: 'post-2',
          type: 'text',
          author_profile_id: 'profile-2',
          author_name: 'User 2',
          content: 'Post 2',
          location_id: 'location-2',
          neighborhood: 'Barra',
          city: 'Salvador',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'nearby', {
        location_id: 'location-1',
        neighborhood: 'Pelourinho',
        city: 'Salvador',
      });

      expect(sorted[0].id).toBe('post-1');
    });

    it('UnifiedPost deve suportar location como objeto do JOIN', () => {
      const post: UnifiedPost = {
        id: 'post-1',
        type: 'text',
        author_profile_id: 'profile-1',
        author_name: 'User 1',
        content: 'Post 1',
        location: {
          name: 'Barra',
          type: 'district',
        },
        location_id: 'location-1',
        likes_count: 0,
        comments_count: 0,
        created_at: '2026-04-05T10:00:00Z',
      };

      expect(post.location).toHaveProperty('name');
      expect(typeof post.location).toBe('object');
    });
  });

  describe('Zero Regressão', () => {
    it('PostAdapter.sortPosts() deve continuar funcionando com critério "recent"', () => {
      const posts: UnifiedPost[] = [
        {
          id: 'post-1',
          type: 'text',
          author_profile_id: 'profile-1',
          author_name: 'User 1',
          content: 'Post 1',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
        {
          id: 'post-2',
          type: 'text',
          author_profile_id: 'profile-2',
          author_name: 'User 2',
          content: 'Post 2',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T11:00:00Z',
        },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'recent');

      expect(sorted[0].id).toBe('post-2');
      expect(sorted[1].id).toBe('post-1');
    });

    it('PostAdapter.sortPosts() deve continuar funcionando com critério "popular"', () => {
      const posts: UnifiedPost[] = [
        {
          id: 'post-1',
          type: 'text',
          author_profile_id: 'profile-1',
          author_name: 'User 1',
          content: 'Post 1',
          likes_count: 5,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
        {
          id: 'post-2',
          type: 'text',
          author_profile_id: 'profile-2',
          author_name: 'User 2',
          content: 'Post 2',
          likes_count: 10,
          comments_count: 0,
          created_at: '2026-04-05T11:00:00Z',
        },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'popular');

      expect(sorted[0].id).toBe('post-2');
      expect(sorted[1].id).toBe('post-1');
    });
  });
});
