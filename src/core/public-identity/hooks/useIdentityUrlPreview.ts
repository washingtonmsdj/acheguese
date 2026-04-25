/**
 * useIdentityUrlPreview
 * Hook puro (sem IO) que computa a URL pública de um identificador.
 * Cada domínio injeta sua própria função de preview.
 */

import { useMemo } from 'react';
import type { EntityType } from '@/core/public-identity/domain/types';

export type UrlPreviewFn = (identifier: string) => string;

/** Funções de preview por domínio - sem estado, sem IO */
export const URL_PREVIEW_FNS: Record<EntityType, UrlPreviewFn> = {
  business: (slug) => (slug ? `/empresas/:uf/:cidade/:bairro/${slug}` : ''),
  profile: (username) => (username ? `/u/${username}` : ''),
  professional: (slug) => (slug ? `/profissionais/:uf/:cidade/${slug}` : ''),
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
          : URL_PREVIEW_FNS.professional;
    const fn = previewFn ?? defaultFn;
    return fn(identifier);
  }, [entityType, identifier, previewFn]);
}
