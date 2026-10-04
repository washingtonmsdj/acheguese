# Core Messaging

**Status:** CAPABILITY HORIZONTAL PRESERVADA E PAUSADA NO MVP  
**Atualizado:** 2026-10-04

`src/core/messaging` é o boundary horizontal de contratos, services, rotas e providers de mensagens. Ele não representa uma tabela genérica única e não deve ganhar um `MessagingService` monolítico.

A Inbox global pertence à capability `messaging`; cada domínio preserva seu próprio agregado e participa da Inbox por provider/adaptor explícito quando a capability e o domínio correspondente estiverem ativos. No corte atual, `messaging=false`, portanto nenhum provider é montado no grafo público ativo.

## Agregados canônicos

### Business Direct Messaging — preservado, provider pausado

Owner:

- `src/core/messaging/services/BusinessDirectMessagingService.ts`;
- `src/core/messaging/providers/BusinessMessagingProvider.ts`.

Persistência:

- `public.business_direct_threads`;
- `public.business_direct_thread_participants`;
- `public.business_direct_messages`;
- `public.business_direct_message_reports`;
- audit metadata-only em `private.business_direct_message_audit_log`.

Comandos/read models preservados:

- `create_business_direct_thread`;
- `list_business_direct_thread_previews`;
- `list_business_direct_messages`;
- `send_business_direct_message`;
- `mark_business_direct_thread_read`;
- `set_business_direct_thread_blocked`;
- `report_business_direct_thread`.

Regras:

- browser autenticado possui leitura via RLS, sem INSERT/UPDATE/DELETE direto;
- mutações são server-owned por RPC `SECURITY DEFINER`;
- identidade/autorização derivam do usuário e Profile ativo;
- a mesma empresa/cliente reutiliza a thread existente;
- mensagens privadas não entram em telemetry/audit textual;
- a persistência permanece preparada para Realtime, mas nenhuma Inbox pública é montada enquanto `messaging=false`.

### Classified Messaging — preservado, provider pausado

Owner: `src/core/messaging/services/ClassifiedMessagingService.ts`.

Persistência principal:

- `public.conversations`;
- `public.messages`.

O agregado continua válido, mas não participa da Inbox enquanto `classifieds` ou `messaging` estiverem pausados.

### Community Direct Messaging — preservado, provider pausado

Owner: `src/core/messaging/services/CommunityDirectMessagingService.ts`.

Persistência principal:

- `public.community_direct_threads`;
- `public.community_direct_thread_participants`;
- `public.community_direct_messages`;
- `public.community_direct_message_reports`.

A UI específica de Community Direct não é a Inbox global. Enquanto Community ou Messaging estiverem pausados, esse agregado não participa da composição ativa.

### Mobility chat

Chat de corrida/entrega mantém semântica e lifecycle próprios de Mobilidade. Compartilhar a ideia de “mensagem” não obriga usar o agregado privado genérico nem reativar a Inbox horizontal.

## Contratos compartilhados

`src/core/messaging/contracts.ts` e `inboxTypes.ts` definem portas de Inbox/thread/paginação. Esses contratos permitem composição sem transformar Messaging em owner dos dados de cada domínio.

O registry de providers está em `src/core/messaging/providers/messagingProviderRegistry.ts`. O registry preserva providers implementados; a camada `app` decide quais podem participar do runtime pelo lifecycle. Com `messaging=false`, a composição ativa é vazia.

## UI e rotas

A UI horizontal preservada fica em `src/modules/messaging`.

Rotas canônicas versionadas para futura reativação:

- `/mensagens`;
- `/mensagens/:providerId/:threadId`;
- thread Business: `/mensagens/business/:threadId`.

Essas rotas **não pertencem ao grafo ativo do MVP** enquanto `messaging=false`. `AppLayoutRoutes.tsx` e `activeLazyImports.ts` não devem importar ou montar a Inbox. Código de rota preservado é contrato de reativação, não autorização de navegação.

## Realtime

Toda abertura de canal Supabase pertence a `src/core/realtime/services/RealtimeService.ts`. Services de Messaging apenas delegam subscriptions ao owner de Realtime. O contrato de stream de Business permanece versionado para futura ativação.

## Notifications

Side effects de notificações usam a autoridade de Notifications/outbox. Messaging não cria uma segunda infraestrutura de delivery nem escreve `public.notifications` diretamente. Messaging e Notifications são capabilities horizontais distintas no registry arquitetural e no lifecycle.

## Segurança

Business Direct Messaging preserva:

- RLS habilitado em todas as tabelas públicas do agregado;
- grants browser read-only;
- RPCs operacionais executáveis por `authenticated` e `service_role`;
- nenhuma mutação direta concedida a `anon`/`authenticated`;
- bloqueio, report e fechamento modelados como comandos do agregado;
- audit privado sem conteúdo textual de mensagem.

A existência desses contratos não reativa a capability. Reativação exige lifecycle explícito, rota certificada, composição de providers e E2E same-SHA.

## Guardrails

- `tests/architecture/business-messaging-mvp.test.ts`;
- `tests/architecture/classified-messaging-ssot.test.ts`;
- `tests/architecture/community-direct-messaging-ssot.test.ts`;
- `tests/architecture/realtime-ssot.test.ts`;
- `tests/architecture/notification-inbox-authority.test.ts`;
- `tests/architecture/messaging-notifications-registry.test.ts`;
- `src/core/messaging/services/BusinessDirectMessagingService.test.ts`;
- `tests/e2e/messaging-authenticated.spec.ts` (preservado para a certificação da futura reativação).

## Evolução

Novo provider só entra na Inbox quando:

1. a capability `messaging` estiver ativa;
2. o domínio estiver ativo;
3. o agregado possuir autorização/RLS/comandos próprios;
4. o provider implementar os contratos horizontais;
5. o composition root registrar e autorizar explicitamente o provider;
6. testes de isolamento provarem que nenhum domínio pausado foi reativado;
7. rota, build e E2E same-SHA estiverem certificados.

Não criar tabela universal, redirect, rota paralela ou bridge temporário para acelerar essa integração.
