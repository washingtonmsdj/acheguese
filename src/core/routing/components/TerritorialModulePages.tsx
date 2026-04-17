/**
 * TerritorialModulePages
 *
 * Páginas de módulo dentro do contexto territorial.
 * Cada uma renderiza o conteúdo existente do módulo,
 * passando o routeResolved do TerritorialLayout para que
 * os hooks de filtro territorial funcionem corretamente.
 *
 * Padrão: /:country/:state/:city/:district/:module
 *         /:country/:state/:city/:groupSlug/:module
 */

import { lazy, Suspense } from 'react';
import { useTerritorialContext } from './TerritorialLayout';
import { ModulePageLoader } from '@/shared/components/loading/PageLoader';

// Lazy imports dos módulos existentes
const ComunidadePage       = lazy(() => import('@/modules/community/pages/ComunidadePage'));
const EmpresasLandingPage  = lazy(() => import('@/app/pages/EmpresasLandingPage'));
const ServicosPage         = lazy(() => import('@/modules/services/pages/ServicosLandingPage'));
const ClassificadosPage    = lazy(() => import('@/modules/classifieds/pages/ClassificadosPage'));
const EventosPage          = lazy(() => import('@/modules/community/pages/EventosPage'));
const MobilidadePage       = lazy(() => import('@/modules/mobility/pages/MobilidadeLandingPage'));
const VagasPage            = lazy(() => import('@/modules/vagas/pages/VagasPublicPage')); // ✅ Página AAA atualizada
const CategoryBusinessPage = lazy(() => import('@/modules/business/pages/CategoryBusinessPage'));
const MapaPage             = lazy(() => import('@/core/maps/pages/MapaPageV4'));

/**
 * HOC mínimo: injeta routeResolved no contexto do módulo.
 * Os módulos lêem routeResolved via useTerritoryFilter(routeResolved).
 * Por ora, os módulos existentes não recebem props — o TerritoryFilter
 * é resolvido via useTerritorialContext() dentro de useTerritoryFilter.
 * Esta camada garante que o contexto de Outlet está disponível.
 */

export function TerritorialCommunityPage() {
  const { resolved } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <ComunidadePage resolved={resolved} />
    </Suspense>
  );
}

export function TerritorialBusinessPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <EmpresasLandingPage resolved={resolved} activeMemberIds={activeMemberIds} />
    </Suspense>
  );
}

export function TerritorialServicesPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <ServicosPage resolved={resolved} activeMemberIds={activeMemberIds} />
    </Suspense>
  );
}

export function TerritorialClassificadosPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <ClassificadosPage resolved={resolved} activeMemberIds={activeMemberIds} />
    </Suspense>
  );
}

export function TerritorialEventosPage() {
  const { resolved } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <EventosPage resolved={resolved} />
    </Suspense>
  );
}

export function TerritorialMobilidadePage() {
  const { resolved } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <MobilidadePage resolved={resolved} />
    </Suspense>
  );
}

export function TerritorialVagasPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <VagasPage resolved={resolved} activeMemberIds={activeMemberIds} />
    </Suspense>
  );
}

export function TerritorialCategoryBusinessPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <CategoryBusinessPage resolved={resolved} activeMemberIds={activeMemberIds} />
    </Suspense>
  );
}

export function TerritorialMapPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <MapaPage resolved={resolved} activeMemberIds={activeMemberIds} />
    </Suspense>
  );
}
