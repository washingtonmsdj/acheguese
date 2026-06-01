/**
 * ClassifiedShortRoute - Rota curta de compartilhamento
 *
 * Resolve classificado pela URL curta:
 * /c/:publicId
 *
 * Comportamento:
 * - Resolve pelo public_id
 * - Renderiza o detalhe diretamente sem redirect
 * - 404 visível se não encontrado
 *
 * @version 1.0.0
 */
import { logger } from '@/shared/utils/logger';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { classifiedUrlService } from "@/core/classifieds/services";
import { FullScreenLoader } from '@/shared/components/loading/PageLoader';

const ClassificadoDetailPage = lazy(() => import('@/modules/classifieds/pages/ClassificadoDetailPage'));

export default function ClassifiedShortRoute() {
  const { publicId } = useParams<{ publicId: string }>();

  const [resolution, setResolution] = useState<{
    status: 'loading' | 'found' | 'not-found';
    classifiedId?: string;
  }>({ status: 'loading' });

  useEffect(() => {
    async function resolve() {
      if (!publicId) {
        setResolution({ status: 'not-found' });
        return;
      }

      try {
        const result = await classifiedUrlService.resolveByPublicId(publicId);

        if (!result) {
          logger.warn('[ClassifiedShortRoute] Classificado não encontrado:', publicId);
          setResolution({ status: 'not-found' });
          return;
        }

        logger.info('[ClassifiedShortRoute] Classificado resolvido pelo public_id:', publicId);
        setResolution({
          status: 'found',
          classifiedId: result.id,
        });
      } catch (error) {
        logger.error('[ClassifiedShortRoute] Erro ao resolver:', error);
        setResolution({ status: 'not-found' });
      }
    }

    resolve();
  }, [publicId]);

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
            Este link curto não aponta para um classificado ativo.
          </p>
          <a href="/classificados" className="mt-4 inline-block text-sm text-primary underline">
            Voltar para classificados
          </a>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ClassificadoDetailPage classifiedId={resolution.classifiedId} />
    </Suspense>
  );
}
