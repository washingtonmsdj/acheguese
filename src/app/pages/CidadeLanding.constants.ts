import { formatBrlNoCents } from "@/shared/utils/currency";
export { formatMetric } from "@/shared/utils/formatters";

export function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
}

export function formatPrice(price: number): string {
  return formatBrlNoCents(price);
}
