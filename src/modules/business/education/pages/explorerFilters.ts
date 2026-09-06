import type { EducationPublicProfile } from '@/core/education';

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
  district: string | null;
  onlyAvailable: boolean;
  sort: SortKey;
}

export const INITIAL_FILTERS: FilterState = {
  query: '',
  niches: [],
  schoolNetworks: [],
  institutionTypes: [],
  infrastructure: [],
  district: null,
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
