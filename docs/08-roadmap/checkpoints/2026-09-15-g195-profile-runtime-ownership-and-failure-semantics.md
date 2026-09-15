# G195 — Profile runtime ownership and failure semantics

Date: 2026-09-15  
Branch: `main`

## Scope

Closes a cluster of profile-runtime inconsistencies found while auditing refresh/session hydration after G192–G194. The goal was to reduce duplicate profile owners and make private profile failures remain errors instead of being silently converted into valid empty state.

## Runtime profile reads

`MultiProfileRuntimeService.getMyProfiles(userId)` keeps its in-flight-only deduplication, but no longer catches broker failures and returns `[]`.

Final meaning:

- `[]` means the private accessible-profile read completed successfully and returned no profiles;
- a broker/network failure rejects and is handled by the consumer boundary;
- the in-flight promise is still removed in `finally`, so failures do not poison later retries;
- no TTL/result cache was introduced.

`MultiProfileProvider` also releases its `loadedUserIdRef` marker when the current profile bootstrap fails. A normal session-state transition can therefore trigger a later attempt instead of permanently treating the user as already hydrated.

## Duplicate profile hooks retired

Two React owners were removed after caller census:

1. `src/core/profiles/hooks/useActiveProfile.ts`
   - its only runtime caller was `ProfileSettingsPage`;
   - the page already lives under `MultiProfileProvider` and needs the multi-profile snake_case shape;
   - it now reads `activeProfile`/`loading` from `useMultiProfileContext`;
   - the hook was removed from the barrel and deleted.

2. `src/core/profiles/hooks/useProfiles.ts`
   - its only runtime caller was `ProfileLinksManager`;
   - that component already lives under the same `MultiProfileProvider` and only needed the existing `allProfiles` list;
   - it now reuses `allProfiles` and the duplicate hook was removed from the barrel and deleted.

The session-context regression whitelist was tightened so the retired files and migrated consumers are no longer exempted.

## Lightweight session identity

Profile read/editor hooks that only need the authenticated user id no longer load the complete `useAuth` API:

- `usePrivateProfileWorkspace` uses `useSessionUserId`;
- `useProfileEditor` uses `useSessionUserId`.

`useAuth` remains valid for consumers that actually need authentication commands or its mapped auth-facing contract. This was not a global mechanical replacement.

## Profile-link correctness

The private profile-link chain was hardened end-to-end:

- `ProfileLinksService.getProfileLinks()` now propagates RLS/network failures instead of converting them to `[]`;
- `useProfileLinks` already captures that rejection and exposes `error`;
- `ProfileLinksManager` now distinguishes initial failure from a real empty link list and offers retry;
- if a previous list is still available, a refresh failure keeps that list visible and reports the stale/error state;
- `ProfileLinksService.reorderLinks()` now inspects each Supabase result and does not report `success: true` when an update resolves with `error`.

Public profile-link reads remain fail-closed as an empty public projection; this checkpoint intentionally changed only the private management contract.

## Regression protection

Added/updated:

- `tests/regression/runtime-profile-read-dedup.test.ts`;
- `tests/regression/multi-profile-session-hydration.test.ts`;
- `tests/architecture/active-profile-canonical-owner.test.ts`;
- `tests/architecture/profile-list-canonical-owner.test.ts`;
- `tests/architecture/profile-session-identity-boundary.test.ts`;
- `tests/regression/profile-links-failure-semantics.test.ts`;
- `tools/architecture/validate-session-context.ts` whitelist was reduced.

The architecture ratchets scan active `src/` so `useActiveProfile`/`useProfiles` cannot quietly return through another barrel or caller.

## Deferred physical cleanup

`MultiProfileService.getMyProfiles()` now has no proven active caller, but it lives inside a large service file. With the current GitHub connector requiring whole-file replacement rather than a safe patch, this checkpoint does not rewrite that large file solely to delete the dead method. A regression test prevents new callers meanwhile.

`eslint.config.js` also contains an older broad multi-profile exception block whose original `useActiveProfile` rationale is stale. The active source is protected by the architecture ratchets and `validate-session-context`; removing/restructuring the large ESLint block is deferred until it can be patched safely or lint can be executed immediately afterward.

## Relevant commits

- `efccabbe20961fee177546d888ce446870ba69b8` — preserve runtime profile read failures;
- `b72c7081792aa00d36cf650ed6379ae0a5d71a14` — guard runtime profile failure semantics;
- `5bdb81bc218eb2ce62aa99ec95d0e230080f94d7` — allow natural retry after profile bootstrap failure;
- `c140fb55d6715174e400ab4eabd7b8cb3f10489a` — guard retryable profile bootstrap;
- `e08c11acb9689874bf3aefb24818e9f3f06eefaa` — migrate profile settings to multi-profile context;
- `f6ace2b1e12043c55f5b94b1caa4cd489437cf9a` / `11285e56d02103363a7995657cdf143e4ad8fd1a` — retire `useActiveProfile` export and file;
- `207f3de2467c8a2620964932568bc477bc387cb5` — tighten session-context whitelist after hook retirement;
- `d27d6169f3a991d6167e277a1ce318adf442773f` — guard canonical active-profile ownership;
- `cf463fcdbab71ed5078216569a906e094239a5d9` — reuse multi-profile context in link manager;
- `9557abf18ac475a054b24cd1a57030e7dcc6b10c` / `5e78f208201646c0ff68f6615b253c15bcf38f01` — retire `useProfiles` export and file;
- `dd46eaf0f136f537f4d053e44a4b74b9dfad842f` — shrink session-context regression whitelist;
- `a3912176a7359a75e58af502c45747c306669638` — guard canonical profile-list ownership;
- `80513a28044d315dbcd5c2f624aa81e76617ae5b` — distinguish profile-link failures from empty state;
- `81fa2e5c37d21a2bf9febeafe90604dddc5a3bf0` / `1b1b837fd715df6e1ef42e1c728203c1c95e85a9` — use lightweight session identity in profile workspace/editor;
- `586532ddaec15a4c68439ef4a648b8e430af0597` — guard lightweight profile session identity;
- `75497297d4c7ac7fef1ee5785b11e6fc38292ceb` — preserve profile-link read/reorder failures;
- `d7f66563c83748de00632b7e812c115d790acc60` — guard profile-link failure semantics.

## Validation status

Source files and caller relationships were read directly after the changes. Vitest, typecheck, lint, production build, browser E2E and release/security commands were not executed in this conversation. This checkpoint is source-level and regression-contract closure, not same-SHA release certification.
