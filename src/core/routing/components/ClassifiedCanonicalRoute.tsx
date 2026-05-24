/**
 * ClassifiedCanonicalRoute - Rota canônica de classificado
 *
 * Resolve classificado pela URL canônica completa:
 * /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId
 *
 * Comportamento:
 * - Resolve pelo public_id (âncora estável)
 * - Renderiza o detalhe diretamente, sem redirect de canonicalização
 * - 404 visível se não encontrado
 *
 * @version 1.0.0
 */
import { logger } from '@/shared/utils/logger';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { classifiedUrlService } from '@/shared/services/classifieds';
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
    status: 'loading' | 'found' | 'not-found';
    classifiedId?: string;
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

  if (resolution.status === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="text-4xl font-bold text-muted-foreground">404</p>
          <p className="mt-2 text-lg font-semibold text-foreground">Classificado não encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Este classificado não existe mais ou foi removido.
          </p>
          <a href="/classificados" className="mt-4 inline-block text-sm text-primary underline">
            Voltar para classificados
          </a>
        </div>
      </div>
    );
  }

  // Renderiza página de detalhe com ID resolvido
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ClassificadoDetailPage classifiedId={resolution.classifiedId} />
    </Suspense>
  );
}
