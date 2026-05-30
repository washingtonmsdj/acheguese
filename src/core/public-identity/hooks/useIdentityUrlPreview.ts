/**
 * useIdentityUrlPreview
 * Hook puro (sem IO) que computa a URL pública de um identificador.
 * Cada domínio injeta sua própria função de preview.
 */

import { useMemo } from 'react';
import { buildBusinessPublicUrlPreview } from '@/core/business/utils/businessPublicUrls';
import { COMMUNICATION_CHANNEL_URL_PREVIEW_PATTERN } from '@/core/communication-territorial/utils/communicationTerritorialUrls';
import { professionalPublicRoutes } from '@/core/professional/routes/professionalPublicRoutes';
import type { EntityType } from '@/core/public-identity/domain/types';

export type UrlPreviewFn = (identifier: string) => string;

/** Funções de preview por domínio - sem estado, sem IO */
export const URL_PREVIEW_FNS: Record<EntityType, UrlPreviewFn> = {
  business: buildBusinessPublicUrlPreview,
  profile: (username) => (username ? `/u/${username}` : ''),
  professional: (slug) => (slug ? professionalPublicRoutes.detailPreview(slug) : ''),
  communication_channel: (slug) => (slug ? COMMUNICATION_CHANNEL_URL_PREVIEW_PATTERN.replace(":canal", slug) : ''),
};

export interface UseIdentityUrlPreviewOptions {
  entityType: EntityType;
  identifier: string;
  /** Sobrescreve a função de preview padrão (ex: business premium usa /p/:slug) */
  previewFn?: UrlPreviewFn;
}

export function useIdentityUrlPreview({
  entityType,
  identifier,
  previewFn,
}: UseIdentityUrlPreviewOptions): string {
  return useMemo(() => {
    const defaultFn =
      entityType === 'business'
        ? URL_PREVIEW_FNS.business
        : entityType === 'profile'
          ? URL_PREVIEW_FNS.profile
          : entityType === 'professional'
            ? URL_PREVIEW_FNS.professional
            : URL_PREVIEW_FNS.communication_channel;
    const fn = previewFn ?? defaultFn;
    return fn(identifier);
  }, [entityType, identifier, previewFn]);
}
