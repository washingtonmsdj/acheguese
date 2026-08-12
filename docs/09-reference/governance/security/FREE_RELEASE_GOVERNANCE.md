# Controlled Release Governance - Supabase Free

Status: ativo
Data: 2026-08-11
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

O snapshot `20260811T212637Z` e um snapshot logico manual, restauravel, com
cobertura de Database, Auth e Storage. O pacote privado off-device teve tamanho,
contagem, SHA-256 e readback verificados, e possui restore runbook.

Este controle nao e backup gerenciado, PITR nem full platform backup. Seu RPO e
limitado a `2026-08-11T21:26:37Z`; a recuperacao e manual e o RTO nao e
garantido. Dumps, conteudo Auth, PII, secrets e identificadores privados do
destino off-device nao pertencem ao repositorio.

## Freshness

O snapshot vale por no maximo 24 horas, ate
`2026-08-12T21:26:37Z`. Um novo snapshot e obrigatorio antes das migrations se:

- houver mudanca material em dados, schema, Auth ou Storage depois do snapshot;
- a janela de execucao ultrapassar o timestamp de validade;
- a verificacao off-device, hash ou readback deixar de ser comprovavel.

O validator falha automaticamente depois da validade. A fila de quatro
migrations e parte da evidencia; mudanca nessa fila exige nova avaliacao.

## Limite Das Excecoes

As excecoes desta janela cobrem somente HIBP nativo indisponivel no plano e a
superficie PostGIS observada no preflight. Elas nao cobrem drift, provenance,
Turnstile, CSP, Vercel inputs, TypeScript, lint, Poll, Community Interest,
Salvador nem qualquer nova mudanca tecnica.

Comando canonico:

```powershell
npm run validate:free-release-governance
```
