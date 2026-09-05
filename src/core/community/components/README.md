# Community Components

Esta pasta contem somente componentes que ainda pertencem a experiencia
Community compartilhada. Superficies especificas do Feed vivem em
`src/core/community-feed`; persistencia de Posts vive em `src/core/posts` e
persistencia de comentarios em `src/core/comments`.

## Fronteiras atuais

- `CommunityRolloutGate` usa os contratos de Location/Rollout da Community.
- `DirectMessageModal` pertence a experiencia de Community Direct Messaging,
  com authority em `core/messaging`.
- Componentes visuais de Post ainda compartilhados por mais de uma superficie
  permanecem aqui enquanto tiverem callers reais; nao mover por nome.
- `CommunityOverviewSurface`, composer, Poll e UI de comentarios pertencem a
  `src/core/community-feed`.

## Diretrizes

- Componentes nao criam segundo caminho de persistencia ou autorizacao.
- Acoes de Post usam owners de `core/posts`/`core/engagement`; comentarios
  usam `core/comments`; reports usam a authority comunitaria de moderacao.
- Nao preservar componente sem caller apenas porque um teste estatico espera o
  arquivo. O teste deve ratchetar o owner vigente.
- Acessibilidade e estado visual pertencem ao componente; integridade,
  identidade e autorizacao pertencem ao service/RLS/RPC apropriado.

Antes de criar ou mover uma superficie, consulte
`docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`,
`docs/03-architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md` e o registry de
ownership vigente.
