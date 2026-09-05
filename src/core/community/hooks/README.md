# Community Hooks

Esta pasta contem apenas hooks que ainda pertencem ao dominio Community e que
possuem comportamento proprio. Ela nao e barrel nem facade para hooks de outros
owners.

## Contratos mantidos

- `useCommunityLocation.ts`: adapta o SSOT de Location para o contexto da
  Community.
- `useCommunityRollout.ts`: aplica o rollout especifico do modulo Community.
- `useDirectMessages.ts`: adapter de UI do contrato de Community Direct
  Messaging; persistencia e authority permanecem em `core/messaging`.

Feed, composer, comentarios, Poll, moderacao de Post/Comment e adapters de
mensagem iniciada por Post pertencem a `src/core/community-feed`. Interacoes
transversais de Post pertencem a `src/core/posts/hooks`.

## Regras

- Nao criar `index.ts` generico nesta pasta para reexportar owners externos.
- Hooks nao acessam Supabase diretamente quando existe service de dominio.
- Identidade social usa o Profile ativo; `user.id` nao substitui `profile.id`.
- Nao recriar hooks aposentados apenas para satisfazer testes ou paths
  historicos; atualize o caller/teste para o owner canonico.
- Alteracoes de Direct Messaging devem preservar o contrato de
  `docs/07-modules/COMMUNITY_DIRECT_MESSAGING_SSOT.md`.

A certificacao hosted e uma prova separada. O ownership desta pasta e protegido
por testes arquiteturais e caller census.
