# Community Hooks

Esta pasta contem somente hooks com comportamento proprio do dominio Community.
Ela nao e barrel nem facade para hooks de outros owners.

## Contratos mantidos

- `useCommunityLocation.ts`: adapta o SSOT de Location para Community.
- `useCommunityRollout.ts`: aplica o rollout especifico do modulo Community.

Feed, composer, comentarios, Poll, moderacao de Post/Comment e adapters de
mensagem iniciada por Post pertencem a `src/core/community-feed`. O estado React
de Community Direct Messaging pertence a `src/core/messaging/hooks`.

## Regras

- Nao criar `index.ts` generico nesta pasta para reexportar owners externos.
- Hooks nao acessam Supabase diretamente quando existe service de dominio.
- Identidade social usa o Profile ativo; `user.id` nao substitui `profile.id`.
- Nao recriar hooks aposentados apenas para satisfazer paths historicos.
