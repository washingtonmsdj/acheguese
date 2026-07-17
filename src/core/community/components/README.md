# Community Components

Esta pasta contem componentes de composicao da experiencia comunitaria. A
pagina territorial e composta por `page/CommunityOverviewSurface.tsx`; os
modulos especializados continuam com seus owners em `core/community-*`.

## Diretrizes

- Feed e composer usam contratos de `core/posts`; comentarios e interacoes
  usam seus owners. `core/feed` fornece somente chaves de cache da composicao.
- Componentes nao simulam pontuacao, badges, rankings ou perfis comunitarios.
  Essas entidades nao possuem contrato remoto publicado.
- Acoes de moderacao nao fazem `update` direto em posts/comentarios. A fila
  administrativa chama a RPC atomica de revisao.
- Acessibilidade, estados de erro e limites de exibicao pertencem ao
  componente; autorizacao e integridade pertencem ao service/RLS/RPC.

Antes de incluir uma nova superficie, confirme o owner do dominio em
`docs/COMMUNITY_TRANSVERSAL_ARCHITECTURE.md` e evite criar um segundo caminho
de dados para a mesma entidade.
