/**
 * TerritorialIndexPage
 *
 * Index de uma rota territorial — renderiza a landing pública (vitrine).
 * 
 * Lógica de roteamento:
 * - Cidade (ex: /ba/salvador) → CidadeLandingPage (conteúdo rico)
 * - Complexo do Nordeste → ComplexoNordesteLandingPage (landing dedicada)
 * - Bairro/Grupo genérico → TerritorialLandingPage
 */

import { lazy, Suspense } from 'react';
import { TerritorialLandingPage } from './TerritorialLandingPage';
import { useTerritorialContext } from './TerritorialLayout';
import { FullScreenLoader } from '@/shared/components/loading/PageLoader';

const CidadeLandingPage = lazy(() => import('@/app/pages/CidadeLandingPage'));
const ComplexoNordesteLandingPage = lazy(() => import('@/app/pages/ComplexoNordesteLandingPage'));

function getGroupSlug(resolved: ReturnType<typeof useTerritorialContext>['resolved']): string | null {
  if (!resolved || resolved.kind !== 'group') return null;
  return resolved.group.slug || null;
}

export function TerritorialIndexPage() {
  const { resolved } = useTerritorialContext();

  // Cidade → CidadeLandingPage
  if (resolved?.kind === 'location' && resolved.location.type === 'city') {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <CidadeLandingPage />
      </Suspense>
    );
  }

  // Complexo do Nordeste de Amaralina → Landing dedicada
  const groupSlug = getGroupSlug(resolved);
  if (groupSlug === 'complexo-do-nordeste-de-amaralina') {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <ComplexoNordesteLandingPage />
      </Suspense>
    );
  }

  // Caso contrário (bairro ou grupo genérico) → TerritorialLandingPage
  return <TerritorialLandingPage />;
}
