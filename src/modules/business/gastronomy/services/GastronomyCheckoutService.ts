import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { Cart, CartItem } from "../types/menu";
import type { GastronomyBusiness } from "../types/gastronomy";

const DELIVERY_CREATE_ORDER_RPC = "delivery_create_order";

type JsonObject = Record<string, unknown>;

export interface GastronomyCheckoutOrderRecord {
  id: string;
  customer_profile_id: string;
  merchant_profile_id: string;
  source_type: string | null;
  source_id: string | null;
  source_reference: string | null;
  logistics_status: string | null;
  financial_status: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGastronomyCheckoutOrderInput {
  customer_profile_id: string;
  actor_profile_id: string;
  business: GastronomyBusiness;
  cart: Cart;
  payment_method?: string;
  notes?: string;
}

export interface DeliveryRpcOrderItem {
  source_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  addons_total: number;
  line_total: number;
  notes: string | null;
  item_snapshot: JsonObject;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function normalizeRpcOrder(value: unknown): GastronomyCheckoutOrderRecord {
  const row = (Array.isArray(value) ? value[0] : value) as
    | Record<string, unknown>
    | null
    | undefined;

  if (!row || typeof row !== "object") {
    throw new Error("Resposta invalida do RPC delivery_create_order.");
  }

  return {
    id: String(row.id),
    customer_profile_id: String(row.customer_profile_id),
    merchant_profile_id: String(row.merchant_profile_id),
    source_type: (row.source_type as string | null) ?? null,
    source_id: (row.source_id as string | null) ?? null,
    source_reference: (row.source_reference as string | null) ?? null,
    logistics_status: (row.logistics_status as string | null) ?? null,
    financial_status: (row.financial_status as string | null) ?? null,
    payment_method: (row.payment_method as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapCartItemToCheckoutOrderItem(item: CartItem): DeliveryRpcOrderItem {
  const unitPrice = roundMoney(item.base_price + (item.variant?.price_adjustment ?? 0));
  const addonsTotal = roundMoney(
    item.addons.reduce((total, addon) => total + addon.price * addon.quantity, 0),
  );
  const lineTotal = roundMoney(item.subtotal);
  const expectedLineTotal = roundMoney(item.quantity * unitPrice + addonsTotal);

  if (lineTotal !== expectedLineTotal) {
    throw new Error(`Item "${item.name}" possui subtotal divergente do calculo.`);
  }

  return {
    source_item_id: item.item_id,
    name: item.name,
    quantity: item.quantity,
    unit_price: unitPrice,
    addons_total: addonsTotal,
    line_total: lineTotal,
    notes: item.special_instructions ?? null,
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
        total_price: roundMoney(addon.price * addon.quantity),
      })),
      special_instructions: item.special_instructions ?? null,
      structured_item: item.structured_item ?? null,
    },
  };
}

function buildFinancial(cart: Cart): {
  items_total: number;
  delivery_fee: number;
  discount_total: number;
  order_total: number;
} {
  const itemsTotal = roundMoney(cart.subtotal);
  const deliveryFee = roundMoney(cart.delivery_fee);
  const orderTotal = roundMoney(cart.total);
  const grossTotal = roundMoney(itemsTotal + deliveryFee);
  const discountTotal = roundMoney(grossTotal - orderTotal);

  if (discountTotal < 0) {
    throw new Error("cart.total nao pode ser maior que subtotal + delivery_fee.");
  }

  return {
    items_total: itemsTotal,
    delivery_fee: deliveryFee,
    discount_total: discountTotal,
    order_total: orderTotal,
  };
}

function assertCheckoutInput(input: CreateGastronomyCheckoutOrderInput): void {
  const { business, cart } = input;

  if (!business.profile_id) {
    throw new Error("Estabelecimento sem profile_id para criar pedido.");
  }

  if (business.business_data_id !== cart.business_id) {
    throw new Error(
      "cart.business_id deve corresponder ao business.business_data_id.",
    );
  }

  if (!business.gastronomy_profile.delivery_enabled) {
    throw new Error("Estabelecimento nao habilitado para delivery.");
  }

  if (!cart.items.length) {
    throw new Error("Pedido exige pelo menos um item no carrinho.");
  }

  const minimumOrder = business.gastronomy_profile.minimum_order;
  if (minimumOrder !== undefined && minimumOrder !== null) {
    const min = roundMoney(minimumOrder);
    if (roundMoney(cart.subtotal) < min) {
      throw new Error(
        `Pedido abaixo do minimo configurado (${min.toFixed(2)}).`,
      );
    }
  }
}

export class GastronomyCheckoutService {
  static async createOrder(
    input: CreateGastronomyCheckoutOrderInput,
  ): Promise<GastronomyCheckoutOrderRecord> {
    assertCheckoutInput(input);

    const financial = buildFinancial(input.cart);
    const orderItems = input.cart.items.map((item) => mapCartItemToCheckoutOrderItem(item));

    type RpcClient = {
      rpc: (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
    };

    const { data, error } = await (supabase as unknown as RpcClient).rpc(
      DELIVERY_CREATE_ORDER_RPC,
      {
        p_customer_profile_id: input.customer_profile_id,
        p_merchant_profile_id: input.business.profile_id,
        p_courier_profile_id: null,
        p_payment_mode: "direct_to_merchant",
        p_delivery_mode: "merchant_own_fleet",
        p_financial_status: "pending",
        p_items_total: financial.items_total,
        p_delivery_fee: financial.delivery_fee,
        p_discount_total: financial.discount_total,
        p_order_total: financial.order_total,
        p_platform_fee_amount: null,
        p_merchant_net_amount: null,
        p_courier_amount: null,
        p_source_type: "gastronomy",
        p_source_id: input.business.business_data_id,
        p_source_reference: input.business.name,
        p_source_metadata: {
          business_name: input.business.name,
          cuisine_type: input.business.gastronomy_profile.cuisine_type,
          delivery_enabled: input.business.gastronomy_profile.delivery_enabled,
        },
        p_order_items: orderItems,
        p_payment_method: input.payment_method ?? null,
        p_external_payment_reference: null,
        p_notes: input.notes ?? null,
        p_actor_profile_id: input.actor_profile_id,
      },
    );

    if (error) {
      logger.error("GastronomyCheckoutService.createOrder", error as Error, {
        customer_profile_id: input.customer_profile_id,
        business_data_id: input.business.business_data_id,
      });
      throw new Error((error as { message?: string }).message || "Falha ao criar pedido.");
    }

    return normalizeRpcOrder(data);
  }
}


