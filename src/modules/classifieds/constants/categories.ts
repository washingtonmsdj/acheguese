import {
  CLASSIFIED_CATEGORIES as CLASSIFIED_CATEGORY_VALUES,
  CLASSIFIED_CATEGORY_LABELS,
  type ClassifiedCategory,
} from "@/config/categories";
import { isLaunchClassifiedCategoryEnabled } from "@/config/launchScope";

export interface ClassifiedCategoryOption {
  id: ClassifiedCategory | "todos";
  label: string;
}

export const CLASSIFIED_CATEGORIES: readonly ClassifiedCategoryOption[] = [
  { id: "todos", label: "Todos" },
  ...Object.entries(CLASSIFIED_CATEGORY_LABELS)
    .filter(([id]) => isLaunchClassifiedCategoryEnabled(id))
    .map(([id, label]) => ({
      id: id as ClassifiedCategory,
      label,
    })),
];

export const CLASSIFIED_FORM_CATEGORIES: readonly ClassifiedCategoryOption[] =
  CLASSIFIED_CATEGORIES.filter(
    (category): category is ClassifiedCategoryOption => category.id !== "todos",
  );

export function getCategoryLabel(categoryId: string): string {
  return (
    CLASSIFIED_CATEGORY_LABELS[categoryId as ClassifiedCategory] ??
    CLASSIFIED_CATEGORY_LABELS[CLASSIFIED_CATEGORY_VALUES.OTHER]
  );
}

export function isValidCategory(categoryId: string): categoryId is ClassifiedCategory {
  return (
    Object.values(CLASSIFIED_CATEGORY_VALUES).includes(categoryId as ClassifiedCategory) &&
    isLaunchClassifiedCategoryEnabled(categoryId)
  );
}
