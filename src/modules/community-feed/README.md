# community-feed

Bounded context de produto para o feed territorial. Ele nao mantem uma arvore
paralela de implementacao.

Boundary:
- Posts, comentarios, reacoes, compartilhamentos e ranking pertencem a
  `core/posts`, `core/comments`, `core/social` e `core/feed`.
- A composicao visual especifica da Comunidade pertence a
  `core/community/components` e `core/community/pages`.
- Nao importa outros modulos `src/modules/*`.
- O territorio e sempre resolvido por `location_id` via core.
- Consumidores externos usam somente os entrypoints comunitarios aprovados em
  `scripts/validate-community-transversal-boundaries.ts`.
- `src/core/community-feed` foi removido: reexports de compatibilidade nao sao
  uma segunda fonte de verdade e nao podem ser recriados.
