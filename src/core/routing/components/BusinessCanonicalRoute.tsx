/**
 * BusinessCanonicalRoute - rota pública canônica de empresa.
 *
 * URL: /empresas/:uf/:cidade/:bairro/:slug
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useParams } from 'react-router-dom';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { buildBusinessPublicUrlFromSegments } from '@/core/business/utils/businessPublicUrls';
import { Loader2 } from 'lucide-react';
import { logPageNotFound } from '@/core/public-identity/utils/identity-logger';

interface BusinessCanonicalRouteProps {
  BusinessDetailComponent?: ComponentType<{ businessId?: string }>;
}

export default function BusinessCanonicalRoute({
  BusinessDetailComponent,
}: BusinessCanonicalRouteProps = {}) {
  const { state, city, district, slug } = useParams<{
    state: string;
    city: string;
    district: string;
    slug: string;
  }>();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found'>('loading');

  useEffect(() => {
    if (!state || !city || !district || !slug) {
      setStatus('not-found');
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
          setStatus('not-found');
          return;
        }

        setBusinessId(ctx.id);
        setStatus('found');
      } catch (err) {
        logger.error('[BusinessCanonicalRoute] Erro:', err);
        setStatus('not-found');
      }
    }

    resolve();
  }, [state, city, district, slug]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'not-found' || !businessId) {
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

  if (!BusinessDetailComponent) {
    logger.error('[BusinessCanonicalRoute] BusinessDetailComponent não informado.');
    return null;
  }

  return <BusinessDetailComponent businessId={businessId} />;
}
