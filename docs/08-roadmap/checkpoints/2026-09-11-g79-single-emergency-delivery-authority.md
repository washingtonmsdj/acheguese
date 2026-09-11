# G79 — Single emergency-delivery mutation authority

Date: 2026-09-11
Branch: `module/mobilidade`

## Problem

After G77/G78, claim, dispatch authorization, reconciliation, synchronous
provider acceptance and webhook events were database commands, but the worker
still had one direct `UPDATE emergency_delivery_log` path for `failed`.

That direct writer was both an architectural exception and a race risk: a stale
worker failure could overwrite a newer canonical outcome unless every caller
reimplemented the same concurrency rules.

## Root correction

`fail_emergency_delivery_attempt` is now the sole failure transition used by
the worker.

The service-role-only command:

- accepts only expected state `processing` or `dispatching`;
- validates bounded error metadata;
- locks the delivery row with `FOR UPDATE`;
- applies `failed` only when the locked row is still exactly in the expected
  state;
- returns the already-current row unchanged when terminal cancellation,
  provider webhook or reconciliation won the race first;
- merges diagnostic metadata without discarding existing outbox metadata.

The worker's `markDeliveryFailed` helper now delegates to that RPC and contains
no direct lifecycle update.

## Invariant

External emergency-delivery state mutations are now owned by canonical
transactional commands rather than scattered worker writes:

```text
claim -> authorize -> begin provider attempt
                  -> confirm provider acceptance
                  -> apply signed provider event
                  -> require reconciliation
                  -> fail attempt
terminal alert -> cancel reversible delivery
```

Read-only service-role queries remain direct because they do not mutate the
lifecycle.

## Ratchet

`src/modules/mobility/__tests__/MobilityEmergencyDeliverySingleAuthorityG79.test.ts`
protects:

- service-role-only failure authority;
- row locking before failure;
- exact expected-state comparison;
- absence of direct worker update to the delivery table;
- preservation of a concurrent canonical result.

## Validation status

- G79 is versioned only on `module/mobilidade`.
- No remote migration/deploy was performed in this checkpoint.
- The ratchet is versioned but no test PASS is claimed without execution.

## Next

Validate the complete G75–G79 source slice, inspect the current `main` and its
migration prerequisites, then integrate the coherent Mobility/Safety slice into
`main` without merging unrelated branch divergence.
