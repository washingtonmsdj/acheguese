# Auditoria de Contratos: UserId vs ProfileId

> Atualizado: 2026-03-23  
> Status: APROVADO — shape unificado em camelCase

## 1. Contrato Canônico

```typescript
// src/core/auth/hooks/useProfileContextIntegration.ts
interface CanonicalActiveProfile {
  id: string; // ProfileId — profiles.id
  userId: string; // UserId — auth.users.id
  profileType: string; // 'personal' | 'driver' | 'business' | 'professional'
  displayName: string;
  username?: string;
  avatarUrl?: string;
  isActive: boolean;
  // ... campos opcionais
}
```

Tanto `AuthContext.activeProfile` quanto `SessionContext.activeProfile` usam este shape.

## 2. Tabela de Contratos por Service

| Service                       | Método                         | Recebe                   | Tipo                | Justificativa                                     |
| ----------------------------- | ------------------------------ | ------------------------ | ------------------- | ------------------------------------------------- |
| **AuthService**               | `signIn`, `signOut`, `isAdmin` | `userId`                 | `UserId`            | Operação técnica de auth                          |
| **ProfileService**            | `getProfileContext`            | `userId`                 | `UserId`            | Busca perfis de um user                           |
| **ProfileService**            | `getProfilesByUserId`          | `userId`                 | `UserId`            | FK profiles.user_id                               |
| **ProfileService**            | `switchActiveProfile`          | `userId, profileId`      | `UserId, ProfileId` | Ambos necessários                                 |
| **ProfileService**            | `getUserRoles`                 | `userId`                 | `UserId`            | user_roles.user_id                                |
| **ProfileService**            | `getUserLikesCount`            | `profileId`              | `ProfileId`         | Contagem por perfil                               |
| **ProfileService**            | `getUserBusinessesByProfiles`  | `profileIds[]`           | `ProfileId[]`       | FK por perfil                                     |
| **PostService**               | `createSimplePost`             | `author_profile_id`      | `ProfileId`         | Autoria social                                    |
| **PostService**               | `getPostsByProfile`            | `profileId`              | `ProfileId`         | Busca por perfil                                  |
| **PostService**               | `getPostsCountByProfile`       | `profileId`              | `ProfileId`         | Contagem por perfil                               |
| **SocialInteractionsService** | `likePost`, `unlikePost`       | `userId`                 | `UserId`            | Resolve profile internamente                      |
| **SocialInteractionsService** | `getLikesForPosts`             | `userId`                 | `UserId`            | Resolve profile internamente                      |
| **CommunityReportService**    | `report`                       | ator derivado pelo banco | `ProfileId`         | O browser nao declara a identidade do denunciante |
| **FavoritesService**          | `getFavoriteStats`             | `profileId`              | `ProfileId`         | Favoritos por perfil                              |
| **SessionService**            | `getSession`, `refreshSession` | `userId`                 | `UserId`            | Sessão técnica                                    |

## 3. Branded Types

```typescript
// src/core/session/types/strict.ts
type UserId = string & { readonly __brand: "UserId" };
type ProfileId = string & { readonly __brand: "ProfileId" };
```

Disponíveis para adoção gradual. Atualmente os services usam `string` com `@ts-nocheck`.  
Quando `@ts-nocheck` for removido, os branded types impedirão trocas acidentais.

## 4. Regra de Uso

| Contexto                                       | Usar                           | Exemplo                                                                 |
| ---------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Auth, sessão, audit, roles                     | `user.id` (UserId)             | `AuthService.isAdmin(user.id)`                                          |
| Posts, comments, reports, favoritos, ownership | `activeProfile.id` (ProfileId) | `postService.createSimplePost({ author_profile_id: activeProfile.id })` |
| Services que resolvem internamente             | `user.id` (UserId)             | `SocialInteractionsService.likePost(postId, user.id)`                   |

## 5. Próxima Fase: Eliminar AuthContext Shim

### Consumidores atuais de useAuthContext (22 arquivos)

Migração planejada em lotes:

1. **Lote 1** — Hooks core: `useProfile`, `useActiveProfile`
2. **Lote 2** — Páginas de perfil: `PerfilHubPage`, `ConfiguracoesPage`, `ProfilePublicPage`
3. **Lote 3** — Admin: `AdminDashboard`, `AdminLayout`, `AdminUsuarios`
4. **Lote 4** — Componentes: `ProfileSwitcher`, `ServiceAreasManager`, `useNovoPost`
5. **Lote 5** — Restantes + remover AuthContext

Cada lote:

- Trocar `useAuthContext()` por `useSessionContext()`
- Ajustar propriedades se necessário
- Rodar `tsc --noEmit` + `vite build`
