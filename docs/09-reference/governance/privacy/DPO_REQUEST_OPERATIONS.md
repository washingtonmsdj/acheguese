# Admin LGPD request authority

Data: 2026-09-16

## Objetivo

Fechar a etapa operacional do canal DPO sem expor `privacy_subject_requests` diretamente ao navegador, sem carregar PII além do necessário para cada etapa de triagem e com histórico durável do ciclo de vida do pedido.

## Autoridade

- `submit-dpo-request` é o broker público de entrada; o navegador não grava no ledger diretamente;
- `admin-privacy-rpc` exige JWT e reutiliza `requireAdmin`, incluindo a política de MFA administrativa;
- as três RPCs administrativas de banco são `service_role` only e validam novamente `private.is_admin(actor_user_id)`;
- a listagem é paginada e retorna somente `id`, tipo, status, datas, vínculo de conta e `total_count`;
- `requester_name`, `requester_email`, `subject` e `message` não fazem parte da RPC de listagem;
- detalhes completos são carregados apenas para um `request_id` específico;
- o frontend remove o detalhe sensível do cache do TanStack Query quando o diálogo é fechado;
- mudanças de estado passam por `admin_transition_privacy_subject_request`, com `FOR UPDATE` e máquina de estados explícita;
- estados terminais não são reabertos implicitamente;
- cada submissão e cada transição administrativa gera histórico transacional em `privacy_subject_request_events` na mesma autoridade do banco;
- o histórico retornado ao painel não expõe `actor_user_id`; esse identificador permanece somente na trilha interna;
- a página administrativa não oferece exportação em massa da caixa DPO.

## Superfície administrativa

A fila operacional está em `/admin/privacidade`, dentro da seção **Moderação e Segurança** do painel. O frontend usa `AdminPrivacyRequestsService`, que chama exclusivamente `admin-privacy-rpc` por meio do broker compartilhado de Edge Functions.

A grade mostra apenas protocolo reduzido, direito exercido, situação, data e indicação de conta vinculada. Nome, e-mail, assunto e mensagem só são requisitados quando um administrador abre uma solicitação individual para análise.

A paginação preserva o total real mesmo quando um `OFFSET` cai além da última linha: nesse caso o broker consulta apenas a primeira linha de metadados para recuperar `total_count`, sem reintroduzir identificadores diretos na lista.

## Estados

- `received` -> `in_review` ou `cancelled`;
- `in_review` -> `waiting_for_requester`, `completed`, `denied` ou `cancelled`;
- `waiting_for_requester` -> `in_review`, `completed`, `denied` ou `cancelled`;
- `completed`, `denied` e `cancelled` são terminais neste contrato.

## Defesa de acesso direto

As duas tabelas DPO usam RLS + FORCE RLS e possuem policy explícita `FOR ALL TO PUBLIC USING (false) WITH CHECK (false)`. A policy deixa o default-deny documentado no próprio banco em vez de depender apenas da ausência de policies permissivas.

A autoridade de tabela também é minimizada independentemente da RLS:

- `anon`: nenhum grant direto nas tabelas DPO;
- `authenticated`: nenhum grant direto nas tabelas DPO;
- `service_role` em `privacy_subject_requests`: somente `INSERT`;
- `service_role` em `privacy_subject_request_events`: nenhum grant direto.

`REFERENCES`, `TRIGGER`, `TRUNCATE`, `SELECT`, `UPDATE` e `DELETE` não fazem parte da autoridade direta do `service_role` no ledger. Leituras administrativas e transições passam pelas RPCs `SECURITY DEFINER` protegidas.

## Histórico e integridade referencial

`privacy_subject_request_events` é append-only pela autoridade das RPCs/triggers e registra `submitted`, `status_changed` e snapshots de backfill quando necessário. O evento de transição é inserido na mesma transação que altera o status do pedido.

Os três FKs desse domínio possuem índice líder no estado remoto verificado:

- `privacy_subject_requests.user_id -> auth.users(id)` por `privacy_subject_requests_user_submitted_idx`;
- `privacy_subject_request_events.request_id -> privacy_subject_requests(id)` por `privacy_subject_request_events_request_time_idx`;
- `privacy_subject_request_events.actor_user_id -> auth.users(id)` por `privacy_subject_request_events_actor_user_idx`.

O advisor pode classificar índices recém-criados como `unused_index` enquanto não houver tráfego; com o ledger vazio isso não é evidência para removê-los, porque dois deles também cobrem manutenção de foreign keys.

## Estado remoto verificado

Em 2026-09-16:

- `privacy_subject_requests` e `privacy_subject_request_events` estão com RLS/FORCE RLS e policy `deny` explícita;
- `service_role` possui somente `INSERT` direto no ledger principal e nenhum grant direto na tabela de eventos;
- `admin_list_privacy_subject_requests`, `admin_get_privacy_subject_request` e `admin_transition_privacy_subject_request` existem no projeto remoto;
- `anon` e `authenticated` não possuem `EXECUTE` nessas RPCs; `service_role` possui;
- o contrato remoto de `admin_list_privacy_subject_requests` foi reduzido e não contém `requester_name`, `requester_email`, `subject` ou `message`;
- todos os FKs das duas tabelas DPO estão cobertos por índice líder;
- o ledger e o histórico estavam ambos com `0` linhas na última verificação remota;
- `admin-privacy-rpc` está implantada com `verify_jwt=true`.

Essas verificações comprovam schema, grants e estado remoto. Um fluxo HTTP autenticado completo pelo painel continua sendo uma validação E2E separada, não inferida apenas pelo estado `ACTIVE` da função.

## Deploy da Edge Function

O repositório possui `.github/workflows/supabase-admin-privacy-rpc-deploy.yml`, com deploy `main`-only a partir de checkout isolado no SHA exato, Supabase CLI fixada, verificação de `verify_jwt=true`, contratos de admin/MFA/auditoria e hashes do bundle. O workflow self-hosted é a autoridade pretendida para eliminar drift entre o source do Git e o runtime remoto.

A execução `35091238772` ainda estava `queued` na última checagem; portanto o deploy exact-main não deve ser considerado concluído até o runner executar esse job com sucesso.

## Escopo preservado

Nenhuma alteração desta rodada toca mobilidade, cadastro, SMTP, Resend ou confirmação de e-mail.

## Pendências separadas

A matriz `user-export-data` continua bloqueada até concluir sua certificação de completude LGPD. `public.privacy_subject_requests` e `public.privacy_subject_request_events` estão classificados como fontes DPO excluídas do export self-service nesta fase. A existência do canal DPO e da fila administrativa não autoriza habilitar esse exportador.
