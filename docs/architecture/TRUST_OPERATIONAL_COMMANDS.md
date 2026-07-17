# Trust Operational Commands

## Status

Canonical since 2026-07-15. This contract closes CP-014.

Migrations:

- `20260715108000_add_professional_trust_role.sql`;
- `20260715109000_consolidate_trust_commands.sql`;
- `20260715111000_fix_trust_command_rate_limit.sql`;
- `20260715112000_harden_trust_rate_limit_contract.sql`.

## Canonical ownership

`trust_events` is the append-only SSOT for operational Trust events.
`trust_admin_actions` is the append-only SSOT for administrative Trust actions.
`ride_ratings` remains the canonical ride rating table; its Trust projection is
created in the same transaction.

Browser code cannot read or mutate `trust_events` or `trust_admin_actions`
directly. It also cannot write `ride_ratings` directly. No second Trust table,
generic CRUD service or client-owned identity contract is allowed.

## Command boundary

Frontend adapters may send only domain identifiers and bounded user input:

- `submit_classified_trust_feedback`;
- `submit_order_trust_feedback`;
- `submit_ride_trust_feedback`;
- `submit_work_opportunity_feedback`;
- `submit_ride_rating`.

Each command derives the active Profile, actor role, authorized target, target
role and canonical context from domain records. Final state, participant
membership, reason allowlists, text limits, deduplication and rate limits are
validated in PostgreSQL.

Rate limits count command executions in a fixed-size private table with one
row per Profile and command. They do not infer request volume from
`trust_events` row count: updating an existing feedback event consumes the
same allowance as creating one. The update is atomic and the rate state is
removed with its canonical Profile.

The TypeScript boundary is split by responsibility:

- `OperationalTrustCommandService`: exact operational commands;
- domain adapters: Classified, Order, Mobility and Work Opportunity;
- `TrustPolicyReadService`: current-profile and bounded offer decisions;
- `TrustAdminService`: bounded keyset reads and atomic admin commands;
- `TrustIncidentService`: incident-only commands documented separately.

`TrustEventService` was removed. Reintroducing a generic event payload with
actor, role, context, evidence or admin identity is forbidden.

## Automatic projections

Public business reviews remain owned by `public.reviews`. A database trigger
projects eligible order reviews into Trust, so review and Trust state cannot
diverge because of a second browser request.

Late order cancellation is derived inside the canonical logistics transition.
The browser sends only a bounded reason code; the database derives actor,
subject, previous state and severity atomically.

Ride rating and its Trust event are persisted by one RPC transaction. Rating
readers use aggregate-only `get_ride_rating_summary`; private rating rows are
not exposed as a public reputation feed.

## Policy enforcement

`private.build_trust_policy_decision` is the authoritative policy model.
Operational UI may display its result, but UI checks are not authorization.

Database triggers enforce critical Trust gates when:

- a ride request is created or assigned;
- an order receives or changes its courier assignment.

Offer screens use `get_ride_offer_trust_decisions` in batches of at most 50.
They do not read private events, calculate policy independently or perform one
Trust query per offer.

## Administration and privacy

Admin event/action readers require an authenticated administrator, use bounded
limits and keyset cursors, and do not grant direct table access. Batch review
and action commands lock the selected events and commit action log, Profile
restriction and event status in one transaction. Admin identity is always
derived from the active Profile.

Operational feedback descriptions are private and bounded. Public reputation
endpoints return aggregates only. Retention, anonymization and legal hold still
require the approved Privacy/DPO policy; this architecture does not invent a
retention period.

## Verification

- `npm run test:trust:ssot` protects source and migration contracts;
- `npm run security:trust:authz-probe` validates 20 remote anonymous,
  ordinary, admin and forged-context authorization cases with temporary
  identities;
- `npm run validate:architecture:core-platform` controls table/RPC ownership;
- `npm run validate:migrations:remote` verifies remote migration drift;
- generated Supabase types are taken from the linked remote schema.

Load percentiles, connection saturation and failover remain staging evidence;
they must not be inferred from unit or authorization tests.
