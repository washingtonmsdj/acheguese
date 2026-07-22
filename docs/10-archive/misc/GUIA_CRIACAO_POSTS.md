# Guia — Criação de Posts
**Sprint 2 | Status**: ✅ Implementado

---

## Como criar um post

### Via UI (fluxo normal)

O `CreatePostModal` resolve o `location_id` automaticamente:

1. Se o território ativo for uma **cidade ou bairro** → usa esse `location_id`
2. Se o território ativo for um **grupo** → bloqueia com erro: _"Selecione uma cidade ou bairro específico para publicar"_
3. Se não houver território ativo → usa `profile.location_id` como fallback
4. Se não houver nenhum → bloqueia com erro: _"Configure sua localização no perfil antes de publicar"_

### Via PostService (programático)

```typescript
import { postService } from '@/core/posts/services';

const post = await postService.createPost({
  author_profile_id: profile.id,  // UUID do perfil — não do user
  content: 'Conteúdo do post',    // nullable no banco; validado no service e na UI
  type: 'text',                   // sem CHECK constraint no banco; default 'text'
  location_id: locationId,        // obrigatório — UUID de city ou district
  reach: 'neighborhood',          // opcional — padrão: 'neighborhood'
  images: [],                     // opcional
  tags: [],                       // opcional
});
```

### Erros esperados

| Código | Mensagem | Causa |
|---|---|---|
| `LOCATION_REQUIRED` | `location_id é obrigatório` | `location_id` nulo ou ausente |
| `INVALID_LOCATION` | `Localização inválida` | `location_id` não existe no banco |
| `INVALID_LOCATION_TYPE` | `Posts só podem ser criados em cidades ou bairros` | `type` ∉ `{city, district}` |
| `INACTIVE_LOCATION` | `Localização inativa` | `status ≠ active` |
| `GROUP_NOT_ALLOWED` | (bloqueado na UI antes de chegar ao service) | `type = group` |

---

## Regras inegociáveis

- `location_id` é **sempre obrigatório** — NOT NULL no banco
- Posts só podem ser criados em `city` ou `district` — nunca em `country`, `state`, `group` ou `street`
- `author_profile_id` deve ser o UUID do **perfil**, não do usuário (`auth.uid()`)
- `reach` é metadado de escopo intencional — não filtra o feed nem restringe leitura
- `content` é nullable no banco — a obrigatoriedade é validada no service (`content.trim()`) e na UI
- `type` não tem CHECK constraint no banco — os valores válidos (`text`, `discussao`, `alerta`, etc.) são convenção de aplicação, não garantia de banco

---

## Funções legadas — removidas no cleanup pós-Sprint 2

As funções abaixo foram **removidas** do PostService no cleanup estrutural (2026-04-05).
Não existem mais. Qualquer chamada a elas causará erro em runtime.

| Função | Status |
|---|---|
| `createCommunityPost()` | **Removida** — use `createPost()` |
| `createCommunityPostWithValidation()` | **Removida** — use `createPost()` |
| `createSimplePost()` | **Removida** — use `createPost()` |

O único ponto de criação de posts sociais é `PostService.createPost()`.
