/**
 * BusinessCanonicalRoute — Rota pública canônica de empresa.
 *
 * URL: /empresas/:uf/:cidade/:bairro/:slug
 * Exemplo: /empresas/ba/salvador/pituba/tonecos-studios
 *
 * Comportamento:
 *   1. Resolve empresa via BusinessUrlService (valida território + slug)
 *   2. Não encontrada → tenta slug history (empresa pode ter mudado de slug/território)
 *   3. Slug history encontrado → redirect 308 para nova canônica
 *   4. Não encontrada em nenhum lugar → /404
 *   5. Encontrada → renderiza EmpresaDetailPage com businessId
 *
 * Esta é a ÚNICA rota que renderiza conteúdo de empresa diretamente.
 * Todas as outras rotas (premium, legado, standalone) redirecionam para cá.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import EmpresaDetailLandingPage from '@/app/pages/EmpresaDetailLandingPage';
import { Loader2 } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { logPageNotFound } from '@/core/public-identity/utils/identity-logger';

export default function BusinessCanonicalRoute() {
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
        // Tentativa 1: resolução direta por território + slug
        let ctx = await BusinessUrlService.resolveByTerritoryAndSlug(
          state!,
          city!,
          district!,
          slug!,
        );

        if (!ctx) {
          // Tentativa 2: slug history — empresa pode ter mudado de slug ou território
          const oldUrl = `/empresas/${state}/${city}/${district}/${slug}`;
          ctx = await BusinessUrlService.resolveBySlugHistory(oldUrl);

          if (ctx) {
            // Encontrou no histórico → redirect para nova canônica
            const newCanonical = BusinessUrlService.getCanonicalUrl(ctx);
            if (import.meta.env.DEV) {
              logger.info(
                `[BusinessCanonicalRoute] Slug history: ${oldUrl} → ${newCanonical}`,
              );
            }
            navigate(newCanonical, { replace: true });
            return;
          }

          if (import.meta.env.DEV) {
            logger.info(
              `[BusinessCanonicalRoute] Não encontrada: /empresas/${state}/${city}/${district}/${slug}`,
            );
          }

          // Log de 404 para monitoramento
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

  return <EmpresaDetailLandingPage businessId={businessId} />;
}
