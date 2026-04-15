Perfeito. Abaixo está a **versão corrigida**, já alinhada com o design final e com os pontos que faltavam.

---

# Implementation Tasks: Session Context Centralization

## Overview

Tasks derivadas do design document. Ordem de execução:

1. Infraestrutura base de sessão
2. Engine de autorização
3. Tooling de enforcement
4. Testes
5. Migração dos componentes
6. Remoção do legado

---

## Phase 1: Session Context System

* [x] 1. Create `src/core/session/state/SessionState.ts`

  * [x] 1.1 Implement static class with private fields: `user`, `activeProfile`, `profiles`
  * [x] 1.2 Implement `getState()`, `setState()`, `clear()`
  * [x] 1.3 Implement `subscribe(listener)` returning unsubscribe function
  * [x] 1.4 Implement private `notifyListeners()`
  * Validates: Requirements 1.1, 1.2, 1.3, 1.6

* [x] 2. Create `src/core/session/services/SessionService.ts`

  * [x] 2.1 Implement `initialized` guard
  * [x] 2.2 Implement `loadVersion` counter
  * [x] 2.3 Implement private `cancelPendingLoads()` that increments `loadVersion`
  * [x] 2.4 Implement `initialize()` with `supabase.auth.onAuthStateChange()` handling:

    * `SIGNED_IN`
    * `SIGNED_OUT`
    * `TOKEN_REFRESHED`
    * `USER_UPDATED`
  * [x] 2.5 On `SIGNED_OUT`, call `cancelPendingLoads()` before clearing state
  * [x] 2.6 Implement `loadAndUpdateState(forceFresh)` with version guard to discard stale results
  * [x] 2.7 Implement `fetchSessionData(forceFresh)` with cache-first strategy
  * [x] 2.8 Implement `getCurrentUser()` as the only place in the system calling `supabase.auth.getUser()`
  * [x] 2.9 Implement `getActiveProfile(userId)` via `get_active_profile` RPC
  * [x] 2.10 Implement `getUserProfiles(userId)` via `profiles` table query
  * [x] 2.11 Implement `switchProfile(profileId)` with cache invalidation + reload
  * [x] 2.12 Implement `initializeSession()`
  * [x] 2.13 Implement `refreshSession()`
  * [x] 2.14 Implement private `mapProfileFromDb()`
  * Validates: Requirements 1.1–1.7, 2.1–2.7, 3.1–3.6, 8.1–8.8

* [x] 3. Create `src/core/session/cache/CacheConfig.ts`

  * [x] 3.1 Define `CacheConfig` as const
  * [x] 3.2 Define `DevCacheConfig` as const
  * [x] 3.3 Define `TestCacheConfig` as const
  * [x] 3.4 Implement `getCacheConfig()` with environment detection
  * Validates: Requirements 6.1, 8.1, 8.2

* [x] 4. Create `src/core/session/cache/CacheManager.ts`

  * [x] 4.1 Implement session cache with TTL from `getCacheConfig()`
  * [x] 4.2 Implement integrated metrics:

    * `_hits`
    * `_misses`
    * `_invalidations`
    * `getMetrics()`
  * [x] 4.3 Implement callback registry:

    * `registerInvalidationCallback()`
    * `unregisterInvalidationCallback()`
  * [x] 4.4 Implement:

    * `getSession()`
    * `setSession()`
    * `invalidateSession()`
    * `invalidateProfile()`
    * `invalidateAuthorization()`
    * `clearAll()`
  * [x] 4.5 Implement private `notifyInvalidation(scope)`
  * Validates: Requirements 6.1–6.7, 8.1, 8.2

* [x] 5. Create `src/core/session/errors/index.ts`

  * [x] 5.1 Implement `SessionAuthError`
  * [x] 5.2 Implement `ProfileNotFoundError`
  * [x] 5.3 Implement `NoActiveProfileError`
  * [x] 5.4 Implement `CacheError`
  * Validates: Requirements 2.5, 3.6, 8.3

