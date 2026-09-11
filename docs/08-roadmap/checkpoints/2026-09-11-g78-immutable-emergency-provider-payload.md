# G78 — Immutable emergency provider payload

Date: 2026-09-11
Branch: `module/mobilidade`

## Problem

A deterministic provider idempotency key is not sufficient when retry payloads
are rebuilt from mutable data. Emergency contact email/name, owner phone,
description or other canonical fields may change after the first attempt. The
same idempotency key plus a different provider payload can then conflict instead
of reconciling the original request.

## Root correction

G78 freezes the exact provider JSON in private storage before dispatch authority
is granted.

`private.emergency_delivery_provider_payloads` contains one immutable snapshot
per durable delivery and is inaccessible to browser roles.

`authorize_emergency_email_dispatch(delivery_id, payload)` now performs in one
transaction:

1. validates payload size/type;
2. locks the owning alert;
3. locks the `processing` delivery;
4. confirms the alert is still actionable;
5. validates recipient against durable `delivery.target`;
6. validates the canonical `acheguese_delivery_id` tag;
7. inserts the exact private provider payload;
8. moves the delivery to `dispatching`.

There is therefore no valid G78 `dispatching` row without an immutable payload.

The older `authorize_emergency_delivery_dispatch(uuid)` command is dropped so
there is no bypass around the new invariant.

## Recovery

Retries and reconciliation call
`get_emergency_email_provider_payload(delivery_id)` and send that exact snapshot
with the original deterministic idempotency key. They do not reconstruct the
payload from mutable profile/contact/alert rows.

An already-authorized `dispatching` recovery also does not require the contact
to remain active or unchanged. That avoids turning a legitimate reconciliation
of an already-issued provider request into a new business decision.

If an anomalous `dispatching` row has no private snapshot, the worker fails
closed to `reconciliation_required` instead of fabricating a replacement
payload.

## PII boundary

The snapshot may contain emergency recipient/body/location information and
therefore lives under `private`, not in `public.emergency_delivery_log`.
Browser roles have no access.

## Ratchet

`src/modules/mobility/__tests__/MobilityEmergencyProviderPayloadG78.test.ts`
protects:

- private-only payload storage;
- snapshot + dispatch in one transaction;
- durable target/tag validation;
- removal of the old dispatch bypass;
- retry from snapshot rather than mutable data;
- recovery without a fresh live-contact dependency.

## Validation status

- Source changes are versioned only on `module/mobilidade`.
- The migration has not been applied remotely in this checkpoint.
- Edge Functions have not been deployed remotely in this checkpoint.
- The ratchet is versioned but no test PASS is claimed without execution.

## Next

Remove the final direct worker mutation (`failed`) so the external-delivery
lifecycle has one database authority for every state transition.
