# G — Canal DPO/LGPD com broker público seguro

Data: 2026-09-16

## Problema encontrado

A página `/dpo` chamava `PrivacyService.createDPORequest()`, que fazia `insert` direto em `dpo_requests`. Essa tabela não existe mais no projeto Supabase canônico, portanto o formulário podia terminar em erro mesmo sendo apresentado como canal formal de privacidade.

A migration histórica de `dpo_requests` também não deve ser simplesmente restaurada: ela autorizava escrita direta do navegador e continha contrato administrativo/PII antigo.

## Correção

- nova tabela canônica `public.privacy_subject_requests`;
- navegador sem `SELECT/INSERT/UPDATE/DELETE` direto na tabela;
- `service_role` é o único writer do ledger;
- nova Edge Function pública `submit-dpo-request` com payload estrito, limite de corpo, origem permitida, rate limit, honeypot e Turnstile server-side;
- `user_id` não vem do payload: quando há sessão real, o broker o deriva validando o bearer token no Supabase Auth; pedidos públicos permanecem com `user_id = null`;
- `PrivacyService` deixou de tocar tabela diretamente e usa exclusivamente o broker;
- `/dpo` passou a exigir Turnstile em produção e continua exibindo e-mail do DPO como fallback;
- removida a promessa genérica de “15 dias úteis”. A página agora explica que o prazo depende do direito exercido e que confirmação/acesso possuem o contrato específico do art. 19;
- criada a autoridade administrativa `admin-privacy-rpc`, protegida por JWT, admin + MFA, rate limit, auditoria específica e RPCs `service_role` only;
- criada a fila `/admin/privacidade`, cuja listagem usa somente metadados de triagem e carrega nome, e-mail, assunto e mensagem apenas no detalhe individual;
- o detalhe sensível é removido do cache do frontend ao fechar a análise.

## Segurança

`submit-dpo-request` é deliberadamente `verify_jwt=false` porque o canal precisa aceitar titulares não autenticados. Por isso ele está explicitamente classificado em `EDGE_FUNCTION_AUTH_POLICY.json` e deve conservar Turnstile, rate limit, validação estrita e `service_role` apenas dentro do broker.

O broker administrativo `admin-privacy-rpc` permanece `verify_jwt=true`, exige `requireAdmin` e reaplica a autoridade administrativa no banco por `private.is_admin(actor_user_id)`. A listagem administrativa não contém identificadores diretos nem o corpo do pedido.

## Matriz de exportação

`public.privacy_subject_requests` já está classificada em `LGPD_EXPORT_MATRIX.json` como `dpo_requests`, porém com `scope: "excluded"` nesta versão.

Essa exclusão é intencional e fail-closed: pedidos públicos podem ter `user_id = NULL`, então `requester_email` não pode ser usado para inferir ownership no export self-service. Uma inclusão futura exige query explícita limitada a `user_id = authenticated_subject_id`, campos aprovados e testes próprios. Pedidos públicos não vinculados continuam no fluxo controlado do DPO.

`LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE=false`, `PRIVACY_DATA_EXPORT_RELEASE_CERTIFIED=false` e a feature flag de produção permanecem inalteradas. Este checkpoint não autoriza deploy de `user-export-data`.

## Escopo preservado

Esta rodada não altera mobilidade e não altera cadastro, SMTP, Resend ou confirmação de e-mail.

## Próximo passo LGPD

O canal DPO e a classificação do ledger estão fechados em source/DB. A exportação self-service continua como trabalho separado: somente depois de completar e validar toda a matriz em ambiente não-prod poderá existir uma revisão específica para certificação e rollout de `user-export-data`.
