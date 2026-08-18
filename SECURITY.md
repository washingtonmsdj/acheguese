# Security Policy

This file is the repository-root entry point for security. The canonical documentation hierarchy is defined by [docs/README.md](./docs/README.md); detailed security guidance lives under the numbered documentation structure.

## Canonical Docs

- [Documentation SSOT](./docs/README.md)
- [General project security](./docs/09-reference/SECURITY.md)
- [Supabase local secret workflow](./docs/09-reference/SUPABASE_SECRETS.md)
- [Supabase Edge Function runtime secrets](./docs/09-reference/EDGE_FUNCTION_SECRETS.md)
- [Active security audit](./docs/09-reference/SECURITY-AUDIT-2026-08.md)
- [Active remediation plan](./docs/08-roadmap/SECURITY-REMEDIATION-PLAN-2026-08.md)
- [Implementation checklist](./docs/08-roadmap/SECURITY-IMPLEMENTATION-CHECKLIST.md)
- [Verification matrix](./docs/09-reference/SECURITY-VERIFICATION-MATRIX.md)

## Non-Negotiable Rules

- No real secrets in committed files.
- No service-role key in browser code or `VITE_*` variables.
- No permissive production CORS fallback.
- No fake provider success paths in production code.
- No raw request bodies without centralized size and content-type guards.
- No business-critical endpoint without method guard, rate limit, validation, authentication/authorization where required, and safe response headers.
- Sensitive storage is private by default and must enforce ownership/authority.
- Authorization changes require positive and negative regression coverage.
- Security gates must not be made non-blocking merely to obtain a green pipeline.
- No second documentation SSOT for security outside the hierarchy in `docs/README.md`.

## Required Checks

Run these before release or security-sensitive changes, as applicable:

```powershell
npm run security:validate
npm audit --audit-level=high
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
npm run validate:ssot
npm run validate:hardcodes
npm run validate:architecture:incremental
npm run validate:docs-structure
npm run validate:docs-live-links
node scripts/verify-deploy-ready.mjs
```

`node scripts/verify-deploy-ready.mjs` must run with the release environment variables loaded. It intentionally fails on missing values or placeholders.

## Active Remediation

The 2026-08 audit did not confirm an active critical incident, but identified P1 security/assurance work. Current execution is tracked by the canonical roadmap/checklist above. A finding is complete only after the technical change, positive/negative verification and remote evidence when applicable.
