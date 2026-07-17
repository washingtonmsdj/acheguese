# Core Safety

SSOT de alertas de emergencia, incidentes, evidencias, contatos e
compartilhamento seguro de viagens.

## Ownership

- `SafetyService.ts`: facade publica, alertas, incidentes e evidencias.
- `SafetyEmergencyContactsService.ts`: CRUD de contatos e orquestracao do
  canal de email.
- `SafetyRideShareService.ts`: criacao, leitura publica por token e revogacao
  de compartilhamentos.
- `send-emergency-email`: broker autenticado; carrega alerta e contato
  canonicos no backend e grava o delivery log.
- `private.notification_outbox`: entrega in-app; o destinatario e derivado do
  perfil no banco.
- `private.audit_safety_insert` e RPCs de Safety: auditoria server-side.

O manifesto executavel em
`docs/architecture/core-platform-ownership.json` bloqueia novos acessos fora
desses owners.

## Persistencia canonica

- `emergency_alerts`
- `emergency_contacts`
- `emergency_delivery_log`
- `safety_incidents`
- `safety_evidence`
- `ride_shares`
- `safety_audit_log`

O schema reproduzivel e as politicas estao em:

- `supabase/migrations/20260714116000_normalize_safety_notification_producers.sql`
- `supabase/migrations/20260714117000_normalize_emergency_contact_email.sql`

## Fronteiras de seguranca

- IDs `profileId`, `createdBy`, `reportedBy` e `uploadedBy` sao IDs de
  `profiles`, nunca `auth.users.id`.
- RLS confirma que o perfil pertence a `auth.uid()` e que a viagem pertence ao
  participante quando aplicavel.
- O cliente nao escreve em `safety_audit_log` nem
  `emergency_delivery_log`.
- Status de alerta/incidente e revogacao de share passam por RPCs que derivam
  identidade e privilegio no backend.
- O browser envia somente `contactId` e `alertId` ao broker de email. Destino,
  texto e localizacao sao lidos das tabelas canonicas pela Edge Function.
- O canal ativo de contato e email. `email` e obrigatorio em novos registros;
  `phone` e opcional e nao implica SMS/voz.
- A leitura publica de uma viagem usa token aleatorio base62 de 32 caracteres,
  prazo maximo de sete dias e RPC com retorno limitado. `anon` nao possui
  `SELECT` direto em `ride_shares`.
- Alertas e incidentes possuem rate limit transacional por perfil.

## Fluxo de uso

Componentes usam hooks; hooks usam a facade:

```text
Component -> Hook -> SafetyService -> owner especializado/RPC/RLS
```

Exemplo de alerta:

```typescript
const result = await safetyService.createEmergencyAlert({
  profileId: activeProfile.id,
  rideId,
  alertType: "sos",
  location: { latitude, longitude },
});
```

Exemplo de share:

```typescript
const result = await safetyService.createRideShare({
  rideId,
  createdBy: activeProfile.id,
  expiresInHours: 24,
});
```

`getSharedRideData(token)` retorna no maximo uma viagem. `revokeRideShare`
recebe somente o ID do share; o ator e derivado no RPC.

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
