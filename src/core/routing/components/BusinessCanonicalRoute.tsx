/**
 * BusinessCanonicalRoute - fallback territorial legado de empresa.
 *
 * URL legada: /empresas/:state/:city/:district/:slug
 * Destino preferencial: /:communityAlias/:slug quando ha alias publico.
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { buildBusinessPublicUrlFromSegments } from '@/core/business/utils/businessPublicUrls';
import { Loader2 } from 'lucide-react';
import { logPageNotFound } from '@/core/public-identity/utils/identity-logger';

interface BusinessCanonicalRouteProps {
  BusinessDetailComponent?: ComponentType<{ businessId?: string }>;
}

type RouteState =
  | { status: 'loading' }
  | { status: 'found'; businessId: string; redirectPath: string | null }
  | { status: 'not-found' };

export default function BusinessCanonicalRoute({
  BusinessDetailComponent,
}: BusinessCanonicalRouteProps = {}) {
  const location = useLocation();
  const { state, city, district, slug } = useParams<{
    state: string;
    city: string;
    district: string;
    slug: string;
  }>();
  const [routeState, setRouteState] = useState<RouteState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    if (!state || !city || !district || !slug) {
      setRouteState({ status: 'not-found' });
      return;
    }

    async function resolve() {
      try {
        const attemptedUrl = buildBusinessPublicUrlFromSegments({
          state,
          city,
          district,
          slug,
        });
        const ctx = await BusinessUrlService.resolveByTerritoryAndSlug(
          state,
          city,
          district,
          slug,
        );

        if (!ctx) {
          if (import.meta.env.DEV) {
            logger.info(
              `[BusinessCanonicalRoute] Não encontrada: ${attemptedUrl}`,
            );
          }

          logPageNotFound({
            entityType: 'business',
            identifier: slug,
            attemptedUrl,
          });
          if (!cancelled) {
            setRouteState({ status: 'not-found' });
          }
          return;
        }

        const canonicalPath =
          await BusinessUrlService.getCanonicalUrlWithResolvedCommunityAlias(ctx);
        const redirectPath = canonicalPath !== location.pathname ? canonicalPath : null;

        if (!cancelled) {
          setRouteState({
            status: 'found',
            businessId: ctx.id,
            redirectPath,
          });
        }
      } catch (err) {
        logger.error('[BusinessCanonicalRoute] Erro:', err);
        if (!cancelled) {
          setRouteState({ status: 'not-found' });
        }
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, state, city, district, slug]);

  if (routeState.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (routeState.status === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="text-4xl font-bold text-muted-foreground">404</p>
          <p className="mt-2 text-lg font-semibold text-foreground">Empresa não encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A URL informada não corresponde a uma empresa ativa neste território.
          </p>
          <a href="/empresas" className="mt-4 inline-block text-sm text-primary underline">
            Voltar para empresas
          </a>
        </div>
      </div>
    );
  }

  if (routeState.redirectPath && routeState.redirectPath !== location.pathname) {
    return (
      <Navigate
        to={`${routeState.redirectPath}${location.search}${location.hash}`}
        replace
      />
    );
  }

  if (!BusinessDetailComponent) {
    logger.error('[BusinessCanonicalRoute] BusinessDetailComponent não informado.');
    return null;
  }

  return <BusinessDetailComponent businessId={routeState.businessId} />;
}
