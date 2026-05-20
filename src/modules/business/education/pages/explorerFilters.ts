import type { EducationPublicProfile } from '../types';

export const SORTERS = [
  { key: 'relevance', label: 'Relevancia' },
  { key: 'name_asc', label: 'A-Z' },
  { key: 'newest', label: 'Mais recentes' },
] as const;

export type SortKey = (typeof SORTERS)[number]['key'];
export type ViewMode = 'grid' | 'list';

export interface FilterState {
  query: string;
  niches: string[];
  schoolNetworks: string[];
  institutionTypes: string[];
  infrastructure: string[];
  modalities: string[];
  audiences: string[];
  district: string | null;
  priceRange: [number, number];
  onlyAvailable: boolean;
  sort: SortKey;
}

export const INITIAL_FILTERS: FilterState = {
  query: '',
  niches: [],
  schoolNetworks: [],
  institutionTypes: [],
  infrastructure: [],
  modalities: [],
  audiences: [],
  district: null,
  priceRange: [0, 3000],
  onlyAvailable: false,
  sort: 'relevance',
};

export interface EnrichedEducationProfile {
  profile: EducationPublicProfile;
}

export function sanitizePublicEducationText(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/dados iniciais baseados[^.]*\./gi, '')
    .replace(/lista de espera/gi, '')
    .replace(/consultar valor/gi, '')
    .replace(/saber mais/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getInstitutionTypeKey(profile: EducationPublicProfile): string {
  const name = profile.institution_type
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const niche = profile.niche_key;

  if (name.includes('centro municipal de educacao infantil') || name.includes('cmei')) {
    return 'cmei';
  }

  if (niche === 'daycare' || name.includes('creche')) {
    return 'creche';
  }

  if (name.includes('colegio')) {
    return 'colegio';
  }

  if (name.includes('curso') || niche === 'prep_course' || niche === 'language_school') {
    return 'curso';
  }

  return 'escola';
}

export function normalizeSlug(value?: string | null): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '-');
}

export function profileHasInfrastructure(profile: EducationPublicProfile, key: string): boolean {
  const facilities = profile.school_facility_features ?? [];
  const access = profile.school_accessibility_features ?? [];
  const equipment = profile.school_equipment_features ?? [];
  if (key === 'library') return facilities.includes('library') || facilities.includes('reading_room');
  if (key === 'laboratory') return facilities.includes('science_lab') || facilities.includes('computer_lab');
  if (key === 'sports_court') return facilities.includes('sports_court') || facilities.includes('covered_sports_court') || facilities.includes('open_sports_court');
  if (key === 'pool') return facilities.includes('pool');
  if (key === 'accessibility') return access.length > 0;
  if (key === 'internet') return equipment.includes('internet');
  return false;
}

export function filterEnrichedProfiles(
  enriched: EnrichedEducationProfile[],
  filters: FilterState,
): EnrichedEducationProfile[] {
  let list = enriched;

  if (filters.query.trim()) {
    const q = filters.query.toLowerCase();
    list = list.filter(
      ({ profile }) =>
        profile.institution_type.toLowerCase().includes(q) ||
        (profile.business_name ?? '').toLowerCase().includes(q) ||
        sanitizePublicEducationText(profile.summary).toLowerCase().includes(q),
    );
  }

  if (filters.niches.length > 0) {
    list = list.filter(({ profile }) => filters.niches.includes(profile.niche_key));
  }

  if (filters.schoolNetworks.length > 0) {
    list = list.filter(
      ({ profile }) =>
        Boolean(profile.school_network) &&
        filters.schoolNetworks.includes(profile.school_network as string),
    );
  }

  if (filters.institutionTypes.length > 0) {
    list = list.filter(({ profile }) =>
      filters.institutionTypes.includes(getInstitutionTypeKey(profile)),
    );
  }

  if (filters.infrastructure.length > 0) {
    list = list.filter(({ profile }) =>
      filters.infrastructure.every((infra) => profileHasInfrastructure(profile, infra)),
    );
  }

  if (filters.district) {
    const filterDistrict = normalizeSlug(filters.district);
    list = list.filter(({ profile }) => normalizeSlug(profile.public_route?.district) === filterDistrict);
  }

  if (filters.onlyAvailable) {
    list = list.filter(({ profile }) => profile.enrollment_open === true);
  }

  if (filters.sort === 'name_asc') {
    list = [...list].sort((a, b) =>
      a.profile.institution_type.localeCompare(b.profile.institution_type),
    );
  } else if (filters.sort === 'newest') {
    list = [...list].sort(
      (a, b) =>
        new Date(b.profile.created_at).getTime() -
        new Date(a.profile.created_at).getTime(),
    );
  }

  return list;
}
