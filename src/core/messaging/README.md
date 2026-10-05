# Core Messaging

**Status:** CAPABILITY HORIZONTAL ATIVA NO MVP  
**Atualizado:** 2026-10-05

`src/core/messaging` é o boundary horizontal de contratos, services, rotas e providers de mensagens. A capability pertence à plataforma Achegue-se, não a Business, Community, Classificados ou qualquer outra vertical.

A Inbox global pertence à capability `messaging`. Cada domínio preserva seu próprio agregado e pode participar da Inbox por provider/adaptor explícito somente quando o domínio correspondente estiver ativo. No corte atual, `messaging=true`; a Inbox permanece ativa mesmo se um provider de domínio for pausado.

## Agregados canônicos

### Business Direct Messaging — provider ativo enquanto Business estiver ativo

Owner:

- `src/core/messaging/services/BusinessDirectMessagingService.ts`;
- `src/core/messaging/providers/BusinessMessagingProvider.ts`.

Persistência:

- `public.business_direct_threads`;
- `public.business_direct_thread_participants`;
- `public.business_direct_messages`;
- `public.business_direct_message_reports`;
- audit metadata-only em `private.business_direct_message_audit_log`.

Regras:

- browser autenticado possui leitura via RLS, sem INSERT/UPDATE/DELETE direto;
- mutações são server-owned por RPC `SECURITY DEFINER`;
- identidade/autorização derivam do usuário e Profile ativo;
- a mesma empresa/cliente reutiliza a thread existente;
- mensagens privadas não entram em telemetry/audit textual;
- pausar Business remove somente esse provider; não pausa `messaging` nem a Inbox.

### Classified Messaging — preservado, provider pausado

Owner: `src/core/messaging/services/ClassifiedMessagingService.ts`.

O agregado continua versionado, mas não participa da Inbox enquanto `classifieds` estiver pausado.

### Community Direct Messaging — preservado, provider pausado

Owner: `src/core/messaging/services/CommunityDirectMessagingService.ts`.

A UI específica de Community Direct não é a Inbox global. Enquanto Community estiver pausada, esse provider não participa da composição ativa; Messaging continua disponível.

### Mobility chat

Chat de corrida/entrega mantém semântica e lifecycle próprios de Mobilidade. Compartilhar a ideia de “mensagem” não transfere ownership da Inbox horizontal.

## Contratos compartilhados

`src/core/messaging/contracts.ts` e `inboxTypes.ts` definem portas de Inbox/thread/paginação. O registry de providers está em `src/core/messaging/providers/messagingProviderRegistry.ts`; a camada `app` seleciona somente providers cujos domínios estejam ativos.

## UI e rotas

A UI horizontal fica em `src/modules/messaging`.

Rotas canônicas ativas:

- `/mensagens`;
- `/mensagens/:providerId/:threadId`;
- thread Business: `/mensagens/business/:threadId`.

`AppLayoutRoutes.tsx` deriva a montagem de `isPlatformCapabilityEnabled("messaging")`; nenhuma vertical controla a existência dessas rotas.

## Realtime e Notifications

Toda abertura de canal Supabase pertence a `src/core/realtime/services/RealtimeService.ts`. Messaging delega subscriptions ao owner de Realtime.

Side effects de notificações usam a autoridade de Notifications/outbox. Messaging não cria uma segunda infraestrutura de delivery nem escreve `public.notifications` diretamente. Messaging e Notifications são capabilities horizontais distintas e ativas.

## Segurança

Business Direct Messaging preserva RLS, grants browser read-only, mutações RPC server-owned, bloqueio/report e audit privado sem conteúdo textual de mensagem.

## Guardrails

- `tests/architecture/business-messaging-mvp.test.ts`;
- `tests/architecture/classified-messaging-ssot.test.ts`;
- `tests/architecture/community-direct-messaging-ssot.test.ts`;
- `tests/architecture/realtime-ssot.test.ts`;
- `tests/architecture/notification-inbox-authority.test.ts`;
- `tests/architecture/messaging-notifications-registry.test.ts`;
- `src/core/messaging/services/BusinessDirectMessagingService.test.ts`.

## Evolução

Novo provider entra na Inbox quando seu domínio estiver ativo, o agregado possuir autorização/RLS/comandos próprios, o provider implementar os contratos horizontais e o composition root autorizá-lo explicitamente. **Ativar ou pausar um provider nunca altera o lifecycle da capability Messaging.**

Não criar tabela universal, redirect, rota paralela ou bridge temporário para acelerar integração.
