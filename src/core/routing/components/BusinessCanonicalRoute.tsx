/**
 * BusinessCanonicalRoute - rota publica canonica de empresa.
 *
 * URL: /empresas/:uf/:cidade/:bairro/:slug
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
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
  const navigate = useNavigate();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state || !city || !district || !slug) {
      navigate('/404', { replace: true });
      return;
    }

    async function resolve() {
      try {
        const ctx = await BusinessUrlService.resolveByTerritoryAndSlug(
          state!,
          city!,
          district!,
          slug!,
        );

        if (!ctx) {
          if (import.meta.env.DEV) {
            logger.info(
              `[BusinessCanonicalRoute] Nao encontrada: /empresas/${state}/${city}/${district}/${slug}`,
            );
          }

          logPageNotFound({
            entityType: 'business',
            identifier: slug!,
            attemptedUrl: `/empresas/${state}/${city}/${district}/${slug}`,
          });

          navigate('/404', { replace: true });
          return;
        }

        setBusinessId(ctx.id);
      } catch (err) {
        logger.error('[BusinessCanonicalRoute] Erro:', err);
        navigate('/404', { replace: true });
      } finally {
        setLoading(false);
      }
    }

    resolve();
  }, [state, city, district, slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!businessId) return null;

  if (!BusinessDetailComponent) {
    logger.error('[BusinessCanonicalRoute] BusinessDetailComponent nao informado.');
    return null;
  }

  return <BusinessDetailComponent businessId={businessId} />;
}
