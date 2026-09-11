# Core Safety

SSOT de alertas de emergencia, incidentes, evidencias, contatos e
compartilhamento seguro de viagens.

## Ownership

- `SafetyService.ts`: facade publica, alertas, incidentes e evidencias.
- `SafetyEmergencyContactsService.ts`: CRUD de contatos e orquestracao do
  canal de email.
- `SafetyRideShareService.ts`: criacao, leitura publica por token e revogacao
  de compartilhamentos.
- `send-emergency-email`: worker autenticado de envio/recovery do outbox.
- `resend-emergency-webhook`: ingestao assinada dos eventos do provedor.
- RPCs `claim_*`, `authorize_*`, `begin_*`, `confirm_*` e `apply_*`: autoridade
  transacional do lifecycle de entrega externa.
- `private.notification_outbox`: entrega in-app.
- `private.audit_safety_insert` e RPCs de Safety: auditoria server-side.

O manifesto executavel em
`docs/architecture/core-platform-ownership.json` bloqueia novos acessos fora
desses owners.

## Persistencia canonica

Publica:

- `emergency_alerts`
- `emergency_contacts`
- `emergency_delivery_log`
- `safety_incidents`
- `safety_evidence`
- `ride_shares`
- `safety_audit_log`

Privada:

- `private.emergency_delivery_provider_events`
- `private.emergency_delivery_provider_payloads`

O schema reproduzivel e as politicas estao em migrations versionadas em
`supabase/migrations/`.

## Fronteiras de seguranca

- IDs de atores sao IDs de `profiles`, nunca `auth.users.id`.
- RLS confirma ownership/participacao quando aplicavel.
- Browser nao escreve em `safety_audit_log`, `emergency_delivery_log`, receipts
  de provedor nem snapshots de payload.
- Status de alerta/incidente passam por RPCs server-owned.
- O browser envia somente IDs canonicos ao worker de emergencia.
- O webhook do Resend nao usa JWT do Supabase, mas exige verificacao Svix do
  corpo bruto com `svix-id`, `svix-timestamp`, `svix-signature` e
  `RESEND_WEBHOOK_SECRET` antes de qualquer mutacao.
- Toda mutacao de webhook e feita por RPC executavel apenas por `service_role`.
- O canal externo ativo e email; `phone` continua opcional e nao implica SMS.

## Entrega externa de emergencia

`emergency_delivery_log` e o outbox duravel. O lifecycle canonico e:

```text
pending -> processing -> dispatching -> sent -> delivered
            |              |
            +-> failed     +-> failed
                           +-> reconciliation_required
pending/processing -> cancelled
```

`processing` ainda e reversivel e nao autoriza side effect externo. O worker
monta o payload candidato e chama `authorize_emergency_email_dispatch`, que na
**mesma transacao**:

1. trava o alerta canonico;
2. confirma `active`/`acknowledged`;
3. trava a obrigacao `processing`;
4. valida target e tag `acheguese_delivery_id`;
5. grava o payload exato em `private.emergency_delivery_provider_payloads`;
6. move `processing -> dispatching`.

A antiga `authorize_emergency_delivery_dispatch(uuid)` e removida em G78 para
nao existir bypass sem snapshot.

Quando um alerta muda para `resolved` ou `false_alarm`, a mesma transacao
cancela tudo que ainda esta `pending/processing`. Um `dispatching` ja cruzou a
fronteira de autorizacao e so pode terminar por envio/reconciliacao idempotente.

### Payload imutavel e retry idempotente

Todo request usa a chave:

```text
emergency-delivery/<delivery-id>
```

Retries nunca reconstroem corpo/destino a partir de perfil, contato ou alerta
mutavel. Eles recuperam o snapshot privado via
`get_emergency_email_provider_payload` e enviam exatamente o mesmo JSON.

`begin_emergency_provider_attempt` serializa tentativas, aplica janela minima,
limite de retries e janela segura menor que a garantia do provedor. Resultado
indeterminado fora dessa janela vira `reconciliation_required`, nunca sucesso
ou falha inventados.

### Verdade do provedor

A resposta sincrona do `POST /emails` nao escreve `sent` diretamente. Ela usa
`confirm_emergency_delivery_provider_acceptance`, que correlaciona o
`provider_message_id` e nao regride estados `delivered` ou `failed` que um
webhook tenha confirmado antes.

Cada email inclui a tag `acheguese_delivery_id`. O Resend devolve tags nos seus
webhooks; `resend-emergency-webhook` usa essa tag assinada como correlacao
primaria e `provider_message_id` como secundaria.

`apply_emergency_delivery_provider_event`:

- deduplica pelo `svix-id` em ledger privado;
- suporta `sent`, `delivered`, `delivery_delayed`, `bounced`, `complained`,
  `failed` e `suppressed`;
- rejeita evento antes da autoridade de dispatch;
- impede regressao por eventos fora de ordem;
- trata `delivered` como confirmacao forte de entrega;
- preserva `delivered/failed` contra escrita concorrente do caminho sincrono.

## Fluxo de uso

```text
Component -> Hook -> SafetyService -> RPC/RLS/worker
Worker -> outbox transacional -> Resend
Resend -> webhook Svix -> RPC service_role -> outbox
```

## Integracao com Mobility

Mobility consome `core/safety` para alertas, incidentes e compartilhamento. Os
estados operacionais de corrida permanecem no owner de Mobility. Mobility nao
possui writer paralelo de `emergency_alerts`.

## Pendencia explicita

O upload de evidencias ainda usa transporte/preset generico de imagem e URL.
A migracao para `MediaAssetRef`, validacao por bytes, bucket privado e lifecycle
proprio pertence a CP-006/Fase 4A. A persistencia, RLS e auditoria de metadados
ja sao canonicas, mas essa pendencia impede declarar o fluxo de evidencia como
hardening final de midia.
