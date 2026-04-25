import type {
  PizzaDough,
  PizzaEdge,
  PizzaFlavor,
  PizzaFlavorSelection,
  PizzaPriceBreakdown,
  PizzaPriceRuleType,
  PizzaSize,
} from "./types";
import type { CartItemAddon } from "../../types/menu";
import { money } from "../../utils/currency";

function resolveSelectedFlavors(
  flavors: PizzaFlavor[],
  selection: PizzaFlavorSelection[],
): Array<PizzaFlavor & { fraction: number }> {
  return selection.map((entry) => {
    const flavor = flavors.find((candidate) => candidate.id === entry.flavor_id);
    if (!flavor) {
      throw new Error(`Sabor de pizza nao encontrado: ${entry.flavor_id}.`);
    }

    return {
      ...flavor,
      fraction: entry.fraction,
    };
  });
}

function calculateFlavorPrice(params: {
  size: PizzaSize;
  flavors: Array<PizzaFlavor & { fraction: number }>;
  rule: PizzaPriceRuleType;
}): number {
  const { size, flavors, rule } = params;

  if (!flavors.length) return 0;

  switch (rule) {
    case "highest_price":
      return money(Math.max(...flavors.map((flavor) => flavor.base_price)));
    case "average_price":
      return money(
        flavors.reduce((total, flavor) => total + flavor.base_price, 0) / flavors.length,
      );
    case "weighted_average":
      return money(
        flavors.reduce(
          (total, flavor) => total + flavor.base_price * flavor.fraction,
          0,
        ),
      );
    case "fixed_base_plus_flavors":
      return money(
        size.base_price +
          flavors.reduce(
            (total, flavor) => total + flavor.base_price * flavor.fraction,
            0,
          ),
      );
    default:
      return money(Math.max(...flavors.map((flavor) => flavor.base_price)));
  }
}

export class PizzaPricingService {
  static calculate(params: {
    size: PizzaSize;
    flavors: PizzaFlavor[];
    flavor_selection: PizzaFlavorSelection[];
    rule: PizzaPriceRuleType;
    edge?: PizzaEdge | null;
    dough?: PizzaDough | null;
    addons?: CartItemAddon[];
    quantity?: number;
  }): PizzaPriceBreakdown {
    const quantity = Math.max(1, Math.floor(params.quantity ?? 1));
    const selectedFlavors = resolveSelectedFlavors(
      params.flavors,
      params.flavor_selection,
    );
    const flavorPrice = calculateFlavorPrice({
      size: params.size,
      flavors: selectedFlavors,
      rule: params.rule,
    });
    const sizePrice = params.rule === "fixed_base_plus_flavors" ? 0 : params.size.base_price;
    const doughPrice = params.dough?.price_adjustment ?? 0;
    const edgePrice = params.edge?.price ?? 0;
    const addonsTotal = money(
      (params.addons ?? []).reduce(
        (total, addon) => total + addon.price * addon.quantity,
        0,
      ),
    );
    const unitPrice = money(sizePrice + flavorPrice + doughPrice + edgePrice);

    return {
      size_price: money(sizePrice),
      flavor_price: money(flavorPrice),
      dough_price: money(doughPrice),
      edge_price: money(edgePrice),
      addons_total: addonsTotal,
      unit_price: unitPrice,
      line_total: money(unitPrice * quantity + addonsTotal),
    };
  }
}
