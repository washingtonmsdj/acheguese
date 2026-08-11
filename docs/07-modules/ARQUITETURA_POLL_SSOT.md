# Poll — autoridade e janela de compatibilidade

## Owner e fonte de verdade

Poll pertence ao domínio de Posts. O estado autoritativo é normalizado em
`community_polls`, `community_poll_options` e `community_poll_votes`.

Para novos registros, `posts.content_payload.poll` contém somente
`{ "poll_id": "<uuid>" }`. As colunas legadas `community_polls.options` e
`community_poll_options.votes` são projeções mantidas pelo banco durante a
janela de compatibilidade; não são autoridades independentes.

Os totais são derivados de `COUNT(community_poll_votes)`. A identidade canônica
do voto é o perfil ativo (`profile_id`); `user_id` permanece como identidade de
autenticação e auditoria.

## ADDITIVE

`20260810151941_reconcile_community_poll_additive_compatibility.sql` suporta os
dois estados conhecidos: a tabela legada `community_poll_votes` presente ou a
tabela ausente em um replay futuro. Estados de schema incompatíveis abortam a
migration.

Nesta fase, `profile_id` é nullable, as FKs novas são `NOT VALID` e a UNIQUE
legada é substituída por dois índices parciais:

- legado: `(poll_id, user_id) WHERE profile_id IS NULL`;
- canônico: `(poll_id, profile_id, option_id) WHERE profile_id IS NOT NULL`.

O frontend antigo conserva as permissões de tabela necessárias. Triggers
derivam `community_poll_options.votes` das linhas de voto e reconstroem
`community_polls.options` das Options normalizadas, inclusive quando o cliente
antigo tenta atualizar essas projeções.

O frontend novo usa `create_post_with_poll`, `cast_community_poll_vote` e
`get_community_poll_for_post`. Criação de Post/Poll/Options, voto e atualização
das projeções acontecem dentro da mesma transação.

## CUTOVER

O plano `docs/09-reference/migrations-pending/20260810152013_finalize_community_poll_cutover.sql`
fica deliberadamente fora de `supabase/migrations`, para que um `db push` da
fase ADDITIVE não o aplique por acidente. Ele só pode ser promovido com um novo
timestamp depois do backend aditivo, da publicação e observação do frontend
novo e de um `POLL_PREFLIGHT_PASS` em modo `cutover`.

A migration aborta diante de Poll JSON sem linha normalizada, duplicidades,
Options inválidas, posições não contíguas, votos sem Profile, associação
User/Profile sem evidência, Option pertencente a outra Poll ou projeções legadas
dessincronizadas. Somente então valida as FKs/checks, torna `profile_id` não
nulo, finaliza a UNIQUE canônica e revoga mutations diretas do Data API.

## CLEANUP futuro

Não existe migration de CLEANUP nesta etapa. Depois de um período de observação
sem clientes legados, uma tarefa separada deverá:

- confirmar por telemetria que não há leitura ou escrita legada;
- remover `community_polls.options` e `community_poll_options.votes`;
- remover os triggers e helpers de projeção legada;
- remover `community_poll_votes.user_id` apenas se auditoria e RLS não dependerem
  mais dele;
- remover índices e policies transitórios que se tornarem redundantes;
- remover o código frontend legado e seus tipos;
- regenerar tipos Supabase e repetir todos os gates de segurança e deploy.

Cada remoção deve ser precedida por inventário read-only e migration fail-closed;
nenhum CLEANUP deve ser combinado com o CUTOVER.
