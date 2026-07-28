# Arquitetura Posts — SSOT Territorial

> AVISO DE SUBSTITUICAO DOCUMENTAL
>
> Status: SUBSTITUIDO.
> Documento canonico atual: `docs/feed/FEED-FREEZE.md`.
> Este arquivo fica preservado apenas como historico e nao deve ser usado como fonte normativa para a superficie publica do Feed.
**Posts Sociais | Status**: ✅ Concluído estruturalmente
**Polls | Status**: ✅ Vinculadas a `posts.id`
**Q&A Perguntas | Status**: ✅ Concluído — `community_questions`
**Q&A Respostas | Status**: ✅ Concluído — `question_answers`
**Última atualização**: 2026-04-05

---

## Visão Geral

Posts são a entidade central do módulo de comunidade. A arquitetura SSOT territorial garante que todo post está vinculado a uma localização canônica (`location_id`) — nunca a campos de texto livres como `city`, `neighborhood` ou `street`.

---

## Modelo de Dados

### Tabela `posts` (colunas relevantes)

| Coluna | Tipo | Nullable | Constraint | Descrição |
|---|---|---|---|---|
| `id` | uuid | NO | PK, default gen_random_uuid() | Identificador único |
| `author_profile_id` | uuid | NO | FK → profiles | Perfil autor (multi-profile) |
| `content` | text | **YES** | — | Conteúdo do post (nullable no banco; validado no service) |
| `type` | text | NO | default `'text'` | Tipo do post — sem CHECK constraint de valores no banco |
| `location_id` | uuid | NO | FK → locations | Território canônico (SSOT) |
| `reach` | text | YES | CHECK (street/neighborhood/city), default `'neighborhood'` | Metadado de escopo intencional |
| `is_published` | boolean | NO | default `true` | Publicado ou rascunho |
| `created_at` | timestamptz | NO | default now() | Data de criação |

> Schema introspectado do banco linked em 2026-04-05. `content` é nullable no banco — a obrigatoriedade é validada no service e na UI, não por constraint de banco.
> A coluna de verificação em `profiles` é `verified` (boolean) — não `is_verified`. O JOIN de `author_profile` no PostService usa `verified`.

### FK canônica

```
posts.location_id → locations.id
constraint: fk_posts_location_id (ON DELETE RESTRICT)
```

Há apenas uma FK entre `posts` e `locations`. A FK duplicada `posts_location_id_fkey` foi removida na migration `20260405000024`.

### Trigger de validação

`validate_post_location_trigger` (BEFORE INSERT OR UPDATE) valida:
- `location.type` ∈ `{'city', 'district'}` — posts só podem existir em cidades ou bairros
- `location.status = 'active'` — localização deve estar ativa

---

## Regras de Negócio

### Criação

1. `location_id` é **obrigatório** — NOT NULL no banco e validado no service antes do insert
2. Território do tipo `group` é **rejeitado** com erro explícito na UI
3. Território do tipo `country` ou `state` é **rejeitado** pelo service e pelo trigger
4. `reach` é **metadado de visibilidade** — não afeta filtros territoriais

### Leitura (feed)

O feed expande o território antes de filtrar:

| Território do usuário | Posts incluídos |
|---|---|
| `city` | posts da cidade + todos os distritos filhos |
| `district` | posts do bairro + cidade pai |

### reach — valores e semântica

`reach` é um **metadado de escopo intencional** — indica para qual audiência o autor pretendia escrever. Hoje ele é exibido como badge informativo no card e **não filtra o feed nem restringe leitura**.

| Valor | Intenção do autor | Badge exibido |
|---|---|---|
| `street` | Escopo de rua | 🏠 Minha rua |
| `neighborhood` | Escopo de bairro (padrão) | 📍 Meu bairro |
| `city` | Escopo de cidade | 🏙️ Cidade |

> `reach` não é uma restrição de acesso. Qualquer post publicado é lido por qualquer usuário via `posts_read_published`, independente do valor de `reach`.

---

## Camadas de Responsabilidade

