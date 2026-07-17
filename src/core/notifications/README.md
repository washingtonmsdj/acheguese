# Core Notifications

Ownership canonico da caixa de entrada e da entrega de notificacoes.

## SSOT

- Inbox, leitura e estado do usuario: `public.notifications` e
  `NotificationService`.
- Preferencias: `public.notification_preferences`; a consolidacao dos services
  de preferencia continua na Fase 2A do plano de Core Platform.
- Comando cross-user, retry e DLQ: `private.notification_outbox`,
  `private.enqueue_notification` e `private.process_notification_outbox`.
- Schema executavel do comando: migration
  `20260714113000_create_notification_outbox_core.sql`.
- Hook oficial de leitura: `useUnifiedNotifications`.
- Tipos publicos da inbox: `types.ts`.

`NotificationCommand` e um contrato server-owned: destinatario derivado pelo
dominio, evento e agregado identificados, texto sem HTML, metadata JSON limitada
a 32 KiB, URL interna segura ou HTTPS, chave idempotente e no maximo dez
tentativas. Nao existe API generica desse comando para o browser.

## Produtores

- Community materializa sincronamente pelo helper Core para preservar a mesma
  transacao de like, comentario, resposta ou mencao.
- Work Opportunities, Vagas, Trust, Mobility, Orders, Business Claims e Safety
  usam triggers de dominio que apenas enfileiram comandos idempotentes.
- Professional Leads conserva o broker autenticado
  `professional-notifications-rpc`; ele deriva participantes no servidor.
- Safety deriva o destinatario de `profiles.user_id`; alertas, incidentes e
  shares produzem comandos apos RLS/constraints e auditoria server-side.

## Operacao

- Estados: `pending`, `processing`, `delivered`, `suppressed` e `dead_letter`.
- O dispatcher usa `FOR UPDATE SKIP LOCKED`, backoff exponencial limitado a 15
  minutos e cinco tentativas por padrao.
- `private.notification_outbox_health()` fornece backlog e item pendente mais
  antigo; `private.requeue_notification_dead_letter(id)` reprocessa um item.
- Somente `service_role` executa enqueue, dispatcher, health, requeue e prune.
- `pg_cron` drena ate 500 comandos por minuto e remove terminais antigos em
  lotes. Isso e um safety net de lancamento, nao evidencia milhares por segundo;
  escala maior exige workers concorrentes, teste de carga e SLO registrado.
- Rollback operacional: desabilitar os triggers produtores e o job de dispatch,
  preservar a outbox para auditoria e reativar somente apos corrigir a causa.
  Nao reintroduzir dual write no navegador.
- Probe de desenvolvimento remoto:
  `tests/security/notification-outbox-remote-probe.sql`. Ele valida entrega,
  deduplicacao, preferencias, retry, DLQ, requeue e health dentro de uma unica
  transacao encerrada por `ROLLBACK`. Nao executar implicitamente contra
  producao.

## Regras

- Nao criar wrappers em `modules/notifications`.
- Nao acessar `supabase.from('notifications')` em UI (`.tsx`).
- Integracoes novas importam de `@/core/notifications`.
- `NotificationService.createNotification` permanece estritamente self-only.
- Notificacao para terceiros usa trigger, RPC/Edge confiavel ou outbox; a UI
  nunca fornece o destinatario privilegiado.
- Preferencias desabilitadas geram `suppressed`, nao retry nem erro falso.