* [x] 6. Create `src/core/session/providers/SessionProvider.tsx`

  * [x] 6.1 Create React context using `SessionContext` type
  * [x] 6.2 Implement `SessionProvider`
  * [x] 6.3 Inside provider, call `SessionService.initialize()`
  * [x] 6.4 Inside provider, call `SessionService.initializeSession()`
  * [x] 6.5 Subscribe to `SessionState` changes
  * [x] 6.6 Expose async handlers:

    * `switchProfile`
    * `refreshSession`
  * [x] 6.7 Manage `isLoading` and `error`
  * [x] 6.8 Do **not** export `useSessionContext()` from this file
  * Validates: Requirements 2.1–2.7

* [x] 7. Create `src/core/session/hooks/useSessionContext.ts`

  * [x] 7.1 Export `useSessionContext()` hook from this file only
  * [x] 7.2 Read from React context created by `SessionProvider`
  * [x] 7.3 Throw descriptive error if used outside provider
  * Validates: Requirements 2.2, 2.3, 2.4, 2.5

* [x] 8. Create `src/core/session/services/ServiceGateway.ts`

  * [x] 8.1 Implement read-only static methods:

    * `getCurrentUser()`
    * `getActiveProfile()`
    * `getUserProfiles()`
    * `isAuthenticated()`
  * [x] 8.2 Implement `getRequiredActiveProfile()` throwing `NoActiveProfileError`
  * [x] 8.3 Ensure zero `supabase.auth` access here
  * Validates: Requirements 3.1–3.6

* [x] 9. Create `src/core/session/types/index.ts`

  * [x] 9.1 Define `User`
  * [x] 9.2 Define `Profile`
  * [x] 9.3 Define `SessionData`
  * [x] 9.4 Define `SessionContext`
  * [x] 9.5 Export `CacheInvalidationCallback`
  * Validates: Requirements 1.1–1.4, 2.3

* [x] 10. Create `src/core/session/types/canonical-boundary.ts`

  * [x] 10.1 Define `UserIdContext`
  * [x] 10.2 Define `ProfileIdContext`
  * [x] 10.3 Define `ProhibitedIdentifier`
  * [x] 10.4 Define `QualifiedIdentifier`
  * Validates: Requirements 5.1–5.7, 9.1–9.7

* [x] 11. Create `src/core/session/types/strict.ts`

  * [x] 11.1 Define branded types `UserId` and `ProfileId`
  * [x] 11.2 Implement `isUserId()`
  * [x] 11.3 Implement `isProfileId()`
  * [x] 11.4 Implement `toUserId()`
  * [x] 11.5 Implement `toProfileId()`
  * Validates: Requirements 5.1–5.7

* [x] 12. Create `src/core/session/index.ts`

  * [x] 12.1 Export `SessionProvider`
  * [x] 12.2 Export `useSessionContext`
  * [x] 12.3 Export `ServiceGateway`
  * [x] 12.4 Export `SessionState`
  * [x] 12.5 Export `SessionService`
  * [x] 12.6 Export session types
  * [x] 12.7 Export session errors
  * [x] 12.8 Export `canonical-boundary`
  * [x] 12.9 Export `strict` types
  * Validates: Requirements 1.1, 2.2, 3.1

---

## Phase 2: Authorization Engine

* [x] 13. Create `src/core/authorization/types/index.ts`

  * [x] 13.1 Define `Action` union with all explicit actions:

    * `createPost`
    * `editPost`
    * `deletePost`
    * `createComment`
    * `editComment`
    * `deleteComment`
    * `createMessage`
    * `editMessage`
    * `deleteMessage`
    * `createBusiness`
    * `editBusiness`
    * `deleteBusiness`
    * `moderateContent`
    * `verifyUser`
    * `banUser`
    * `suspendUser`
    * `reviewContent`
    * `voteOnContent`
    * `uploadMedia`
    * `reportContent`
  * [x] 13.2 Define `ActionContext` with explicit optional fields only:

    * `communityId?`
    * `businessId?`
    * `eventId?`
  * [x] 13.3 Define `TargetEntity`
  * [x] 13.4 Define `ProfileStatus`
  * [x] 13.5 Define `ProfileType`
  * [x] 13.6 Define `Permission`
  * [x] 13.7 Ensure `Permission.status` is:

    * `'allowed'`
    * `'denied'`
    * `'requiresTarget'`
  * Validates: Requirements 4.1–4.9, 5.1–5.7

