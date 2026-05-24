export const RECOMMENDATION_CATEGORY_IDS = [
  'services',
  'restaurantes',
  'manutencao',
  'saude',
  'pets',
  'compras',
  'outros',
] as const;

export type RecommendationCategoryId = (typeof RECOMMENDATION_CATEGORY_IDS)[number];

const RECOMMENDATION_CATEGORY_SET = new Set<string>(RECOMMENDATION_CATEGORY_IDS);

export const RECOMMENDATION_CATEGORY_DETAILS: Record<
  RecommendationCategoryId,
  { label: string; hint: string }
> = {
  services: {
    label: 'Serviços',
    hint: 'Eletricista, encanador, diarista, pintor...',
  },
  restaurantes: {
    label: 'Restaurantes',
    hint: 'Restaurante, lanchonete, pizzaria, padaria...',
  },
  manutencao: {
    label: 'Manutenção',
    hint: 'Reformas, consertos, instalações...',
  },
  saude: {
    label: 'Saúde',
    hint: 'Médico, dentista, farmácia, clínica...',
  },
  pets: {
    label: 'Pets',
    hint: 'Veterinário, pet shop, banho e tosa...',
  },
  compras: {
    label: 'Compras',
    hint: 'Lojas, mercados, materiais e itens locais...',
  },
  outros: {
    label: 'Outros',
    hint: 'Qualquer outra recomendação local...',
  },
};

export const RECOMMENDATION_CATEGORY_OPTIONS = RECOMMENDATION_CATEGORY_IDS.map((id) => ({
  id,
  ...RECOMMENDATION_CATEGORY_DETAILS[id],
}));

export const RECOMMENDATION_FILTER_OPTIONS = [
  { id: 'todos' as const, label: 'Todos' },
  ...RECOMMENDATION_CATEGORY_OPTIONS.map(({ id, label }) => ({ id, label })),
];

export function getRecommendationCategoryDetails(category: string): {
  label: string;
  hint: string;
} {
  return (
    RECOMMENDATION_CATEGORY_DETAILS[category as RecommendationCategoryId] ??
    RECOMMENDATION_CATEGORY_DETAILS.outros
  );
}

interface RecommendationFormDataLike {
  titulo: string;
  description: string;
  category: string;
}

export interface BusinessRecommendationPrefillInput {
  businessName: string;
  businessCategory?: string | null;
  businessUrl?: string | null;
}

export function mapBusinessCategoryToRecommendationCategory(
  businessCategory?: string | null,
): RecommendationCategoryId {
  const normalized = (businessCategory || '').toLowerCase();

  if (
    normalized.includes('restaurante') ||
    normalized.includes('gastronomia') ||
    normalized.includes('lanchonete') ||
    normalized.includes('pizzaria') ||
    normalized.includes('padaria') ||
    normalized.includes('bar')
  ) {
    return 'restaurantes';
  }

  if (
    normalized.includes('saude') ||
    normalized.includes('clinica') ||
    normalized.includes('farmacia') ||
    normalized.includes('medic')
  ) {
    return 'saude';
  }

  if (
    normalized.includes('pet') ||
    normalized.includes('veterin') ||
    normalized.includes('banho')
  ) {
    return 'pets';
  }

  if (
    normalized.includes('loja') ||
    normalized.includes('mercado') ||
    normalized.includes('shopping') ||
    normalized.includes('varejo')
  ) {
    return 'compras';
  }

  if (
    normalized.includes('obra') ||
    normalized.includes('reforma') ||
    normalized.includes('constr') ||
    normalized.includes('manutenc')
  ) {
    return 'manutencao';
  }

  return 'services';
}

export function buildBusinessRecommendationPrefill(
  input: BusinessRecommendationPrefillInput,
): RecommendationFormDataLike {
  const businessName = input.businessName.trim();
  const category = mapBusinessCategoryToRecommendationCategory(input.businessCategory);

  const title = `Alguem recomenda ${businessName}?`;
  const descriptionBase = `Estou buscando opinioes reais sobre ${businessName}.`;
  const description = input.businessUrl
    ? `${descriptionBase}\n\nEmpresa: ${businessName}\nLink: ${input.businessUrl}`
    : `${descriptionBase}\n\nEmpresa: ${businessName}`;

  return {
    titulo: title.slice(0, 200),
    description: description.slice(0, 500),
    category,
  };
}

export function buildRecommendationPrefillFromSearchParams(
  searchParams: URLSearchParams,
): Partial<RecommendationFormDataLike> {
  const titleParam = searchParams.get('title') || searchParams.get('titulo') || '';
  const descriptionParam =
    searchParams.get('description') || searchParams.get('descricao') || '';
  const categoryParam = searchParams.get('category') || searchParams.get('categoria') || '';

  const businessName = searchParams.get('businessName') || '';
  const businessCategory = searchParams.get('businessCategory') || '';
  const businessUrl = searchParams.get('businessUrl') || '';

  const fallbackFromBusiness =
    businessName.trim().length > 0
      ? buildBusinessRecommendationPrefill({
          businessName,
          businessCategory,
          businessUrl,
        })
      : null;

  const rawTitle = titleParam || fallbackFromBusiness?.titulo || '';
  const rawDescription = descriptionParam || fallbackFromBusiness?.description || '';
  const rawCategory = categoryParam || fallbackFromBusiness?.category || '';

  return {
    titulo: rawTitle.slice(0, 200),
    description: rawDescription.slice(0, 500),
    category: RECOMMENDATION_CATEGORY_SET.has(rawCategory) ? rawCategory : '',
  };
}
