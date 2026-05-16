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
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTerritorialContext } from './TerritorialLayout';
import { ModulePageLoader } from '@/shared/components/loading/PageLoader';
import { useCityMetadata } from '@/core/city/hooks/useCityMetadata';
import { resolveFallbackCityStatus, type CityStatus } from '@/core/city/services/CityService';
import { TERRITORY_CONFIG } from '@/config/territory';

// Lazy imports dos módulos existentes
const ComunidadePage       = lazy(() => import('@/modules/community-feed/pages/ComunidadePage'));
const CidadeLandingPage    = lazy(() => import('@/app/pages/CidadeLandingPage'));
const ComplexoLandingPage  = lazy(() => import('@/app/pages/ComplexoNordesteLandingPage'));
const CommunityCommunicationTabPage = lazy(() => import('@/modules/communication-territorial/pages/CommunityCommunicationTabPage'));
const AlertasPage          = lazy(() => import('@/modules/community-alerts/pages/AlertasPage'));
const ProblemasPage        = lazy(() => import('@/modules/community-issues/pages/ProblemasPage'));
const EmpresasPage         = lazy(() => import('@/app/pages/EmpresasLandingPage'));
const ServicosPage         = lazy(() => import('@/modules/professionals/services/pages/ServicosLandingPage'));
const ClassificadosPage    = lazy(() => import('@/modules/classifieds/pages/ClassificadosPage'));
const EventsListPage     = lazy(() => import('@/features/events/pages/EventsListPage'));
const GastronomyPage        = lazy(() => import('@/modules/business/gastronomy/pages/GastronomyLandingPage'));
const MobilidadePage       = lazy(() => import('@/modules/mobility/pages/MobilidadeLandingPage'));
const VagasPage            = lazy(() => import('@/modules/classifieds/jobs/pages/VagasPublicPage'));
const CategoryBusinessPage = lazy(() => import('@/core/business/pages/CategoryBusinessPage'));
const MapaPage             = lazy(() => import('@/core/maps/pages/MapaPageV4'));

type PublicModuleKey =
  | 'empresas'
  | 'gastronomia'
  | 'eventos'
  | 'classificados'
  | 'vagas'
  | 'servicos'
  | 'busca'
  | 'comunidade';

