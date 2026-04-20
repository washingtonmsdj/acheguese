/**
 * Canonical cuisine constants for cross-domain usage.
 */

export const CUISINE_TYPES = [
  "brasileira",
  "italiana",
  "japonesa",
  "chinesa",
  "mexicana",
  "arabe",
  "francesa",
  "portuguesa",
  "indiana",
  "tailandesa",
  "americana",
  "vegetariana",
  "vegana",
  "frutos-do-mar",
  "churrascaria",
  "pizzaria",
  "hamburgueria",
  "hamburguer",
  "lanchonete",
  "cafeteria",
  "padaria",
  "sorveteria",
  "doceria",
  "bar",
  "pub",
  "contemporanea",
  "fusion",
  "regional",
  "baiana",
  "mineira",
  "nordestina",
  "pastel",
  "outros",
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];

function humanizeCuisineSlug(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const CUISINE_LABEL_OVERRIDES: Partial<Record<CuisineType, string>> = {
  "frutos-do-mar": "Frutos do Mar",
  sorveteria: "Acai e Sorvetes",
  hamburguer: "Hamburguer",
  pastel: "Pastel",
};

export function getCuisineLabel(cuisineType?: string | null): string {
  if (!cuisineType) {
    return "Culinaria";
  }

  return (
    CUISINE_LABEL_OVERRIDES[cuisineType as CuisineType] ??
    humanizeCuisineSlug(cuisineType)
  );
}
