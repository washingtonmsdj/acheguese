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
- removida a promessa genérica de “15 dias úteis”. A página agora explica que o prazo depende do direito exercido e que confirmação/acesso possuem o contrato específico do art. 19.

## Segurança

`submit-dpo-request` é deliberadamente `verify_jwt=false` porque o canal precisa aceitar titulares não autenticados. Por isso ele está explicitamente classificado em `EDGE_FUNCTION_AUTH_POLICY.json` e deve conservar Turnstile, rate limit, validação estrita e `service_role` apenas dentro do broker.

## Escopo preservado

Esta rodada não altera mobilidade e não altera cadastro, SMTP, Resend ou confirmação de e-mail.

## Próximo passo LGPD

A matriz de exportação continua não certificada. `privacy_subject_requests` precisa ser classificada na próxima reconciliação da `LGPD_EXPORT_MATRIX` antes de qualquer liberação de `user-export-data`.
