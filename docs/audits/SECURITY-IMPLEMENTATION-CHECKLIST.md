# Checklist de Implementação — Segurança e Hardening

Status: ATIVO  
Baseline: 2026-08-18  
Plano: [`SECURITY-REMEDIATION-PLAN-2026-08.md`](./SECURITY-REMEDIATION-PLAN-2026-08.md)

> Regra: marcar `[x]` somente quando o critério de aceite estiver comprovado. “Código escrito” não significa “concluído”.

## P1 — Prioridade imediata

### SEC-001 — `safety-evidence` privado

- [ ] Revalidar contagem de objetos e consumidores atuais.
- [ ] Criar migration/config reproduzível que torne o bucket privado.
- [ ] Definir policies mínimas de upload/read/delete em `storage.objects`.
- [ ] Bloquear acesso anônimo direto.
- [ ] Bloquear usuário não relacionado.
- [ ] Validar ator autorizado.
- [ ] Validar admin/moderação conforme policy de negócio.
- [ ] Implementar signed URL curta apenas onde necessário.
- [ ] Criar probe automatizado de autorização de storage.
- [ ] Executar teste remoto após deploy.
- [ ] Registrar evidência no PR.

**DoD:** nenhum acesso público involuntário + fluxo autorizado preservado + teste negativo versionado.

### SEC-002 — Password leak protection

- [ ] Ativar configuração no Supabase Auth.
- [ ] Rodar `npm run security:auth:hibp`.
- [ ] Ajustar script/probe para falhar se a configuração regredir.
- [ ] Testar signup.
- [ ] Testar alteração de senha.
- [ ] Testar reset/recovery.
- [ ] Registrar evidência remota sem armazenar senha em logs.

**DoD:** proteção remota ativa e regression check automatizado.

### SEC-003 — `search_path` de funções privilegiadas

- [ ] Capturar lista atual de warnings do advisor.
- [ ] Separar `SECURITY DEFINER` de funções comuns.
- [ ] Classificar por domínio/criticidade.
- [ ] Corrigir primeiro admin/trust/safety.
- [ ] Corrigir billing/subscription.
- [ ] Corrigir messaging/private data.
- [ ] Corrigir demais mutações sensíveis.
- [ ] Executar testes de autorização positiva e negativa por lote.
- [ ] Rodar `npm run validate:migrations`.
- [ ] Rodar `npm run validate:migrations:remote`.
- [ ] Confirmar ausência de migration drift.

**DoD:** funções críticas sem `search_path` implícito perigoso e sem mudança de semântica de autorização.

### SEC-004 — Views privilegiadas

- [ ] Inventariar views apontadas pelo advisor.
- [ ] Documentar owner/consumidores de cada view.
- [ ] Confirmar necessidade real de owner authority.
- [ ] Migrar para invoker quando autoridade extra não for necessária.
- [ ] Testar usuário A vs usuário B.
- [ ] Testar anon/authenticated/admin.
- [ ] Cobrir exposição de PII/private fields.

**DoD:** zero view privilegiada sem justificativa + teste correspondente.

## P2 — Hardening de superfície

### SEC-005 — Storage MIME/tamanho

- [ ] Inventariar todos os buckets.
- [ ] Definir tamanho máximo por categoria.
- [ ] Definir MIME allowlist por categoria.
- [ ] Revisar `ai-images`.
- [ ] Revisar `tryon-images`.
- [ ] Revisar buckets de chat/incident/verification.
- [ ] Testar arquivo oversized.
- [ ] Testar MIME não permitido.
- [ ] Testar arquivo permitido.
- [ ] Revisar risco de SVG/HTML ativo.

**DoD:** limites explícitos e cobertos por teste para todos os buckets com upload de usuário.

### SEC-006 — Escrita anônima de métricas

- [ ] Listar policies anônimas com condição permissiva.
- [ ] Identificar quais representam telemetria legítima.
- [ ] Remover acesso direto desnecessário a tabelas.
- [ ] Criar RPC/Edge estreita quando necessário.
- [ ] Aplicar rate limit.
- [ ] Aplicar deduplicação/idempotência.
- [ ] Impedir spoofing de owner/user/business.
- [ ] Criar teste de abuso/replay.

