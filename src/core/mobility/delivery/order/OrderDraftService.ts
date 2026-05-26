import type {
  CreateOrderItemInput,
  OrderItemAddonSnapshot,
  OrderItemSnapshot,
  OrderSourceContext,
} from "./types";
import { ORDER_SOURCE_TYPE } from "./types";
import { roundMoney } from "./money";

function normalizeSnapshot(snapshot?: OrderItemSnapshot): OrderItemSnapshot {
  const addons = Array.isArray(snapshot?.addons)
    ? snapshot.addons.map((addon): OrderItemAddonSnapshot => ({
        addon_id: addon.addon_id ?? null,
        name: addon.name,
        unit_price: roundMoney(addon.unit_price, "addon.unit_price"),
        quantity: addon.quantity,
        total_price: roundMoney(addon.total_price, "addon.total_price"),
      }))
    : [];

  return {
    base_unit_price:
      snapshot?.base_unit_price === undefined
        ? undefined
        : roundMoney(snapshot.base_unit_price, "snapshot.base_unit_price"),
    variant: snapshot?.variant
      ? {
          variant_id: snapshot.variant.variant_id ?? null,
          name: snapshot.variant.name,
          price_adjustment: roundMoney(
            snapshot.variant.price_adjustment,
            "snapshot.variant.price_adjustment",
          ),
        }
      : null,
    addons,
    special_instructions: snapshot?.special_instructions ?? null,
    description: snapshot?.description ?? null,
    structured_item: snapshot?.structured_item ?? null,
  };
}

export class OrderDraftService {
  static normalizeSourceContext(
    sourceContext?: OrderSourceContext,
  ): Required<Omit<OrderSourceContext, "source_id" | "source_reference">> &
    Pick<OrderSourceContext, "source_id" | "source_reference"> {
    const normalizedSourceType =
      sourceContext?.source_type ?? ORDER_SOURCE_TYPE.MANUAL;
    const normalizedSourceId = sourceContext?.source_id?.trim() || null;
    const normalizedSourceReference =
      sourceContext?.source_reference?.trim() || null;

    if (normalizedSourceType !== ORDER_SOURCE_TYPE.MANUAL && !normalizedSourceId) {
      throw new Error(
        "source_id e obrigatorio quando source_type nao e manual.",
      );
    }

    return {
      source_type: normalizedSourceType,
      source_id: normalizedSourceId,
      source_reference: normalizedSourceReference,
      source_metadata: sourceContext?.source_metadata ?? {},
    };
  }

  static normalizeItems(items?: CreateOrderItemInput[]): CreateOrderItemInput[] {
    if (!items || items.length === 0) return [];

    return items.map((item, index) => {
      const name = item.name?.trim();
      if (!name) {
        throw new Error(`Item ${index + 1}: name e obrigatorio.`);
      }

      const quantity = roundMoney(item.quantity, `Item ${index + 1}: quantity`);
      const unitPrice = roundMoney(item.unit_price, `Item ${index + 1}: unit_price`);
      const addonsTotal = roundMoney(
        item.addons_total ?? 0,
        `Item ${index + 1}: addons_total`,
      );
      const computedLineTotal = roundMoney(
        quantity * unitPrice + addonsTotal,
        `Item ${index + 1}: computed line_total`,
      );
      const lineTotal = roundMoney(
        item.line_total ?? computedLineTotal,
        `Item ${index + 1}: line_total`,
      );

      if (quantity <= 0) {
        throw new Error(`Item ${index + 1}: quantity deve ser maior que zero.`);
      }

      if (unitPrice < 0 || addonsTotal < 0 || lineTotal < 0) {
        throw new Error(
          `Item ${index + 1}: unit_price, addons_total e line_total nao podem ser negativos.`,
        );
      }

      if (lineTotal !== computedLineTotal) {
        throw new Error(
          `Item ${index + 1}: line_total divergente do calculo esperado.`,
        );
      }

      return {
        source_item_id: item.source_item_id?.trim() || undefined,
        sku: item.sku?.trim() || undefined,
        name,
        quantity,
        unit_price: unitPrice,
        addons_total: addonsTotal,
        line_total: lineTotal,
        notes: item.notes?.trim() || undefined,
        item_snapshot: normalizeSnapshot(item.item_snapshot),
        metadata: item.metadata ?? {},
      };
    });
  }

  static calculateItemsTotal(items?: CreateOrderItemInput[]): number {
    return roundMoney(
      (items ?? []).reduce((total, item) => total + (item.line_total ?? 0), 0),
      "items_total",
    );
  }

  static assertItemsTotalMatchesFinancial(
    items: CreateOrderItemInput[] | undefined,
    itemsTotal: number,
  ): void {
    if (!items || items.length === 0) return;

    const normalizedItemsTotal = roundMoney(itemsTotal, "items_total");
    const calculatedItemsTotal = this.calculateItemsTotal(items);

    if (normalizedItemsTotal !== calculatedItemsTotal) {
      throw new Error(
        `items_total divergente do somatorio dos itens (${calculatedItemsTotal.toFixed(2)}).`,
      );
    }
  }
}
