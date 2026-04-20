/**
 * ClassifiedShortRoute â€” Rota curta de compartilhamento
 *
 * Resolve classificado pela URL curta:
 * /c/:publicId
 *
 * Comportamento:
 * - Resolve pelo public_id
 * - Redirect 308 para canonical atual
 * - 404 se nÃ£o encontrado
 *
 * @version 1.0.0
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { classifiedUrlService } from '@/core/classifieds/services/ClassifiedUrlService';
import { FullScreenLoader } from '@/shared/components/loading/PageLoader';

export default function ClassifiedShortRoute() {
  const { publicId } = useParams<{ publicId: string }>();

  const [resolution, setResolution] = useState<{
    status: 'loading' | 'redirect' | 'not-found';
    redirectTo?: string;
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
          logger.warn('[ClassifiedShortRoute] Classificado nÃ£o encontrado:', publicId);
          setResolution({ status: 'not-found' });
          return;
        }

        // Sempre redireciona para canonical
        logger.info('[ClassifiedShortRoute] Redirect para canonical:', result.current_canonical);
        setResolution({
          status: 'redirect',
          redirectTo: result.current_canonical,
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

  if (resolution.status === 'redirect' && resolution.redirectTo) {
    return <Navigate to={resolution.redirectTo} replace />;
  }

  return <Navigate to="/404" replace />;
}
