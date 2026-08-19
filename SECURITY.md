# Security Policy

This file is the entry point for non-negotiable security rules and release gates.
Detailed audit findings, remediation order, acceptance criteria, Supabase/Edge
Function hardening, secret-handling requirements, and production-drift policy
live in the canonical operational plan below.

## Canonical Security Docs

- Security entry point and mandatory rules: [`SECURITY.md`](./SECURITY.md)
- Active technical audit and remediation plan: [`AUDITORIA_E_PLANO_IMPLEMENTACAO.md`](./AUDITORIA_E_PLANO_IMPLEMENTACAO.md)
- Architecture and domain documentation index: [`docs/INDEX_CANONICO.md`](./docs/INDEX_CANONICO.md)

The previous references to `docs/SECURITY.md`, `docs/SUPABASE_SECRETS.md`, and
`docs/EDGE_FUNCTION_SECRETS.md` were removed because those paths were not
present in the audited `main` branch. Do not introduce a new document as
canonical without updating this entry point and the repository documentation
index.

## Non-Negotiable Rules

- No real secrets in committed files.
- No service-role key, JWT signing secret, provider secret, cron secret, or
  administrative credential in browser code or `VITE_*` variables.
- No permissive production CORS fallback.
- No fake provider success paths in production code.
- No raw request bodies without centralized size and content-type guards.
- No business-critical endpoint without method guard, validation,
  authentication/authorization where required, safe response headers, and an
  appropriate rate-limit or authoritative backend control.
- No permanent production schema change without an equivalent versioned
  migration.
- No Edge Function deployment may remain canonical without equivalent source
  in the release branch.
- No undocumented manual production mutation except emergency containment;
  emergency changes must be reconciled into Git immediately afterward.
- No new exposed `SECURITY DEFINER` RPC without explicit authorization design,
  fixed `search_path`, intentional grants, and negative authorization tests.
- The `private` schema must not be added to exposed Data API schemas without an
  explicit security decision and grant review.
- Production releases must remain attributable to a known Git commit.

## Production Drift Policy

GitHub is the intended source of truth for persistent application code,
migrations, and Edge Function source.

The release process must detect and reject, or explicitly reconcile, cases
where:

- a Supabase migration exists remotely but not in `supabase/migrations/`;
- a versioned migration expected for release is missing remotely;
- an implanted Edge Function differs from the versioned source;
- a Vercel production deployment points to a SHA different from the approved
  release SHA;
- a security-sensitive runtime change cannot be mapped to a reviewed commit.

The detailed implementation checklist and acceptance criteria are maintained in
[`AUDITORIA_E_PLANO_IMPLEMENTACAO.md`](./AUDITORIA_E_PLANO_IMPLEMENTACAO.md).

## Secret Handling

### Browser/public values

Only values explicitly designed to be public may be present in Vite/browser
configuration. Supabase publishable/anon client configuration is not a
substitute for authorization; RLS/RPC authorization remains authoritative.

### Privileged values

The following must remain in appropriate runtime secret stores and never be
committed or exposed through `VITE_*`:

- Supabase `service_role` credentials;
- JWT signing secrets;
- billing/provider webhook secrets;
- API/provider private keys;
- cron/authentication secrets;
- administrative service credentials.

### Templates

Versioned environment files must contain only placeholders or deliberately
public configuration. Prefer explicit template naming such as `.env.example`
and `.env.production.example` to reduce the chance of committing real runtime
values.

## Supabase / Edge Function Security Boundary

- Browser authorization must be enforced by RLS, safe RPC contracts, or trusted
  Edge brokers as appropriate.
- `SECURITY DEFINER` is exceptional and must have a documented reason.
- Privileged RPCs must not rely solely on the caller being `authenticated`.
- Edge Functions must use centralized CORS/security helpers where available.
- Critical mutations must not depend solely on best-effort in-memory or
  non-atomic perimeter rate limiting; authoritative backend constraints must
  fail closed.
- Manual Supabase production changes must be reconciled into Git before the
  next normal release.

## Required Checks

Run these before release or security-sensitive changes:

```powershell
npm run security:validate
npm run security:config:validate
npm audit
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
npm run validate:ssot
npm run validate:hardcodes
npm run validate:architecture:incremental
npm run validate:architecture:governance
npm run validate:docs-structure
npm run typecheck
npm run build
node scripts/verify-deploy-ready.mjs
```

`node scripts/verify-deploy-ready.mjs` must run with the release environment
variables loaded. It intentionally fails on missing values or placeholders.

The audit plan proposes additional permanent gates for Supabase drift, Edge
Function provenance, canonical documentation links, and `SECURITY DEFINER`
allowlisting. Until those gates exist, the corresponding checks must be part of
manual release review.

## Current Priority

As of 2026-08-19, the highest-priority security/governance work is:

1. protect `main` and make release checks mandatory;
2. reconcile Supabase migrations and Edge Function deployments with Git;
3. add automated production drift/provenance checks;
4. enable leaked-password protection and complete privileged-RPC/grant
   hardening;
5. preserve the current Vercel CSP/HSTS/security-header baseline during all
   changes.

Track status only in
[`AUDITORIA_E_PLANO_IMPLEMENTACAO.md`](./AUDITORIA_E_PLANO_IMPLEMENTACAO.md).
