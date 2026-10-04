# Core Notifications

**Status:** CAPABILITY HORIZONTAL PRESERVADA; INBOX/UI PAUSADA NO MVP  
**Atualizado:** 2026-10-04

Ownership canônico da caixa de entrada, preferências e entrega de notificações. Notifications pertence à plataforma e é independente de Messaging: verticais ativos ou pausados apenas produzem eventos autorizados; não controlam o lifecycle da capability.

No corte atual, `notifications=false`. Portanto `/notificacoes` e `/conta/notificacoes` permanecem rotas canônicas versionadas, mas ficam fora do grafo ativo. O backend de autoridade, preferências, materialização e outbox permanece preservado e server-owned; manter essa infraestrutura não reativa a Inbox pública.

## SSOT

- Inbox, leitura e estado do usuário: `public.notifications` + `NotificationService`.
- Preferências: `public.notification_preferences` + `NotificationPreferencesService`; leitura e patch passam pelos RPCs `get_current_notification_preferences` e `patch_current_notification_preferences`.
- Comando cross-user, retry e DLQ: `private.notification_outbox`, `private.enqueue_notification` e `private.process_notification_outbox`.
- Schema executável do comando: migration `20260714113000_create_notification_outbox_core.sql`.
- Hook oficial de leitura preservado: `useUnifiedNotifications`.
- Tipos públicos da inbox: `types.ts`.

`NotificationCommand` é um contrato server-owned: destinatário derivado pelo domínio, evento e agregado identificados, texto sem HTML, metadata JSON limitada a 32 KiB, URL interna segura ou HTTPS, chave idempotente e no máximo dez tentativas. Não existe API genérica desse comando para o browser.

## Lifecycle da UI

Enquanto `notifications=false`:

- `AppLayoutRoutes.tsx` não monta `/notificacoes` nem `/conta/notificacoes`;
- rotas legadas `/notifications` e `/settings/notifications` continuam retiradas;
- shell, sidebar, topbar e módulos ativos não devem expor CTA de Inbox/Preferências;
- registros históricos podem permanecer armazenados;
- `notificationActionScope.ts` não expõe CTA interno para owner pausado, rota retirada ou Inbox pausada;
- não existe fallback para `/notificacoes` ou qualquer rota 404.

Reativação exige mudança explícita no `platformCapabilityRegistry`, rotas certificadas, autorização, testes e prova same-SHA. Redirect ou fallback não é mecanismo de lifecycle.

## Autoridade da inbox

A criação genérica de notificação pelo browser foi aposentada. A migration `20260918115346_retire_browser_notification_creation_cp001.sql` revoga `EXECUTE` de `authenticated` em `create_notification`; somente `service_role` preserva esse materializador para brokers confiáveis.

A migration `20260829185546_harden_notification_inbox_write_authority.sql` já havia fechado o bypass de tabela; o corte CP-001 completa a fronteira:

- `create_notification` permanece como materializador privilegiado server-owned, sem API genérica de browser;
- authenticated não possui INSERT direto em `public.notifications`;
- authenticated não possui hard DELETE direto;
- o usuário conserva somente as operações de estado previstas pelo contrato e RLS quando a Inbox for consumida por uma superfície autorizada;
- cross-user continua reservado a produtores server-side/outbox.

## Produtores

Os producers abaixo permanecem como contratos server-side/versionados. A presença do producer não ativa a UI de Notifications nem o módulo de origem:

- Community materializa pelo helper Core quando seu fluxo estiver autorizado;
- Community Direct Messaging enfileira notificação pelo helper server-side depois do comando autorizado;
- Work Opportunities, Vagas, Trust, Mobility, Orders, Business Claims e Safety possuem integrações server-owned preservadas;
- Professional Leads conserva o broker autenticado `professional-notifications-rpc`, que deriva participantes no servidor;
- Safety deriva o destinatário de `profiles.user_id` e mantém autorização/auditoria server-side.

Domínios pausados continuam fail-closed no runtime público independentemente da existência desses contratos de backend.

## Realtime

Toda abertura de canal pertence a `src/core/realtime/services/RealtimeService.ts`. `NotificationService` apenas delega subscription ao owner de Realtime.

A migration `20260829185634_align_messaging_notification_realtime_publication.sql` preserva `public.notifications` na publication `supabase_realtime`. Isso mantém a infraestrutura pronta, mas nenhuma subscription pública deve ser montada apenas por essa existência enquanto `notifications=false`.

## Operação

- Estados da outbox: `pending`, `processing`, `delivered`, `suppressed` e `dead_letter`.
- O dispatcher usa `FOR UPDATE SKIP LOCKED`, backoff exponencial limitado a 15 minutos e cinco tentativas por padrão.
- `private.notification_outbox_health()` fornece backlog e item pendente mais antigo; `private.requeue_notification_dead_letter(id)` reprocessa um item.
- Somente `service_role` executa enqueue, dispatcher, health, requeue e prune.
- `pg_cron` pode drenar a outbox como infraestrutura server-side. Isso não constitui evidência de capacidade de escala nem ativa UI pública.
- Rollback operacional: desabilitar os triggers/producers afetados e o job de dispatch, preservar a outbox para auditoria e reativar somente após corrigir a causa. Não reintroduzir dual write no navegador.
- Probe de desenvolvimento remoto: `tests/security/notification-outbox-remote-probe.sql`. Ele valida entrega, deduplicação, preferências, retry, DLQ, requeue e health dentro de uma única transação encerrada por `ROLLBACK`. Não executar implicitamente contra produção.

## Regras

- não criar wrappers em `modules/notifications` que reimplementem persistência;
- não acessar `supabase.from('notifications')` em UI (`.tsx`);
- não inserir ou hard-delete `public.notifications` pelo browser;
- integrações novas importam de `@/core/notifications`;
- criação usa trigger, Edge confiável ou outbox; a UI não possui comando genérico de criação e nunca fornece destinatário privilegiado;
- preferências desabilitadas geram `suppressed`, não retry nem erro falso;
- Messaging e Notifications possuem owners, rotas e lifecycle distintos.

## Ratchets

- `tests/architecture/notification-inbox-authority.test.ts` protege criação/deleção da inbox e o owner de preferências;
- `tests/architecture/canonical-route-no-redirects.test.ts` protege a ausência de rotas/fallbacks mortos no corte atual;
- `tests/architecture/messaging-notifications-registry.test.ts` protege a separação de ownership entre Messaging e Notifications;
- `tests/architecture/realtime-ssot.test.ts` protege o transporte e a publication necessária;
- `tools/architecture/architecture-registry.ts` registra Notifications separadamente de Messaging.

## Fora do escopo do corte atual

- Inbox pública e preferências navegáveis;
- delivery real push/email em todos os provedores;
- reconnect/offline UX da Inbox;
- certificação de escala/SLO da outbox;
- reativação de producers pertencentes a domínios pausados.
