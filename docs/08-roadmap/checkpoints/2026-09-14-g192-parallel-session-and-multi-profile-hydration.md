# G192 — Parallel session and multi-profile hydration

Date: 2026-09-14  
Branch: `main`

## Scope

Removes a serial hydration waterfall between the canonical session owner and the multi-profile runtime without changing Account/Auth UI or weakening session ownership.

## Previous flow

`SessionProvider` already called `SessionService.initialize()` / `initializeSession()` and subscribed to `SessionState`.

`SessionService.loadFromSession()` publishes the authenticated `user` into `SessionState` before its session-profile queries finish. However, `MultiProfileProvider` independently awaited `SessionService.initializeSession()` before reading the user and starting `MultiProfileRuntimeService.getMyProfiles()`.

Because `initializeSession()` resolves only after the initial session event has completed its session load, the private multi-profile broker read started after the session-profile load, creating a serial refresh waterfall.

## Final flow

`MultiProfileProvider` now consumes `useSessionContext()`, which is valid because its only runtime mount is inside `SessionProvider`.

- while the parent session has not decided whether a user exists, multi-profile keeps its loading state;
- as soon as the parent context publishes `user.id`, the private multi-profile read starts;
- it does not wait for `SessionProvider.isLoading` to become false;
- it does not call `SessionService.initializeSession()` or read `SessionState` directly;
- `SessionService` remains the owner of auth/session initialization and of the real `switchProfile` command;
- session-profile hydration and the richer private multi-profile projection can therefore overlap instead of running strictly in series.

## Race safety

The provider now owns two lightweight guards:

- `loadedUserIdRef` prevents a second automatic read when only the parent `isLoading` flag changes for the same user;
- `requestVersionRef` invalidates stale async results when the user changes, signs out, or a newer manual refetch starts.

A stale response can no longer repopulate profiles after logout or overwrite a newer user's state.

On resolved sign-out the provider clears:

- `allProfiles` and its ref;
- `activeProfile`;
- `contextualProfile`;
- error/loading state;
- the stored active-profile id.

## Storage hardening

Direct active-profile localStorage calls were wrapped in the existing canonical `ACTIVE_PROFILE_STORAGE_KEY` through local read/write/clear helpers. Storage failures in restricted browsing contexts no longer turn profile hydration/switching into an exception path.

No second storage key was created.

## Relationship to runtime-profile read dedup

G191 introduced in-flight-only deduplication in `MultiProfileRuntimeService.getMyProfiles(userId)`.

That remains complementary here:

- parallel hydration can cause several consumers to ask for the same runtime profile projection close together;
- those callers share a pending broker Promise;
- the Promise is removed immediately on completion;
- there is still no persistent or TTL profile cache.

## Deliberately unchanged

- `SessionService.initializeSession()` still exists and remains the canonical awaitable for callers that genuinely need complete initial session hydration;
- `SessionProvider` still uses it;
- the private multi-profile shape is not substituted with `SessionProfileView`;
- Account settings layout/components were not changed;
- route authorization semantics were not changed.

## Regression protection

- `tests/regression/multi-profile-session-hydration.test.ts` guards parent-session ownership, early user-driven hydration, stale-request invalidation and storage-key ownership;
- `tests/regression/runtime-profile-read-dedup.test.ts` continues protecting in-flight-only broker read coalescing.

## Relevant commits

- `ebef5b63256f42069e7922d5f0756a9420793496` — start multi-profile hydration from the published session user;
- `25825ac4bfa66af35c9ffedd7d8fcc3e36100b5a` — guard parallel multi-profile session hydration.

## Validation status

The parent/child provider topology, session publication timing, runtime caller census and profile contracts were read directly from current `main` before the change. Regression source was added, but Vitest, typecheck, lint, production build, browser E2E and performance tracing were not executed in this conversation.
