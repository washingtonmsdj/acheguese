# Security Policy

This file is the entry point for security rules. Detailed operational guidance
lives in dedicated docs so there is a single source of truth per subject.

## Canonical Docs

- General project security: `docs/SECURITY.md`
- Supabase local secret workflow: `docs/SUPABASE_SECRETS.md`
- Supabase Edge Function runtime secrets: `docs/EDGE_FUNCTION_SECRETS.md`

## Non-Negotiable Rules

- No real secrets in committed files.
- No service-role key in browser code or `VITE_*` variables.
- No permissive production CORS fallback.
- No fake provider success paths in production code.
- No raw request bodies without centralized size and content-type guards.
- No business-critical endpoint without method guard, rate limit, validation,
  authentication/authorization where required, and safe response headers.
- No duplicated runtime-secret checklists outside the canonical docs above.

## Required Checks

Run these before release or security-sensitive changes:

```powershell
npm run security:validate
npm run validate:ssot
npm run validate:hardcodes
npm run validate:architecture:incremental
node scripts/verify-deploy-ready.mjs
```

`node scripts/verify-deploy-ready.mjs` must run with the release environment
variables loaded. It intentionally fails on missing values or placeholders.