**DoD:** evento anônimo legítimo funciona; cliente não controla campos de autoridade nem pode inflar métricas trivialmente.

### SEC-007 — Hygiene de `.env`

- [ ] Listar `.env*` rastreados pelo git.
- [ ] Classificar cada valor.
- [ ] Rotacionar qualquer segredo real encontrado antes da remoção.
- [ ] Remover ambientes efetivos do versionamento.
- [ ] Manter template `.env.example` seguro.
- [ ] Atualizar `.gitignore`.
- [ ] Adicionar validação CI para bloquear novos arquivos proibidos.
- [ ] Rodar Gitleaks no histórico/baseline conforme política vigente.

**DoD:** checkout não depende de segredo versionado e CI evita regressão.

## P3 — Escala e prevenção de drift

### SEC-008 — RLS/performance

- [ ] Capturar baseline de advisor/performance.
- [ ] Priorizar queries de maior tráfego.
- [ ] Corrigir initplan/reavaliações onde seguro.
- [ ] Consolidar policies redundantes.
- [ ] Rodar `EXPLAIN (ANALYZE, BUFFERS)` em ambiente apropriado.
- [ ] Comparar antes/depois.
- [ ] Confirmar mesmo conjunto de linhas visíveis.

**DoD:** ganho/limpeza mensurável sem ampliação de acesso.

### SEC-009 — SSOT de configuração de segurança

- [ ] Mapear valores duplicados entre frontend, Edge e deploy.
- [ ] Escolher fonte declarativa ou validador.
- [ ] Adicionar gate de drift no CI.
- [ ] Testar divergência proposital para provar falha do gate.
- [ ] Documentar como alterar uma regra de segurança sem editar múltiplos SSOTs manualmente.

**DoD:** drift material é detectado automaticamente.

### WEB-001 — Produção/SEO/smoke

- [ ] Testar `acheguese.com.br` em desktop.
- [ ] Testar mobile.
- [ ] Verificar console errors.
- [ ] Verificar requests 4xx/5xx inesperados.
- [ ] Validar CSP real de produção.
- [ ] Validar Turnstile nos fluxos protegidos.
- [ ] Validar `robots.txt`.
- [ ] Validar sitemap.
- [ ] Validar canonical.
- [ ] Validar OpenGraph/social cards.
- [ ] Validar fluxo anônimo principal.
- [ ] Validar login/logout/session refresh.
- [ ] Validar rota pública territorial crítica.
- [ ] Automatizar smoke mínimo em Playwright/CI.

**DoD:** fluxo público principal reproduzível sem erro crítico e SEO técnico básico verificável.

## Gate transversal antes de marcar qualquer P1/P2 como concluído

- [ ] `npm run security:validate`
- [ ] `npm audit --audit-level=high`
- [ ] `npm run validate:migrations` quando houver DB change
- [ ] `npm run validate:migrations:remote` quando houver DB change
- [ ] `npm run validate:security-authority` quando houver autorização
- [ ] `npm run validate:ssot`
- [ ] `npm run validate:hardcodes`
- [ ] `npm run validate:architecture:incremental`
- [ ] `npm run validate:docs-structure`
- [ ] Typecheck/lint/build aplicáveis passam
- [ ] Probe do domínio afetado passa
- [ ] PR descreve risco anterior, mudança, teste negativo e rollback

## Controle de progresso

| ID | Prioridade | Estado | PR | Evidência | Observação |
| --- | --- | --- | --- | --- | --- |
| SEC-001 | P1 | TODO | — | — | storage sensível |
| SEC-002 | P1 | TODO | — | — | auth |
| SEC-003 | P1 | TODO | — | — | DB hardening |
| SEC-004 | P1 | TODO | — | — | views/authorization |
| SEC-005 | P2 | TODO | — | — | storage |
| SEC-006 | P2 | TODO | — | — | abuse/analytics |
| SEC-007 | P2 | TODO | — | — | secrets hygiene |
| SEC-008 | P3 | TODO | — | — | performance |
| SEC-009 | P3 | TODO | — | — | drift prevention |
| WEB-001 | P3 | TODO | — | — | production/SEO |

Estados permitidos: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `RISK_ACCEPTED`. `RISK_ACCEPTED` exige decisão explícita com justificativa e prazo de revisão.
