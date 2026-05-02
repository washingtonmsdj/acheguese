import {
  educationDetailPreviewMap,
  educationLandingPreviewProfiles,
  educationPreviewRouteByProfileId,
  type EducationDetailPreview,
} from './publicEducationPage.mock';

export function isEducationPreviewEnabled(): boolean {
  return import.meta.env.DEV;
}

export function getEducationPreviewDetailBySlug(
  slug?: string,
): EducationDetailPreview | undefined {
  if (!isEducationPreviewEnabled() || !slug) return undefined;
  return educationDetailPreviewMap[slug];
}

export function getEducationPreviewProfiles() {
  if (!isEducationPreviewEnabled()) return [];
  return educationLandingPreviewProfiles;
}

export function getEducationPreviewDistricts(): string[] {
  if (!isEducationPreviewEnabled()) return [];
  const set = new Set<string>();
  Object.values(educationDetailPreviewMap).forEach((preview) => set.add(preview.district));
  return Array.from(set).sort();
}

export function getEducationPreviewRoute(profileId: string) {
  return educationPreviewRouteByProfileId[profileId];
}

