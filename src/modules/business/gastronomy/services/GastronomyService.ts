import * as GastronomyQueries from '@/core/business/services/gastronomy.queries';
import * as MenuQueries from '@/core/business/services/menu.queries';

/**
 * Read-side facade kept for hooks that need a compact canonical query contract.
 *
 * Presentation helpers were retired after caller census proved zero runtime
 * consumers. Write operations live in dedicated services such as GastronomyProfileService,
 * MenuService, OrderService and GastronomyCheckoutService.
 */
export const GastronomyFacade = {
  queries: {
    ...GastronomyQueries,
    ...MenuQueries,
  },
} as const;

export type GastronomyFacadeContract = typeof GastronomyFacade;
