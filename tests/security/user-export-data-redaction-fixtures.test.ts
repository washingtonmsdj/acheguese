import { describe, expect, it } from "vitest";

import {
  MAX_ROWS_PER_SECTION,
  enforceSectionLimit,
  mapAuthUser,
  redactUserMetadata,
  sanitizeOrders,
  sanitizeRides,
  type JsonRecord,
} from "../../supabase/functions/_shared/lgpdExportPolicy";

const rideFixture: JsonRecord = {
  id: "ride-1",
  passenger_profile_id: "profile-passenger",
  driver_profile_id: "profile-driver",
  route_id: "route-1",
  status: "completed",
  suggested_price: 40,
  final_price: 35,
  available_seats: 1,
  pickup_location_id: "pickup-private",
  dropoff_location_id: "dropoff-private",
  origin: { label: "Casa do passageiro" },
  destination: { label: "Destino do passageiro" },
  payment_method: "pix",
  departure_time: "2026-08-20T12:00:00Z",
  ride_mode: "ride",
  source_type: "app",
};

const orderFixture: JsonRecord = {
  id: "order-1",
  customer_profile_id: "profile-customer",
  merchant_profile_id: "profile-merchant",
  courier_profile_id: "profile-courier",
  payment_mode: "platform_checkout",
  delivery_mode: "platform_courier_network",
  logistics_status: "delivered",
  financial_status: "paid",
  items_total: 100,
  delivery_fee: 12,
  discount_total: 5,
  order_total: 107,
  platform_fee_amount: 10,
  merchant_net_amount: 82,
  courier_amount: 15,
  currency: "BRL",
  payment_method: "credit_card",
  source_type: "business",
};

describe("user-export-data pure LGPD policy fixtures", () => {
  it("shows passenger-private route/payment fields only to the passenger", () => {
    const passenger = sanitizeRides(
      [rideFixture],
      new Set(["profile-passenger"]),
    )[0];
    const driver = sanitizeRides(
      [rideFixture],
      new Set(["profile-driver"]),
    )[0];

    expect(passenger.subject_roles).toEqual(["passenger"]);
    expect(passenger.origin).toEqual(rideFixture.origin);
    expect(passenger.destination).toEqual(rideFixture.destination);
    expect(passenger.pickup_location_id).toBe("pickup-private");
    expect(passenger.dropoff_location_id).toBe("dropoff-private");
    expect(passenger.payment_method).toBe("pix");

    expect(driver.subject_roles).toEqual(["driver"]);
    expect(driver.origin).toBeUndefined();
    expect(driver.destination).toBeUndefined();
    expect(driver.pickup_location_id).toBeUndefined();
    expect(driver.dropoff_location_id).toBeUndefined();
    expect(driver.payment_method).toBeUndefined();
  });

  it("preserves both subject roles when the same user owns passenger and driver profiles", () => {
    const row = sanitizeRides(
      [rideFixture],
      new Set(["profile-passenger", "profile-driver"]),
    )[0];

    expect(row.subject_roles).toEqual(["passenger", "driver"]);
    expect(row.origin).toEqual(rideFixture.origin);
    expect(row.payment_method).toBe("pix");
    expect(row.passenger_profile_id).toBeUndefined();
    expect(row.driver_profile_id).toBeUndefined();
  });

  it("keeps customer payment data separate from merchant/courier payout data", () => {
    const customer = sanitizeOrders(
      [orderFixture],
      new Set(["profile-customer"]),
    )[0];
    const merchant = sanitizeOrders(
      [orderFixture],
      new Set(["profile-merchant"]),
    )[0];
    const courier = sanitizeOrders(
      [orderFixture],
      new Set(["profile-courier"]),
    )[0];

    expect(customer.subject_roles).toEqual(["customer"]);
    expect(customer.payment_method).toBe("credit_card");
    expect(customer.platform_fee_amount).toBeUndefined();
    expect(customer.merchant_net_amount).toBeUndefined();
    expect(customer.courier_amount).toBeUndefined();

    expect(merchant.subject_roles).toEqual(["merchant"]);
    expect(merchant.payment_method).toBeUndefined();
    expect(merchant.platform_fee_amount).toBe(10);
    expect(merchant.merchant_net_amount).toBe(82);
    expect(merchant.courier_amount).toBeUndefined();

    expect(courier.subject_roles).toEqual(["courier"]);
    expect(courier.payment_method).toBeUndefined();
    expect(courier.platform_fee_amount).toBeUndefined();
    expect(courier.merchant_net_amount).toBeUndefined();
    expect(courier.courier_amount).toBe(15);
  });

  it("combines only the financial fields justified by profiles owned by the subject", () => {
    const merchantCourier = sanitizeOrders(
      [orderFixture],
      new Set(["profile-merchant", "profile-courier"]),
    )[0];

    expect(merchantCourier.subject_roles).toEqual(["merchant", "courier"]);
    expect(merchantCourier.payment_method).toBeUndefined();
    expect(merchantCourier.platform_fee_amount).toBe(10);
    expect(merchantCourier.merchant_net_amount).toBe(82);
    expect(merchantCourier.courier_amount).toBe(15);
    expect(merchantCourier.customer_profile_id).toBeUndefined();
    expect(merchantCourier.merchant_profile_id).toBeUndefined();
    expect(merchantCourier.courier_profile_id).toBeUndefined();
  });

  it("removes secret-like user metadata and non-scalar nested values", () => {
    expect(
      redactUserMetadata({
        locale: "pt-BR",
        marketing_opt_in: true,
        refresh_token: "secret",
        apiKey: "secret",
        credential_hint: "secret",
        nested: { should: "not serialize" },
      }),
    ).toEqual({
      locale: "pt-BR",
      marketing_opt_in: true,
    });
  });

  it("maps Auth user without app metadata, identity data or provider tokens", () => {
    const mapped = mapAuthUser({
      id: "user-1",
      email: "subject@example.test",
      app_metadata: { role: "admin" },
      user_metadata: {
        display_name: "Subject",
        access_token: "do-not-export",
      },
      identities: [
        {
          provider: "google",
          identity_data: { email: "third-party@example.test" },
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      factors: [
        {
          status: "verified",
          friendly_name: "Telefone",
          factor_type: "totp",
          secret: "do-not-export",
        },
      ],
    });

    expect(mapped).not.toHaveProperty("app_metadata");
    expect(mapped.user_metadata).toEqual({ display_name: "Subject" });
    expect(mapped.identities).toEqual([
      {
        provider: "google",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: null,
        last_sign_in_at: null,
      },
    ]);
    expect(JSON.stringify(mapped)).not.toContain("do-not-export");
    expect(JSON.stringify(mapped)).not.toContain("third-party@example.test");
  });

  it("fails closed when a section exceeds the canonical row bound", () => {
    const rows = Array.from(
      { length: MAX_ROWS_PER_SECTION + 1 },
      (_, index) => ({ id: `row-${index}` }),
    );
    expect(() => enforceSectionLimit("fixture", rows)).toThrow(
      "EXPORT_SECTION_TOO_LARGE:fixture",
    );
  });
});
