# EVIDÊNCIA FASE 6 — TESTES
**Sprint 2 - Posts (SSOT Territorial)**  
**Data**: 2026-04-05  
**Padrão**: AAA

---

## A. ARQUIVOS CRIADOS / ALTERADOS

### Novos
1. `tests/fase6-ssot-posts-runtime.test.ts` — 12 testes runtime contra banco linked
2. `tests/fase6-regressao-posts.test.ts` — 12 testes de regressão unitários

### Corrigidos durante a fase (bugs reais encontrados pelos testes)
3. `src/core/posts/services/PostService.ts`
   - JOIN `location:locations!location_id` → `location:locations!fk_posts_location_id`
     (banco tinha 2 FKs entre posts e locations; hint explícito necessário na época)
   - JOIN `profiles!author_profile_id` pedia `is_verified` → corrigido para `verified`
     (coluna real no banco é `verified`, não `is_verified`)
   - Após remoção da FK duplicada: hint `!fk_posts_location_id` removido → embed simplificado para `location:locations(...)`

---

## B. BUGS ENCONTRADOS E CORRIGIDOS

### Bug 1 — JOIN ambíguo entre posts e locations

**Erro**: `Could not embed because more than one relationship was found for 'posts' and 'locations'`

**Causa**: O banco tem duas FKs de `posts.location_id` para `locations`:
- `fk_posts_location_id` (criada na Fase 0)
- `posts_location_id_fkey` (criada na Fase 1)

**Correção aplicada**:
```diff
- location:locations!location_id(
+ location:locations!fk_posts_location_id(
```
Aplicado em `createPost()` e `getFeed()`.

A FK duplicada foi removida posteriormente via migration `20260405000024` — ver seção G.

---

### Bug 2 — Coluna `is_verified` inexistente em profiles

**Erro**: `column profiles_1.is_verified does not exist`

**Causa**: O JOIN de `author_profile` pedia `is_verified`, mas a coluna real no banco é `verified`.

**Correção**:
```diff
  author_profile:profiles!author_profile_id(
    id,
    name,
    avatar_url,
-   is_verified
+   verified
  ),
```
Aplicado em `createPost()` e `getFeed()`.

---

## C. OUTPUT REAL DOS TESTES

```bash
$ npm test -- tests/fase6-regressao-posts.test.ts tests/fase6-ssot-posts-runtime.test.ts
```

```
 RUN  v3.2.4

 ✓ tests/fase6-regressao-posts.test.ts (12 tests) 2021ms
   ✓ Fase 2 — PostAdapter.fromServicePost() > inclui location do JOIN
   ✓ Fase 2 — PostAdapter.fromServicePost() > inclui reach do banco
   ✓ Fase 5 — PostAdapter sem comparação textual > mesmo location_id → prioridade máxima (3)
   ✓ Fase 5 — PostAdapter sem comparação textual > location_id diferente → prioridade 0 (sem comparação textual)
   ✓ Fase 5 — UnifiedPost suporta location como objeto e reach > location pode ser objeto { name }
   ✓ Fase 5 — UnifiedPost suporta location como objeto e reach > reach aceita street | neighborhood | city
   ✓ Fase 5 — formattedLocation prioriza location.name > location.name vence city/neighborhood
   ✓ Fase 5 — formattedLocation prioriza location.name > sem location → fallback residual temporário
   ✓ Fase 5 — formattedLocation prioriza location.name > sem nada → "Localização não informada"
   ✓ Fase 4 — createPost exige location_id > PostService.createPost rejeita location_id null
   ✓ Zero regressão — sortPosts > critério "recent" — mais novo primeiro
   ✓ Zero regressão — sortPosts > critério "popular" — mais curtido primeiro

 ✓ tests/fase6-ssot-posts-runtime.test.ts (12 tests) 9490ms
   ✓ createPost() — validações > rejeita post sem location_id
   ✓ createPost() — validações > rejeita post com location_id inexistente
   ✓ createPost() — validações > rejeita post em location com type inválido (country)
   ✓ createPost() — validações > rejeita post em location com type state
   ✓ expandLocationIds() — expansão territorial > cidade expande para cidade + seus distritos
   ✓ expandLocationIds() — expansão territorial > bairro expande para bairro + cidade pai
   ✓ expandLocationIds() — expansão territorial > location_id inexistente retorna feed vazio sem erro
   ✓ getFeed() — JOIN com locations > posts retornados incluem location.name do JOIN
   ✓ getFeed() — JOIN com locations > posts retornados incluem reach
   ✓ getFeed() — JOIN com locations > feed sem location_id retorna vazio sem erro
   ✓ createPost() — fluxo positivo (via admin) > cria post em city com location.name no retorno
   ✓ createPost() — fluxo positivo (via admin) > cria post em district com location.name no retorno

 Test Files  2 passed (2)
      Tests  24 passed (24)
   Duration  16.67s
```

