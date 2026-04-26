import type { MenuItemAddon } from "../../../types/menu";

export type PizzaRenderSize = "sm" | "md" | "lg" | "xl";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPizzaSizeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\([^)]*\)/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function resolvePizzaRenderSize(input: {
  sizeLabel?: string | null;
  diameterCm?: number | null;
  slices?: number | null;
}): PizzaRenderSize {
  const label = normalizeText(input.sizeLabel ?? "");

  if (label) {
    if (/\bmini\b|\bbroto\b|\bindividual\b|\bpequena\b|\bpequeno\b|\bp\b/.test(label)) return "sm";
    if (/\bmedia\b|\bmedio\b|\bmediana\b|\bm\b/.test(label)) return "md";
    if (/\bgrande\b|\bg\b/.test(label)) return "lg";
    if (/\bfamilia\b|\bgigante\b|\bextra grande\b|\bgg\b|\bgiga\b/.test(label)) return "xl";
  }

  if (typeof input.diameterCm === "number" && Number.isFinite(input.diameterCm)) {
    if (input.diameterCm <= 25) return "sm";
    if (input.diameterCm <= 32) return "md";
    if (input.diameterCm <= 40) return "lg";
    return "xl";
  }

  if (typeof input.slices === "number" && Number.isFinite(input.slices)) {
    if (input.slices <= 4) return "sm";
    if (input.slices <= 8) return "md";
    if (input.slices <= 12) return "lg";
    return "xl";
  }

  return "md";
}

export function textHasPizzaCrustHint(...values: Array<string | null | undefined>): boolean {
  const joined = normalizeText(values.filter(Boolean).join(" "));
  if (!joined) return false;
  return /\bborda\b|\brecheada\b|\bcrust\b|\bedge\b/.test(joined);
}

export function hasSelectedCrustAddon(
  addons: MenuItemAddon[],
  addonQuantities: Record<string, number>,
): boolean {
  return addons.some((addon) => {
    const quantity = addonQuantities[addon.id] ?? 0;
    if (quantity <= 0) return false;
    return textHasPizzaCrustHint(addon.name, addon.description);
  });
}
