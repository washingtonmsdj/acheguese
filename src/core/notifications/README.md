# Core Notifications

**Status:** G4 SSOT SOURCE EM FECHAMENTO — NAO MVP CERTIFICADO  
**Data do checkpoint:** 2026-08-29

Ownership canonico da caixa de entrada, preferencias e entrega de notificacoes.

## SSOT

- Inbox, leitura e estado do usuario: `public.notifications` + `NotificationService`.
- Preferencias: `public.notification_preferences` + `NotificationPreferencesService`; leitura e patch passam pelos RPCs `get_current_notification_preferences` e `patch_current_notification_preferences`.
- Comando cross-user, retry e DLQ: `private.notification_outbox`, `private.enqueue_notification` e `private.process_notification_outbox`.
- Schema executavel do comando: migration `20260714113000_create_notification_outbox_core.sql`.
- Hook oficial de leitura: `useUnifiedNotifications`.
- Tipos publicos da inbox: `types.ts`.

`NotificationCommand` e um contrato server-owned: destinatario derivado pelo dominio, evento e agregado identificados, texto sem HTML, metadata JSON limitada a 32 KiB, URL interna segura ou HTTPS, chave idempotente e no maximo dez tentativas. Nao existe API generica desse comando para o browser.

## Autoridade da inbox

`NotificationService.createNotification()` e estritamente self-only e delega ao RPC `create_notification`.

A migration `20260829185546_harden_notification_inbox_write_authority.sql` fechou o bypass browser conhecido:

- `create_notification` executa como comando privilegiado com ACL explicita para `authenticated` e `service_role`; `anon` nao executa;
- authenticated nao possui mais INSERT direto em `public.notifications`;
- authenticated nao possui mais hard DELETE direto;
- o usuario continua podendo SELECT da propria inbox e UPDATE apenas as colunas de estado permitidas (`read`, `is_read`, `read_at`, `deleted_at`, `updated_at`), sempre sob RLS de ownership;
- cross-user continua reservado a produtores server-side/outbox.

## Produtores

- Community materializa sincronamente pelo helper Core para preservar a mesma transacao de like, comentario, resposta ou mencao.
- Community Direct Messaging enfileira notificacao pelo helper server-side depois do comando de mensagem autorizado.
- Work Opportunities, Vagas, Trust, Mobility, Orders, Business Claims e Safety usam triggers de dominio que apenas enfileiram comandos idempotentes.
- Professional Leads conserva o broker autenticado `professional-notifications-rpc`; ele deriva participantes no servidor.
- Safety deriva o destinatario de `profiles.user_id`; alertas, incidentes e shares produzem comandos apos RLS/constraints e auditoria server-side.

## Realtime

Toda abertura de canal pertence a `src/core/realtime/services/RealtimeService.ts`. `NotificationService` apenas delega subscription ao owner de Realtime.

A migration `20260829185634_align_messaging_notification_realtime_publication.sql` garante que `public.notifications` esteja na publication `supabase_realtime` usada pelos Postgres Changes do runtime.

## Operacao

- Estados da outbox: `pending`, `processing`, `delivered`, `suppressed` e `dead_letter`.
- O dispatcher usa `FOR UPDATE SKIP LOCKED`, backoff exponencial limitado a 15 minutos e cinco tentativas por padrao.
- `private.notification_outbox_health()` fornece backlog e item pendente mais antigo; `private.requeue_notification_dead_letter(id)` reprocessa um item.
- Somente `service_role` executa enqueue, dispatcher, health, requeue e prune.
- `pg_cron` drena ate 500 comandos por minuto e remove terminais antigos em lotes. Isso e um safety net de lancamento, nao evidencia milhares por segundo; escala maior exige workers concorrentes, teste de carga e SLO registrado.
- Rollback operacional: desabilitar os triggers produtores e o job de dispatch, preservar a outbox para auditoria e reativar somente apos corrigir a causa. Nao reintroduzir dual write no navegador.
- Probe de desenvolvimento remoto: `tests/security/notification-outbox-remote-probe.sql`. Ele valida entrega, deduplicacao, preferencias, retry, DLQ, requeue e health dentro de uma unica transacao encerrada por `ROLLBACK`. Nao executar implicitamente contra producao.

## Regras

- Nao criar wrappers em `modules/notifications` que reimplementem persistencia.
- Nao acessar `supabase.from('notifications')` em UI (`.tsx`).
- Nao inserir ou hard-delete `public.notifications` pelo browser.
- Integracoes novas importam de `@/core/notifications`.
- Notificacao para terceiros usa trigger, RPC/Edge confiavel ou outbox; a UI nunca fornece o destinatario privilegiado.
- Preferencias desabilitadas geram `suppressed`, nao retry nem erro falso.

## Ratchets

- `tests/architecture/notification-inbox-authority.test.ts` protege criacao/delecao da inbox e o owner de preferencias;
- `tests/architecture/realtime-ssot.test.ts` protege o transporte e a publication necessaria;
- o registro de ownership do Core Platform continua sendo o mapa global de tabelas controladas.

## O que G4 nao certifica

- carga/retry/SLO real da outbox;
- delivery real push/email em todos os provedores;
- reconnect/offline UX da inbox;
- auditoria exaustiva de migrations/RLS/grants/legados em G5;
- same-SHA lint/typecheck/test/E2E/build/deploy/smoke em G7.
