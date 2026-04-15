# EVIDÊNCIA — RLS/Auth Flow Real com Usuário Autenticado Comum
**Sprint 2 - Posts (SSOT Territorial)**  
**Data**: 2026-04-05  
**Padrão**: AAA

---

## A. ARQUIVOS CRIADOS / ALTERADOS

1. `supabase/migrations/20260405000028_seed_rls_test_users.sql`
   — seed inicial de users (via SQL); substituído pela criação via API Admin

2. `tests/rls-posts-auth-flow.test.ts`
   — 15 testes de RLS com usuário autenticado comum (sem service_role nas ações validadas)

---

## B. FIXTURES

### Users de teste (criados via `admin.auth.admin.createUser()`)

| User | Email | UUID | Senha |
|---|---|---|---|
| User A | rls-user-a@example.com | c0ac34a0-b132-4ac8-9736-abfb4cf98c23 | RlsTestA123! |
| User B | rls-user-b@example.com | d611d89f-2750-4b92-8222-7ea49db43360 | RlsTestB123! |

### Profiles

| Profile | User | Tipo | location_id | location_name |
|---|---|---|---|---|
| e114b313-... | User A | personal | 00000000-...-0002 | Barra Teste Fase2 |
| 6fb6aa61-... | User B | personal | 00000000-...-0001 | Salvador Teste Fase2 |
| 5acc8b86-... | User B | business | 00000000-...-0001 | Salvador Teste Fase2 |

---

## C. BUGS ENCONTRADOS E CORRIGIDOS

### Bug 1 — Hash de senha incompatível via SQL

**Problema**: Users criados via `crypt('senha', gen_salt('bf'))` no SQL retornavam `Database error querying schema` ao tentar `signInWithPassword`.

**Causa**: O Supabase Auth usa um formato interno de bcrypt diferente do gerado pelo `pgcrypto`. Inserção direta em `auth.users` não gera hash compatível com o fluxo de autenticação.

**Correção**: Users criados via `admin.auth.admin.createUser()` (API Admin do Supabase JS), que gera o hash corretamente.

### Bug 2 — Domínio `@test.local` bloqueado

**Problema**: `admin.auth.admin.createUser({ email: 'rls-user-a@test.local' })` retornava `Database error checking email`.

**Causa**: O projeto Supabase bloqueia domínios `*.local` na criação de users.

**Correção**: Domínio alterado para `@example.com`.

---

## D. OUTPUT REAL DOS TESTES

```bash
$ npm test -- tests/rls-posts-auth-flow.test.ts
```

```
 RUN  v3.2.4

 ✓ tests/rls-posts-auth-flow.test.ts (15 tests) 9944ms
   ✓ posts_create > User A cria post com profile próprio → sucesso  811ms
   ✓ posts_create > User A tenta criar post com profile de User B → falha RLS  375ms
   ✓ posts_create > User A tenta criar post com location_id inválido → falha (trigger/FK)  350ms
   ✓ posts_create > User B cria post com profile business próprio (multi-profile) → sucesso  860ms
   ✓ posts_read_published > User B lê post publicado de User A → sucesso (leitura pública)  358ms
   ✓ posts_read_published > Cliente anon lê post publicado → sucesso (sem autenticação)  291ms
   ✓ posts_read_own > User A lê próprio post não publicado → sucesso (posts_read_own)  299ms
   ✓ posts_read_own > User B não vê post não publicado de User A → retorna vazio  308ms
   ✓ posts_update_own > User A edita próprio post → sucesso  319ms
   ✓ posts_update_own > User B tenta editar post de User A → falha RLS  615ms
   ✓ posts_delete_own > User A tenta deletar post de User B → falha RLS (post permanece)  588ms
   ✓ posts_delete_own > User A deleta próprio post → sucesso (post removido)  612ms
   ✓ multi-profile > User B cria post com profile pessoal → author_profile_id = PROF_B  288ms
   ✓ multi-profile > User B cria post com profile business → author_profile_id = PROF_B2  288ms
   ✓ multi-profile > User B não consegue criar post com profile de User A (mesmo autenticado)  291ms

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Duration  14.50s
```

---

## E. EVIDÊNCIA OBJETIVA POR POLICY

### posts_create
- ✅ User A cria com profile próprio → `error: null`, `author_profile_id = PROF_A`
- ✅ User A tenta criar com profile de User B → `error ≠ null` (RLS: `profiles.user_id ≠ auth.uid()`)
- ✅ location_id inválido → `error ≠ null` (FK/trigger)
- ✅ User B cria com profile business próprio → `error: null`, `author_profile_id = PROF_B2`

### posts_read_published
- ✅ User B lê post publicado de User A → `error: null`, `is_published: true`
- ✅ Cliente anon (sem autenticação) lê post publicado → `error: null`

### posts_read_own
- ✅ User A lê próprio post não publicado → `error: null`
- ✅ User B não vê post não publicado de User A → `data: null` (RLS filtra)

### posts_update_own
- ✅ User A edita próprio post → `error: null`
- ✅ User B tenta editar post de User A → conteúdo não alterado (RLS bloqueia silenciosamente)

### posts_delete_own
- ✅ User A tenta deletar post de User B → post permanece (verificado via admin)
- ✅ User A deleta próprio post → post removido (verificado via admin)

### multi-profile
- ✅ User B cria com profile pessoal → `author_profile_id = PROF_B`
- ✅ User B cria com profile business → `author_profile_id = PROF_B2`
- ✅ User B não cria com profile de User A → `error ≠ null`

---

## F. DIAGNÓSTICO

```
tests/rls-posts-auth-flow.test.ts: No diagnostics found
```

---

## G. O QUE FOI PROVADO

| Cenário | Provado |
|---|---|
| Criação com profile próprio | ✅ |
| Bloqueio de criação com profile alheio | ✅ |
| Bloqueio por location_id inválido (autenticado) | ✅ |
| Leitura pública de posts publicados | ✅ |
| Leitura pública sem autenticação | ✅ |
| Leitura de post não publicado pelo dono | ✅ |
| Bloqueio de leitura de post não publicado por terceiro | ✅ |
| Edição de post próprio | ✅ |
| Bloqueio de edição de post alheio | ✅ |
| Deleção de post próprio | ✅ |
| Bloqueio de deleção de post alheio | ✅ |
| Multi-profile: criação com profile pessoal | ✅ |
| Multi-profile: criação com profile business | ✅ |
| Multi-profile: bloqueio de criação com profile de outro user | ✅ |

## H. O QUE NÃO FOI PROVADO

| Cenário | Status |
|---|---|
| Fluxo completo via UI (CreatePostModal → PostService → banco) | ⚠️ não coberto — testes são diretos no cliente Supabase |
| Rate limiting (5 posts/dia) | ⚠️ não implementado no banco |
| RLS em ambiente de produção (não linked/dev) | ⚠️ não testado |

---

**Status**: ✅ RLS/AUTH FLOW VALIDADO — 15/15 testes passando com usuário autenticado comum; todas as policies provadas com evidência objetiva; supabaseAdmin usado apenas em setup/teardown.
