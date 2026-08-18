# Checklist de Implementação — Segurança e Hardening

Status: ATIVO  
Baseline: 2026-08-18  
Plano: [SECURITY-REMEDIATION-PLAN-2026-08.md](./SECURITY-REMEDIATION-PLAN-2026-08.md)

> Marcar `[x]` somente quando o critério de aceite estiver comprovado. Código escrito não significa item concluído.

## P1 — prioridade imediata

### CI-001 — restaurar Security Scan e Security Check

Tracker: issue #17. Diagnóstico: PR #18.

- [x] Confirmar que a falha antecede o PR documental.
- [x] Comparar execução GitHub-hosted com runner self-hosted conhecido.
- [x] Criar diagnóstico fail-closed no self-hosted sem secrets e sem executar código de fork.
- [ ] Obter resultado do diagnóstico no SHA do PR #18.
- [ ] Identificar a primeira falha real, caso o self-hosted falhe.
- [ ] Corrigir causa de runner/conta/infra ou código conforme evidência.
- [ ] Provar `Security Scan` verde.
- [ ] Provar `Security Check` verde.
- [ ] Registrar causa raiz na issue #17.

**DoD:** gates confiáveis, bloqueantes e diagnosticáveis.

### SEC-001 — `safety-evidence` privado

- [ ] Revalidar contagem de objetos e consumidores.
- [ ] Confirmar que nenhum consumidor legítimo depende de URL pública estável.
- [ ] Criar mudança reproduzível para bucket privado.
- [ ] Definir policies mínimas de upload/read/delete.
- [ ] Bloquear acesso anônimo.
- [ ] Bloquear usuário não relacionado.
- [ ] Validar ator autorizado e moderação/admin.
- [ ] Implementar signed URL curta somente onde necessário.
- [ ] Criar probe de autorização de Storage.
- [ ] Executar prova remota e registrar no PR.

**DoD:** acesso público involuntário = zero; fluxo autorizado preservado; teste negativo versionado.

### SEC-002 — leaked-password protection

- [ ] Revalidar configuração remota.
- [ ] Ativar proteção contra senhas comprometidas.
- [ ] Rodar `npm run security:auth:hibp`.
- [ ] Fortalecer o probe para detectar regressão.
- [ ] Testar signup, mudança de senha e recovery/reset.
- [ ] Registrar evidência sem senha em logs.

**DoD:** proteção ativa e regression check automatizado.

### SEC-003 — `search_path` privilegiado

- [ ] Capturar baseline atual do advisor.
- [ ] Separar `SECURITY DEFINER` de funções comuns.
- [ ] Classificar por domínio/criticidade.
- [ ] Corrigir admin/trust/safety em lote pequeno.
- [ ] Corrigir billing/subscription em lote pequeno.
- [ ] Corrigir messaging/private data em lote pequeno.
- [ ] Executar probes positivos/negativos.
- [ ] Validar migrations local/remota e drift.

**DoD:** funções críticas endurecidas sem alterar autorização.

### SEC-004 — views privilegiadas

- [ ] Inventariar views do advisor.
- [ ] Declarar owner/consumidores.
- [ ] Confirmar necessidade de owner authority.
- [ ] Migrar para invoker quando autoridade extra não for necessária.
- [ ] Testar anon/authenticated/admin e usuário A/B.
- [ ] Cobrir PII/private fields.

**DoD:** zero view privilegiada sem justificativa + teste.

## P2 — hardening

### SEC-005 — Storage MIME/tamanho

- [ ] Inventariar buckets de upload.
- [ ] Definir limite de tamanho por categoria.
- [ ] Definir MIME allowlist.
- [ ] Revisar `ai-images`, `tryon-images`, incidentes, chat e verificação.
- [ ] Testar oversized, MIME inválido e arquivo válido.
- [ ] Revisar SVG/HTML ativo.

### SEC-006 — escrita anônima de métricas

- [ ] Listar policies permissivas para `anon`.
- [ ] Separar telemetria legítima de dado de negócio.
- [ ] Remover acesso direto desnecessário.
- [ ] Usar RPC/Edge estreita onde necessário.
- [ ] Aplicar rate limit e deduplicação.
- [ ] Bloquear spoofing de IDs de autoridade.
- [ ] Criar teste de replay/abuso.

### SEC-007 — `.env`/secrets hygiene

- [ ] Listar `.env*` rastreados.
- [ ] Classificar valores client-safe vs segredo.
- [ ] Rotacionar qualquer segredo real antes da remoção.
- [ ] Remover ambientes efetivos do versionamento.
- [ ] Manter templates seguros.
- [ ] Atualizar `.gitignore` e gate CI.
- [ ] Rodar Gitleaks conforme política vigente.

## P3 — escala e prevenção de drift

### SEC-008 — RLS/performance

- [ ] Capturar advisor/performance baseline.
- [ ] Priorizar queries críticas.
- [ ] Corrigir reavaliações/initplan onde seguro.
- [ ] Consolidar policies redundantes.
- [ ] Medir antes/depois.
- [ ] Confirmar mesmo conjunto de linhas visíveis.

### SEC-009 — configuração de segurança

- [ ] Mapear valores duplicados frontend/Edge/deploy.
- [ ] Escolher fonte declarativa ou validador.
- [ ] Adicionar gate de drift.
- [ ] Testar divergência sintética.

### WEB-001 — produção/SEO/smoke

- [ ] Desktop e mobile.
- [ ] Console/network.
- [ ] CSP e Turnstile.
- [ ] robots/sitemap/canonical/OpenGraph.
- [ ] fluxo anônimo e login/logout/session refresh.
- [ ] rota territorial crítica.
- [ ] smoke mínimo automatizado.

## Gate transversal

- [ ] `Security Scan` saudável ou run explicitamente triado enquanto CI-001 estiver aberto.
- [ ] `Security Check` saudável ou run explicitamente triado enquanto CI-001 estiver aberto.
- [ ] `npm run security:validate`.
- [ ] `npm audit --audit-level=high`.
- [ ] migrations local/remota quando houver DB change.
- [ ] `npm run validate:security-authority` quando houver autorização.
- [ ] `npm run validate:ssot`.
- [ ] `npm run validate:hardcodes`.
- [ ] `npm run validate:architecture:incremental`.
- [ ] `npm run validate:docs-structure`.
- [ ] `npm run validate:docs-live-links`.
- [ ] typecheck/lint/build aplicáveis.
- [ ] probe do domínio afetado.
- [ ] PR registra risco anterior, teste negativo, teste positivo e rollback.

## Controle de progresso

| ID | Prioridade | Estado | PR/Issue | Observação |
| --- | --- | --- | --- | --- |
| CI-001 | P1 | IN_PROGRESS | #17 / #18 | recuperar gates |
| SEC-001 | P1 | TODO | — | Storage sensível |
| SEC-002 | P1 | TODO | — | Auth |
| SEC-003 | P1 | TODO | — | DB privileged hardening |
| SEC-004 | P1 | TODO | — | views/autorização |
| SEC-005 | P2 | TODO | — | Storage |
| SEC-006 | P2 | TODO | — | abuse/analytics |
| SEC-007 | P2 | TODO | — | secrets hygiene |
| SEC-008 | P3 | TODO | — | performance |
| SEC-009 | P3 | TODO | — | drift prevention |
| WEB-001 | P3 | TODO | — | produção/SEO |

Estados permitidos: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `RISK_ACCEPTED`. `RISK_ACCEPTED` exige justificativa e data de revisão.
