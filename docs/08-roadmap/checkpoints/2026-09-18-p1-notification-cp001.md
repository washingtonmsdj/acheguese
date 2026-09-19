# Checkpoint 2026-09-18 — P1 CP-001: autoridade de criação de notificações

## Objetivo

Fechar o finding arquitetural CP-001 sem ampliar privilégios: aposentar a API genérica de criação de notificações pelo browser e manter a materialização apenas em produtores server-owned.

## Evidência de uso

A busca do runtime não encontrou caller ativo de `NotificationService.createNotification`. Os fluxos cross-user já foram roteados para triggers, brokers confiáveis ou `private.notification_outbox`. O broker de Professional continua derivando destinatários no servidor e chama `create_notification` com `service_role`.

## Mudança aplicada

Migration remota e versionada:

`20260918115346_retire_browser_notification_creation_cp001`

Efeito:

- `anon`: sem `EXECUTE`;
- `authenticated`: `EXECUTE` revogado;
- `service_role`: `EXECUTE` preservado;
- corpo de `create_notification` não foi alterado;
- `NotificationService` deixa de expor `CreateNotificationInput` e `createNotification`;
- ownership global passa de `migration / CP-001` para `canonical / server-owned-notification-materializer`;
- ratchets passam a proibir reintrodução do comando genérico no browser.

## Verificação remota

Após a migration:

- `has_function_privilege('anon', ..., 'EXECUTE') = false`;
- `has_function_privilege('authenticated', ..., 'EXECUTE') = false`;
- `has_function_privilege('service_role', ..., 'EXECUTE') = true`;
- Supabase Security Advisor reduziu `authenticated_security_definer_function_executable` de 85 para 84;
- nenhum revoke em massa foi aplicado aos RPCs admin/safety já autorizados internamente.

## Limites

Este checkpoint não certifica o release global. GitHub Actions continua sujeito ao bloqueio externo de runners/orçamento; o PR deve permanecer sem merge até os gates executarem de fato. A mudança também não altera Mobilidade pública, pricing ou política comercial.

## Próximo alvo P1

Continuar a classificação dos warnings residuais por autoridade real. Priorizar superfícies que ainda sejam genéricas ou sem caller/guard comprovado; não revogar RPCs canônicos apenas para zerar o Advisor.
