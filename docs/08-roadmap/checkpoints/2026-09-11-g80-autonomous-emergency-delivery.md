# G80 — Autonomous emergency delivery outbox

Date: 2026-09-11
Branch: `integrate/mobility-safety-g71-g79`

## Problem

G72 made external SOS notifications durable at write time, but the first consumer
still depended on the browser calling `send-emergency-email` after the alert was
created. If the tab, device or network disappeared between alert commit and that
call, the durable `pending` obligation could remain untouched indefinitely.

There was a second durability hole: a process that died after
`pending -> processing` but before `processing -> dispatching` could leave a
reversible claim stranded forever.

An intermediate G80 implementation introduced a separate cron Edge worker and a
shared delivery executor. The final design removes both artifacts because they
created a second operational surface and forced ownership away from the already
canonical `send-emergency-email` broker.

## Root correction

The final flow is:

```text
emergency_alerts INSERT
  -> durable emergency_delivery_log row
  -> browser fast path OR pg_cron fallback
  -> same send-emergency-email broker
  -> canonical claim/authorize/provider RPCs
  -> Resend
  -> signed provider webhook
```

`send-emergency-email` is the only Edge delivery executor. It has two explicit,
fail-closed ingress modes:

- browser request: canonical authenticated user via `requireAuthenticatedUser`;
- autonomous request: `x-cron-secret` validated by `requireCronSecret`.

There is no fallback from an invalid cron credential to user authentication and
no service-role credential is transported over HTTP.

Because the Edge gateway must allow the cron request to reach function code,
`send-emergency-email` is configured with `verify_jwt=false`; the function owns
the complete authorization decision. Security Authority records both facts:
`cron-secret` for the no-JWT exception and `notification-broker` for its
service-role database authority.

## Durable recipient snapshot

The outbox producer already persisted the destination email in `target`. G80
also snapshots `contact_name` into metadata at alert creation.

The broker now builds a first-attempt provider payload from the durable outbox
row, not from a fresh `emergency_contacts` lookup. Therefore deactivating,
renaming or deleting the contact after the SOS transaction cannot silently
change or erase an already-created emergency obligation.

After `dispatching`, G78 still freezes the exact provider payload in private
storage and retries use only that immutable snapshot.

## Autonomous claim recovery

`private.prepare_emergency_delivery_work`:

- resets stale `processing` rows older than two minutes back to `pending`;
- preserves `attempt_count`, so repeated crashes still converge on the existing
  bounded claim limit;
- only recovers pre-dispatch work while the alert is `active` or
  `acknowledged`;
- returns a bounded batch.

Terminal transitions continue to cancel `pending`/`processing` through G75.

## Authorized-dispatch recovery invariant

`dispatching` is different from `pending`/`processing`: it has already crossed
the irreversible provider boundary.

G80 therefore keeps an eligible `dispatching` row recoverable even if the alert
later becomes `resolved` or `false_alarm`. The existing G76 idempotency window,
provider-attempt serialization and reconciliation rules decide whether another
provider request is safe.

This avoids abandoning a provider-authorized delivery solely because the alert
became terminal after authorization.

## Scheduler

`private.invoke_emergency_delivery_worker` uses the canonical Vault + `pg_net`
pattern already present in the repository:

- project URL from `acheguese_project_url`;
- cron secret from `acheguese_cron_secret`;
- bounded batch of 10 jobs;
- POST directly to `/functions/v1/send-emergency-email`;
- body contains only canonical `alertId` and `contactId`;
- no secrets are stored in migration text or `cron.command`.

The cron job `emergency-delivery-outbox-every-minute` runs once per minute.

## Removed intermediate architecture

The following intermediate G80 artifacts were deleted rather than retained as
legacy code:

- `supabase/functions/process-emergency-delivery-outbox/index.ts`;
- `supabase/functions/process-emergency-delivery-outbox/deno.json`;
- `supabase/functions/send-emergency-email/deliveryExecutor.ts`.

The RPC/table ownership therefore remains on the existing
`supabase/functions/send-emergency-email/index.ts` path.

## Ratchets

`MobilityEmergencyDeliveryAutonomousG80.test.ts` protects:

- durable recipient snapshot;
- abandoned pre-dispatch claim recovery without attempt reset;
- actionable-alert gating for `pending`;
- terminal-independent recovery for already-authorized `dispatching`;
- direct cron invocation of the canonical broker;
- absence of the intermediate parallel worker/executor;
- explicit user-or-cron authorization;
- Security Authority and secret-preflight coverage.

Existing G75–G79 ratchets continue protecting terminalization, provider-safe
idempotency, signed webhook truth, immutable payload and single failure
authority.

## Validation status

- Source is versioned only on `integrate/mobility-safety-g71-g79`.
- `main` is unchanged by this checkpoint.
- G80 migration has **not** been applied to remote Supabase in this checkpoint.
- Updated Edge Function has **not** been deployed remotely in this checkpoint.
- GitHub Actions runner has been failing before job steps start, so no CI PASS is
  claimed without execution evidence.
- The PR must remain draft until executable validation is available or an
  equivalent trusted validation path produces evidence.
