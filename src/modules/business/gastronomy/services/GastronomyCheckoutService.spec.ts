import { beforeEach, describe, expect, it, vi } from "vitest";
import { GastronomyCheckoutService } from "./GastronomyCheckoutService";
import { DeliveryAreaService } from "@/core/business/services/GastronomyDeliveryAreaService";
import { GastronomyOrderOriginAdapter } from "@/core/mobility/delivery/order/adapters/GastronomyOrderOriginAdapter";
import { OrderDeliverySSOTService } from "@/core/mobility/delivery/services/OrderDeliverySSOTService";

vi.mock("@/core/business/services/GastronomyDeliveryAreaService", () => ({
  DeliveryAreaService: {
    checkEligibility: vi.fn(),
  },
}));

vi.mock("@/core/mobility/delivery/order/adapters/GastronomyOrderOriginAdapter", () => ({
  GastronomyOrderOriginAdapter: {
    toCreateOrderInput: vi.fn(),
  },
}));

vi.mock("@/core/mobility/delivery/services/OrderDeliverySSOTService", () => ({
  OrderDeliverySSOTService: {
    createOrder: vi.fn(),
  },
}));

const mockedDeliveryAreaService = vi.mocked(DeliveryAreaService);
const mockedAdapter = vi.mocked(GastronomyOrderOriginAdapter);
const mockedOrderDeliverySSOTService = vi.mocked(OrderDeliverySSOTService);

const baseBusiness = {
  business_data_id: "business-1",
  profile_id: "merchant-profile-1",
  name: "Pizzaria Teste",
  gastronomy_profile: {
    cuisine_type: "pizza",
    delivery_enabled: true,
    takeout_enabled: true,
    dine_in_enabled: false,
    minimum_order: null,
  },
} as const;

const baseCart = {
  business_id: "business-1",
  fulfillment_mode: "delivery",
  items: [
    {
      item_id: "item-1",
      name: "Pizza",
      base_price: 50,
      quantity: 1,
      addons: [],
      subtotal: 50,
    },
  ],
  subtotal: 50,
  delivery_fee: 5,
  total: 55,
} as const;

describe("GastronomyCheckoutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDeliveryAreaService.checkEligibility.mockResolvedValue({
      data: {
        is_eligible: true,
        area: null,
        message: null,
      },
      error: null,
    } as never);
    mockedAdapter.toCreateOrderInput.mockReturnValue({ id: "draft" } as never);
    mockedOrderDeliverySSOTService.createOrder.mockResolvedValue({
      success: true,
      data: { id: "order-1" },
      error: null,
    } as never);
  });

  it("bloqueia carrinho vazio antes de validar area de entrega", async () => {
    await expect(
      GastronomyCheckoutService.createOrder({
        customer_profile_id: "customer-1",
        actor_profile_id: "customer-1",
        business: baseBusiness as never,
        cart: {
          ...baseCart,
          items: [],
          subtotal: 0,
          delivery_fee: 0,
          total: 0,
        } as never,
        delivery_snapshot: {
          postal_code: "40000-000",
          street: "Rua A",
          number: "123",
          neighborhood: "Centro",
          city: "Salvador",
          state: "BA",
        },
      }),
    ).rejects.toThrow("O carrinho precisa ter pelo menos um item.");

    expect(mockedDeliveryAreaService.checkEligibility).not.toHaveBeenCalled();
    expect(mockedAdapter.toCreateOrderInput).not.toHaveBeenCalled();
  });

  it("bloqueia forma de pagamento fora dos metodos aceitos", async () => {
    await expect(
      GastronomyCheckoutService.createOrder({
        customer_profile_id: "customer-1",
        actor_profile_id: "customer-1",
        business: {
          ...baseBusiness,
          gastronomy_profile: {
            ...baseBusiness.gastronomy_profile,
            metadata: {
              accepted_payment_methods: ["pix"],
            },
          },
        } as never,
        cart: baseCart as never,
        payment_method: "cash",
        delivery_snapshot: {
          postal_code: "40000-000",
          street: "Rua A",
          number: "123",
          neighborhood: "Centro",
          city: "Salvador",
          state: "BA",
        },
      }),
    ).rejects.toThrow("Forma de pagamento indisponivel para este estabelecimento.");

    expect(mockedDeliveryAreaService.checkEligibility).not.toHaveBeenCalled();
    expect(mockedAdapter.toCreateOrderInput).not.toHaveBeenCalled();
  });

  it("bloqueia platform courier tambem no servico SSOT de checkout", async () => {
    await expect(
      GastronomyCheckoutService.createOrder({
        customer_profile_id: "customer-1",
        actor_profile_id: "customer-1",
        business: {
          ...baseBusiness,
          gastronomy_profile: {
            ...baseBusiness.gastronomy_profile,
            metadata: {
              delivery_fulfillment_mode: "platform_courier",
            },
          },
        } as never,
        cart: baseCart as never,
        delivery_snapshot: {
          postal_code: "40000-000",
          street: "Rua A",
          number: "123",
          neighborhood: "Centro",
          city: "Salvador",
          state: "BA",
        },
      }),
    ).rejects.toThrow(
      "Entrega por rede de motoboy ainda nao esta disponivel neste lancamento.",
    );

    expect(mockedDeliveryAreaService.checkEligibility).not.toHaveBeenCalled();
    expect(mockedAdapter.toCreateOrderInput).not.toHaveBeenCalled();
  });

  it("bloqueia delivery sem endereco estruturado completo", async () => {
    await expect(
      GastronomyCheckoutService.createOrder({
        customer_profile_id: "customer-1",
        actor_profile_id: "customer-1",
        business: baseBusiness as never,
        cart: baseCart as never,
        delivery_snapshot: {
          neighborhood: "Centro",
          city: "Salvador",
          state: "BA",
        },
      }),
    ).rejects.toThrow(
      "Destino de entrega incompleto. Informe CEP, rua, numero, bairro, cidade e estado para validar a area.",
    );

    expect(mockedDeliveryAreaService.checkEligibility).not.toHaveBeenCalled();
    expect(mockedAdapter.toCreateOrderInput).not.toHaveBeenCalled();
  });

  it("valida area e cria pedido quando delivery esta completo", async () => {
    const result = await GastronomyCheckoutService.createOrder({
      customer_profile_id: "customer-1",
      actor_profile_id: "customer-1",
      business: baseBusiness as never,
      cart: baseCart as never,
      payment_method: "pix",
      delivery_snapshot: {
        postal_code: "40000-000",
        street: "Rua A",
        number: "123",
        neighborhood: "Centro",
        city: "Salvador",
        state: "BA",
      },
    });

    expect(mockedDeliveryAreaService.checkEligibility).toHaveBeenCalledWith(
      "business-1",
      "Centro",
      "Salvador",
      "BA",
      55,
    );
    expect(mockedAdapter.toCreateOrderInput).toHaveBeenCalled();
    expect(result).toEqual({ id: "order-1" });
  });
});
