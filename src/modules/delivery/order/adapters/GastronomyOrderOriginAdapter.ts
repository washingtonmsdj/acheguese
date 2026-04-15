import type { Cart, CartItem, GastronomyBusiness } from "@/core/gastronomy";
import { DELIVERY_MODE } from "../../delivery/types";
import type { FinancialStatus } from "../../payment-context/types";
import { PAYMENT_MODE } from "../../payment-context/types";
import { OrderDraftService } from "../OrderDraftService";
import { roundMoney } from "../money";
import {
  ORDER_SOURCE_TYPE,
  type CreateOrderInput,
  type CreateOrderItemInput,
} from "../types";

type GastronomyOrderBusiness = Pick<
  GastronomyBusiness,
  "business_data_id" | "profile_id" | "name" | "gastronomy_profile"
>;

export interface CreateGastronomyOrderDraftInput {
  customer_profile_id: string;
  actor_profile_id: string;
  business: GastronomyOrderBusiness;
  cart: Cart;
  courier_profile_id?: string;
  payment_method?: string;
  external_payment_reference?: string;
  notes?: string;
  initial_financial_status?: FinancialStatus;
}

export class GastronomyOrderOriginAdapter {
  private static mapCartItem(item: CartItem): CreateOrderItemInput {
    const unitPrice = roundMoney(
      item.base_price + (item.variant?.price_adjustment ?? 0),
      "item.unit_price",
    );
    const addonsTotal = roundMoney(
      item.addons.reduce((total, addon) => total + addon.price * addon.quantity, 0),
      "item.addons_total",
    );
    const lineTotal = roundMoney(item.subtotal, "item.subtotal");
    const expectedLineTotal = roundMoney(
      item.quantity * unitPrice + addonsTotal,
      "item.expected_subtotal",
    );

    if (lineTotal !== expectedLineTotal) {
      throw new Error(
        `Item "${item.name}" possui subtotal divergente do calculo de variante/addons.`,
      );
    }

    return {
      source_item_id: item.item_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      addons_total: addonsTotal,
      line_total: lineTotal,
      notes: item.special_instructions,
      item_snapshot: {
        base_unit_price: item.base_price,
        variant: item.variant
          ? {
              variant_id: item.variant.variant_id,
              name: item.variant.name,
              price_adjustment: item.variant.price_adjustment,
            }
          : null,
        addons: item.addons.map((addon) => ({
          addon_id: addon.addon_id,
          name: addon.name,
          unit_price: addon.price,
          quantity: addon.quantity,
          total_price: roundMoney(
            addon.price * addon.quantity,
            "item.addon.total_price",
          ),
        })),
        special_instructions: item.special_instructions ?? null,
      },
    };
  }

  static toCreateOrderInput(
    input: CreateGastronomyOrderDraftInput,
  ): CreateOrderInput {
    const { business, cart } = input;

    if (business.business_data_id !== cart.business_id) {
      throw new Error(
        "cart.business_id deve corresponder ao business.business_data_id da origem gastronomy.",
      );
    }

    if (!business.gastronomy_profile.delivery_enabled) {
      throw new Error(
        "A origem gastronomy informada nao esta habilitada para delivery.",
      );
    }

    if (!cart.items.length) {
      throw new Error("Pedido gastronomy exige pelo menos um item no carrinho.");
    }

    const subtotal = roundMoney(cart.subtotal, "cart.subtotal");
    const deliveryFee = roundMoney(cart.delivery_fee, "cart.delivery_fee");
    const cartTotal = roundMoney(cart.total, "cart.total");
    const grossTotal = roundMoney(subtotal + deliveryFee, "cart.gross_total");
    const discountTotal = roundMoney(grossTotal - cartTotal, "cart.discount_total");

    if (discountTotal < 0) {
      throw new Error(
        "cart.total nao pode ser maior que subtotal + delivery_fee no modo atual.",
      );
    }

    const minimumOrder = business.gastronomy_profile.minimum_order;
    if (minimumOrder !== undefined && minimumOrder !== null) {
      const normalizedMinimumOrder = roundMoney(
        minimumOrder,
        "business.minimum_order",
      );
      if (subtotal < normalizedMinimumOrder) {
        throw new Error(
          `Pedido abaixo do minimo configurado para o estabelecimento (${normalizedMinimumOrder.toFixed(2)}).`,
        );
      }
    }

    const items = OrderDraftService.normalizeItems(
      cart.items.map((item) => this.mapCartItem(item)),
    );

    return {
      customer_profile_id: input.customer_profile_id,
      merchant_profile_id: business.profile_id,
      courier_profile_id: input.courier_profile_id,
      source_context: {
        source_type: ORDER_SOURCE_TYPE.GASTRONOMY,
        source_id: business.business_data_id,
        source_reference: business.name,
        source_metadata: {
          business_name: business.name,
          cuisine_type: business.gastronomy_profile.cuisine_type,
          delivery_enabled: business.gastronomy_profile.delivery_enabled,
        },
      },
      payment_mode: PAYMENT_MODE.DIRECT_TO_MERCHANT,
      delivery_mode: DELIVERY_MODE.MERCHANT_OWN_FLEET,
      payment_method: input.payment_method,
      external_payment_reference: input.external_payment_reference,
      notes: input.notes,
      financial: {
        items_total: subtotal,
        delivery_fee: deliveryFee,
        discount_total: discountTotal,
      },
      items,
      initial_financial_status: input.initial_financial_status,
      actor_profile_id: input.actor_profile_id,
    };
  }
}
