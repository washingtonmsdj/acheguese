/**
 * useEcosystemSummary
 *
 * Busca contagens reais do ecossistema para o hub /perfil.
 * Usa apenas services existentes — zero acesso direto ao banco de dados.
 *
 * Strategy de loading:
 *   - posts e classificados: carregados juntos (rápidos, dependem do profileId)
 *   - links e members: carregados em paralelo, assíncronos independentes
 *   - cada grupo tem seu próprio loading flag para não bloquear a UI
 */

import { useState, useEffect } from 'react';
import { postService } from '@/core/posts/services';
import { getUserClassifieds } from '@/shared/services/classifieds';
import { ProfileLinksService } from '@/core/profiles/services/multi-profile/profileLinksService';
import { ProfileMembersService } from '@/core/profiles/services/multi-profile/profileMembersService';
import type { ProfileType } from '@/core/profiles/services/multi-profile/types';
import { canProfileHaveMembers } from '../utils/profileDomainRules';

export interface EcosystemSummary {
  postsCount: number;
  classifiedsCount: number;
  linksCount: number;
  membersCount: number;
  loadingContent: boolean;   // posts + classificados
  loadingRelations: boolean; // links + members
}

export function useEcosystemSummary(
  profileId: string | null,
  profileType?: ProfileType | null,
): EcosystemSummary {
  const [postsCount, setPostsCount] = useState(0);
  const [classifiedsCount, setClassifiedsCount] = useState(0);
  const [linksCount, setLinksCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingRelations, setLoadingRelations] = useState(false);

  // Grupo 1: posts + classificados
  useEffect(() => {
    if (!profileId) {
      setPostsCount(0);
      setClassifiedsCount(0);
      setLoadingContent(false);
      return;
    }
    let cancelled = false;
    setLoadingContent(true);

    Promise.all([
      postService.getPostsCountByProfile(profileId).catch(() => 0),
      getUserClassifieds(profileId)
        .then(list => list.length)
        .catch(() => 0),
    ]).then(([posts, classifieds]) => {
      if (cancelled) return;
      setPostsCount(posts);
      setClassifiedsCount(classifieds);
      setLoadingContent(false);
    });

    return () => { cancelled = true; };
  }, [profileId]);

  // Grupo 2: links + members (assíncrono independente)
  useEffect(() => {
    if (!profileId) {
      setLinksCount(0);
      setMembersCount(0);
      setLoadingRelations(false);
      return;
    }
    let cancelled = false;
    setLoadingRelations(true);

    const canHaveMembers = canProfileHaveMembers(profileType);

    Promise.all([
      ProfileLinksService.getProfileLinks(profileId)
        .then(list => list.length)
        .catch(() => 0),
      canHaveMembers
        ? ProfileMembersService.getProfileMembers(profileId)
            .then(list => list.length)
            .catch(() => 0)
        : Promise.resolve(0),
    ]).then(([links, members]) => {
      if (cancelled) return;
      setLinksCount(links);
      setMembersCount(members);
      setLoadingRelations(false);
    });

    return () => { cancelled = true; };
  }, [profileId, profileType]);

  return {
    postsCount,
    classifiedsCount,
    linksCount,
    membersCount,
    loadingContent,
    loadingRelations,
  };
}

