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
    const fn = previewFn ?? URL_PREVIEW_FNS[entityType];
    return fn(identifier);
  }, [entityType, identifier, previewFn]);
}

