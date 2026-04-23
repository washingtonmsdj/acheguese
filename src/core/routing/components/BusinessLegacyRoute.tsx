/**
 * BusinessLegacyRoute - Compatibilidade para rota legada de empresa.
 *
 * URL legado: /empresa/:id
 *
 * Comportamento:
 * 1. Tenta resolver :id como profile_id da empresa
 * 2. Se nao encontrar, tenta resolver como slug
 * 3. Redireciona para URL canonica /empresas/:uf/:cidade/:bairro/:slug
 * 4. Nao encontrada -> /404
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';

export default function BusinessLegacyRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate('/404', { replace: true });
      return;
    }

    async function resolve() {
      try {
        const byId = await BusinessUrlService.resolveById(id);
        const ctx = byId ?? (await BusinessUrlService.resolveBySlug(id));

        if (!ctx) {
          navigate('/404', { replace: true });
          return;
        }

        const canonicalUrl = BusinessUrlService.getCanonicalUrl(ctx);

        if (import.meta.env.DEV) {
          logger.info(`[BusinessLegacyRoute] Redirect /empresa/${id} -> ${canonicalUrl}`);
        }

        navigate(canonicalUrl, { replace: true });
      } catch (error) {
        logger.error('[BusinessLegacyRoute] Erro ao resolver rota legada:', error);
        navigate('/404', { replace: true });
      }
    }

    resolve();
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
