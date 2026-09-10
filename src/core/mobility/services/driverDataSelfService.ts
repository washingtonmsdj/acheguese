/**
 * Self-service driver_data mutation boundary.
 *
 * driver_data owns registration/vehicle attributes. Operational presence,
 * availability and live location belong exclusively to driver_availability via
 * DriverAvailabilityService / mobility-rpc.
 */

const DRIVER_SELF_SERVICE_FIELDS = new Set([
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