* [x] 14. Create `src/core/authorization/errors/index.ts`

  * [x] 14.1 Implement `AuthorizationError`
  * [x] 14.2 Implement `OwnershipCheckError`
  * Validates: Requirements 4.1, 4.9

* [x] 15. Create `src/core/authorization/services/AuthorizationEngine.ts`

  * [x] 15.1 Implement `initialized` guard
  * [x] 15.2 Implement `initialize()` with `CacheManager.registerInvalidationCallback()`
  * [x] 15.3 Implement `canProfilePerformAction(profileId, action, context, targetEntity?)`
  * [x] 15.4 Implement `checkOwnership(profileId, targetEntity)`
  * [x] 15.5 Implement `getProfilePermissions(profileId, context)`
  * [x] 15.6 Implement private `canPerformWithProfile(profile, action, context, targetEntity?)`
  * [x] 15.7 Implement `getProfileData(profileId)` reading directly from `profiles`
  * [x] 15.8 Implement `checkActionPermission(profile, action, context, targetEntity?, isOwner)`
  * [x] 15.9 Implement `checkCommunityPermission(communityId, action)`
  * [x] 15.10 Implement `isModerator(profileId)`
  * [x] 15.11 Implement `isCommunityModerator(profileId, communityId)`
  * [x] 15.12 Implement `normalizeContext(context)`
  * [x] 15.13 Implement `normalizeTargetEntity(targetEntity?)`
  * [x] 15.14 Implement `generateCacheKey(profileId, action, context, targetEntity?)`
  * [x] 15.15 Implement `getCachedDecision()`
  * [x] 15.16 Implement `cacheDecision()`
  * [x] 15.17 Implement `invalidateCache()`
  * [x] 15.18 Use TTL from `getCacheConfig()`
  * Validates: Requirements 4.1–4.9, 6.4, 6.7, 7.1–7.8, 8.1, 8.2, 8.7

* [x] 16. Create `src/core/authorization/index.ts`

  * [x] 16.1 Export `AuthorizationEngine`
  * [x] 16.2 Export authorization types
  * [x] 16.3 Export authorization errors
  * Validates: Requirements 4.1, 4.2

* [x] 17. Update `src/main.ts`

  * [x] 17.1 Initialize `AuthorizationEngine.initialize()` before render
  * [x] 17.2 Do **not** initialize `SessionService` in `main.ts`
  * [x] 17.3 Keep `SessionService.initialize()` owned by `SessionProvider`
  * Validates: Requirements 4.2, 6.4

---

## Phase 3: Enforcement Tooling

* [x] 18. Create/update `eslint-plugin-session-context.cjs`

  * [x] 18.1 Implement `no-direct-supabase-auth`

    * block `supabase.auth.getUser()` outside `SessionService`
    * block `supabase.auth.onAuthStateChange()` outside `SessionService`
  * [x] 18.2 Implement `no-permission-inference`

    * detect `activeProfile.profileType` in authorization conditionals
    * detect `activeProfile.isActive` in authorization conditionals
    * detect both binary comparisons and direct boolean checks
    * cover optional chaining where applicable
  * [x] 18.3 Implement `no-ambiguous-identifiers`

    * block `author_id`, `authorId`
    * block `owner_id`, `ownerId`
    * block `creator_id`, `creatorId`
    * block other prohibited ambiguous names from canonical boundary
  * [x] 18.4 Implement `require-authorization-engine`

    * detect `profileContext.permissions.*` used in conditionals
  * Validates: Requirements 1.7, 5.6, 7.4, 9.1–9.7, 11.5–11.8

