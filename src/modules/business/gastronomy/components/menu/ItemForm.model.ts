import { z } from 'zod';
import type { MenuCategory, MenuItem } from '@/core/business/services/MenuService';
import { isMediaAssetReference } from '@/core/media';

export const NO_CATEGORY_VALUE = '__none__';

export const itemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  category_id: z.string().optional(),
  image_url: z
    .string()
    .refine((value) => !value || isMediaAssetReference(value), 'Imagem inválida')
    .optional(),
  preparation_time_min: z.number().min(0).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  stock_alert_threshold: z.number().int().min(0).optional(),
  is_available: z.boolean().default(true),
  calories: z.number().min(0).optional(),
  is_featured: z.boolean().default(false),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_gluten_free: z.boolean().default(false),
  is_lactose_free: z.boolean().default(false),
  is_spicy: z.boolean().default(false),
  spicy_level: z.number().int().min(1).max(5).optional(),
  ingredients: z.string().optional(),
  tags: z.string().optional(),
  allergens: z.string().optional(),
  pizza_size_label: z.string().max(40).optional(),
  pizza_slices: z.number().int().min(1).max(24).optional(),
  pizza_diameter_cm: z.number().min(10).max(80).optional(),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

export interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<boolean | void> | boolean | void;
  item?: MenuItem | null;
  categories: MenuCategory[];
  isSubmitting?: boolean;
  allowCategorySelection?: boolean;
  allowImage?: boolean;
  isPizzaria?: boolean;
}

export type ItemNutritionalInfo = Record<string, unknown>;

export interface PizzaVisualInfo {
  size_label?: string;
  slices?: number;
  diameter_cm?: number;
}

export function getItemNutritionalInfo(item?: MenuItem | null): ItemNutritionalInfo {
  return item?.nutritional_info && typeof item.nutritional_info === 'object'
    ? (item.nutritional_info as ItemNutritionalInfo)
    : {};
}

export function getPizzaVisual(info: ItemNutritionalInfo): PizzaVisualInfo | undefined {
  return info.pizza_visual as PizzaVisualInfo | undefined;
}

export function buildItemFormDefaults(item?: MenuItem | null): ItemFormValues {
  const itemNutritionalInfo = getItemNutritionalInfo(item);
  const pizzaVisual = getPizzaVisual(itemNutritionalInfo);

  return {
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category_id: item?.category_id || '',
    image_url: item?.image_reference || '',
    preparation_time_min: item?.preparation_time_min || undefined,
    stock_quantity: item?.stock_quantity ?? undefined,
    stock_alert_threshold: item?.stock_alert_threshold ?? undefined,
    is_available: item?.is_available ?? true,
    calories: typeof itemNutritionalInfo.calories === 'number' ? itemNutritionalInfo.calories : undefined,
    is_featured: item?.is_featured || false,
    is_vegetarian: itemNutritionalInfo.is_vegetarian === true,
    is_vegan: itemNutritionalInfo.is_vegan === true,
    is_gluten_free: itemNutritionalInfo.is_gluten_free === true,
    is_lactose_free: itemNutritionalInfo.is_lactose_free === true,
    is_spicy: itemNutritionalInfo.is_spicy === true,
    spicy_level: typeof itemNutritionalInfo.spicy_level === 'number' ? itemNutritionalInfo.spicy_level : undefined,
    ingredients: Array.isArray(itemNutritionalInfo.ingredients) ? itemNutritionalInfo.ingredients.join(', ') : '',
    tags: item?.tags?.join(', ') || '',
    allergens: item?.allergens?.join(', ') || '',
    pizza_size_label: pizzaVisual?.size_label || '',
    pizza_slices: typeof pizzaVisual?.slices === 'number' ? pizzaVisual.slices : undefined,
    pizza_diameter_cm: typeof pizzaVisual?.diameter_cm === 'number' ? pizzaVisual.diameter_cm : undefined,
  };
}

export function buildMenuItemPayload(
  values: ItemFormValues,
  itemNutritionalInfo: ItemNutritionalInfo,
  options: { allowCategorySelection: boolean; allowImage: boolean },
): Record<string, unknown> {
  const {
    pizza_size_label: _pizzaSizeLabel,
    pizza_slices: _pizzaSlices,
    pizza_diameter_cm: _pizzaDiameterCm,
    ...baseValues
  } = values;

  const baseNutritionalInfo = { ...itemNutritionalInfo };
  const hasPizzaVisual =
    Boolean(values.pizza_size_label?.trim()) ||
    typeof values.pizza_slices === 'number' ||
    typeof values.pizza_diameter_cm === 'number';

  if (hasPizzaVisual) {
    baseNutritionalInfo.pizza_visual = {
      size_label: values.pizza_size_label?.trim() || undefined,
      slices: values.pizza_slices,
      diameter_cm: values.pizza_diameter_cm,
    };
  } else {
    delete baseNutritionalInfo.pizza_visual;
  }

  return {
    ...baseValues,
    tags: baseValues.tags || undefined,
    allergens: baseValues.allergens || undefined,
    image_url: options.allowImage ? baseValues.image_url || undefined : undefined,
    category_id: options.allowCategorySelection ? baseValues.category_id || undefined : undefined,
    nutritional_info: {
      ...baseNutritionalInfo,
      calories: baseValues.calories,
      is_vegetarian: baseValues.is_vegetarian,
      is_vegan: baseValues.is_vegan,
      is_gluten_free: baseValues.is_gluten_free,
      is_lactose_free: baseValues.is_lactose_free,
      is_spicy: baseValues.is_spicy,
      spicy_level: baseValues.spicy_level,
      ingredients: baseValues.ingredients
        ? baseValues.ingredients.split(',').map((ingredient) => ingredient.trim()).filter(Boolean)
        : [],
    },
  };
}
