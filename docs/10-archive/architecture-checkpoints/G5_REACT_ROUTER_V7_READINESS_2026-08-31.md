# G5 — React Router v7 security/readiness evidence — 2026-08-31

Branch: `main`

## Scope

This document records the source-level readiness work for the React Router security upgrade without claiming that the dependency upgrade itself has landed.

The canonical dependency files remain unchanged at this checkpoint:

- `react-router-dom`: `^6.30.4` in `package.json`;
- `react-router-dom`: `6.30.4` in `package-lock.json`;
- `react-router`: `6.30.4` in `package-lock.json`.

The launch finding therefore remains open until the complete npm lifecycle can regenerate and validate the lockfile.

## Security target

The relevant 2026 advisories include React Router ranges that remain vulnerable throughout the 6.x line and are patched beginning at 7.18.0. A 6.30.5/6 bump must therefore not be presented as closure of this finding.

The selected G5 target is `react-router-dom@7.18.3` because:

- 7.18.0 contains the security fixes for the navigation/redirect advisory class affecting the current 6.x package range;
- 7.18.2 hardened the RSC CSRF codepaths;
- 7.18.3 adds additional URL validation for client-side navigations/redirects and action-origin validation;
- v7 supports React 18+ and Node 20+, while Achegue-se is already on React/ReactDOM 18.3.1 and Node 24;
- jumping to React Router v8 would unnecessarily couple this G5 security fix to React 19 and a broader routing migration.

Upstream references:

- `https://github.com/remix-run/react-router/releases/tag/react-router%407.18.3`
- `https://github.com/remix-run/react-router/blob/react-router@7.18.3/CHANGELOG.md`

## Declarative-mode compatibility evidence

The application runtime uses `BrowserRouter`, `Routes`, and `Route`; no Data Router/Framework Mode authority is used by application source.

`src/app/components/AppRuntime.tsx` already opts into the two v7 behavioral changes that are relevant to the current declarative runtime while it is still on v6:

```tsx
future={{
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}}
```

This is particularly relevant because the route tree contains splat routes such as `/admin/*`, `/central/*`, `/p/:slug/*`, and the application fallback `/*`. The v7 relative-splat behavior is therefore already being exercised under the v6 compatibility flag instead of being introduced for the first time by the package major bump.

Focused repository searches found no application usage of the v6 APIs that materially expand the migration surface into Data/Framework Mode, including:

- `createBrowserRouter` / `RouterProvider`;
- `defer`;
- the removed legacy multipart upload handlers;
- `fallbackElement`;
- React Router framework/RSC packages.

This does not replace typecheck, tests, build, or runtime proof after the dependency is actually upgraded.

## Ratchet added

Commit `6349bcd97f9d67d68a925e8f11522ecc624de932` adds:

- `tests/security/react-router-v7-readiness-ratchet.test.ts`

The ratchet enforces source invariants for the migration window:

1. while the project is still on v6, it must remain on the known current `^6.30.4` declaration rather than accepting a false 6.30.5/6 security closure;
2. the existing `v7_startTransition` and `v7_relativeSplatPath` flags must remain enabled while v6 is installed;
3. when v7 lands, the declared version may not be below 7.18.3 and the obsolete v6 future flags must be removed;
4. application source must remain in Declarative Mode during this security upgrade instead of silently introducing Data/Framework Mode router authorities;
5. `@react-router/*` framework/RSC packages and `@remix-run/server-runtime` may not be introduced as part of this narrow dependency fix.

The ratchet is committed source evidence only at this checkpoint. It has not received a successful GitHub Actions execution because the repository's observed Actions jobs continue to fail before runner allocation/steps.

## Lockfile lifecycle remains fail-closed

A one-shot npm workflow was already attempted and proved that even `ubuntu-latest` jobs are currently failing before runner allocation. That helper was removed after the infrastructure proof and must not be recreated repeatedly while the provider condition is unchanged.

The package upgrade is therefore intentionally **not** committed as a package.json-only change, and the lockfile is intentionally **not** hand-edited from sampled registry metadata.

Required closure sequence remains:

1. execute with Node 24 / npm 11.17.0 in an environment that can reach the npm registry;
2. set `react-router-dom` to the selected 7.18.3 target;
3. regenerate the entire `package-lock.json` with npm;
4. run the repository lock-consistency validator;
5. run `npm ci`;
6. run `npm audit --omit=dev --audit-level=moderate`;
7. run application typecheck, lint, relevant tests, and build;
8. obtain hosted Vercel proof for the resulting runtime.

Until that sequence executes successfully, the production dependency finding remains open and G5 remains active.

## Do not repeat

- do not mark React Router 6.30.5/6 as the security fix;
- do not edit isolated lockfile entries manually;
- do not commit `package.json` without a coherently regenerated lockfile;
- do not create repeated temporary GitHub Actions one-shots while jobs still fail before runner allocation;
- do not broaden this G5 fix into React Router v8/React 19 without a separate architectural reason;
- do not start G6 while the central G5 launch blockers remain open.
