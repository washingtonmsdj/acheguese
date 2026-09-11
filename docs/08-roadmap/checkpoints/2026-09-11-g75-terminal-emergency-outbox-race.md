# G75 — Terminal-safe emergency delivery dispatch

Date: 2026-09-11
Branch: `module/mobilidade`

## Problem

G72 made external emergency notifications durable and prevented two workers from
claiming the same `pending` obligation. It did not close the second race:

1. the worker could validate an `active`/`acknowledged` alert;
2. claim the delivery as `processing`;
3. the alert could then become `resolved` or `false_alarm`;
4. the already-processing worker could still call the external email provider.

A second browser-side status check would only move the race window and was not
an acceptable fix.

## Root correction

G75 introduces an explicit provider-dispatch boundary in the canonical outbox:

```text
pending -> processing -> dispatching -> sent -> delivered
                     \\-> failed
pending/processing -> cancelled
```

`processing` means the obligation is claimed but the external side effect is
still forbidden. `dispatching` means the database has atomically revalidated
the owning alert and authorized crossing the irreversible provider boundary.

The new `authorize_emergency_delivery_dispatch` service-only RPC:

- resolves the delivery's canonical alert;
- locks that alert row with `FOR UPDATE`;
- requires alert status `active` or `acknowledged`;
- locks the delivery row;
- accepts only `processing` work;
- atomically moves it to `dispatching` and records `dispatch_authorized_at`.

The Edge Function calls this RPC immediately before the provider HTTP request.
A null authorization returns `409` and no email provider request is made.

## Terminal cancellation invariant

`private.cancel_emergency_delivery_outbox_on_terminal_alert` runs in the same
transaction that changes an alert to `resolved` or `false_alarm` and moves every
related `pending`/`processing` delivery to `cancelled`.

Claim, dispatch authorization and terminal lifecycle all serialize on the same
`emergency_alerts` row lock. Therefore exactly one side wins:

- terminal transition first: reversible work becomes `cancelled` and cannot
  dispatch;
- dispatch authorization first: the row becomes `dispatching` before the
  terminal transition and has already crossed the system's irreversible
  side-effect boundary.

The trigger deliberately does not relabel `dispatching`/`sent` work as
cancelled because an immediate provider request cannot be reliably unsent after
that boundary.

## Additional hardening

- `emergency_delivery_log` now records `dispatch_authorized_at` and
  `cancelled_at`.
- The status contract includes `dispatching` and `cancelled`.
- The one-open-attempt index includes `dispatching`.
- Existing `pending`/`processing` rows already owned by terminal alerts are
  reconciled to `cancelled` by the migration.
- `claim_emergency_delivery_attempt` now locks/revalidates the alert before
  claiming a job.
- The obsolete `auth.role()` guard was removed from the SECURITY DEFINER claim
  function; access is enforced by explicit `REVOKE` from browser roles and
  `GRANT EXECUTE` only to `service_role`.
- Client delivery types include the new states so the browser does not invent a
  parallel status model.

## Ratchet

`src/modules/mobility/__tests__/MobilityEmergencyDeliveryTerminalRaceG75.test.ts`
protects:

- terminal cancellation of only reversible work;
- alert-row serialization in claim and dispatch authorization;
- authorization occurring before the provider HTTP call;
- `dispatching` as the required state for provider result persistence;
- service-only execution grants and absence of `auth.role()`;
- status-contract alignment between worker and browser adapter.

## Validation status

- G75 source changes are versioned only on `module/mobilidade`.
- No change was made to `main`.
- The migration has **not** been applied to remote Supabase in this checkpoint.
- The Edge Function has **not** been deployed remotely in this checkpoint.
- The ratchet is versioned but has **not** been executed in this checkpoint;
  no runtime/test PASS is claimed without execution evidence.

## Next

Harden recovery of workers that die after `dispatching` but before persisting
`sent`. The recovery must not blindly resend an already-authorized immediate
email; it needs provider-safe idempotency/reconciliation before any automatic
retry is allowed.
