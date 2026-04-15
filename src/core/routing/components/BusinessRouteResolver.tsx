/**
 * BusinessRouteResolver — Resolve se /empresas/:state/:city/:district/:slug é:
 *   1. Rota canônica de empresa específica (slug de business)
 *   2. Rota territorial (slug de grupo ou bairro)
 *
 * Estratégia:
 *   - Tenta resolver como business primeiro
 *   - Se não encontrar, delega para TerritorialLayout
 *
 * Isso elimina ambiguidade de rotas sem duplicar lógica.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { TerritorialLayout } from './TerritorialLayout';
import BusinessCanonicalRoute from './BusinessCanonicalRoute';
import { Loader2 } from 'lucide-react';

export default function BusinessRouteResolver() {
  const { state, city, district, slug } = useParams<{
    state: string;
    city: string;
    district: string;
    slug: string;
  }>();
  const [resolved, setResolved] = useState<'loading' | 'business' | 'territorial'>('loading');

  useEffect(() => {
    if (!state || !city || !district || !slug) {
      setResolved('territorial');
      return;
    }

    async function resolve() {
      // Tenta resolver como business (5 segmentos: /empresas/:uf/:cidade/:bairro/:slug)
      const ctx = await BusinessUrlService.resolveByTerritoryAndSlug(
        state!,
        city!,
        district!,
        slug!,
      );

      if (ctx) {
        // É uma empresa específica
        setResolved('business');
      } else {
        // Não é empresa, deve ser território (grupo ou bairro)
        setResolved('territorial');
      }
    }

    resolve();
  }, [state, city, district, slug]);

  if (resolved === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (resolved === 'business') {
    return <BusinessCanonicalRoute />;
  }

  return <TerritorialLayout />;
}
