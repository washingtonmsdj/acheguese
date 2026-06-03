/**
 * BusinessRouteResolver - resolve se /empresas/:state/:city/:district/:slug e:
 *   1. fallback legado de empresa especifica (slug de business)
 *   2. rota territorial (slug de grupo ou bairro)
 *
 * A rota de business pode redirecionar para /:communityAlias/:slug quando
 * houver alias publico da comunidade.
 */

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useParams } from 'react-router-dom';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { TerritorialLayout } from './TerritorialLayout';
import BusinessCanonicalRoute from './BusinessCanonicalRoute';
import { Loader2 } from 'lucide-react';

interface BusinessRouteResolverProps {
  BusinessDetailComponent?: ComponentType<{ businessId?: string }>;
}

export default function BusinessRouteResolver({
  BusinessDetailComponent,
}: BusinessRouteResolverProps = {}) {
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
      const ctx = await BusinessUrlService.resolveByTerritoryAndSlug(
        state!,
        city!,
        district!,
        slug!,
      );

      setResolved(ctx ? 'business' : 'territorial');
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
    return <BusinessCanonicalRoute BusinessDetailComponent={BusinessDetailComponent} />;
  }

  return <TerritorialLayout />;
}
