/**
 * TerritorialModulePages
 *
 * Páginas de módulo dentro do contexto territorial.
 * Cada uma renderiza o conteúdo existente do módulo,
 * passando o routeResolved do TerritorialLayout para que
 * os hooks de filtro territorial funcionem corretamente.
 *
 * Padrão: /:state/:city/:district/:module
 *         /:state/:city/:groupSlug/:module
 */

import { lazy, Suspense, type ReactNode } from 'react';
import { Link, useLocation, useOutlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTerritorialContext } from '@/core/routing/components/TerritorialLayout';
import { ModulePageLoader } from '@/shared/components/loading/PageLoader';
import { useCityMetadata } from '@/core/city/hooks/useCityMetadata';
import { resolveFallbackCityStatus, type CityStatus } from '@/core/city/services/CityService';
import { TERRITORY_CONFIG } from '@/config/territory';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';
import { getRequiredRecordValue } from '@/shared/utils/recordLookup';
import { MODULE_SLUGS, buildCommunityTerritoryUrl, buildModuleTerritoryUrl } from '@/core/routing/utils/territoryUrls';
import { createLaunchPausedRoute } from '@/app/routes/launchPausedComponent';
import type { CommunityOverviewSection } from '@/core/community/components/page/communityOverviewNavigation';

// Lazy imports dos módulos existentes
const ComunidadePage       = lazy(() => import('@/core/community/pages/ComunidadePage'));
const CidadeLandingPage    = lazy(() => import('@/app/pages/CidadeLandingPage'));
// Sprint TERRITORY.1: Territory Home passa a ser a home única de qualquer território
// (cidade ou bairro). O feed completo continua em `/comunidade/.../feed` via ComunidadePage.
const TerritoryHomePage    = lazy(() => import('@/app/pages/TerritoryHomePage'));
const CommunityCommunicationTabPage = lazy(() => import('@/modules/communication-territorial/pages/CommunityCommunicationTabPage'));
const ProblemasPage        = lazy(() => import('@/modules/community-issues/pages/ProblemasPage'));
const EmpresasPage         = lazy(() => import('@/app/pages/EmpresasLandingPage'));
const ServicosPage         = lazy(() => import('@/modules/professionals/services/pages/ServicosLandingPage'));
const ClassificadosPage    = lazy(() => import('@/modules/classifieds/pages/ClassificadosPage'));
const EventsListPage     = lazy(() => import('@/features/events/pages/EventsListPage'));
const GastronomyPage        = lazy(() => import('@/modules/business/gastronomy/pages/GastronomyLandingPage'));
const EducationPage         = createLaunchPausedRoute('Educacao');
const MobilidadePage       = createLaunchPausedRoute('Mobilidade');
const VagasPage            = lazy(() => import('@/modules/classifieds/jobs/pages/VagasPublicPage'));
const CategoryBusinessPage = lazy(() => import('@/core/business/pages/CategoryBusinessPage'));
const MapaPage             = lazy(() => import('@/core/maps/pages/MapaPageV4'));

function isCommunityScopedPath(pathname: string): boolean {
  const communityRoot = `/${MODULE_SLUGS.community}`;
  return pathname === communityRoot || pathname.startsWith(`${communityRoot}/`);
}

function resolvePersistentCommunitySection(
  pathname: string,
  search: string,
  communityBaseUrl: string,
): { section: CommunityOverviewSection; embedOutlet: boolean } {
  const relativePath = pathname.startsWith(communityBaseUrl)
    ? pathname.slice(communityBaseUrl.length)
    : '';
  const segments = relativePath.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (!firstSegment) {
    const requestedView = new URLSearchParams(search).get('view');
    if (requestedView === 'groups' || requestedView === 'discussions') {
      return { section: requestedView, embedOutlet: false };
    }
    return { section: 'feed', embedOutlet: false };
  }

  if (firstSegment === 'feed') return { section: 'feed', embedOutlet: false };
  if (firstSegment === 'grupos') {
    return { section: 'groups', embedOutlet: segments.length > 1 };
  }

  switch (firstSegment) {
    case MODULE_SLUGS.business:
      return { section: 'business', embedOutlet: true };
    case MODULE_SLUGS.services:
      return { section: 'services', embedOutlet: true };
    case MODULE_SLUGS.classifieds:
      return { section: 'classifieds', embedOutlet: true };
    case MODULE_SLUGS.gastronomy:
      return { section: 'gastronomy', embedOutlet: true };
    case MODULE_SLUGS.map:
      return { section: 'map', embedOutlet: true };
    default:
      return { section: 'feed', embedOutlet: true };
  }
}

