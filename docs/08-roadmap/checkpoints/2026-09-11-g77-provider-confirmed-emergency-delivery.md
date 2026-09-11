# G77 — Provider-confirmed emergency delivery

Date: 2026-09-11
Branch: `module/mobilidade`

## Problem

G76 made provider calls retryable without blind duplicate sends, but `sent` and
`delivered` still lacked a complete external source of truth. A synchronous
HTTP 2xx proves provider acceptance, not recipient delivery, and provider
callbacks can race the worker that persists the synchronous response.

## Root correction

G77 adds a signed Resend webhook pipeline. The webhook endpoint is public only
at the transport layer (`verify_jwt=false`) because Resend does not authenticate
with a Supabase user JWT. It is not a public writer: the function verifies the
Svix signature over the raw request body before any mutation and all database
changes go through service-role-only RPCs.

`resend-emergency-webhook` requires:

- `svix-id`;
- `svix-timestamp`;
- `svix-signature`;
- `RESEND_WEBHOOK_SECRET`.

Relevant events are `email.sent`, `email.delivered`,
`email.delivery_delayed`, `email.bounced`, `email.complained`, `email.failed`
and `email.suppressed`.

## Correlation and deduplication

Every emergency email carries the provider tag:

```text
acheguese_delivery_id=<emergency_delivery_log.id>
```

The signed tag is the primary correlation key. `provider_message_id` remains a
secondary provider key.

`private.emergency_delivery_provider_events` is a minimal receipt ledger keyed
by the Svix event ID. It stores event identity/type/timestamps and correlation,
not the raw webhook payload or recipient/body PII.

`apply_emergency_delivery_provider_event` owns event application and:

- locks the canonical delivery row;
- rejects provider activity before dispatch authority;
- deduplicates repeated Svix events;
- prevents provider-message correlation conflicts;
- records out-of-order historical receipts without regressing lifecycle;
- treats `delivered` as the strongest successful confirmation;
- maps bounce/failure/suppression to canonical failure unless delivery was
  already confirmed.

## Synchronous/webhook race

The worker no longer writes `sent` directly. After a successful provider POST,
it calls `confirm_emergency_delivery_provider_acceptance`.

That command locks the row and never changes a webhook-confirmed `delivered` or
`failed` back to `sent`. Therefore it is safe for the provider webhook to arrive
before the HTTP response is persisted.

## Runtime modernization

The two functions involved in this pipeline use per-function `deno.json` files
and exact pinned `npm:` imports:

- `@supabase/supabase-js@2.116.0`;
- `svix@2.3.0` for the webhook.

`send-emergency-email` uses the default Edge Function `fetch` handler and no
longer imports `deno.land/std` or `esm.sh` directly. Its authentication is local
to this flow so modernizing Mobility did not require changing the shared legacy
helper used by unrelated functions.

## Ratchet

`src/modules/mobility/__tests__/MobilityEmergencyProviderWebhookG77.test.ts`
protects signature-before-mutation ordering, service-only writes, private event
receipts, provider correlation, non-regression and pinned modern dependencies.

## Validation status

- Source changes are versioned only on `module/mobilidade`.
- No G77 migration was applied to the remote Supabase project in this
  checkpoint.
- Neither emergency Edge Function was deployed remotely in this checkpoint.
- The ratchet is versioned but no PASS is claimed until it is actually
  executed.

## Next

Freeze the exact provider payload before `dispatching`, because retrying an
idempotency key is only safe when the provider request payload is identical.
