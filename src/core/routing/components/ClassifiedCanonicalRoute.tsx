/**
 * ClassifiedCanonicalRoute — Rota canônica de classificado
 *
 * Resolve classificado pela URL canônica completa:
 * /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId
 *
 * Comportamento:
 * - Resolve pelo public_id (âncora estável)
 * - Detecta URL desatualizada (slug/território/categoria mudou)
 * - Redirect 308 para canonical atual
 * - 404 se não encontrado
 *
 * @version 1.0.0
 */
import { logger } from '@/shared/utils/logger';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { classifiedUrlService } from '@/core/classifieds/services/ClassifiedUrlService';
import { FullScreenLoader } from '@/shared/components/loading/PageLoader';

const ClassificadoDetailPage = lazy(() => import('@/modules/classifieds/pages/ClassificadoDetailPage'));

export default function ClassifiedCanonicalRoute() {
  const { uf, cidade, bairro, categoria, subcategoria, slug, publicId } = useParams<{
    uf: string;
    cidade: string;
    bairro: string;
    categoria: string;
    subcategoria: string;
    slug: string;
    publicId: string;
  }>();

  const [resolution, setResolution] = useState<{
    status: 'loading' | 'found' | 'redirect' | 'not-found';
    classifiedId?: string;
    redirectTo?: string;
  }>({ status: 'loading' });

  useEffect(() => {
    async function resolve() {
      if (!uf || !cidade || !bairro || !categoria || !subcategoria || !slug || !publicId) {
        setResolution({ status: 'not-found' });
        return;
      }

      try {
        const result = await classifiedUrlService.resolveByCanonicalUrl(
          uf,
          cidade,
          bairro,
          categoria,
          subcategoria,
          slug,
          publicId
        );

        if (!result) {
          logger.warn('[ClassifiedCanonicalRoute] Classificado não encontrado:', publicId);
          setResolution({ status: 'not-found' });
          return;
        }

        if (result.needs_redirect && result.redirect_to) {
          logger.info('[ClassifiedCanonicalRoute] Redirect para canonical:', result.redirect_to);
          setResolution({
            status: 'redirect',
            redirectTo: result.redirect_to,
          });
          return;
        }

        setResolution({
          status: 'found',
          classifiedId: result.id,
        });
      } catch (error) {
        logger.error('[ClassifiedCanonicalRoute] Erro ao resolver:', error);
        setResolution({ status: 'not-found' });
      }
    }

    resolve();
  }, [uf, cidade, bairro, categoria, subcategoria, slug, publicId]);

  if (resolution.status === 'loading') {
    return <FullScreenLoader />;
  }

  if (resolution.status === 'redirect' && resolution.redirectTo) {
    return <Navigate to={resolution.redirectTo} replace />;
  }

  if (resolution.status === 'not-found') {
    return <Navigate to="/404" replace />;
  }

  // Renderiza página de detalhe com ID resolvido
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ClassificadoDetailPage classifiedId={resolution.classifiedId} />
    </Suspense>
  );
}

