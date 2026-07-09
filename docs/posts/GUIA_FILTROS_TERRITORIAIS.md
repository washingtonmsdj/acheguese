# Guia — Filtros Territoriais de Posts
**Sprint 2 | Status**: ✅ Implementado

---

## Como o feed filtra por território

O feed **não filtra por texto** (`city`, `neighborhood`, `street`). Filtra exclusivamente por `location_id`.

### Expansão territorial

Ao buscar posts para um território, o service expande automaticamente:

| Território do usuário | IDs incluídos na query |
|---|---|
| `city` (ex: Salvador) | Salvador + todos os distritos ativos filhos |
| `district` (ex: Barra) | Barra + cidade pai (Salvador) |

```typescript
// Exemplo: usuário na Barra
const feed = await postService.getFeed({
  location_id: BARRA_ID,
});
// Query inclui: [BARRA_ID, SALVADOR_ID]
// Retorna posts da Barra E de Salvador
```

### Por que expandir?

- Um post criado em Salvador deve aparecer para quem mora na Barra
- Um post criado na Barra deve aparecer para quem mora em Salvador
- Isso garante que o feed não fique vazio quando há poucos posts no bairro

---

## reach não é filtro nem restrição de acesso

`reach` é um **metadado de escopo intencional** — indica para qual audiência o autor pretendia escrever. Ele **não filtra o feed** e **não restringe leitura**. Qualquer post publicado é lido por qualquer usuário via `posts_read_published`, independente do valor de `reach`.

O que `reach` faz hoje: é exibido como badge no card.

```
reach = 'street'       → badge "🏠 Minha rua"
reach = 'neighborhood' → badge "📍 Meu bairro"
reach = 'city'         → badge "🏙️ Cidade"
```

A intenção futura é usar `reach` para filtros opcionais de UI — mas isso não está implementado e não deve ser adicionado sem decisão arquitetural explícita.

---

## Como usar o feed no código

### Via hook (componentes React)

```typescript
import { useCommunityFeedSimple } from '@/modules/community/hooks/feed/useCommunityFeed';

const { posts, isLoading, hasNextPage, loadMore } = useCommunityFeedSimple({
  locationScope: 'city', // ou 'neighborhood'
});
```

O hook resolve o `location_id` internamente via `useTerritoryFilter`.

### Via service (direto)

```typescript
import { postService } from '@/core/posts/services';

const { posts, hasMore, nextCursor } = await postService.getFeed({
  location_id: locationId,   // UUID de city ou district
  limit: 20,
  cursor: nextCursor,        // para paginação
});

// Cada post retorna:
// post.location.name           → nome da localização (do JOIN)
// post.location_id             → UUID para cálculo de proximidade
// post.reach                   → metadado de escopo intencional
// post.author_profile.verified → boolean (coluna real em profiles é 'verified', não 'is_verified')
```

### Ordenação por proximidade

```typescript
import { PostAdapter } from '@/core/posts/adapters/PostAdapter';

const sorted = PostAdapter.sortPosts(posts, 'nearby', {
  location_id: activeProfile.location_id,
});

// Regra: mesmo location_id → prioridade 3; diferente → 0
// Não usa comparação textual de bairro/cidade
```

---

## Restrições

- `location_id` ausente no `getFeed()` → retorna feed vazio sem erro
- `location_id` inexistente → `expandLocationIds` ignora silenciosamente e retorna vazio
- Território do tipo `group` → não é suportado em `getFeed()` diretamente; use `location_ids` com os IDs dos membros do grupo

---

## Observações de escopo

A validação de criação via usuário autenticado comum (RLS real com `auth.uid()`) foi validada — ver `EVIDENCIA_RLS_AUTH_FLOW_FINAL.md`.

Q&A não pertence ao feed social: perguntas usam `community_questions` e respostas usam `question_answers`. `community_posts` não deve ser tratada como fonte runtime; referências restantes ficam restritas a migrations históricas, tipos gerados enquanto o schema remoto existir, ou testes que documentam a migração.
