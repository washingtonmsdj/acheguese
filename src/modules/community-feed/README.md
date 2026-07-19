# community-feed

Modulo transversal para o feed territorial.

Boundary:
- Consome somente `core/posts`, `core/comments`, `core/social`, as chaves de
  cache de `core/feed`, `core/location` e owners canonicos em `core/community`.
- Nao importa outros modulos `src/modules/*`.
- O territorio e sempre resolvido por `location_id` via core.
- Rotas, testes e componentes compartilhados de feed devem carregar `src/core/community/*` diretamente (o antigo shim `src/core/community-feed/*` foi removido em favor do SSOT canonico).
