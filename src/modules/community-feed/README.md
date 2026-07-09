# community-feed

Modulo transversal para o feed territorial.

Boundary:
- Consome somente `core/posts`, `core/comments`, `core/social`, `core/feed`, `core/location` e owners canonicos em `core/community-feed`.
- Nao importa outros modulos `src/modules/*`.
- O territorio e sempre resolvido por `location_id` via core.
- Rotas, testes e componentes compartilhados de feed devem carregar `src/core/community-feed/*` diretamente; este modulo nao deve recriar facades vazias.
