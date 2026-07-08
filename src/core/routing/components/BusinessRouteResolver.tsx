/**
 * BusinessRouteResolver - entrada unica para /empresas/:state/:city/:district/:slug.
 *
 * Essa URL representa uma entidade publica de empresa. Se a empresa nao existir,
 * a rota canonica deve renderizar 404; nao deve cair em layout territorial vazio.
 */

import type { ComponentType } from 'react';
import BusinessCanonicalRoute from './BusinessCanonicalRoute';

interface BusinessRouteResolverProps {
  BusinessDetailComponent?: ComponentType<{ businessId?: string }>;
}

export default function BusinessRouteResolver({
  BusinessDetailComponent,
}: BusinessRouteResolverProps = {}) {
  return <BusinessCanonicalRoute BusinessDetailComponent={BusinessDetailComponent} />;
}
