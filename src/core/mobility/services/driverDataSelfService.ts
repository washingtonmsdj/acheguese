/**
 * Self-service driver_data mutation boundary.
 *
 * Security is enforced in Postgres by update_owned_driver_data(). This helper
 * keeps browser payloads narrow so profile editors never attempt to send
 * server-owned verification, subscription, capability, rating or stats fields.
 */

const DRIVER_SELF_SERVICE_FIELDS = new Set([
  "is_online",
  "is_available",
  "last_location_update",
  "current_location",
  "license_number",
  "license_category",
  "license_expiry",
  "license_state",
  "vehicle_type",
  "vehicle_plate",
  "vehicle_model",
  "vehicle_year",
  "vehicle_color",
]);

export function sanitizeDriverSelfServiceUpdate(
  updates: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(updates).filter(
      ([key, value]) => DRIVER_SELF_SERVICE_FIELDS.has(key) && value !== undefined,
    ),
  );
}
