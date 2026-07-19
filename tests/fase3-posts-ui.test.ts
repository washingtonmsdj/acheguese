/**
 * Testes de Validação - Sprint 2 Fase 3
 * Validações objetivas das refatorações de UI/Formulários
 */

import { describe, it, expect } from 'vitest';

describe('Sprint 2 - Fase 3: Formulários e Hooks Refatorados', () => {
  describe('CreatePostModal - Resolução de location_id', () => {
    it('deve ter lógica de resolução de location_id', async () => {
      const { CreatePostModal } = await import('@/core/community/components/composer/CreatePostModal');
      const modalCode = CreatePostModal.toString();

      // Verificar que usa useTerritoryFilter
      expect(modalCode).toContain('useTerritoryFilter');
      
      // Verificar que tem lógica de resolução
      expect(modalCode).toContain('getLocationIdForPost');
      
      // Verificar que usa createPost (não createSimplePost)
      expect(modalCode).toContain('createPost');
    });

    it('deve bloquear quando filter.scope === group', async () => {
      const { CreatePostModal } = await import('@/core/community/components/composer/CreatePostModal');
      const modalCode = CreatePostModal.toString();

      // Verificar que valida scope (pode ser === ou == após compilação)
      expect(modalCode).toMatch(/scope\s*===?\s*["']group["']/);
      
      // Verificar mensagem de erro para grupo
      expect(modalCode).toContain('Selecione uma cidade ou bairro específico para publicar');
    });

    it('deve ter fallback para profile.location_id', async () => {
      const { CreatePostModal } = await import('@/core/community/components/composer/CreatePostModal');
      const modalCode = CreatePostModal.toString();

      // Verificar que usa profile.location_id como fallback
      expect(modalCode).toContain('profile');
      expect(modalCode).toContain('location_id');
    });

    it('deve exibir erro quando não houver localização', async () => {
      const { CreatePostModal } = await import('@/core/community/components/composer/CreatePostModal');
      const modalCode = CreatePostModal.toString();

      // Verificar mensagem de erro para ausência de localização
      expect(modalCode).toContain('Configure sua localização no perfil antes de publicar');
    });

    it('deve passar location_id para createPost', async () => {
      const { CreatePostModal } = await import('@/core/community/components/composer/CreatePostModal');
      const modalCode = CreatePostModal.toString();

      // Verificar que chama createPost com location_id
      expect(modalCode).toContain('location_id:');
      expect(modalCode).toContain('resolvedLocationId');
    });

    it('NÃO deve usar campos legados (city, neighborhood, street)', async () => {
      const { CreatePostModal } = await import('@/core/community/components/composer/CreatePostModal');
      const modalCode = CreatePostModal.toString();

      // Verificar que NÃO usa campos legados em createPost
      // (pode aparecer em comentários ou strings, mas não em lógica)
      const hasLegacyFieldsInLogic = 
        modalCode.includes('city:') || 
        modalCode.includes('neighborhood:') || 
        modalCode.includes('street:');
      
      expect(hasLegacyFieldsInLogic).toBe(false);
    });
  });

  describe('useCreatePostForm - Dados do formulário apenas', () => {
    it('deve gerenciar apenas dados do formulário', async () => {
      const { useCreatePostForm } = await import('@/core/community/hooks/composer/useCreatePostForm');
      const hookCode = useCreatePostForm.toString();

      // Verificar que gerencia content, type, reach, images
      expect(hookCode).toContain('content');
      expect(hookCode).toContain('type');
      expect(hookCode).toContain('reach');
      expect(hookCode).toContain('images');
    });

    it('NÃO deve resolver território por texto', async () => {
      const { useCreatePostForm } = await import('@/core/community/hooks/composer/useCreatePostForm');
      const hookCode = useCreatePostForm.toString();

      // Verificar que NÃO tem lógica de resolução de território
      expect(hookCode).not.toContain('location_id');
      expect(hookCode).not.toContain('territory');
    });

    it('NÃO deve converter reach em location_id', async () => {
      const { useCreatePostForm } = await import('@/core/community/hooks/composer/useCreatePostForm');
      const hookCode = useCreatePostForm.toString();

      // Verificar que reach é apenas metadado
      expect(hookCode).not.toContain('reach === ');
      expect(hookCode).not.toContain('convertReach');
    });
  });

  describe('UnifiedComposer - SSOT territorial', () => {
    it('deve aceitar locationId como prop opcional', async () => {
      const { UnifiedComposer } = await import('@/core/community/components/composer/UnifiedComposer');
      const composerCode = UnifiedComposer.toString();

      // Verificar que aceita locationId (mesmo que não use ainda)
      const propsInterface = composerCode.substring(0, 500);
      expect(propsInterface).toContain('locationId');
    });

    it('NÃO deve propagar city/neighborhood para CreatePostModal', async () => {
      const { UnifiedComposer } = await import('@/core/community/components/composer/UnifiedComposer');
      const composerCode = UnifiedComposer.toString();

      // Verificar que CreatePostModal não recebe city/neighborhood
      const createPostModalCall = composerCode.substring(
        composerCode.indexOf('CreatePostModal'),
        composerCode.indexOf('CreatePostModal') + 200
      );
      
      expect(createPostModalCall).not.toContain('city=');
      expect(createPostModalCall).not.toContain('neighborhood=');
    });

    it('NÃO deve ter novo acoplamento com campos legados', async () => {
      const { UnifiedComposer } = await import('@/core/community/components/composer/UnifiedComposer');
      const composerCode = UnifiedComposer.toString();

      // Verificar que não usa city/neighborhood em lógica nova
      // (pode aparecer em props de outros modais por compatibilidade)
      const hasNewLegacyLogic = 
        composerCode.includes('const city') || 
        composerCode.includes('const neighborhood');
      
      expect(hasNewLegacyLogic).toBe(false);
    });
  });

  describe('Arquitetura Conceitual Correta', () => {
    it('Service valida city/district only', async () => {
      const { postService } = await import('@/core/posts/services');
      const createPostCode = postService.createPost.toString();

      // Verificar que valida type in ['city', 'district']
      expect(createPostCode).toMatch(/LocationType\.CITY|city/);
      expect(createPostCode).toMatch(/LocationType\.DISTRICT|district/);
      expect(createPostCode).toContain('INVALID_LOCATION_TYPE');
    });

    it('UI bloqueia group (não service)', async () => {
      const { CreatePostModal } = await import('@/core/community/components/composer/CreatePostModal');
      const modalCode = CreatePostModal.toString();

      // Verificar que UI bloqueia group (pode ser === ou == após compilação)
      expect(modalCode).toMatch(/scope\s*===?\s*["']group["']/);
      
      // Service não deve ter lógica específica de group
      const { postService } = await import('@/core/posts/services');
      const createPostCode = postService.createPost.toString();
      expect(createPostCode).not.toContain('GROUP_NOT_ALLOWED');
    });

    it('Form gerencia apenas dados do post', async () => {
      const { useCreatePostForm } = await import('@/core/community/hooks/composer/useCreatePostForm');
      const hookCode = useCreatePostForm.toString();

      // Verificar que não tem lógica de território
      expect(hookCode).not.toContain('useTerritoryFilter');
      expect(hookCode).not.toContain('location_id');
    });

    it('Território sempre por location_id', async () => {
      const { CreatePostModal } = await import('@/core/community/components/composer/CreatePostModal');
      const modalCode = CreatePostModal.toString();

      // Verificar que usa location_id (não city/neighborhood/street)
      expect(modalCode).toContain('location_id');
      expect(modalCode).not.toContain('city:');
      expect(modalCode).not.toContain('neighborhood:');
      expect(modalCode).not.toContain('street:');
    });
  });
});