export function CommunityPersistentPortalLayout() {
  const territorialContext = useTerritorialContext();
  const location = useLocation();
  const outlet = useOutlet(territorialContext);
  const presentation = resolvePersistentCommunitySection(
    location.pathname,
    location.search,
    territorialContext.communityBaseUrl,
  );
  const communityContent = presentation.embedOutlet ? (
    <Suspense
      fallback={
        <div data-community-module-loading="true">
          <ModulePageLoader />
        </div>
      }
    >
      {outlet}
    </Suspense>
  ) : undefined;

  return (
    <Suspense fallback={<ModulePageLoader />}>
      <CidadeLandingPage
        activeCommunitySection={presentation.section}
        communityContent={communityContent}
      />
    </Suspense>
  );
}

type PublicModuleKey =
  | 'empresas'
  | 'gastronomia'
  | 'educacao'
  | 'eventos'
  | 'classificados'
  | 'vagas'
  | 'servicos'
  | 'busca'
  | 'comunidade';

const MODULE_EMPTY_COPY: Record<PublicModuleKey, { title: string; description: (city: string) => string; cta: string }> = {
  empresas: {
    title: 'Comércios da comunidade em implantação',
    description: (city) => `Ainda não temos comércios cadastrados para esta comunidade de ${city}. Seja um dos primeiros.`,
    cta: 'Cadastrar empresa',
  },
  gastronomia: {
    title: 'Gastronomia da comunidade em implantação',
    description: (city) => `Estamos organizando restaurantes e cardápios para esta comunidade de ${city}.`,
    cta: 'Indicar estabelecimento',
  },
  educacao: {
    title: 'Educação da comunidade em implantação',
    description: (city) => `Estamos organizando escolas, cursos e instituições para esta comunidade de ${city}.`,
    cta: 'Indicar instituição',
  },
  eventos: {
    title: 'Eventos da comunidade em implantação',
    description: (city) => `Ainda não encontramos eventos para esta comunidade de ${city}. Cadastre um evento local.`,
    cta: 'Cadastrar evento',
  },
  classificados: {
    title: 'Classificados da comunidade em implantação',
    description: (city) => `Ainda não há classificados para esta comunidade de ${city}. Publique o primeiro anúncio.`,
    cta: 'Publicar anúncio',
  },
  vagas: {
    title: 'Vagas próximas em implantação',
    description: (city) => `Ainda não há vagas publicadas para esta comunidade de ${city}. Empresas locais podem cadastrar oportunidades.`,
    cta: 'Cadastrar vaga',
  },
  servicos: {
    title: 'Serviços locais em implantação',
    description: (city) => `Estamos organizando profissionais e serviços para esta comunidade de ${city}.`,
    cta: 'Cadastrar serviço',
  },
  busca: {
    title: 'Busca em implantação',
    description: (city) => `Estamos estruturando resultados locais em ${city}.`,
    cta: 'Voltar para cidade ativa',
  },
  comunidade: {
    title: 'Comunidade em implantação',
    description: (city) => `A comunidade deste território em ${city} ainda não está disponível.`,
    cta: 'Quero ser avisado',
  },
};

function extractCityStateFromPath(path: string): { state?: string; city?: string } {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 3 && parts[0] === 'br') {
    return { state: parts[1], city: parts[2] };
  }
  if (parts.length >= 2) {
    return { state: parts[0], city: parts[1] };
  }
  return {};
}

