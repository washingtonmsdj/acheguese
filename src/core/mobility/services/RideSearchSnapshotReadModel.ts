export type RideSearchAddressSummary = {
  street: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type RideSearchLocationSummary = {
  name: string | null;
};

export interface RideSearchSnapshotRow {
  id: string;
  status: string | null;
  suggested_price: number | null;
  pickup_address?: RideSearchAddressSummary | null;
  dropoff_address?: RideSearchAddressSummary | null;
  pickup_location?: RideSearchLocationSummary | null;
  dropoff_location?: RideSearchLocationSummary | null;
}

/**
 * Snapshot used by the passenger search screen before a driver is accepted.
 * It intentionally contains only route labels/coordinates required to render
 * the planned route plus lifecycle status and the offered price.
 */
export const RIDE_SEARCH_SNAPSHOT_SELECT = `
  id,
  status,
  suggested_price,
  pickup_address:addresses!pickup_address_id(street, latitude, longitude),
  dropoff_address:addresses!dropoff_address_id(street, latitude, longitude),
  pickup_location:locations!pickup_location_id(name),
  dropoff_location:locations!dropoff_location_id(name)
`;
