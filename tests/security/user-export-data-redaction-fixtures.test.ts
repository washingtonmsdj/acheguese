import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const source = readFileSync(
  join(ROOT, "supabase/functions/user-export-data/index.ts"),
  "utf8",
);

type JsonRecord = Record<string, unknown>;
type Sanitizer = (rows: JsonRecord[], profileIds: Set<string>) => JsonRecord[];

function extractFunction(functionName: string): string {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${functionName} in user-export-data source`);

  const openBrace = source.indexOf("{", start);
  if (openBrace < 0) throw new Error(`Missing body for ${functionName}`);

  let depth = 0;
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;

  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error(`Unterminated ${functionName}`);
}

function loadSanitizer(functionName: string): Sanitizer {
  const functionSource = extractFunction(functionName);
  const compiled = ts.transpileModule(
    `${functionSource}\nexports.sanitizer = ${functionName};`,
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  const moduleExports: { sanitizer?: Sanitizer } = {};
  const execute = new Function("exports", compiled);
  execute(moduleExports);
  if (typeof moduleExports.sanitizer !== "function") {
    throw new Error(`Unable to load ${functionName}`);
  }
  return moduleExports.sanitizer;
}

const sanitizeRides = loadSanitizer("sanitizeRides");
const sanitizeOrders = loadSanitizer("sanitizeOrders");

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

describe("user-export-data role-aware redaction fixtures", () => {
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
});
