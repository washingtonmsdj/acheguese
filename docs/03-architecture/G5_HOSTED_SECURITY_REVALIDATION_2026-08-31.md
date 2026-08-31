# G5 — Hosted security revalidation — 2026-08-31

## Authority

This checkpoint extends `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` and `G5_CHECKPOINT_2026-08-31.md`.

- branch: `main`;
- HEAD immediately before this write: `6550584c532795e027daae76d3fbf5129ab1d787`;
- Vercel project: `acheguese` / `prj_oJGAwHhZSHojL3KQPyO8Us31ntKW`;
- Supabase project remains `xhdowzacfujckjelqhtd`;
- phase remains **G5 EM EXECUÇÃO**.

This document supersedes the previous assumption that the three provider blockers were the complete remaining G5 blocker set. A real hosted build has now exposed one additional source/dependency blocker.

## 1. Vercel execution recovered

The deployment created from commit `6550584c532795e027daae76d3fbf5129ab1d787` (`dpl_47RhshigAff93kvETikgE2bhKUmA`) received a real Vercel build machine and executed source gates.

Observed progress:

- clone completed;
- package/lock consistency validator passed;
- `npm ci` completed;
- `security:validate` passed with the expected build-environment warning that `.env.local` is not present;
- `lint:security` completed with warnings and zero errors;
- execution reached the production dependency audit.

Therefore the historical `build-rate-limit` condition is no longer the current first blocker for hosted proof.

## 2. First real hosted blocker: React Router dependency audit

The build failed at:

`npm audit --omit=dev --audit-level=moderate`

The audit reported two moderate findings in `react-router` inherited through `react-router-dom@6.30.4`:

1. open redirect via backslash in `<Link>` / `useNavigate`;
2. arbitrary constructor injection in SSR hydration error deserialization.

The repository had already prepared this migration in:

- `G5_REACT_ROUTER_V7_READINESS_2026-08-31.md`;
- `tests/security/react-router-v7-readiness-ratchet.test.ts`.

The selected narrow target remains `react-router-dom@7.18.3`. The 6.x line must not be presented as a security closure because the relevant advisories are patched only in the 7.18.x line.

## 3. Why no package-only hotfix was committed here

The G5 ratchet explicitly requires a coherent npm lifecycle:

1. Node 24 / npm 11.17.0;
2. set `react-router-dom` to `7.18.3`;
3. regenerate the complete `package-lock.json` with npm;
4. run the lock-consistency validator;
5. run `npm ci`;
6. run the production dependency audit;
7. run typecheck/lint/focused tests/build;
8. obtain hosted Vercel proof.

The connected GitHub file API can replace repository files, but it is not an npm execution environment and does not safely regenerate the full lockfile. Manually editing isolated lock entries or committing `package.json` alone would violate the existing fail-closed migration ratchet and could leave dependency integrity ambiguous.

Decision: **do not bypass the ratchet merely because the hosted audit now proves urgency**.

## 4. GitHub Actions remains an independent provider blocker

The same commit `6550584c...` triggered GitHub Actions, but `SSOT Enforcement` run `33370778607` still produced:

- `runner_id = 0`;
- `steps = []`;
- conclusion `failure` within seconds.

This remains provider/execution failure rather than test/lint/typecheck evidence.

## 5. Updated G5 blocker set

### B0 — React Router production dependency audit — SOURCE/LOCKFILE BLOCKER

Required closure:

- upgrade canonical dependency to `react-router-dom@7.18.3`;
- regenerate the entire lockfile through npm;
- pass lock consistency, `npm ci`, production audit, typecheck, lint, focused routing/security tests and build;
- prove the same resulting SHA on Vercel.

### B1 — Supabase generated types materialization — OPERATIONAL BLOCKER

Materialize the complete official generated output in `src/integrations/supabase/types.generated.ts`; no manual/partial reconstruction.

### B2 — `classified-images` Storage orphan — CAPABILITY BLOCKER

Remove only through the official Storage API with preflight/postcheck; no SQL or parallel service-role authority.

### B3 — GitHub Actions real execution — PROVIDER BLOCKER

Obtain a run with runner allocation and real steps. Pre-step `failure` is not PASS or source failure evidence.

## 6. Vercel ignoreCommand observation

The hosted clone does not expose a usable `origin` remote to the ignore script. The current script therefore fails open to a real build when the previous successful deployment commit cannot be fetched.

This is safe behavior. Do not replace last-successful-deployment semantics with a naive `HEAD^` diff just to save builds: if runtime commits exist between the previous successful deployment and the current documentation commit, `HEAD^` could incorrectly skip a required deployment.

This optimization remains lower priority than B0–B3.

## 7. Next action

The next source-changing action is the React Router v7.18.3 lockfile lifecycle in an environment capable of running the canonical Node/npm toolchain against the repository. After that change lands, use Vercel as the immediate hosted proof path because Vercel execution is currently functioning.

Do not start G6 while B0–B3 remain open.
