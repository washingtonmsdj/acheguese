# Core Notifications

**Status:** CAPABILITY HORIZONTAL ATIVA NO MVP  
**Atualizado:** 2026-10-05

Ownership canônico da caixa de entrada, preferências e entrega de notificações. Notifications pertence à plataforma Achegue-se e não pertence a Business, Messaging ou qualquer vertical. Verticais apenas produzem eventos autorizados; seu lifecycle não controla `notifications`.

No corte atual, `notifications=true`. As rotas canônicas `/notificacoes` e `/conta/notificacoes` estão no grafo ativo autenticado. Rotas legadas `/notifications` e `/settings/notifications` permanecem retiradas sem redirect.

## SSOT

- Inbox, leitura e estado do usuário: `public.notifications` + `NotificationService`.
- Preferências: `public.notification_preferences` + `NotificationPreferencesService`; leitura e patch passam pelos RPCs `get_current_notification_preferences` e `patch_current_notification_preferences`.
- Comando cross-user, retry e DLQ: `private.notification_outbox`, `private.enqueue_notification` e `private.process_notification_outbox`.
- Schema executável do comando: migration `20260714113000_create_notification_outbox_core.sql`.
- Hook oficial de leitura: `useUnifiedNotifications`.
- Tipos públicos da Inbox: `types.ts`.

`NotificationCommand` é server-owned: destinatário derivado pelo domínio, evento e agregado identificados, texto sem HTML, metadata JSON limitada, URL interna segura ou HTTPS e chave idempotente. Não existe API genérica desse comando para o browser.

## Lifecycle da UI

Enquanto `notifications=true`:

- `AppLayoutRoutes.tsx` monta `/notificacoes` e `/conta/notificacoes` sob autenticação;
- topbar/shell podem expor a capability pelo lifecycle canônico;
- registros históricos continuam pertencendo à Inbox;
- `notificationActionScope.ts` permite destinos de owners ativos;
- ação que aponta para owner pausado/retirado cai de forma segura em `/notificacoes`, sem reativar a vertical;
- pausar uma vertical não pausa a Inbox nem as preferências.

## Autoridade da Inbox

A criação genérica de notificação pelo browser permanece aposentada. `create_notification` é materializador privilegiado server-owned; authenticated não possui INSERT genérico nem hard DELETE direto em `public.notifications`. Cross-user permanece reservado a producers server-side/outbox.

## Produtores

A presença de um producer não ativa seu domínio. Somente eventos de owners autorizados pelo lifecycle podem produzir ações navegáveis. Producers preservados de Community, Work Opportunities, Vagas, Mobility, Orders, Business Claims, Safety e outros continuam fail-closed quando seus domínios estão pausados.

Business pode produzir notificações enquanto ativo, mas **Business não é dependência da capability Notifications**.

## Realtime

Toda abertura de canal pertence a `src/core/realtime/services/RealtimeService.ts`. `NotificationService` apenas delega subscription ao owner de Realtime. `public.notifications` permanece na publication `supabase_realtime` conforme migration versionada.

## Operação

- outbox: `pending`, `processing`, `delivered`, `suppressed`, `dead_letter`;
- dispatcher com lock, backoff e tentativas limitadas;
- health/requeue/prune reservados a `service_role`;
- preferências desabilitadas geram `suppressed`, não retry falso;
- rollback operacional não reintroduz dual write no browser.

## Regras

- não criar wrapper que reimplemente persistência de Notifications;
- não acessar `supabase.from('notifications')` diretamente em UI;
- criação usa trigger, Edge confiável ou outbox;
- Mensagens e Notificações possuem owners, rotas e lifecycle distintos;
- pausar qualquer vertical remove somente eventos/ações daquela vertical, nunca a capability horizontal.

## Ratchets

- `tests/architecture/notification-inbox-authority.test.ts`;
- `tests/architecture/canonical-route-no-redirects.test.ts`;
- `tests/architecture/messaging-notifications-registry.test.ts`;
- `tests/architecture/realtime-ssot.test.ts`;
- `tools/architecture/architecture-registry.ts`.

## Pós-MVP

Continuam fora do corte: certificação ampla de delivery push/email por todos os providers, escala/SLO e producers pertencentes a domínios pausados. Isso não altera a disponibilidade da Inbox/Preferências já ativas.
