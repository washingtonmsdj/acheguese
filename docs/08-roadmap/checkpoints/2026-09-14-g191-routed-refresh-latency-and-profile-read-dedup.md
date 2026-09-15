# G191 — Routed refresh latency and profile-read dedup

Date: 2026-09-14  
Branch: `main`

## Scope

Continues the refresh work after G190 without restoring a blocking loader or changing Account/Auth concepts. This checkpoint removes one universal lazy waterfall from routed startup and deduplicates concurrent private profile reads without introducing stale caching.

## Routed shell waterfall

Before this checkpoint, non-root navigation loaded `RoutedAppRuntime` lazily and then `FullAppRuntimeShell` created a second lazy boundary for `SessionProfileRuntimeShell`.

That second boundary did not protect the public `/`: the public root was already isolated by the first `RoutedAppRuntime` split in `AppRuntime`. Every routed page, however, had to pass through the second boundary.

Final contract:

- `AppRuntime` keeps `RoutedAppRuntime` lazy, preserving the lean `/`;
- `RoutedAppRuntime` statically owns `FullAppRuntimeShell`;
- `FullAppRuntimeShell` now statically owns `SessionProfileRuntimeShell`;
- `SessionProfileRuntimeShell` keeps the `AppRoutes` Suspense boundary for actual route/page chunks;
- `AppRoutes` still lazy-loads pages and large subtrees such as `AppLayoutRoutes`, `CentralRoutes`, `AdminRoutes`, auth pages and premium pages;
- overlays/auth-return helpers remain lazy and visually null because the owning page already exists underneath.

This removes a universal `shell -> second shell` network/render step without pulling the public root or route pages into the public bootstrap.

## Runtime profile reads

`MultiProfileRuntimeService.getMyProfiles(userId)` uses the private `profile-rpc -> profile_rpc_get_accessible_profiles` contract. It cannot be replaced blindly with `SessionState.profiles`:

- session profiles use `SessionProfileView` (camelCase, session projection);
- multi-profile runtime uses a richer private snake_case projection with fields such as `handle`, visibility and runtime profile metadata;
- the broker enforces bounded actor access/ownership/admin rules.

The safe optimization is therefore request coalescing, not shape substitution.

`runtimeProfileService.ts` now owns an in-flight `Map<string, Promise<Profile[]>>`:

- concurrent reads for the same user share one broker request;
- different users remain isolated;
- failures still resolve through the existing `[]` fallback;
- the entry is removed in `finally`;
- there is no TTL, localStorage, sessionStorage or completed-result cache;
- the next call after completion always performs a fresh read.

This helps when the global `MultiProfileProvider` and profile hooks ask for the same runtime profile set close together.

## Account impact

`AccountSettingsShell` reads `profilesLoading`, but it does not hide or block the account page. While profiles load it only substitutes the desktop profile identity with `…` / `Carregando perfil...`; page children continue rendering. No Account concept/layout code was changed in this checkpoint.

## Deliberately not changed

- `AppLayoutRoutes` remains lazy. It is a large cross-domain route tree and making it static would load it on routed surfaces that do not need it, including auth pages. No bundle evidence currently justifies that tradeoff.
- `SessionService.initializeSession()` remains callable by `MultiProfileProvider`; it only awaits the shared `initPromise` and does not itself issue another network request.
- `SessionProfileView` was not coerced into the multi-profile private shape.
- no persistent profile-result cache was added.

## Regression protection

- `tests/regression/loading/full-screen-loader-retired.test.ts` now requires one top-level routed passive fallback and forbids the redundant lazy import of `SessionProfileRuntimeShell`;
- `tests/regression/public/first-paint-theme-fallback.test.ts` protects the same routed topology plus the CSP-safe theme bootstrap;
- `tests/regression/runtime-profile-read-dedup.test.ts` protects in-flight-only profile request coalescing and forbids TTL/storage-backed result caching.

## Relevant commits

- `1e99872b32728b221c01af5c226f09126d76f4a7` — remove redundant routed session-shell lazy boundary;
- `f37d1ae568015fa88a63102315ecc701829111b7` — ratchet routed refresh to one shell loading step;
- `8936dd5e7cc5dd81c3ec1ab243ae277ba2faeee8` — align first-paint ratchet with the single routed shell step;
- `7a1c8e575db3d030fc8ebce95c4266bd27bc6c61` — deduplicate concurrent runtime profile reads;
- `e0887dbf072774dce21e02c352429d22fc1fa48a` — guard concurrent runtime profile read deduplication.

## Validation status

Direct `main` source reads and caller/route census were performed. The route tree was inspected to confirm that page/subtree components remain lazy after removing the redundant session-shell split. Vitest, typecheck, lint, production build, browser E2E, performance trace and screenshot comparison were not executed in this conversation. Provider build-rate-limit status is not source validation.
