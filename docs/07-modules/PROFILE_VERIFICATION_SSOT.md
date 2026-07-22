# Profile Verification SSOT

## Ownership

`public.verification` is the canonical aggregate for profile verification
requests. It owns the request type, evidence references, lifecycle and latest
review decision. `private.profile_verification_audit_log` is the append-only
decision trail.

`profiles.verified` and `profiles.verified_at` are read projections for the
public identity badge. They are not a workflow and must never receive pending,
rejected or reviewer fields.

## Lifecycle

- `pending`: submitted or resubmitted and awaiting review.
- `approved`: evidence accepted.
- `rejected`: evidence refused with a mandatory reason.
- `revoked`: a previous approval was withdrawn.

The transition contract is strict: an administrator can approve or reject
only a pending request, and can revoke only an approved request. Rejection and
revocation require a reason with at least 10 characters. A rejected or revoked
request returns to `pending` only when its owner submits new evidence.

Verification types are independent. In particular, `resident` proves a
territorial relationship and does not grant the public identity badge. Only an
approved `document` verification updates that projection.

## Boundaries

- Owners submit with `request_profile_verification`; the function binds the
  request to the current active profile and accepts only private Storage
  references owned by that profile.
- Owners can read their own requests through RLS, but cannot write the table
  directly.
- Admin lists, statistics and decisions pass through
  `admin-verify-profile`, which validates the JWT and admin role.
- `review_profile_verification` and `set_profile_verification_badge` are
  `service_role` only and bind every decision to the admin user validated by
  the Edge Function.
- Evidence stays in the private `verification-documents` bucket. It must not be
  migrated to the public MediaAsset aggregate.

## Domain separation

Driver approval remains owned by Mobility's immutable
`driver_moderation_events`; identity, residence and driver approval are not the
same fact. Business claims and address verification also retain their own
domain aggregates and may project trust signals without duplicating this
workflow in `profiles`.
