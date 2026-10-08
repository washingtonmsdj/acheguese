/**
 * A newer read model may arrive while an editor has unsaved changes.
 * Switching to a different Business always requires fresh form state, but a
 * same-Business refetch must not overwrite unsaved fields or uploaded media.
 */
export interface BusinessEditHydrationState {
  routeProfileId: string | null | undefined;
  loadedProfileId: string | null | undefined;
  initializedProfileId: string | null;
  hasUnsavedFields: boolean;
  hasUnsavedSlug: boolean;
  hasPendingUploads: boolean;
}

export function shouldHydrateBusinessEditForm({
  routeProfileId,
  loadedProfileId,
  initializedProfileId,
  hasUnsavedFields,
  hasUnsavedSlug,
  hasPendingUploads,
}: BusinessEditHydrationState): boolean {
  if (!routeProfileId || loadedProfileId !== routeProfileId) return false;
  if (initializedProfileId !== routeProfileId) return true;

  return !hasUnsavedFields && !hasUnsavedSlug && !hasPendingUploads;
}
