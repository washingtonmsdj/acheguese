export type EventCategory =
  | 'cultural'
  | 'esportivo'
  | 'social'
  | 'religioso'
  | 'educacional'
  | 'gastronomico'
  | 'artistico'
  | 'comunitario';

export const EVENT_CATEGORY_OPTIONS = [
  { value: 'cultural', label: 'Cultural', color: 'from-purple-500 to-pink-500' },
  { value: 'esportivo', label: 'Esportivo', color: 'from-green-500 to-emerald-500' },
  { value: 'social', label: 'Social', color: 'from-blue-500 to-cyan-500' },
  { value: 'religioso', label: 'Religioso', color: 'from-amber-500 to-orange-500' },
  { value: 'educacional', label: 'Educacional', color: 'from-indigo-500 to-violet-500' },
  { value: 'gastronomico', label: 'Gastronômico', color: 'from-red-500 to-rose-500' },
  { value: 'artistico', label: 'Artístico', color: 'from-pink-500 to-purple-500' },
  { value: 'comunitario', label: 'Comunitário', color: 'from-teal-500 to-cyan-500' },
] as const satisfies ReadonlyArray<{
  value: EventCategory;
  label: string;
  color: string;
}>;

export const EVENT_CATEGORY_VALUES = EVENT_CATEGORY_OPTIONS.map((category) => category.value);

export const EVENT_LIST_CATEGORY_OPTIONS = [
  { id: 'todos', name: 'Todos', icon: '*', color: 'from-slate-500 to-slate-600' },
  ...EVENT_CATEGORY_OPTIONS.map((category) => ({
    id: category.value,
    name: category.label,
    icon: '*',
    color: category.color,
  })),
] as const;

export const EVENT_DATE_FILTER_OPTIONS = [
  { id: 'todos', name: 'Todas as datas' },
  { id: 'hoje', name: 'Hoje' },
  { id: 'semana', name: 'Esta semana' },
  { id: 'mes', name: 'Este mês' },
  { id: 'proximo-mes', name: 'Próximo mês' },
] as const;

export const EVENT_TYPE_FILTER_OPTIONS = [
  { id: 'todos', name: 'Todos os tipos' },
  { id: 'presencial', name: 'Presencial' },
  { id: 'online', name: 'Online' },
  { id: 'hibrido', name: 'Híbrido' },
] as const;

export const EVENT_PRICE_FILTER_OPTIONS = [
  { id: 'todos', name: 'Todos os preços' },
  { id: 'gratuito', name: 'Gratuito' },
  { id: 'pago', name: 'Pago' },
] as const;

export const EVENT_SORT_OPTIONS = [
  { id: 'data-asc', name: 'Data: Mais próximos' },
  { id: 'data-desc', name: 'Data: Mais distantes' },
  { id: 'popularidade', name: 'Mais populares' },
  { id: 'preco-asc', name: 'Menor preço' },
  { id: 'preco-desc', name: 'Maior preço' },
  { id: 'alfabetica', name: 'A-Z' },
] as const;

export const EVENTS_ITEMS_PER_PAGE = 20;

export function isEventCategory(value?: string | null): value is EventCategory {
  return EVENT_CATEGORY_VALUES.includes(value as EventCategory);
}

export function getEventCategoryLabel(value?: string | null): string {
  return EVENT_CATEGORY_OPTIONS.find((category) => category.value === value)?.label ?? 'Comunitário';
}