const MODULE_EMPTY_COPY: Record<PublicModuleKey, { title: string; description: (city: string) => string; cta: string }> = {
  empresas: {
    title: 'Comercios da comunidade em implantação',
    description: (city) => `Ainda não temos comercios cadastrados para esta comunidade de ${city}. Seja um dos primeiros.`,
    cta: 'Cadastrar empresa',
  },
  gastronomia: {
    title: 'Gastronomia da comunidade em implantação',
    description: (city) => `Estamos organizando restaurantes e cardapios para esta comunidade de ${city}.`,
    cta: 'Indicar estabelecimento',
  },
  eventos: {
    title: 'Eventos da comunidade em implantação',
    description: (city) => `Ainda não encontramos eventos para esta comunidade de ${city}. Cadastre um evento local.`,
    cta: 'Cadastrar evento',
  },
  classificados: {
    title: 'Classificados da comunidade em implantação',
    description: (city) => `Ainda não ha classificados para esta comunidade de ${city}. Publique o primeiro anuncio.`,
    cta: 'Publicar anúncio',
  },
  vagas: {
    title: 'Vagas próximas em implantação',
    description: (city) => `Ainda nao ha vagas publicadas para esta comunidade de ${city}. Empresas locais podem cadastrar oportunidades.`,
    cta: 'Cadastrar vaga',
  },
  servicos: {
    title: 'Serviços locais em implantação',
    description: (city) => `Estamos organizando profissionais e servicos para esta comunidade de ${city}.`,
    cta: 'Cadastrar serviço',
  },
  busca: {
    title: 'Busca em implantação',
    description: (city) => `Estamos estruturando resultados locais em ${city}.`,
    cta: 'Voltar para cidade ativa',
  },
  comunidade: {
    title: 'Comunidade em implantação',
    description: (city) => `A comunidade deste territorio em ${city} ainda nao esta disponivel.`,
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
  const { resolved } = useTerritorialContext();
  const { pathname } = useLocation();
  const locationPath = resolved.kind === 'location'
    ? resolved.location.geographic_path
    : resolved.group.members[0]?.geographic_path ?? '';
  const { state, city } = extractCityStateFromPath(locationPath);
  const cityName = getCityNameFromPath(city);
  const { data } = useCityMetadata(state, city);
  const cityStatus: CityStatus = data?.city_status ?? resolveFallbackCityStatus(state, city);

  const mustBlock = enforceActive ? cityStatus !== 'active' : cityStatus === 'inactive' || cityStatus === 'coming_soon' || cityStatus === 'launching';
  if (!mustBlock) return <>{children}</>;

  const copy = MODULE_EMPTY_COPY[module];
  const pagePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const pageTitle = `${copy.title} - ${cityName} | Achegue-se`;
  const isCommunityPath = pathname.startsWith('/comunidade/');
  const safeState = state ?? TERRITORY_CONFIG.launch.state;
  const safeCity = city ?? TERRITORY_CONFIG.launch.city;
  const canonicalTerritoryBase = resolved.kind === 'group'
    ? `/${safeState}/${safeCity}/${resolved.group.slug}`
    : `/${safeState}/${safeCity}/${resolved.location.slug}`;
  const primaryCtaHref = isCommunityPath
    ? `/comunidade${canonicalTerritoryBase}/empresas`
    : `/empresas${canonicalTerritoryBase}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={copy.description(cityName)} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`https://acheguese.com.br${pagePath}`} />
      </Helmet>
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Em implantação
        </p>
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-muted-foreground">
          {`Estamos chegando em ${cityName}. O Achegue-se ainda está organizando empresas, eventos, serviços e conteúdos locais nesta região.`}
        </p>
        <p className="mt-2 text-muted-foreground">{copy.description(cityName)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={primaryCtaHref} className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            {copy.cta}
          </Link>
          <Link to={`/contato?cidade=${encodeURIComponent(cityName)}`} className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            Entrar na lista de interesse
          </Link>
          <Link to="/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina" className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
            Ir para Comunidade do Complexo (piloto ativo)
          </Link>
        </div>
      </div>
    </div>
  );
}

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
    <CityStatusGate module="comunidade" enforceActive>
      <Suspense fallback={<ModulePageLoader />}>
        <ComunidadePage resolved={resolved} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialCommunityHomePage() {
  const { resolved } = useTerritorialContext();

  return (
    <Suspense fallback={<ModulePageLoader />}>
      {resolved.kind === 'group' ? <ComplexoLandingPage /> : <CidadeLandingPage />}
    </Suspense>
  );
}

export function TerritorialCommunityEntryPage() {
  const { resolved } = useTerritorialContext();

  if (resolved.kind === "group") {
    return <TerritorialCommunityHomePage />;
  }

  if (resolved.location.type === "city") {
    return <TerritorialCommunityHomePage />;
  }

  return <TerritorialCommunityPage />;
}

export function TerritorialCommunityAlertsPage() {
  const { resolved } = useTerritorialContext();
  return (
    <CityStatusGate module="comunidade" enforceActive>
      <Suspense fallback={<ModulePageLoader />}>
        <AlertasPage resolved={resolved} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialCommunityIssuesPage() {
  const { resolved } = useTerritorialContext();
  return (
    <CityStatusGate module="comunidade" enforceActive>
      <Suspense fallback={<ModulePageLoader />}>
        <ProblemasPage resolved={resolved} />
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
  return (
    <CityStatusGate module="empresas">
      <Suspense fallback={<ModulePageLoader />}>
        <EmpresasPage resolved={resolved} activeMemberIds={activeMemberIds} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialServicesPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <CityStatusGate module="servicos">
      <Suspense fallback={<ModulePageLoader />}>
        <ServicosPage resolved={resolved} activeMemberIds={activeMemberIds} />
      </Suspense>
    </CityStatusGate>
  );
}

export function TerritorialClassificadosPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();
  return (
    <CityStatusGate module="classificados">
      <Suspense fallback={<ModulePageLoader />}>
        <ClassificadosPage resolved={resolved} activeMemberIds={activeMemberIds} />
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
  return (
    <CityStatusGate module="gastronomia">
      <Suspense fallback={<ModulePageLoader />}>
        <GastronomyPage />
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
  return (
    <Suspense fallback={<ModulePageLoader />}>
      <MapaPage resolved={resolved} activeMemberIds={activeMemberIds} />
    </Suspense>
  );
}
