# G — Canal DPO/LGPD com broker público seguro

Data: 2026-09-16

## Problema encontrado

A página `/dpo` chamava `PrivacyService.createDPORequest()`, que fazia `insert` direto em `dpo_requests`. Essa tabela não existe mais no projeto Supabase canônico, portanto o formulário podia terminar em erro mesmo sendo apresentado como canal formal de privacidade.

A migration histórica de `dpo_requests` também não deve ser simplesmente restaurada: ela autorizava escrita direta do navegador e continha contrato administrativo/PII antigo.

## Correção

- nova tabela canônica `public.privacy_subject_requests`;
- navegador sem acesso direto à tabela;
- `service_role` reduzido a `INSERT` direto no ledger e sem `SELECT`, `UPDATE`, `DELETE`, `TRUNCATE`, `TRIGGER` ou `REFERENCES`;
- nova Edge Function pública `submit-dpo-request` com payload estrito, limite de corpo, origem permitida, rate limit, honeypot e Turnstile server-side;
- `user_id` não vem do payload: quando há sessão real, o broker o deriva validando o bearer token no Supabase Auth; pedidos públicos permanecem com `user_id = null`;
- `PrivacyService` deixou de tocar tabela diretamente e usa exclusivamente o broker;
- `/dpo` passou a exigir Turnstile em produção e continua exibindo e-mail do DPO como fallback;
- removida a promessa genérica de “15 dias úteis”. A página agora explica que o prazo depende do direito exercido e que confirmação/acesso possuem o contrato específico do art. 19;
- criada a autoridade administrativa `admin-privacy-rpc`, protegida por JWT, admin + MFA, rate limit, auditoria específica e RPCs `service_role` only;
- criada a fila `/admin/privacidade`, cuja listagem usa somente metadados de triagem e carrega nome, e-mail, assunto e mensagem apenas no detalhe individual;
- o detalhe sensível é removido do cache do frontend ao fechar a análise;
- criada `privacy_subject_request_events` como histórico transacional de submissão e mudança de estado;
- cada transição grava o evento na mesma transação do update do pedido;
- o histórico apresentado ao painel não inclui `actor_user_id`, preservando esse identificador apenas para auditoria interna;
- as duas tabelas DPO usam RLS + FORCE RLS e policies explícitas de default-deny;
- todos os FKs do domínio DPO estão cobertos por índice líder.

## Segurança

`submit-dpo-request` é deliberadamente `verify_jwt=false` porque o canal precisa aceitar titulares não autenticados. Por isso ele está explicitamente classificado em `EDGE_FUNCTION_AUTH_POLICY.json` e deve conservar Turnstile, rate limit, validação estrita e `service_role` apenas dentro do broker.

O broker administrativo `admin-privacy-rpc` permanece `verify_jwt=true`, exige `requireAdmin` e reaplica a autoridade administrativa no banco por `private.is_admin(actor_user_id)`. A listagem administrativa não contém identificadores diretos nem o corpo do pedido.

As tabelas `privacy_subject_requests` e `privacy_subject_request_events` possuem policy `FOR ALL TO PUBLIC USING (false) WITH CHECK (false)`, além dos grants minimizados. No estado remoto verificado, `anon` e `authenticated` não possuem grants diretos nas duas tabelas, `service_role` possui somente `INSERT` em `privacy_subject_requests` e nenhum grant direto em `privacy_subject_request_events`.

As três RPCs administrativas são `SECURITY DEFINER`, não podem ser executadas por `anon` nem `authenticated` e continuam executáveis por `service_role`.

## Histórico e performance do domínio

Os FKs verificados remotamente são:

- `privacy_subject_requests.user_id -> auth.users(id)` — coberto por `privacy_subject_requests_user_submitted_idx`;
- `privacy_subject_request_events.request_id -> privacy_subject_requests(id)` — coberto por `privacy_subject_request_events_request_time_idx`;
- `privacy_subject_request_events.actor_user_id -> auth.users(id)` — coberto por `privacy_subject_request_events_actor_user_idx`.

O ledger e o histórico estavam ambos com `0` linhas na última validação. Por isso avisos de `unused_index` para índices recém-criados não justificam remoção nesta fase.

## Matriz de exportação

`public.privacy_subject_requests` e `public.privacy_subject_request_events` estão classificadas em `LGPD_EXPORT_MATRIX.json` dentro da fonte lógica `dpo_requests`, porém com `scope: "excluded"` nesta versão.

Essa exclusão é intencional e fail-closed: pedidos públicos podem ter `user_id = NULL`, então `requester_email` não pode ser usado para inferir ownership no export self-service. Uma inclusão futura exige query explícita limitada a `user_id = authenticated_subject_id`, campos aprovados e testes próprios. Pedidos públicos não vinculados continuam no fluxo controlado do DPO.

`LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE=false`, `PRIVACY_DATA_EXPORT_RELEASE_CERTIFIED=false` e a feature flag de produção permanecem inalteradas. Este checkpoint não autoriza deploy de `user-export-data`.

## Deploy exact-main

O workflow `.github/workflows/supabase-admin-privacy-rpc-deploy.yml` faz checkout isolado do SHA exato, fixa a Supabase CLI, valida `verify_jwt=true`, os contratos admin/MFA/auditoria, exige o fallback de paginação e registra os hashes do bundle antes do deploy.

A leitura do runtime remoto confirmou que `admin-privacy-rpc` está em versão 3 e ainda não contém a correção de paginação já presente na `main`: quando `items.length === 0 && page > 1`, o source atual faz um probe com `p_limit: 1` e `p_offset: 0` para preservar `total_count`; a versão remota não faz esse probe.

A execução antiga `35091238772` foi cancelada automaticamente pela política `cancel-in-progress` após o workflow ganhar o ratchet específico de paginação. A execução corrente é `35094442109` e continuava `queued` na última checagem.

Portanto existe drift confirmado entre Git e runtime. A função não deve ser considerada sincronizada com `main` até a execução corrente — ou outra execução exact-main posterior equivalente — concluir com sucesso. O deploy manual pelo conector não deve substituir essa autoridade apenas para contornar indisponibilidade do runner.

## Escopo preservado

Esta rodada não altera mobilidade e não altera cadastro, SMTP, Resend ou confirmação de e-mail.

## Próximo passo LGPD

O canal DPO, sua fila administrativa, o histórico transacional, os grants mínimos e a classificação da matriz estão fechados em source/DB. Restam dois gates separados: concluir o deploy exact-main da Edge Function quando o runner estiver disponível e, em trabalho independente, certificar a completude da matriz antes de qualquer rollout de `user-export-data`.
