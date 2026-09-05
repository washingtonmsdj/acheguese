# Community Hooks

Os hooks desta pasta compoem a experiencia comunitaria e nao sao uma camada
alternativa de dados.

## Contratos mantidos

- `feed/`: leitura territorial por `core/posts`; `core/feed` fornece somente o
  namespace de cache da composicao.
- `composer/`: criacao de conteudo com autoria do perfil ativo e `location_id`.
- Groups saiu deste namespace: `useGrupos` e `useFavoriteGroups` pertencem a
  `src/core/community-groups/hooks`, com persistencia em `CommunityGroupsService`.
- `useComments`, `useCommentActions` e hooks de post: interacoes sobre os
  services canonicos de posts e comentarios.

## Regras

- Hooks nao acessam Supabase diretamente quando existe service de dominio.
- A autoria vem do perfil ativo; `user.id` nao substitui `profile.id` em
  conteudo social.
- Paginas de grupos e filas de conteudo usam paginacao limitada. Nao adicione
  leituras sem limite ou contagens paralelas ao runtime.
- Gamificacao, badges e ranking individual nao sao contratos publicados. Nao
  crie hooks de pontos no cliente sem schema, RLS e operacao server-side.

Valide alteracoes com `npm run typecheck:app` e os testes de hardening de
`src/core/community/access/__tests__/`.
