# Plano de Remediação e Melhoria de Segurança — 2026-08

Status: ATIVO  
Início: 2026-08-18  
Fonte: [Auditoria de Segurança — 2026-08](../09-reference/SECURITY-AUDIT-2026-08.md)  
Execução: [Checklist de implementação](./SECURITY-IMPLEMENTATION-CHECKLIST.md)  
Prova: [Matriz de verificação](../09-reference/SECURITY-VERIFICATION-MATRIX.md)

## Objetivo

Converter os achados da auditoria em trabalho pequeno, implementável, verificável e reversível, preservando os boundaries/SSOTs existentes.

## Princípios obrigatórios

1. Fail closed para autorização, Storage sensível e funções privilegiadas.
2. Cada controle técnico deve produzir evidência executável quando possível.
3. Mudanças em RLS/RPC/Storage exigem teste positivo e negativo.
4. `service_role` nunca no browser.
5. Webhooks públicos usam autenticidade do provedor, não JWT artificial.
6. Mudanças de banco devem ser versionadas e reproduzíveis.
7. Um SSOT por regra; documentação explica e testes/scripts/policies provam.
8. Sem mass refactor durante hardening.
9. Gate vermelho não vira normalidade: a causa deve ser triada e corrigida.

## P0 — incidente

Nenhum incidente crítico confirmado no snapshot de 2026-08-18. Qualquer evidência de dado sensível público, segredo real em histórico ou bypass reproduzido de RLS/admin sobe o item correspondente para P0 e exige containment/rotação antes de feature work.

## P1 — executar primeiro

### CI-001 — restaurar `Security Scan` e `Security Check`

Tracker: issue #17. Diagnóstico: draft PR #18.

- identificar se a falha ocorre antes dos steps ou dentro de algum scanner/comando;
- distinguir runner/conta/infra de código/dependência;
- preservar todos os controles existentes ou equivalente superior;
- não usar `continue-on-error` no resultado final como atalho;
- provar ao menos um run verde de cada gate após a correção.

**DoD:** os gates voltam a distinguir regressão nova de dívida conhecida e permanecem bloqueantes.

### SEC-001 — tornar `safety-evidence` privado

- revalidar consumidores e contagem de objetos;
- tornar o bucket privado por mudança reproduzível;
- definir policies mínimas de `storage.objects`;
- negar anônimo e usuário não relacionado;
- validar ator legítimo e moderação/admin conforme regra de negócio;
- usar signed URLs curtas somente quando necessário;
- adicionar probe automatizado.

**DoD:** nenhum acesso público involuntário, fluxo autorizado preservado e teste negativo versionado.

### SEC-002 — proteção contra senhas comprometidas

- ativar leaked-password protection no Supabase Auth;
- executar/fortalecer `npm run security:auth:hibp`;
- validar signup, mudança e recovery/reset;
- não registrar senha em logs.

**DoD:** configuração remota ativa e regression check automatizado.

### SEC-003 — `search_path` de funções privilegiadas

- capturar baseline do advisor;
- priorizar `SECURITY DEFINER` e funções de admin/trust/safety/billing/messaging/private data;
- definir `search_path` mínimo e qualificar objetos críticos quando necessário;
- corrigir em lotes pequenos;
- validar autorização positiva/negativa e migration drift.

**DoD:** funções críticas sem resolução implícita perigosa e sem mudança de semântica de autorização.

### SEC-004 — views privilegiadas

- inventariar views apontadas pelo advisor;
- declarar necessidade de owner authority ou migrar para invoker semantics;
- testar anon/authenticated, usuário A/B e admin quando aplicável;
- verificar PII/private fields.

**DoD:** nenhuma view privilegiada sem justificativa e teste correspondente.

## P2 — hardening de superfície

### SEC-005 — Storage MIME/tamanho

Definir `file_size_limit` e MIME allowlist por bucket de upload; revisar especialmente `ai-images`, `tryon-images`, incidentes, chat e verificação. Testar oversized, MIME inválido e arquivo válido.

### SEC-006 — escrita anônima de métricas

Identificar `WITH CHECK (true)`/equivalentes para `anon`, distinguir telemetria legítima, preferir RPC/Edge estreita, aplicar rate limit/dedup e impedir spoofing de owner/user/business IDs.

### SEC-007 — hygiene de `.env`

Inventariar `.env*` rastreados, classificar client-safe vs segredo, rotacionar segredo real antes de limpeza, manter templates seguros e bloquear novos ambientes efetivos no CI.

## P3 — escala e prevenção de drift

### SEC-008 — RLS/performance

Capturar baseline, corrigir initplan/reavaliações onde seguro, consolidar policies redundantes e medir consultas críticas com `EXPLAIN (ANALYZE, BUFFERS)` em ambiente apropriado, preservando o mesmo conjunto de linhas visíveis.

### SEC-009 — SSOT de configuração de segurança

Mapear valores duplicados entre frontend, Edge e deploy; escolher fonte declarativa ou validador de equivalência e falhar CI em drift material.

### WEB-001 — produção/SEO/smoke

Testar desktop/mobile, console/network, CSP, Turnstile, robots, sitemap, canonical, OpenGraph, fluxo anônimo, login/logout/session refresh e rota territorial crítica. Automatizar o mínimo reproduzível.

## Testes ofensivos após P1

Quando aplicável, cobrir:

- usuário A lendo/mutando usuário B;
- business A acessando business B;
- usuário comum chamando comando administrativo;
- usuário inativo/banido;
- anônimo em dado privado;
- ex-membro em thread/mensagem;
- acesso direto a attachments/evidence;
- spoofing de IDs de autoridade;
- replay e assinatura inválida de webhook;
- request oversized/content-type inválido;
- signed URL expirada.

## Definition of Done

Um item só fecha com:

- mudança técnica versionada quando aplicável;
- teste/probe positivo e negativo;
- evidência local/CI/remota;
- rollback/recuperação para infra;
- checklist atualizado;
- documentação canônica atualizada se a regra mudou;
- nenhum warning novo de severidade maior.

## Sequência de PRs

1. PR A — documentação/baseline (#16).
2. PR B — CI-001 (#18 e correção resultante).
3. PR C — SEC-001 + parte de SEC-005.
4. PR D — SEC-002.
5. PR E — SEC-003/004 em lotes pequenos.
6. PR F — SEC-006.
7. PR G — SEC-007.
8. PR H — SEC-008.
9. PR I — SEC-009.
10. PR J — WEB-001.

## Gate de release

Executar, conforme aplicável:

```bash
npm run security:validate
npm audit --audit-level=high
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
npm run validate:ssot
npm run validate:hardcodes
npm run validate:architecture:incremental
npm run validate:docs-structure
npm run validate:docs-live-links
node scripts/verify-deploy-ready.mjs
```

Novo achado recebe ID, prioridade/classe, evidência, critério de aceite e teste de regressão. Não adicionar tarefas vagas como “melhorar segurança”.