* [x] 19. Create `scripts/validate-session-context.ts`

  * [x] 19.1 Implement Node-only walker using `fs`
  * [x] 19.2 No `grep`
  * [x] 19.3 Must be Windows-compatible
  * [x] 19.4 Scan `.ts` and `.tsx` files under `src/`
  * [x] 19.5 Detect ambiguous identifiers
  * [x] 19.6 Exit with code 1 on violations
  * [x] 19.7 Print clear error output
  * Validates: Requirements 9.5, 9.6, 11.5–11.7

* [x] 20. Update `eslint.config.js`

  * [x] 20.1 Register `session-context` plugin
  * [x] 20.2 Configure all 4 rules as `'warn'` during phases 1–2
  * [x] 20.3 Leave commented `'error'` variants for later promotion
  * Validates: Requirements 9.5, 9.6

* [x] 21. Update `package.json`

  * [x] 21.1 Add `validate:session-context`
  * [x] 21.2 Ensure `prebuild` runs `npm run lint && npm run validate:session-context`
  * Validates: Requirements 9.5, 9.6

* [x] 22. Update `.husky/pre-commit`

  * [x] 22.1 Run `npm run lint`
  * [x] 22.2 Run `npm run validate:session-context`
  * Validates: Requirements 9.6

---

## Phase 4: Unit, Property-Based and Integration Tests

* [x] 23. Create `src/core/session/__tests__/SessionService.test.ts`

  * [x] 23.1 Test unauthenticated `initializeSession()`
  * [x] 23.2 Test authenticated `initializeSession()`
  * [x] 23.3 Test `switchProfile()` invalidates cache and reloads state
  * [x] 23.4 Test version guard discards stale result when newer load finishes first
  * [x] 23.5 Test `SIGNED_OUT` cancels in-flight loads and prevents stale overwrite
  * Validates: Requirements 1.1–1.6, 6.2, 8.7, Property 1, Property 14

* [x] 24. Create `src/core/authorization/__tests__/AuthorizationEngine.test.ts`

  * [x] 24.1 Test suspended profile denied restricted actions
  * [x] 24.2 Test active owner can edit own post
  * [x] 24.3 Test non-owner denied edit/delete regardless of status
  * [x] 24.4 Test `checkOwnership()` returns true for owner
  * [x] 24.5 Test `generateCacheKey()` is stable for semantically equal contexts
  * Validates: Requirements 4.4, 4.5, 4.8, 4.9, Property 5, Property 7

* [x] 25. Create `src/core/session/__tests__/SessionService.property.test.ts`

  * [x] 25.1 Property 1 — session data consistency
  * [x] 25.2 Property 8 — `switchProfile()` invalidates and repopulates cache
  * [x] 25.3 Property 14 — concurrent loads: only last-started load may commit
  * Validates: Requirements 1.6, 6.2–6.4, 8.7, Property 1, Property 8, Property 14

* [x] 26. Create `src/core/authorization/__tests__/AuthorizationEngine.property.test.ts`

  * [x] 26.1 Property 7 — suspended profiles denied all restricted actions
  * [x] 26.2 Property 5 — non-owner denied; suspended owner denied; active owner allowed
  * Validates: Requirements 4.4, 4.8, 4.9, Property 5, Property 7

* [x] 27. Create `src/core/session/__tests__/integration/session-flow.test.ts`

  * [x] 27.1 Test login → switch profile → logout flow
  * Validates: Requirements 1.1–1.4, 6.2, Property 1

---

## Phase 5: Migrate High-Traffic Components (P0)

* [x] 28. Migrate `src/modules/community/`

  * [x] 28.1 Replace `useAuthContext()` with `useSessionContext()` where applicable
  * [x] 28.2 Replace `profileContext.permissions.*` with `AuthorizationEngine.canProfilePerformAction()`
  * [x] 28.3 Replace `user.id` with `activeProfile.id` in social/domain flows
  * [x] 28.4 Verify zero direct `supabase.auth.getUser()` calls remain
  * Validates: Requirements 7.1–7.8, 9.1–9.7

