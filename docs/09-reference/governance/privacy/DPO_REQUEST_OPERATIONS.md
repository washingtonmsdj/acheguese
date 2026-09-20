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

A paginação da `main` preserva o total real mesmo quando um `OFFSET` cai além da última linha: nesse caso o broker consulta apenas a primeira linha de metadados para recuperar `total_count`, sem reintroduzir identificadores diretos na lista.

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
- `admin-privacy-rpc` está implantada com `verify_jwt=true`, porém o runtime ainda está na versão 3 antiga.

A leitura direta do bundle remoto confirmou drift concreto: a versão 3 não contém o fallback de paginação presente na `main` (`if (items.length === 0 && page > 1)` com probe `p_limit: 1` / `p_offset: 0`). Portanto o runtime remoto não está sincronizado com o source atual mesmo que a função esteja `ACTIVE`.

## Deploy da Edge Function

O repositório possui `.github/workflows/supabase-admin-privacy-rpc-deploy.yml`, com deploy `main`-only a partir de checkout isolado no SHA exato, Supabase CLI fixada, verificação de `verify_jwt=true`, contratos de admin/MFA/auditoria, presença obrigatória do fallback de paginação e hashes do bundle. O workflow self-hosted é a autoridade definida para eliminar drift entre o source do Git e o runtime remoto.

A execução antiga `35091238772` foi cancelada pela política de concorrência depois que o ratchet do workflow foi atualizado. A execução corrente é `35094442109` e continuava `queued` na última checagem. Esse job precisa concluir com sucesso antes de declarar `admin-privacy-rpc` sincronizada com a `main`. Não deve ser feito deploy manual paralelo apenas para contornar indisponibilidade do runner.

## Escopo preservado

Nenhuma alteração desta rodada toca mobilidade, cadastro, SMTP, Resend ou confirmação de e-mail.

## Pendências separadas

A matriz `user-export-data` continua bloqueada até concluir sua certificação de completude LGPD. `public.privacy_subject_requests` e `public.privacy_subject_request_events` estão classificados como fontes DPO excluídas do export self-service nesta fase. A existência do canal DPO e da fila administrativa não autoriza habilitar esse exportador.


## Revalidação do corte MVP — 2026-09-20

- `submit-dpo-request` foi revalidada no projeto canônico como **ACTIVE v1**, `verify_jwt=false`, coerente com o intake público protegido pelo próprio código;
- o bundle remoto confirma origin allowlist, body limit, rate limit, honeypot e Turnstile com action/hostname; falha de configuração ou indisponibilidade do provider retorna erro e não insere pedido;
- o source canônico continua gravando somente via service role em `privacy_subject_requests`; o navegador usa exclusivamente a Edge Function;
- os ratchets DPO foram realinhados às identidades reais do ledger de migrations após a convergência 673/673;
- `.env.production` passou a declarar explicitamente `VITE_TURNSTILE_SITE_KEY=`, já exigida por `verify-deploy-ready` e `validate-turnstile-production-config`.

O `admin-privacy-rpc` remoto continua **ACTIVE v3** com `verify_jwt=true`. A comparação com a `main` confirma que o runtime ainda não contém o probe de paginação para página vazia (`items.length === 0 && page > 1`, `p_limit: 1`, `p_offset: 0`). Autenticação, MFA, ações e RPCs permanecem equivalentes no contrato observado.

**Classificação:** o intake público LGPD está funcionalmente protegido no runtime observado. O sync do `admin-privacy-rpc` continua pendente pela authority self-hosted existente; não fazer deploy manual paralelo apenas para contornar indisponibilidade do runner.
