/**
 * BusinessPremiumRoute - Rota curta premium de empresa.
 *
 * URL: /p/:slug
 * Exemplo: /p/tonecos-studios
 *
 * Comportamento:
 *   1. Resolve empresa pelo slug via BusinessUrlService
 *   2. Se nao houver empresa premium, tenta resolver handle legado de perfil
 *   3. Se houver profile legado, redireciona para /u/:username
 *   4. Caso contrario, envia para /404
 *
 * Decisao arquitetural: /p/:slug fica reservado para premium business.
 * Conteudo de perfil publico agora e canonico em /u/:username.
 */
import { logger } from '@/shared/utils/logger';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { profileService } from '@/core/profiles/services';
import { buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';
import { isReservedSlug } from '@/core/routing/reservedSlugs';

export default function BusinessPremiumRoute() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) {
      navigate('/404', { replace: true });
      return;
    }

    if (isReservedSlug(slug)) {
      navigate('/404', { replace: true });
      return;
    }

    async function resolve() {
      try {
        const businessContext = await BusinessUrlService.resolveBySlug(slug);

        if (businessContext) {
          const urls = BusinessUrlService.buildUrls(businessContext);

          if (import.meta.env.DEV) {
            logger.info(`[BusinessPremiumRoute] Redirecionando /p/${slug} -> ${urls.canonical}`);
          }

          navigate(urls.canonical, { replace: true });
          return;
        }

        const legacyProfile = await profileService.getByHandle(slug);
        if (legacyProfile?.username) {
          navigate(buildPublicProfileUrl(legacyProfile.username), { replace: true });
          return;
        }

        if (import.meta.env.DEV) {
          logger.info(`[BusinessPremiumRoute] Nenhuma entidade encontrada em /p/${slug}`);
        }
        navigate('/404', { replace: true });
      } catch (err) {
        logger.error('[BusinessPremiumRoute] Erro:', err);
        navigate('/404', { replace: true });
      }
    }

    resolve();
  }, [slug, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