* [x] 29. Migrate `src/shared/components/dashboard/` and `src/modules/dashboard/`

  * [x] 29.1 Replace legacy session patterns with `useSessionContext()`
  * [x] 29.2 Replace permission inference with `AuthorizationEngine`
  * [x] 29.3 Verify `DashboardHeader.tsx`
  * [x] 29.4 Verify `DashboardTabs.tsx`
  * Validates: Requirements 7.1–7.8, 9.1–9.7

---

## Phase 6: Migrate Admin and Moderation (P1)

* [x] 30. Migrate `src/modules/admin/pages/`

  * [x] 30.1 Migrate `AdminUsuarios.tsx`
  * [x] 30.2 Migrate `AdminModeracao.tsx`
  * [x] 30.3 Migrate `AdminAlertas.tsx`
  * [x] 30.4 Migrate `AdminZeladoria.tsx`
  * [x] 30.5 Migrate `AdminVerificacoes.tsx`
  * [x] 30.6 Ensure all moderation actions use explicit AuthorizationEngine actions
  * Validates: Requirements 4.6, 7.5, 9.1–9.7

---

## Phase 7: Migrate Remaining Modules (P2)

* [x] 31. Migrate `src/modules/mobility/`

  * [x] 31.1 Replace legacy session and permission patterns
  * Validates: Requirements 9.1–9.7, 10.1–10.10

* [x] 32. Migrate `src/modules/business/`

  * [x] 32.1 Replace legacy session and permission patterns
  * Validates: Requirements 9.1–9.7, 10.1–10.10

* [x] 33. Migrate `src/modules/services/`

  * [x] 33.1 Replace legacy session and permission patterns
  * Validates: Requirements 9.1–9.7, 10.1–10.10

* [x] 34. Migrate `src/modules/classifieds/`

  * [x] 34.1 Replace legacy session and permission patterns
  * Validates: Requirements 9.1–9.7, 10.1–10.10

* [x] 35. Verify global migration state

  * [x] 35.1 Verify zero remaining `profileContext.permissions.*`
  * [x] 35.2 Verify zero remaining forbidden ambiguous identifiers
  * [x] 35.3 Verify zero direct forbidden `supabase.auth.*` usages
  * Validates: Requirements 9.1–9.7, 10.1–10.10

---

## Phase 8: Remove Legacy Code and Lock Final State

* [x] 36. Remove compatibility layer

  * [x] 36.1 Remove deprecated `useProfile()` wrapper from `src/contexts/ProfileContext.tsx`
  * [x] 36.2 Remove remaining compatibility adapters
  * Validates: Requirements 10.8–10.10

* [x] 37. Promote enforcement rules

  * [x] 37.1 Change ESLint `session-context` rules from `'warn'` to `'error'`
  * [x] 37.2 Verify CI/build fail on legacy pattern usage
  * Validates: Requirements 9.6, 10.8–10.10

* [x] 38. Update architecture documentation

  * [x] 38.1 Update `ARCHITECTURE.md`
  * [x] 38.2 Update docs under `docs/`
  * [x] 38.3 Explicitly document initialization ownership:

    * `main.ts` owns `AuthorizationEngine.initialize()`
    * `SessionProvider` owns `SessionService.initialize()` and `initializeSession()`
  * Validates: Requirements 10.8–10.10

---

## Execution Notes

### Ordem prática recomendada

1. Phase 1 completa
2. Phase 2 completa
3. Phase 3 completa
4. Phase 4 completa
5. Só então migrar componentes

### Regra de disciplina

Durante a migração:

* nada de inferir permissão via `activeProfile`
* nada de usar `user.id` em fluxo social/domínio
* nada de novo acesso direto a `supabase.auth.getUser()` fora de `SessionService`

### Ponto mais crítico

O trecho mais sensível da implementação é:

* concorrência entre loads
* cancelamento em `SIGNED_OUT`
* descarte de resultado stale

Se isso ficar errado, todo o SSOT fica falso.
