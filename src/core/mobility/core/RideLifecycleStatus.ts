import {
  RIDE_STATE,
  RideStateMachine,
  type RideState,
} from "./RideStateMachine";

const CANONICAL_RIDE_STATES = Object.values(RIDE_STATE) as RideState[];
const CANONICAL_RIDE_STATE_SET = new Set<string>(CANONICAL_RIDE_STATES);

/** Canonical states whose lifecycle has not reached a terminal state. */
export const OPEN_RIDE_STATES: readonly RideState[] = CANONICAL_RIDE_STATES.filter(
  (state) => !RideStateMachine.isFinalState(state),
);

/** Canonical terminal states, derived from the same state machine owner. */
export const CLOSED_RIDE_STATES: readonly RideState[] = CANONICAL_RIDE_STATES.filter(
  (state) => RideStateMachine.isFinalState(state),
);

/**
 * Historical aliases whose canonical meaning is deterministic.
 *
 * G61/G62 migrate these values in the database. Keeping the mapping at the
 * read boundary makes deploy ordering safe: application code canonicalizes an
 * old row even before the migration reaches a particular environment.
 */
export const LEGACY_RIDE_STATUS_ALIASES = {
  pending: RIDE_STATE.REQUESTED,
  accepted: RIDE_STATE.DRIVER_ACCEPTED,
  driver_on_the_way: RIDE_STATE.DRIVER_ARRIVING,
  passenger_on_board: RIDE_STATE.PASSENGER_BOARDED,
} as const satisfies Readonly<Record<string, RideState>>;

export type LegacyRideStatusAlias = keyof typeof LEGACY_RIDE_STATUS_ALIASES;

/**
 * Remaining unresolved historical open state.
 *
 * `driver_arrived` has no one-to-one state in the canonical state machine, so
 * it must remain read-compatible until provenance proves the correct rewrite.
 */
export const LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES = ["driver_arrived"] as const;

/**
 * Remaining unresolved historical terminal state.
 *
 * `cancelled` does not identify whether passenger, driver or system caused the
 * terminal transition, so rewriting it without audit provenance would destroy
 * lifecycle meaning.
 */
export const LEGACY_CLOSED_RIDE_STATUSES = ["cancelled"] as const;

const LEGACY_ALIAS_OPEN_RIDE_STATUSES = Object.keys(
  LEGACY_RIDE_STATUS_ALIASES,
) as LegacyRideStatusAlias[];

/**
 * Raw database values that may still represent a ride needing operational
 * attention while migrations converge historical rows.
 */
export const LEGACY_OPEN_RIDE_STATUSES: readonly string[] = [
  ...LEGACY_ALIAS_OPEN_RIDE_STATUSES,
  ...LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES,
];

/**
 * Statuses that may represent a ride which still needs operational attention.
 * Consumers querying ride_requests for an "active/open ride" must use this
 * collection instead of defining local subsets.
 */
export const QUERYABLE_OPEN_RIDE_STATUSES: readonly string[] = [
  ...OPEN_RIDE_STATES,
  ...LEGACY_OPEN_RIDE_STATUSES,
];

/** Statuses safe to classify as closed/history. */
export const QUERYABLE_CLOSED_RIDE_STATUSES: readonly string[] = [
  ...CLOSED_RIDE_STATES,
  ...LEGACY_CLOSED_RIDE_STATUSES,
];

/**
 * Open-state values that must not use the driver's participant-level base-row
 * read. Assignment is only an offer relationship (G69), and `delivered` is a
 * transient audit milestone closed to `completed` inside one transaction (G70).
 */
const NON_OPERATIONAL_DRIVER_OPEN_STATUSES = new Set<string>([
  RIDE_STATE.REQUESTED,
  RIDE_STATE.SEARCHING_DRIVER,
  RIDE_STATE.DRIVER_ASSIGNED,
  RIDE_STATE.DELIVERED,
  "pending",
]);

/**
 * Open lifecycle statuses in which the driver is an accepted operational
 * participant. Pre-accept offers use MobilityOfferService; historical delivered
 * rows use the redacted G73 history read model.
 */
export const DRIVER_OWNED_OPEN_RIDE_STATUSES: readonly string[] =
  QUERYABLE_OPEN_RIDE_STATUSES.filter(
    (status) => !NON_OPERATIONAL_DRIVER_OPEN_STATUSES.has(status),
  );

/**
 * Convert a canonical or deterministic historical alias into a canonical
 * state. Unresolved legacy values intentionally return null instead of being
 * guessed.
 */
export function toCanonicalRideState(
  status: string | null | undefined,
): RideState | null {
  if (!status) return null;
  if (CANONICAL_RIDE_STATE_SET.has(status)) return status as RideState;

  return LEGACY_RIDE_STATUS_ALIASES[
    status as LegacyRideStatusAlias
  ] ?? null;
}

export function isOpenRideStatus(
  status: string | null | undefined,
): boolean {
  return Boolean(status && QUERYABLE_OPEN_RIDE_STATUSES.includes(status));
}

export function isClosedRideStatus(
  status: string | null | undefined,
): boolean {
  return Boolean(status && QUERYABLE_CLOSED_RIDE_STATUSES.includes(status));
}
