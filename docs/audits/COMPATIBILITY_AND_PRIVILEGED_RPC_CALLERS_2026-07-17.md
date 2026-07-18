# Compatibility and privileged RPC caller audit - 2026-07-17

## Scope

This audit covers the open Core Platform Phase 6 work for deprecated aliases,
facades, types, closed validator allowlists and browser calls to remote RPCs
that are executable only by `service_role`.

## Removed

- `src/modules/community-alerts`: an unconsumed README plus reexport facade.
  Runtime consumers already import the canonical owner
  `src/core/community/alerts` directly.
- `src/modules/classifieds/types/classified.ts`: a second, unimported Classified
  type model with Portuguese field aliases.
- `ResidentAddressService.lookupCep`: zero callsites; the active hook already
  uses `LocationGeocodingService`.
- Deprecated and unconsumed payment helpers. The two form consumers now derive
  labels directly from `PAYMENT_METHODS`.
- `generate-ssot-fix-plan.ts`: it generated simulated hardcoded findings rather
  than reading an audit result.
- Closed compatibility exceptions in the taxonomy/community validators.

The migration validator no longer allowlists `increment_vaga_view_count`.
Instead, it processes ordered function creation, drop, `GRANT` and `REVOKE`
statements, including PostgreSQL's default `PUBLIC` execute privilege, and
validates the final browser exposure state.

## Retained with proven consumers

- `PostsFacade`, `ProfessionalFacade`, `MobilityFacade` and
  `GastronomyFacade` still have runtime consumers and were not removed.
- Public community alias services model canonical public URL ownership and are
  not deprecated compatibility redirects.
- `ClassifiedData.location` and `ClassifiedData.neighborhood` still feed six UI,
  search and mapper callsites. They remain a documented residual until a
  canonical location label read model replaces them.

## Remote privileged RPC audit

The linked project returned 163 distinct public RPC names executable by
`service_role` but not by `anon` or `authenticated`. The repository scan found
zero direct `.rpc` or `callRPC` invocations of those names in browser source.

The audit also exposed a browser caller for the removed
`cancel_account_deletion` function. Migration `20260717143000` replaced it with
`cancel_account_deletion_for_user`, revoked `PUBLIC`, `anon` and
`authenticated`, and granted only `service_role`. The browser now calls
`PrivacyRpcService`; deployed `privacy-rpc` version 2 verifies the JWT, derives
the actor and passes that server-owned identity to the database command.
Migration `20260717144000` then made retries idempotent and serialized
concurrent attempts with a row lock, so an interrupted Auth metadata update can
be retried without reopening the deletion schedule.

The same migration records explicit service-only ACLs for eight historical
functions whose remote state was already hardened but whose local migration
history did not explain that state. The migration was applied to the linked
project and the final catalog query confirmed browser execute is false.

Delivery operation names found in error handling are not direct calls. Runtime
writes use `DeliveryRpcService`, which invokes the authenticated `delivery-rpc`
broker. The Security Authority separately validates every Edge Function that
uses the privileged secret.

Reproducible command:

```text
npm run security:privileged-rpc:browser-callers
```

Expected result: the remote count may change as migrations evolve, but direct
browser callers must remain zero.
