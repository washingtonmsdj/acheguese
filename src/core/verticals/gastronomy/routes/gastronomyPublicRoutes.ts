import { APP_MODULE_SLUGS, buildAppModulePath } from '@/shared/config/moduleSlugs';

export const GASTRONOMY_PUBLIC_ROUTE_SEGMENTS = {
  favorites: 'favoritos',
  orders: 'pedidos',
} as const;

export const GASTRONOMY_PUBLIC_ROUTE_PARAMS = {
  orderId: ':orderId',
} as const;

function cleanRouteSegment(value: string, label: string): string {
  const segment = value.trim().replace(/^\/+|\/+$/g, '');
  if (!segment || /[/?#]/.test(segment)) {
    throw new Error(`${label} deve ser um unico segmento de rota.`);
  }
  return segment;
}

export const gastronomyPublicRoutes = {
  home: () => buildAppModulePath(APP_MODULE_SLUGS.gastronomy),
  favorites: () =>
    buildAppModulePath(APP_MODULE_SLUGS.gastronomy, GASTRONOMY_PUBLIC_ROUTE_SEGMENTS.favorites),
  orderDetails: (orderId: string) =>
    buildAppModulePath(
      APP_MODULE_SLUGS.gastronomy,
      `${GASTRONOMY_PUBLIC_ROUTE_SEGMENTS.orders}/${cleanRouteSegment(orderId, 'id do pedido')}`,
    ),
} as const;