---

## D. DIAGNÓSTICO

```
src/core/posts/services/PostService.ts: No diagnostics found
tests/fase6-regressao-posts.test.ts: No diagnostics found
tests/fase6-ssot-posts-runtime.test.ts: No diagnostics found
```

Zero erros de compilação.

---

## E. COBERTURA DOS TESTES

### Runtime (banco linked)
| Cenário | Resultado |
|---|---|
| createPost sem location_id | ✅ rejeita com mensagem correta |
| createPost com location inexistente | ✅ rejeita |
| createPost em country | ✅ rejeita |
| createPost em state | ✅ rejeita |
| expandLocationIds: city → city + districts | ✅ expande |
| expandLocationIds: district → district + city | ✅ expande |
| expandLocationIds: location inexistente | ✅ retorna vazio |
| getFeed: location.name no JOIN | ✅ presente |
| getFeed: reach no retorno | ✅ presente |
| getFeed: sem location_id | ✅ retorna vazio |
| createPost em city (admin) | ✅ location.name correto |
| createPost em district (admin) | ✅ location.name correto |

### Regressão (unitários)
| Cenário | Resultado |
|---|---|
| PostAdapter inclui location do JOIN | ✅ |
| PostAdapter inclui reach | ✅ |
| calculateProximity: mesmo location_id → 3 | ✅ |
| calculateProximity: sem comparação textual | ✅ |
| UnifiedPost: location como objeto | ✅ |
| UnifiedPost: reach tipado | ✅ |
| formattedLocation: location.name vence city/neighborhood | ✅ |
| formattedLocation: fallback residual temporário | ✅ |
| formattedLocation: sem nada → "Localização não informada" | ✅ |
| createPost rejeita location_id null | ✅ |
| sortPosts: recent | ✅ |
| sortPosts: popular | ✅ |

---

## F. NOTA SOBRE TESTES DE CRIAÇÃO E ESCOPO REAL DA FASE

Os testes de fluxo positivo (`createPost em city/district`) usam `supabaseAdmin` (service_role) para bypassar RLS. Isso valida schema, service layer e JOIN com locations — mas **não valida criação via usuário autenticado comum**.

O fluxo de autenticação/RLS no app (usuário logado → `auth.uid()` → policy `posts_create` → insert) **não foi coberto nesta fase**. Essa validação específica precisa de evidência própria com usuário autenticado real.

**Escopo correto desta fase**: integração runtime + regressão concluídas; validação específica de RLS/auth flow ainda precisa de evidência própria.

---

## G. FK DUPLICADA — ✅ RESOLVIDO

**Problema identificado**: O banco tinha duas FKs de `posts.location_id` → `locations.id`:
- `fk_posts_location_id` — criada na Fase 0
- `posts_location_id_fkey` — criada na Fase 1

**Impacto**: todos os embeds Supabase entre `posts` e `locations` eram ambíguos, exigindo hint explícito em cada query.

**Resolução**: migration `20260405000024_remove_duplicate_fk_posts_location.sql` removeu `posts_location_id_fkey`. Apenas `fk_posts_location_id` permanece.

**Verificação pós-migration — FKs restantes**:
```
┌──────────────────────┬─────────────────┐
│   constraint_name    │ constraint_type │
├──────────────────────┼─────────────────┤
│ fk_posts_location_id │ FOREIGN KEY     │
└──────────────────────┴─────────────────┘
```

**Prova real — embed sem hint**:

Query executada via `supabaseAdmin` sem hint `!fk_posts_location_id`:
```ts
supabaseAdmin
  .from('posts')
  .select(`id, location_id, location:locations(id, name, type)`)
  .eq('location_id', BARRA_ID)
  .limit(1)
```

Resultado:
```
error: null
data[0].location.name: 'Barra Teste Fase2'
```

Sem erro de ambiguidade. O embed resolve corretamente com uma única FK.

**Testes pós-limpeza**: 25/25 passando — sem regressão, incluindo teste específico de embed sem hint.

```
✓ embed location:locations sem hint — regressão FK cleanup
  ✓ embed simples resolve sem ambiguidade após remoção de posts_location_id_fkey
```

---

**Status**: ✅ FASE 6 CONCLUÍDA — integração runtime + regressão concluídas; validação específica de RLS/auth flow ainda precisa de evidência própria.
