import { describe, expect, it } from "vitest";

import {
  buildCheckoutDeliveryAddress,
  buildCheckoutOrderNotes,
  isPlatformCourierCheckoutAvailable,
  isPlatformCourierUnavailableForCheckout,
  isStructuredDeliveryDestinationReady,
  resolveCheckoutPaymentOptions,
} from "./checkoutRules";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { DeliveryDestination } from "../utils/deliveryDestination";

function businessWithMetadata(
  metadata: Record<string, unknown>,
): GastronomyBusiness {
  return {
    business_data_id: "business-1",
    name: "Pizzaria Teste",
    slug: "pizzaria-teste",
    gastronomy_profile: {
      id: "profile-1",
      business_id: "business-1",
      cuisine_type: "pizza",
      cuisine_subtypes: [],
      price_range: "$$",
      delivery_enabled: true,
      takeout_enabled: true,
      dine_in_enabled: true,
      delivery_fee: 7,
      accepts_reservations: false,
      has_parking: false,
      has_wifi: false,
      has_accessibility: false,
      has_kids_area: false,
      has_live_music: false,
      status: "approved",
      metadata,
      created_at: "2026-07-03T00:00:00.000Z",
      updated_at: "2026-07-03T00:00:00.000Z",
    },
  } as unknown as GastronomyBusiness;
}

const destination: DeliveryDestination = {
  source: "manual_address",
  latitude: -12.99,
  longitude: -38.49,
  label: "Rua Teste, 123",
  street: "Rua Teste",
  neighborhood: "Centro",
  city: "Salvador",
  state: "BA",
  postalCode: "40000-000",
  updatedAt: "2026-07-03T00:00:00.000Z",
};

describe("checkoutRules", () => {
  it("builds payment options from one shared rule per fulfillment mode", () => {
    const business = businessWithMetadata({
      delivery_fulfillment_mode: "merchant_own_fleet",
      accepted_payment_methods: ["pix", "card_on_delivery", "cash"],
    });

    expect(resolveCheckoutPaymentOptions(business, "delivery")).toEqual([
      { value: "pix", label: "PIX na entrega" },
      { value: "card_on_delivery", label: "Cartão na entrega" },
      { value: "cash", label: "Dinheiro na entrega" },
    ]);
    expect(resolveCheckoutPaymentOptions(business, "takeout")).toContainEqual({
      value: "card_on_delivery",
      label: "Cartão na retirada",
    });
  });

  it("requires structured address fields before delivery checkout", () => {
    expect(isStructuredDeliveryDestinationReady(destination, "")).toBe(false);
    expect(isStructuredDeliveryDestinationReady(destination, "123")).toBe(true);
  });

  it("builds checkout delivery payload and notes consistently", () => {
    expect(
      buildCheckoutDeliveryAddress(destination, {
        streetNumber: "123",
        complement: "Apto 2",
        referencePoint: "Portaria",
        recipientName: "Maria",
        recipientPhone: "71999999999",
      }),
    ).toMatchObject({
      id: "destination:manual_address",
      postal_code: "40000-000",
      number: "123",
      complement: "Apto 2",
      reference: "Portaria",
      recipient_name: "Maria",
      phone: "71999999999",
    });

    expect(
      buildCheckoutOrderNotes({
        paymentMethod: "cash",
        cashChangeFor: "100,00",
        customerNotes: "Sem cebola",
        deliveryDestination: destination,
        streetNumber: "123",
        complement: "Apto 2",
        referencePoint: "Portaria",
      }),
    ).toBe(
      "Troco para: R$ 100,00 | Sem cebola | CEP: 40000-000 | Rua: Rua Teste | Número: 123 | Complemento: Apto 2 | Referência: Portaria",
    );
  });

  it("keeps platform courier blocked in the official gastronomy checkout", () => {
    const business = businessWithMetadata({
      delivery_fulfillment_mode: "platform_courier",
    });

    expect(isPlatformCourierCheckoutAvailable()).toBe(false);
    expect(isPlatformCourierUnavailableForCheckout(business, "delivery")).toBe(
      true,
    );
    expect(isPlatformCourierUnavailableForCheckout(business, "takeout")).toBe(
      false,
    );
  });
});