| Camada | Responsabilidade |
|---|---|
| FK `fk_posts_location_id` | Garante que `location_id` existe em `locations` |
| Trigger `validate_post_location_trigger` | Valida `type` (city/district) e `status` (active) |
| NOT NULL em `location_id` | Garante que todo post tem território (aplicado na Fase 4) |
| RLS (ver tabela acima) | Leitura pública de publicados; escrita/edição/remoção exige ownership |
| `PostService.createPost()` | Valida grupo territorial e lógica de negócio |
| `PostService.getFeed()` | Expande território e faz JOIN com `locations` |

### RLS Policies

| Policy | Operação | Regra |
|---|---|---|
| `posts_read_published` | SELECT | `is_published = true` — leitura pública de qualquer post publicado, sem autenticação |
| `posts_read_own` | SELECT | `profiles.user_id = auth.uid()` — leitura de posts próprios (incluindo não publicados) |
| `posts_create` | INSERT | `profiles.user_id = auth.uid()` + `location_id IS NOT NULL` — criação exige ownership do perfil |
| `posts_update_own` | UPDATE | `profiles.user_id = auth.uid()` — edição exige ownership |
| `posts_delete_own` | DELETE | `profiles.user_id = auth.uid()` — remoção exige ownership |

> Leitura de posts publicados é **pública** (sem autenticação). Escrita, edição e remoção exigem que o `author_profile_id` pertença ao usuário autenticado via `profiles.user_id = auth.uid()`.

---

## Fluxo de Criação

```
UI (CreatePostModal)
  → useTerritoryFilter() → resolve location_id ativo
  → se scope = 'group' → rejeita com erro na UI
  → se scope = 'location' → usa location_id do filtro
  → fallback → profile.location_id
  → PostService.createPost({ location_id, ... })
    → valida location_id obrigatório
    → valida type ∈ {city, district}
    → valida status = active
    → INSERT posts
    → trigger valida novamente (camada extra)
    → retorna post com JOIN location.name
```

---

## Fluxo de Leitura

```
CommunityFeed
  → useCommunityFeedSimple({ locationScope })
    → useTerritoryFilter() → resolve location_id
    → PostService.getFeed({ location_id })
      → expandLocationIds([location_id])
        → city → [city_id, ...district_ids]
        → district → [district_id, city_id]
      → SELECT posts WHERE location_id IN (expanded_ids)
        JOIN locations ON fk_posts_location_id
        JOIN profiles ON author_profile_id
      → retorna posts com location.name e reach
  → PostAdapter.fromServicePost() → UnifiedPost
  → UnifiedPostCard exibe location.name (prioridade) ou fallback
```

---

## Débito Técnico Registrado

| Item | Status |
|---|---|
| Colunas legadas `city`, `neighborhood`, `street`, `autor_id`, `texto` do banco | ✅ removidas — migration 000030 |
| Funções deprecated `createCommunityPost`, `createCommunityPostWithValidation`, `createSimplePost` | ✅ removidas |
| Polls migradas para `posts.id` | ✅ migration 000031 |
| Q&A territorial — `location_id` NOT NULL no banco | ✅ migration 000032 |
| Rename `community_posts` → `community_questions` | ✅ migration 000033 |
| Q&A Respostas — `question_answers` canônico | ✅ migration 000035 |
| Remoção de `@ts-nocheck` | ⏳ sprint futura — exige tipagem completa |

---

## Estado Final

### Posts Sociais — concluído estruturalmente

- `posts.location_id` NOT NULL, FK canônica íntegra, trigger de validação
- Colunas legadas removidas do banco
- `comments` pertence exclusivamente a Posts Sociais

### Polls — concluído funcionalmente

- `community_polls.post_id` → `posts.id` (migration 000031)
- Desacopladas de Q&A

### Q&A Perguntas — concluído estruturalmente

- Tabela: `community_questions` (renomeada de `community_posts` na migration 000033)
- `location_id` NOT NULL + FK → `locations`
- Filtro territorial em listagem e criação

### Q&A Respostas — concluído estruturalmente

- Tabela: `question_answers` com FK → `community_questions(id)`
- Likes: `question_answer_likes` com UNIQUE(answer_id, user_id)
- Triggers de sincronização de `likes_count` e `answers_count`
- RPC `mark_best_answer` opera em `question_answers`
- `CommunityQAService` sem nenhuma dependência de `comments` ou `CommentService`

### Próxima sprint (futura)

- Remoção de `@ts-nocheck` (exige tipagem completa — escopo maior)
