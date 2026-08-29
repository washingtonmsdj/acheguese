# Core Messaging

**Status:** G4 SSOT SOURCE EM FECHAMENTO — NAO MVP CERTIFICADO  
**Data do checkpoint:** 2026-08-29

`src/core/messaging` e o boundary horizontal de contratos e services de mensagens. Ele **nao** representa uma tabela generica unica e nao deve ganhar um `MessagingService` monolitico.

## Agregados canonicos

### Classified Messaging

Owner: `src/core/messaging/services/ClassifiedMessagingService.ts`

Persistencia principal:

- `public.conversations`;
- `public.messages`.

Mutacoes de conversa/mensagem passam pelos RPCs server-owned (`create_classified_conversation`, `send_classified_message`, `mark_classified_messages_read`, `block_classified_conversation`, `moderate_classified_conversation`). O service mantem apenas read models autorizados e a fachada de dominio.

### Community Direct Messaging

Owner: `src/core/messaging/services/CommunityDirectMessagingService.ts`

Persistencia principal:

- `public.community_direct_threads`;
- `public.community_direct_thread_participants`;
- `public.community_direct_messages`;
- `public.community_direct_message_reports`.

O agregado e intencionalmente separado de Classified, Ride e Group chat. Criacao, envio, leitura, bloqueio e report passam pelos RPCs canonicos do dominio.

## Contratos compartilhados

`src/core/messaging/contracts.ts` define portas de inbox/thread/paginacao reutilizadas pelos agregados. Esses contratos nao criam um owner de persistencia paralelo.

## Realtime

Toda abertura de canal Supabase pertence a `src/core/realtime/services/RealtimeService.ts`. Services de Messaging apenas delegam subscriptions ao owner de Realtime.

A migration `20260829185634_align_messaging_notification_realtime_publication.sql` garante no schema alvo a publication dos streams usados por Classified (`public.messages`) e Notifications (`public.notifications`). Community Direct ja usa `public.community_direct_messages` na mesma publication.

## Notifications

Side effects de notificacao gerados por Messaging usam a autoridade de Notifications/outbox. Messaging nao deve inserir em `public.notifications` diretamente nem criar um segundo sistema de delivery.

## UI

Messaging/Chat permanece launch-paused no composition root. As antigas `pages`, `components` e `hooks` dentro de `src/core/messaging` foram aposentadas porque estavam sem caller runtime e violavam a taxonomia `core = dominio / modules = UI`.

Quando a UI for retomada em G6, ela deve nascer em `src/modules/messaging` e consumir apenas as facades publicas de `@/core/messaging`.

## Ratchets

- `tests/architecture/classified-messaging-ssot.test.ts` protege o owner Classified e proibe UI dentro de `core/messaging`;
- `tests/architecture/community-direct-messaging-ssot.test.ts` protege o agregado Community Direct;
- `tests/architecture/realtime-ssot.test.ts` proibe `.channel()` fora do owner de Realtime e exige os streams publicados;
- `tests/architecture/notification-inbox-authority.test.ts` impede Messaging/qualquer runtime browser de criar ou hard-delete notificacoes diretamente.

## O que G4 nao certifica

Este fechamento arquitetural nao certifica ainda:

- UX final de inbox/chat, atualmente pausada;
- E2E real de envio/recebimento/reconnect;
- volume, ordering, retry e offline behavior sob carga;
- auditoria exaustiva de migrations/RLS/grants/legados de todos os chats;
- same-SHA lint/typecheck/test/build/deploy/smoke.

Essas provas continuam em G5/G6/G7.
