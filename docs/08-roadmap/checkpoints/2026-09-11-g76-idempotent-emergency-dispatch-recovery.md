# G76 — Idempotent emergency dispatch recovery

Date: 2026-09-11
Branch: `module/mobilidade`

## Problem

G75 closed the race between Safety terminalization and provider dispatch, but
introduced an honest intermediate state: `dispatching`.

If the Edge Function dies, loses the network response or is interrupted after
the provider request starts but before `sent` is persisted, the system cannot
safely infer whether the email was accepted. Blindly changing the row back to
`pending` or generating a new provider request would risk duplicate emergency
notifications.

## Provider contract verified

Resend supports `Idempotency-Key` on `POST /emails`:

- the same key plus the same payload is processed once and returns the same
  email ID on retry;
- the provider retains idempotency keys for 24 hours;
- the same key with a different payload is rejected;
- concurrent requests using the same key are rejected as concurrent rather
  than both being accepted.

G76 deliberately uses a 23-hour automatic-recovery window to keep margin inside
that provider guarantee.

## Root correction

Every durable delivery now uses one deterministic provider key:

```text
emergency-delivery/<delivery-id>
```

The same delivery never receives a newly generated retry key.

Before both the first provider call and every recovery call, the worker invokes
`begin_emergency_provider_attempt`. The service-only database command locks the
delivery row and:

1. accepts only `dispatching`;
2. requires a canonical `dispatch_authorized_at`;
3. suppresses another attempt for 30 seconds after an in-flight attempt;
4. caps automatic provider attempts at five;
5. stops automatic recovery after 23 hours;
6. increments `provider_attempt_count` and records
   `last_provider_attempt_at` atomically.

## Indeterminate outcomes

A new explicit status exists:

```text
reconciliation_required
```

It is neither success nor failure.

The row moves there when:

- the provider idempotency recovery window has expired;
- the automatic provider-attempt limit has been reached;
- a dispatching row lacks its authorization timestamp;
- the provider returns an idempotency conflict that cannot be safely treated as
  a duplicate of the same request.

`require_emergency_delivery_reconciliation` is service-role only and provides
the canonical transition for an ambiguous provider outcome.

## Retry classification

The Edge Function now distinguishes provider failures instead of collapsing all
non-2xx responses into `failed`:

- `408`, `429`, `5xx`: remain `dispatching`; future retry uses the same
  idempotency key;
- `409 concurrent_idempotent_requests`: remain `dispatching`; the concurrent
  request is allowed to finish;
- other `409`: `reconciliation_required`;
- permanent non-retryable provider rejection: `failed`;
- successful retry: `sent`, using the provider-returned email ID.

Network exceptions also leave the already-authorized row `dispatching`, so a
later retry is safe and idempotent.

## Terminal alerts

G76 does **not** weaken G75.

A terminal alert still cannot create or recover `pending`/`processing` work.
Only a row already in `dispatching` — meaning G75 authorized it before the
terminal transition — may finish provider reconciliation. That reconciliation
uses the same durable delivery ID and the same provider idempotency key.

## Schema and contract

`emergency_delivery_log` adds:

- `provider_attempt_count`;
- `last_provider_attempt_at`;
- `reconciliation_required_at`.

The status contract now includes `reconciliation_required`; browser adapter,
worker and migration share the same status vocabulary.

## Ratchet

`src/modules/mobility/__tests__/MobilityEmergencyDeliveryIdempotencyG76.test.ts`
protects:

- serialized provider-attempt gating;
- 30-second concurrency suppression;
- bounded 23-hour recovery window;
- automatic-attempt cap;
- deterministic `Idempotency-Key` use;
- explicit `reconciliation_required` state;
- service-role-only recovery commands;
- retryable failures staying `dispatching`;
- terminal-alert recovery being restricted to already-authorized
  `dispatching` work.

## Validation status

- All G76 source changes are versioned only on `module/mobilidade`.
- `main` was not written.
- No Supabase migration was applied remotely in this checkpoint.
- No Edge Function was deployed remotely in this checkpoint.
- The ratchet is versioned but has not been executed here; no runtime/test PASS
  is claimed without execution evidence.

## Next

The next Safety/Mobility reliability gate is provider callback reconciliation:
consume authenticated provider lifecycle events (`sent`, `delivered`, bounce or
failure as applicable) and make `delivered` a provider-confirmed state rather
than a local assumption. This must be implemented with verified webhook
signature handling and canonical correlation to `emergency_delivery_log`, not
with a public unauthenticated writer.
