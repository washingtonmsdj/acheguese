import type { Json } from "@/shared/types/json";
import type { CartItem, CartItemAddon, MenuItemAddon } from "../../types/menu";
import { money } from "../../utils/currency";
import { PizzaPricingService } from "./PizzaPricingService";
import { PizzaValidationService } from "./PizzaValidationService";
import type {
  PizzaBuildSelection,
  PizzaCatalog,
  PizzaDough,
  PizzaEdge,
  PizzaOrderItemSnapshot,
  PizzaSize,
} from "./types";

function normalizeQuantity(value?: number): number {
  if (value == null || Number.isNaN(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalizeAddonSelection(
  addons: MenuItemAddon[],
  addonQuantities?: Record<string, number>,
): CartItemAddon[] {
  if (!addons.length || !addonQuantities) return [];

  return addons
    .map((addon) => {
      const quantity = Math.max(
        0,
        Math.min(Math.floor(addonQuantities[addon.id] ?? 0), addon.max_quantity || 1),
      );

      if (!quantity) return null;

      return {
        addon_id: addon.id,
        name: addon.name,
        price: money(addon.price),
        quantity,
      } satisfies CartItemAddon;
    })
    .filter((addon): addon is CartItemAddon => addon !== null);
}

function findRequired<T extends { id: string; name: string }>(
  values: T[],
  id: string,
  label: string,
): T {
  const value = values.find((entry) => entry.id === id);
  if (!value) throw new Error(`${label} não encontrado: ${id}.`);
  return value;
}

function buildPizzaName(size: PizzaSize, flavorCount: number): string {
  return `Pizza ${size.name} - ${flavorCount} sabor${flavorCount > 1 ? "es" : ""}`;
}

export class PizzaCartItemBuilder {
  static build(selection: PizzaBuildSelection, catalog: PizzaCatalog): CartItem {
    if (!selection.item.is_available) {
      throw new Error("Não é possível adicionar um item indisponível ao carrinho.");
    }

    const quantity = normalizeQuantity(selection.quantity);
    const size = findRequired(catalog.sizes, selection.size_id, "Tamanho de pizza");
    const edge = selection.edge_id
      ? findRequired(catalog.edges, selection.edge_id, "Borda de pizza")
      : null;
    const dough = selection.dough_id
      ? findRequired(catalog.doughs, selection.dough_id, "Massa de pizza")
      : null;
    const validation = PizzaValidationService.validateBuild({
      size,
      flavors: catalog.flavors,
      flavor_selection: selection.flavors,
      edge,
      dough,
    });

    if (!validation.is_valid) {
      throw new Error(validation.errors.join(" "));
    }

    const addons = normalizeAddonSelection(
      (selection.item.addons ?? []).filter((addon) => addon.is_available),
      selection.addon_quantities,
    );
    const priceRule = selection.price_rule ?? catalog.config.default_price_rule;
    const breakdown = PizzaPricingService.calculate({
      size,
      flavors: catalog.flavors,
      flavor_selection: selection.flavors,
      rule: priceRule,
      edge,
      dough,
      addons,
      quantity,
    });

    const flavorSnapshots = selection.flavors.map((entry) => {
      const flavor = findRequired(catalog.flavors, entry.flavor_id, "Sabor de pizza");
      return {
        flavor_id: flavor.id,
        name: flavor.name,
        fraction: entry.fraction,
        unit_price_at_purchase: money(flavor.base_price),
      };
    });

    const snapshot: PizzaOrderItemSnapshot = {
      item_id: selection.item.id,
      item_name: selection.item.name,
      niche_key: "pizza",
      size: {
        size_id: size.id,
        name: size.name,
        base_price: money(size.base_price),
        max_flavors: size.max_flavors,
        slices: size.slices,
        diameter_cm: size.diameter_cm,
      },
      flavors: flavorSnapshots,
      flavor_count: flavorSnapshots.length,
      price_rule: priceRule,
      flavor_unit_price: money(breakdown.flavor_price),
      edge: edge
        ? {
            edge_id: edge.id,
            name: edge.name,
            price: money(edge.price),
          }
        : null,
      dough: dough
        ? {
            dough_id: (dough as PizzaDough).id,
            name: dough.name,
            price_adjustment: money(dough.price_adjustment),
          }
        : null,
      addons,
      quantity,
      unit_price: breakdown.unit_price,
      line_total: breakdown.line_total,
    };

    return {
      line_id: crypto.randomUUID(),
      item_id: selection.item.id,
      name: buildPizzaName(size, flavorSnapshots.length),
      base_price: breakdown.unit_price,
      quantity,
      addons,
      subtotal: breakdown.line_total,
      structured_item: {
        kind: "pizza",
        snapshot: snapshot as unknown as Json,
        price_breakdown: breakdown as unknown as Json,
      },
    };
  }
}
