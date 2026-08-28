import * as GastronomyHelpers from './gastronomy.helpers';
import * as GastronomyQueries from '@/core/business/services/gastronomy.queries';
import * as MenuQueries from '@/core/business/services/menu.queries';

/**
 * Read-side facade kept for hooks that need a compact query/helper contract.
 *
 * Write operations live in dedicated services such as GastronomyProfileService,
 * MenuService, OrderService and GastronomyCheckoutService.
 */
export const GastronomyFacade = {
  queries: {
    ...GastronomyQueries,
    ...MenuQueries,
  },
  helpers: {
    ...GastronomyHelpers,
  },
} as const;

export type GastronomyFacadeContract = typeof GastronomyFacade;
