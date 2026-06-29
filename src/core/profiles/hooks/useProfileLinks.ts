/**
 * USE PROFILE LINKS - FASE 4
 * Hook para gerenciar vínculos entre perfis
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { ProfileLinksService } from '../services/multi-profile';
import type { ProfileLink, LinkType } from '../services/multi-profile/types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useProfileLinks(profileId: string | null) {
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    if (!profileId) {
      setLinks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await ProfileLinksService.getProfileLinks(profileId);
      setLinks(data);
    } catch (error: unknown) {
      logger.error('Error loading profile links:', error);
      setError(getErrorMessage(error, 'Failed to load links'));
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const createLink = useCallback(async (
    toProfileId: string,
    linkType: LinkType,
    isPublic: boolean = true,
    displayOrder: number = 0
  ) => {
    if (!profileId) return { success: false, error: 'No profile selected' };

    const result = await ProfileLinksService.createLink(
      profileId,
      toProfileId,
      linkType,
      isPublic,
      displayOrder
    );
    
    if (result.success) {
      await loadLinks();
    }

    return result;
  }, [profileId, loadLinks]);

  const updateLink = useCallback(async (
    linkId: string,
    updates: Partial<Pick<ProfileLink, 'is_public' | 'display_order'>>
  ) => {
    const result = await ProfileLinksService.updateLink(linkId, updates);
    
    if (result.success) {
      await loadLinks();
    }

    return result;
  }, [loadLinks]);

  const deleteLink = useCallback(async (linkId: string) => {
    const result = await ProfileLinksService.deleteLink(linkId);
    
    if (result.success) {
      await loadLinks();
    }

    return result;
  }, [loadLinks]);

  const reorderLinks = useCallback(async (reorderedLinks: Array<{ id: string; display_order: number }>) => {
    const result = await ProfileLinksService.reorderLinks(reorderedLinks);
    
    if (result.success) {
      await loadLinks();
    }

    return result;
  }, [loadLinks]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  return {
    links,
    loading,
    error,
    createLink,
    updateLink,
    deleteLink,
    reorderLinks,
    refetch: loadLinks,
  };
}
