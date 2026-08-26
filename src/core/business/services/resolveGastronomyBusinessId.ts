import { BusinessService } from '@/core/business/services/BusinessService';
import { logger } from '@/shared/utils/logger';
import { isValidId } from '@/shared/validation';

export async function resolveGastronomyBusinessId(
  businessIdentifier: string,
): Promise<string> {
  if (!businessIdentifier || !isValidId(businessIdentifier)) {
    return businessIdentifier;
  }

  try {
    const resolvedBusinessDataId =
      await BusinessService.getBusinessDataIdByProfileId(businessIdentifier);

    return resolvedBusinessDataId ?? businessIdentifier;
  } catch (error) {
    logger.error('[Gastronomy] Error resolving business identifier:', error);
    return businessIdentifier;
  }
}
