import type {
  Cart,
  CartItem,
  CartItemAddon,
  CartItemVariant,
  MenuItemAddon,
  MenuItemVariant,
  MenuItemWithRelations,
} from "../types/menu";
import type { GastronomyFulfillmentMode } from "../checkout/checkoutRules";
import { money } from "../utils/currency";

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

function resolveVariant(
  variants: MenuItemVariant[],
  variantId?: string | null,
): CartItemVariant | undefined {
  if (!variants.length) return undefined;

  const selectedVariant =
    variants.find((variant) => variant.id === variantId) ||
    variants.find((variant) => variant.is_default) ||
    variants[0];

  if (!selectedVariant) return undefined;

  return {
    variant_id: selectedVariant.id,
    name: selectedVariant.name,
    price_adjustment: money(selectedVariant.price_adjustment),
  };
}

function calculateLineSubtotal(params: {
  base_price: number;
  quantity: number;
  variant?: CartItemVariant;
  addons: CartItemAddon[];
}): number {
  const unitPrice = money(params.base_price + (params.variant?.price_adjustment ?? 0));
  const addonsTotal = money(
    params.addons.reduce(
      (total, addon) => total + addon.price * addon.quantity,
      0,
    ),
  );

  return money(unitPrice * params.quantity + addonsTotal);
}

export interface BuildCartItemInput {
  item: MenuItemWithRelations;
  quantity?: number;
  variant_id?: string | null;
  addon_quantities?: Record<string, number>;
  special_instructions?: string;
}

export class GastronomyCartService {
  private static normalizeDeliveryFee(
    deliveryFee: number,
    fulfillmentMode: GastronomyFulfillmentMode = "delivery",
  ): number {
    return fulfillmentMode === "delivery" ? money(deliveryFee) : 0;
  }

  static createEmptyCart(
    businessId: string,
    deliveryFee = 0,
    fulfillmentMode: GastronomyFulfillmentMode = "delivery",
  ): Cart {
    const normalizedDeliveryFee = this.normalizeDeliveryFee(deliveryFee, fulfillmentMode);
    return {
      business_id: businessId,
      fulfillment_mode: fulfillmentMode,
      items: [],
      subtotal: 0,
      delivery_fee: normalizedDeliveryFee,
      total: normalizedDeliveryFee,
    };
  }

  static buildCartItem(input: BuildCartItemInput): CartItem {
    const { item } = input;

    if (!item.is_available) {
      throw new Error("Não é possível adicionar um item indisponível ao carrinho.");
    }

    const quantity = normalizeQuantity(input.quantity);
    const availableVariants = (item.variants ?? []).filter(
      (variant) => variant.is_available,
    );
    const availableAddons = (item.addons ?? []).filter((addon) => addon.is_available);
    const variant = resolveVariant(availableVariants, input.variant_id);
    const addons = normalizeAddonSelection(availableAddons, input.addon_quantities);
    const specialInstructions = input.special_instructions?.trim() || undefined;
    const subtotal = calculateLineSubtotal({
      base_price: item.base_price,
      quantity,
      variant,
      addons,
    });
    const lineId = crypto.randomUUID();

    return {
      line_id: lineId,
      item_id: item.id,
      name: item.name,
      image_url: item.image_url,
      base_price: money(item.base_price),
      quantity,
      variant,
      addons,
      special_instructions: specialInstructions,
      subtotal,
    };
  }

  static recalculateCartTotals(cart: Cart): Cart {
    const subtotal = money(
      cart.items.reduce((total, item) => total + item.subtotal, 0),
    );
    const deliveryFee = money(cart.delivery_fee);

    return {
      ...cart,
      subtotal,
      delivery_fee: deliveryFee,
      total: money(subtotal + deliveryFee),
    };
  }

  static appendItem(
    cart: Cart | null,
    params: {
      business_id: string;
      delivery_fee: number;
      fulfillment_mode?: GastronomyFulfillmentMode;
      cart_item: CartItem;
    },
  ): Cart {
    const fulfillmentMode = params.fulfillment_mode ?? cart?.fulfillment_mode ?? "delivery";
    const baseCart =
      cart && cart.business_id === params.business_id
        ? {
            ...cart,
            fulfillment_mode: fulfillmentMode,
            delivery_fee: this.normalizeDeliveryFee(params.delivery_fee, fulfillmentMode),
          }
        : this.createEmptyCart(params.business_id, params.delivery_fee, fulfillmentMode);

    return this.recalculateCartTotals({
      ...baseCart,
      items: [...baseCart.items, params.cart_item],
    });
  }

  static removeItem(cart: Cart | null, lineId: string): Cart | null {
    if (!cart) return null;

    const nextItems = cart.items.filter((item) => item.line_id !== lineId);
    if (!nextItems.length) return null;

    return this.recalculateCartTotals({
      ...cart,
      items: nextItems,
    });
  }

  static syncDeliveryFee(
    cart: Cart | null,
    deliveryFee: number,
    fulfillmentMode?: GastronomyFulfillmentMode,
  ): Cart | null {
    if (!cart) return null;

    const nextFulfillmentMode = fulfillmentMode ?? cart.fulfillment_mode ?? "delivery";
    return this.recalculateCartTotals({
      ...cart,
      fulfillment_mode: nextFulfillmentMode,
      delivery_fee: this.normalizeDeliveryFee(deliveryFee, nextFulfillmentMode),
    });
  }

  static getItemCount(cart: Cart | null): number {
    if (!cart) return 0;

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  static getMinimumOrderRemaining(
    cart: Cart | null,
    minimumOrder?: number | null,
  ): number {
    if (!minimumOrder) return 0;

    const subtotal = cart?.subtotal ?? 0;
    return Math.max(0, money(minimumOrder) - subtotal);
  }

  static isMinimumOrderReached(
    cart: Cart | null,
    minimumOrder?: number | null,
  ): boolean {
    return this.getMinimumOrderRemaining(cart, minimumOrder) === 0;
  }
}
