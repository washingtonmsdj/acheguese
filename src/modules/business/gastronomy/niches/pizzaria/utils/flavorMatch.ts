import type { PizzaFlavor } from "../types";

const PIZZA_NAME_STOPWORDS = new Set([
  "pizza",
  "pizzas",
  "especial",
  "especiais",
  "tradicional",
  "tradicionais",
  "premium",
  "doce",
  "doces",
]);

function normalizePizzaText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizePizzaText(value: string): string {
  return value
    .replace(/gue/g, "ge")
    .replace(/ghi/g, "gi")
    .replace(/gh/g, "g")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizePizzaText(value: string): string[] {
  return canonicalizePizzaText(normalizePizzaText(value))
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !PIZZA_NAME_STOPWORDS.has(token));
}

export function findFlavorByMenuItemName(
  flavors: PizzaFlavor[],
  itemName: string,
): PizzaFlavor | undefined {
  if (!itemName.trim()) return undefined;

  const normalizedItemName = normalizePizzaText(itemName);
  const canonicalItemName = canonicalizePizzaText(normalizedItemName);
  const itemTokens = tokenizePizzaText(itemName);

  const preparedFlavors = flavors.map((flavor) => {
    const normalizedFlavorName = normalizePizzaText(flavor.name);
    const canonicalFlavorName = canonicalizePizzaText(normalizedFlavorName);
    const flavorTokens = tokenizePizzaText(flavor.name);
    return {
      flavor,
      normalizedFlavorName,
      canonicalFlavorName,
      flavorTokens,
    };
  });

  const exactMatch = preparedFlavors.find(
    (entry) =>
      entry.normalizedFlavorName === normalizedItemName ||
      entry.canonicalFlavorName === canonicalItemName,
  );
  if (exactMatch) return exactMatch.flavor;

  const containsMatch = preparedFlavors.find(
    (entry) =>
      normalizedItemName.includes(entry.normalizedFlavorName) ||
      canonicalItemName.includes(entry.canonicalFlavorName),
  );
  if (containsMatch) return containsMatch.flavor;

  if (!itemTokens.length) return undefined;

  const tokenMatch = preparedFlavors.find((entry) =>
    itemTokens.some((token) => entry.flavorTokens.includes(token)),
  );
  return tokenMatch?.flavor;
}

