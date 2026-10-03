export type JsonRecord = Record<string, unknown>;

export const MAX_ROWS_PER_SECTION = 50_000;

export function safeArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonRecord =>
        typeof entry === "object" && entry !== null && !Array.isArray(entry)
      )
    : [];
}

export function enforceSectionLimit(
  section: string,
  rows: JsonRecord[],
): JsonRecord[] {
  if (rows.length > MAX_ROWS_PER_SECTION) {
    throw new Error(`EXPORT_SECTION_TOO_LARGE:${section}`);
  }
  return rows;
}

export function dedupeRows(section: string, rows: JsonRecord[]): JsonRecord[] {
  const seen = new Set<string>();
  const result: JsonRecord[] = [];

  for (const row of rows) {
    const id = typeof row.id === "string" ? row.id : null;
    const key = id ? `id:${id}` : JSON.stringify(row);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }

  return enforceSectionLimit(section, result);
}

export function redactUserMetadata(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const blockedKey =
    /(token|secret|password|credential|authorization|api[_-]?key|refresh)/i;
  const result: JsonRecord = {};
  for (const [key, entry] of Object.entries(value as JsonRecord)) {
    if (blockedKey.test(key)) continue;
    if (
      entry === null ||
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    ) {
      result[key] = entry;
    }
  }
  return result;
}

export function mapAuthUser(user: Record<string, unknown>): JsonRecord {
  const identities = Array.isArray(user.identities)
    ? user.identities.map((identity) => {
        const row = identity as Record<string, unknown>;
        return {
          provider: row.provider ?? null,
          created_at: row.created_at ?? null,
          updated_at: row.updated_at ?? null,
          last_sign_in_at: row.last_sign_in_at ?? null,
        };
      })
    : [];

  const factors = Array.isArray(user.factors)
    ? user.factors.map((factor) => {
        const row = factor as Record<string, unknown>;
        return {
          status: row.status ?? null,
          friendly_name: row.friendly_name ?? null,
          factor_type: row.factor_type ?? null,
          created_at: row.created_at ?? null,
          updated_at: row.updated_at ?? null,
        };
      })
    : [];

  return {
    id: user.id ?? null,
    email: user.email ?? null,
    phone: user.phone ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    phone_confirmed_at: user.phone_confirmed_at ?? null,
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    user_metadata: redactUserMetadata(user.user_metadata),
    identities,
    factors,
  };
}

export function sanitizeRides(
  rows: JsonRecord[],
  profileIds: Set<string>,
): JsonRecord[] {
  return rows.map((row) => {
    const passenger = typeof row.passenger_profile_id === "string"
      ? row.passenger_profile_id
      : null;
    const driver = typeof row.driver_profile_id === "string"
      ? row.driver_profile_id
      : null;
    const isPassenger = Boolean(passenger && profileIds.has(passenger));
    const isDriver = Boolean(driver && profileIds.has(driver));
    const subjectRoles = [
      isPassenger ? "passenger" : null,
      isDriver ? "driver" : null,
    ].filter((value): value is string => Boolean(value));

    return {
      id: row.id,
      subject_roles: subjectRoles,
      route_id: row.route_id,
      status: row.status,
      suggested_price: row.suggested_price,
      final_price: row.final_price,
      available_seats: row.available_seats,
      created_at: row.created_at,
      updated_at: row.updated_at,
      pickup_location_id: isPassenger ? row.pickup_location_id : undefined,
      dropoff_location_id: isPassenger ? row.dropoff_location_id : undefined,
      origin: isPassenger ? row.origin : undefined,
      destination: isPassenger ? row.destination : undefined,
      departure_time: row.departure_time,
      payment_method: isPassenger ? row.payment_method : undefined,
      ride_mode: row.ride_mode,
      source_type: row.source_type,
      pickup_confirmed_at: row.pickup_confirmed_at,
      delivered_at: row.delivered_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
      cancelled_at: row.cancelled_at,
    };
  });
}

export function sanitizeOrders(
  rows: JsonRecord[],
  profileIds: Set<string>,
): JsonRecord[] {
  return rows.map((row) => {
    const customer = typeof row.customer_profile_id === "string"
      ? row.customer_profile_id
      : null;
    const merchant = typeof row.merchant_profile_id === "string"
      ? row.merchant_profile_id
      : null;
    const courier = typeof row.courier_profile_id === "string"
      ? row.courier_profile_id
      : null;
    const isCustomer = Boolean(customer && profileIds.has(customer));
    const isMerchant = Boolean(merchant && profileIds.has(merchant));
    const isCourier = Boolean(courier && profileIds.has(courier));
    const subjectRoles = [
      isCustomer ? "customer" : null,
      isMerchant ? "merchant" : null,
      isCourier ? "courier" : null,
    ].filter((value): value is string => Boolean(value));

    return {
      id: row.id,
      subject_roles: subjectRoles,
      payment_mode: row.payment_mode,
      delivery_mode: row.delivery_mode,
      logistics_status: row.logistics_status,
      financial_status: row.financial_status,
      items_total: row.items_total,
      delivery_fee: row.delivery_fee,
      discount_total: row.discount_total,
      order_total: row.order_total,
      platform_fee_amount: isMerchant ? row.platform_fee_amount : undefined,
      merchant_net_amount: isMerchant ? row.merchant_net_amount : undefined,
      courier_amount: isCourier ? row.courier_amount : undefined,
      currency: row.currency,
      payment_method: isCustomer ? row.payment_method : undefined,
      paid_at: row.paid_at,
      refunded_at: row.refunded_at,
      accepted_at: row.accepted_at,
      preparing_at: row.preparing_at,
      ready_for_pickup_at: row.ready_for_pickup_at,
      picked_up_at: row.picked_up_at,
      delivered_at: row.delivered_at,
      canceled_at: row.canceled_at,
      failed_at: row.failed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      source_type: row.source_type,
    };
  });
}

export function sanitizeReports(
  kind: string,
  rows: JsonRecord[],
): JsonRecord[] {
  return rows.map((row) => ({
    kind,
    target_type: row.target_type,
    reason: row.reason,
    report_type: row.report_type,
    severity: row.severity,
    title: row.title,
    description: row.description ?? row.details,
    evidence_urls: row.evidence_urls,
    status: row.status,
    reported_at: row.reported_at,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}
