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

import { Suspense } from 'react';
import type { ComponentType } from 'react';
import { TerritorialLandingPage } from './TerritorialLandingPage';
import { useTerritorialContext } from './TerritorialLayout';
import { FullScreenLoader } from '@/shared/components/loading/PageLoader';

interface TerritorialIndexPageProps {
  CityLandingComponent?: ComponentType;
  ComplexoLandingComponent?: ComponentType;
}

function getGroupSlug(resolved: ReturnType<typeof useTerritorialContext>['resolved']): string | null {
  if (!resolved || resolved.kind !== 'group') return null;
  return resolved.group.slug || null;
}

export function TerritorialIndexPage({
  CityLandingComponent,
  ComplexoLandingComponent,
}: TerritorialIndexPageProps = {}) {
  const { resolved } = useTerritorialContext();

  // Cidade → CidadeLandingPage
  if (resolved?.kind === 'location' && resolved.location.type === 'city') {
    if (!CityLandingComponent) return <TerritorialLandingPage />;
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <CityLandingComponent />
      </Suspense>
    );
  }

  // Complexo do Nordeste de Amaralina → Landing dedicada
  const groupSlug = getGroupSlug(resolved);
  if (groupSlug === 'complexo-do-nordeste-de-amaralina') {
    if (!ComplexoLandingComponent) return <TerritorialLandingPage />;
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <ComplexoLandingComponent />
      </Suspense>
    );
  }

  // Caso contrário (bairro ou grupo genérico) → TerritorialLandingPage
  return <TerritorialLandingPage />;
}
