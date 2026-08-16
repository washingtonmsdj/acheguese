# Controlled Release Governance - Supabase Free

Status: ativo
Data: 2026-08-15
Owner: `washingto silva (@washingtonmsdj)`

Esta policy autoriza somente uma janela controlada de release no Supabase Free.
Ela nao declara o plano Free equivalente ao Pro e nao substitui gates tecnicos.
O SSOT executavel e
[`FREE_RELEASE_GOVERNANCE.json`](./FREE_RELEASE_GOVERNANCE.json).

## Estados Da Security Authority

| Controle                       | Estado                                                   |
| ------------------------------ | -------------------------------------------------------- |
| HIBP nativo do Auth            | `HIBP_UNAVAILABLE_ON_PLAN` / `VALID_TEMPORARY_EXCEPTION` |
| Superficie PostGIS em `public` | `VALID_TEMPORARY_EXCEPTION`                              |
| Recovery manual desta janela   | `VERIFIED_COMPENSATING_CONTROL`                          |
| PITR gerenciado                | `UNAVAILABLE_ON_PLAN` / `RESIDUAL_RISK_ACCEPTED`         |
| Excecoes de 2026-07-08         | `EXPIRED_EXCEPTION`                                      |

`CONTROL_IMPLEMENTED` so pode ser usado quando o controle existe de fato.
Excecao vencida, evidencia ausente ou achado material novo produz `BLOCKER`.

## MANUAL_RELEASE_RECOVERY_SNAPSHOT

O snapshot vigente `20260815T201851Z` e um snapshot logico manual, restauravel,
com papel `POST_POLL_HARDENING_RECOVERY_SNAPSHOT` e
capturado em `2026-08-15T20:27:35.010135Z`, com validade ate
`2026-08-16T20:27:35.010135Z`, cobertura de Database, Auth e Storage. O pacote
privado off-device tem 46.952.119 bytes, SHA-256
`39ad4c122f0c0d94e4944553bbb68ddb3fe4e529e3e730b01c92e289fb823779`, contagem,
readback e sincronizacao verificados, e possui restore runbook.

O snapshot anterior `20260815T123607Z` (`POST_POLL_HARDENING_RECOVERY_SNAPSHOT`, 344
migrations) e o snapshot `20260814T102848Z` (`POST_POLL_HARDENING_RECOVERY_SNAPSHOT`, 344
migrations) e os snapshots `20260812T094356Z` (`POST_POLL_HARDENING_RECOVERY_SNAPSHOT`, 344
migrations), `20260812T044423Z` (`POST_MIGRATION_RELEASE_RECOVERY_SNAPSHOT`,
343 migrations) e `20260811T212637Z` (`PRE_RELEASE_RECOVERY_SNAPSHOT`, 339
migrations) continuam preservados. Eles sao historicos e nao podem ser usados
para afirmar freshness do remoto atual.

Este controle nao e backup gerenciado, PITR nem full platform backup. Seu RPO e
limitado a `2026-08-15T20:27:35.010135Z`; a recuperacao e manual e o RTO nao e
garantido. Dumps, conteudo Auth, PII, secrets e identificadores privados do
destino off-device nao pertencem ao repositorio.

## Freshness

O snapshot vale por no maximo 24 horas, ate
`2026-08-16T20:27:35.010135Z`. Um novo snapshot e obrigatorio antes de operacao
mutavel se:

- houver mudanca material em dados, schema, Auth ou Storage depois do snapshot;
- a janela de execucao ultrapassar o timestamp de validade;
- a verificacao off-device, hash ou readback deixar de ser comprovavel.

O validator local comprova somente estrutura, validade, policy e evidencia
off-device. Ele imprime `REMOTE_RECOVERY_FRESHNESS_NOT_PROVEN` e nunca se
apresenta como prova do estado remoto.

O gate remoto consulta read-only o projeto linkado e compara migration
count/latest, Auth users/identities e Storage object count/bytes. Migrations
divergentes falham automaticamente. Como o SSOT desta janela define
`REQUIRE_FRESH_RECOVERY` para Auth e Storage, divergencias nesses agregados
tambem exigem novo snapshot. A declaracao local
`NO_KNOWN_MATERIAL_CHANGE` e apenas informativa e nao suprime divergencia.

## Limite Das Excecoes

As excecoes desta janela cobrem somente HIBP nativo indisponivel no plano e a
superficie PostGIS observada no preflight. Elas nao cobrem drift, provenance,
Turnstile, CSP, Vercel inputs, TypeScript, lint, Poll, Community Interest,
Salvador nem qualquer nova mudanca tecnica.

Comando canonico:

```powershell
npm run validate:free-release-governance
npm run validate:free-release-governance:remote
```