function getCityNameFromPath(citySlug?: string): string {
  if (!citySlug) return 'esta cidade';
  return citySlug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface CityStatusGateProps {
  module: PublicModuleKey;
  enforceActive?: boolean;
  children: ReactNode;
}

function CityStatusGate({ module, enforceActive = false, children }: CityStatusGateProps) {
  const { resolved, communityBaseUrl } = useTerritorialContext();
  const { pathname } = useLocation();
  const locationPath = resolved.kind === 'location'
    ? resolved.location.geographic_path
    : resolved.group.members.at(0)?.geographic_path ?? '';
  const { state, city } = extractCityStateFromPath(locationPath);
  const cityName = getCityNameFromPath(city);
  const { data } = useCityMetadata(state, city);
  const cityStatus: CityStatus = data?.city_status ?? resolveFallbackCityStatus(state, city);

  const mustBlock = enforceActive ? cityStatus !== 'active' : cityStatus === 'inactive' || cityStatus === 'coming_soon' || cityStatus === 'launching';
  if (!mustBlock) return <>{children}</>;

  const copy = getRequiredRecordValue(MODULE_EMPTY_COPY, module, MODULE_EMPTY_COPY.comunidade);
  const pagePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const canonicalHref = buildPublicAbsoluteUrl(pagePath);
  const pageTitle = `${copy.title} - ${cityName} | Achegue-se`;
  const safeState = state ?? TERRITORY_CONFIG.launch.state;
  const safeCity = city ?? TERRITORY_CONFIG.launch.city;
  const moduleTerritoryBase = resolved.kind === 'group'
    ? `/${safeState}/${safeCity}/${resolved.group.slug}`
    : resolved.location.type === 'city'
      ? `/${safeState}/${safeCity}`
      : `/${safeState}/${safeCity}/${resolved.location.slug}`;
  const communityEntryHref = communityBaseUrl || buildCommunityTerritoryUrl(moduleTerritoryBase);
  const interestHref = buildCommunityTerritoryUrl(moduleTerritoryBase, 'interesse');
  const primaryCtaHref = buildModuleTerritoryUrl(MODULE_SLUGS.business, moduleTerritoryBase);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={copy.description(cityName)} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={canonicalHref} />
      </Helmet>
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Em implantação
        </p>
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-muted-foreground">
          {`Estamos chegando em ${cityName}. O Achegue-se ainda está organizando empresas, gastronomia, serviços, classificados e conteúdos locais nesta região.`}
        </p>
        <p className="mt-2 text-muted-foreground">{copy.description(cityName)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={interestHref}
            className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Entrar na lista de interesse
          </Link>
          <Link to={primaryCtaHref} className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            {copy.cta}
          </Link>
          <Link to={communityEntryHref} className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            Abrir portal comunitário
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * HOC mínimo: injeta routeResolved no contexto do módulo.
 * Os módulos públicos devem resolver o filtro canônico via
 * useModuleTerritoryFilter({ routeResolved }) na borda da página.
 * O contexto de Outlet continua sendo a fonte de routeResolved.
 * Esta camada garante que o contexto de Outlet está disponível.
 */

export function TerritorialCommunityPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <CityStatusGate module="comunidade" enforceActive>
      <Suspense fallback={<ModulePageLoader />}>
        <ComunidadePage resolved={resolved} activeMemberIds={activeMemberIds} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialCommunityHomePage() {
  // Sprint TERRITORY.1: renderiza a Territory Home oficial em vez do antigo
  // CidadeLandingPage. O feed completo permanece disponível em `.../feed`.
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <TerritoryHomePage />
    </Suspense>
  );
}

export function TerritorialCommunityEntryPage() {
  // Antes: variava conforme cidade/bairro/grupo. Agora a Territory Home é única
  // e o próprio TerritoryHomePage se especializa pelo território ativo.
  return <TerritorialCommunityHomePage />;
}

export function TerritorialCommunityIssuesPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <CityStatusGate module="comunidade" enforceActive>
      <Suspense fallback={<ModulePageLoader />}>
        <ProblemasPage resolved={resolved} activeMemberIds={activeMemberIds} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialCommunityCommunicationPage() {
  const { resolved } = useTerritorialContext();
  return (
    <CityStatusGate module="comunidade" enforceActive>
      <Suspense fallback={<ModulePageLoader />}>
        <CommunityCommunicationTabPage resolved={resolved} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialBusinessPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  const { pathname } = useLocation();
  const presentation = isCommunityScopedPath(pathname) ? 'embedded' : 'standalone';
  return (
    <CityStatusGate module="empresas">
      <Suspense fallback={<ModulePageLoader />}>
        <EmpresasPage
          resolved={resolved}
          activeMemberIds={activeMemberIds}
          presentation={presentation}
        />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialServicesPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  const { pathname } = useLocation();
  const presentation = isCommunityScopedPath(pathname) ? 'embedded' : 'standalone';
  return (
    <CityStatusGate module="servicos">
      <Suspense fallback={<ModulePageLoader />}>
        <ServicosPage
          resolved={resolved}
          activeMemberIds={activeMemberIds}
          presentation={presentation}
        />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialClassificadosPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  const { pathname } = useLocation();
  const presentation = isCommunityScopedPath(pathname) ? 'embedded' : 'standalone';
  return (
    <CityStatusGate module="classificados">
      <Suspense fallback={<ModulePageLoader />}>
        <ClassificadosPage
          resolved={resolved}
          activeMemberIds={activeMemberIds}
          presentation={presentation}
        />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialEventosPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <CityStatusGate module="eventos">
      <Suspense fallback={<ModulePageLoader />}>
        <EventsListPage resolved={resolved} activeMemberIds={activeMemberIds} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialGastronomyPage() {
  const { pathname } = useLocation();
  const presentation = isCommunityScopedPath(pathname) ? 'embedded' : 'standalone';
  return (
    <CityStatusGate module="gastronomia">
      <Suspense fallback={<ModulePageLoader />}>
        <GastronomyPage presentation={presentation} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialEducationPage() {
  return (
    <CityStatusGate module="educacao">
      <Suspense fallback={<ModulePageLoader />}>
        <EducationPage />
      </Suspense>
    </CityStatusGate>
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
    <CityStatusGate module="vagas">
      <Suspense fallback={<ModulePageLoader />}>
        <VagasPage resolved={resolved} activeMemberIds={activeMemberIds} />
      </Suspense>
    </CityStatusGate>
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
  const { pathname } = useLocation();
  const presentation = isCommunityScopedPath(pathname) ? 'embedded' : 'standalone';
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <MapaPage
        resolved={resolved}
        activeMemberIds={activeMemberIds}
        presentation={presentation}
      />
    </Suspense>
  );
}
