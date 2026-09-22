# Core Messaging

**Status:** ATIVO NO MVP — boundary horizontal com provider Business  
**Atualizado:** 2026-09-21

`src/core/messaging` é o boundary horizontal de contratos, services e providers
de mensagens. Ele **não** representa uma tabela genérica única e não deve ganhar
um `MessagingService` monolítico.

A Inbox global pertence à capability `messaging`; cada domínio preserva seu
próprio agregado e participa da Inbox por provider/adaptor explícito.

## Agregados canônicos

### Business Direct Messaging — ativo no MVP

Owner:

- `src/core/messaging/services/BusinessDirectMessagingService.ts`;
- `src/core/messaging/providers/BusinessMessagingProvider.ts`.

Persistência:

- `public.business_direct_threads`;
- `public.business_direct_thread_participants`;
- `public.business_direct_messages`;
- `public.business_direct_message_reports`;
- audit metadata-only em `private.business_direct_message_audit_log`.

Comandos/read models públicos:

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
- `business_direct_messages` participa da publication `supabase_realtime`.

### Classified Messaging — preservado, provider pausado

Owner: `src/core/messaging/services/ClassifiedMessagingService.ts`.

Persistência principal:

- `public.conversations`;
- `public.messages`.

O agregado continua válido, mas não é registrado na Inbox enquanto
`classifieds` estiver pausado.

### Community Direct Messaging — preservado, provider pausado

Owner: `src/core/messaging/services/CommunityDirectMessagingService.ts`.

Persistência principal:

- `public.community_direct_threads`;
- `public.community_direct_thread_participants`;
- `public.community_direct_messages`;
- `public.community_direct_message_reports`.

A UI específica de Community Direct não é a Inbox global. Enquanto Community
estiver pausada, esse agregado não participa da composição ativa.

### Mobility chat

Chat de corrida/entrega mantém semântica e lifecycle próprios de Mobilidade.
Compartilhar a ideia de “mensagem” não obriga usar o agregado privado genérico.

## Contratos compartilhados

`src/core/messaging/contracts.ts` e `inboxTypes.ts` definem portas de
Inbox/thread/paginação. Esses contratos permitem composição sem transformar
Messaging em owner dos dados de cada domínio.

O registry de providers está em
`src/core/messaging/providers/messagingProviderRegistry.ts`.

No MVP, **somente Business** é registrado.

## UI

A UI horizontal fica em `src/modules/messaging`.

Rotas ativas:

- `/mensagens`;
- `/mensagens/:providerId/:threadId`;
- thread Business canônica: `/mensagens/business/:threadId`.

A página recebe providers registrados pelo composition root. Ela não importa
Community/Classificados diretamente e não inventa conversas de módulos pausados.

## Realtime

Toda abertura de canal Supabase pertence a
`src/core/realtime/services/RealtimeService.ts`. Services de Messaging apenas
delegam subscriptions ao owner de Realtime.

Streams ativos de Business usam `public.business_direct_messages`.

## Notifications

Side effects de notificações usam a autoridade de Notifications/outbox.
Messaging não cria uma segunda infraestrutura de delivery nem escreve
`public.notifications` diretamente.

## Segurança

Business Direct Messaging possui:

- RLS habilitado em todas as tabelas públicas do agregado;
- grants browser read-only;
- RPCs operacionais executáveis por `authenticated` e `service_role`;
- nenhuma mutação direta concedida a `anon`/`authenticated`;
- bloqueio, report e fechamento modelados como comandos do agregado;
- audit privado sem conteúdo textual de mensagem.

## Guardrails

- `tests/architecture/business-messaging-mvp.test.ts`;
- `tests/architecture/classified-messaging-ssot.test.ts`;
- `tests/architecture/community-direct-messaging-ssot.test.ts`;
- `tests/architecture/realtime-ssot.test.ts`;
- `tests/architecture/notification-inbox-authority.test.ts`;
- `src/core/messaging/services/BusinessDirectMessagingService.test.ts`;
- `tests/e2e/messaging-authenticated.spec.ts`.

## Evolução

Novo provider só entra na Inbox quando:

1. o domínio estiver ativo;
2. o agregado possuir autorização/RLS/comandos próprios;
3. o provider implementar os contratos horizontais;
4. o composition root registrar explicitamente o provider;
5. testes de isolamento provarem que nenhum domínio pausado foi reativado.

Não criar tabela universal ou bridge temporário para acelerar essa integração.
