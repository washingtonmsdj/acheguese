import { describe, expect, it } from 'vitest';
import {
  GASTRONOMY_PUBLIC_ROUTE_PARAMS,
  gastronomyPublicRoutes,
} from '@/core/verticals/gastronomy/routes/gastronomyPublicRoutes';

describe('gastronomyPublicRoutes', () => {
  it('builds public gastronomy utility routes from module slug SSOT', () => {
    expect(gastronomyPublicRoutes.home()).toBe('/gastronomia');
    expect(gastronomyPublicRoutes.favorites()).toBe('/gastronomia/favoritos');
    expect(gastronomyPublicRoutes.orderDetails('order-123')).toBe(
      '/gastronomia/pedidos/order-123',
    );
  });

  it('exposes the order details route pattern for AppRoutes', () => {
    expect(gastronomyPublicRoutes.orderDetails(GASTRONOMY_PUBLIC_ROUTE_PARAMS.orderId)).toBe(
      '/gastronomia/pedidos/:orderId',
    );
  });

  it('rejects route segment injection', () => {
    expect(() => gastronomyPublicRoutes.orderDetails('order-1/extra')).toThrow(
      /id do pedido/,
    );
  });
});
