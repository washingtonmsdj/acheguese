# Auditoria de Segurança — 2026-08

Status: ATIVO  
Snapshot: 2026-08-18  
Escopo: GitHub `washingtonmsdj/acheguese` (`main`), Supabase `acheguese` (`xhdowzacfujckjelqhtd`) e superfície pública de `acheguese.com.br`.

## Objetivo

Registrar o estado observado na auditoria e ligar evidência, priorização e execução sem criar um segundo SSOT de segurança.

Execução:

- [Plano de remediação](../08-roadmap/SECURITY-REMEDIATION-PLAN-2026-08.md)
- [Checklist de implementação](../08-roadmap/SECURITY-IMPLEMENTATION-CHECKLIST.md)
- [Matriz de verificação](./SECURITY-VERIFICATION-MATRIX.md)

## Sumário executivo

A fundação observada é forte para o tamanho do produto: RLS está essencialmente universal nas tabelas de aplicação, há autorização interna nas RPCs privilegiadas amostradas, billing/webhooks possuem controles coerentes e o repositório possui múltiplos gates de segurança.

O principal risco sistêmico é complexidade e drift entre domínios, policies, funções privilegiadas, Storage, Edge Functions, CI e documentação.

Não foi confirmada vulnerabilidade crítica explorável que justifique declarar incidente ativo no snapshot. Foram identificadas configurações de risco, dívida de assurance e hardenings que devem ser concluídos antes de ampliar superfícies sensíveis.

## Baseline observado

### Banco e autorização

- aproximadamente 241 tabelas no schema `public`;
- RLS habilitado em 240/241; a exceção observada foi `spatial_ref_sys`, infraestrutura PostGIS;
- `anon` e `authenticated` não possuem `CREATE` no schema `public`;
- funções administrativas amostradas validam identidade, perfil/estado e papel/permissão antes de mutações privilegiadas;
- funções de comunidade/mensageria amostradas validam identidade, ownership/membership e, em vários fluxos, rate limiting.

### Billing

`billing-webhook` usa `verify_jwt=false` de forma intencional por ser webhook do Stripe. No trecho auditado foram observados método restrito, limite de corpo, rate limiting, exigência de `stripe-signature`, validação com `constructEvent`, uso de `service_role` somente após assinatura válida, idempotência e registro de sucesso/falha.

Classificação: controle adequado no trecho auditado; `verify_jwt=false` isoladamente não é vulnerabilidade nesse endpoint.

### CI/CD e frontend

Os workflows incluem ESLint security, `npm audit` high/critical, Semgrep, Gitleaks, padrões XSS/token/cookie e TypeScript strict. O build Vercel valida configuração, CSP, Turnstile, typecheck e lint.

Foi detectado `CI-001`: `Security Scan` e `Security Check` falham de forma recorrente em PRs anteriores ao roadmap atual. A causa raiz ainda está em investigação e não deve ser mascarada removendo scanners ou tornando o resultado não bloqueante.

## Achados ativos

| ID | Prioridade | Classe | Achado | Estado |
| --- | --- | --- | --- | --- |
| CI-001 | P1 | assurance/operabilidade | `Security Scan` e `Security Check` não fornecem gate confiável no estado observado | IN_PROGRESS — issue #17 / PR #18 |
| SEC-001 | P1 | configuração de risco | bucket `safety-evidence` público apesar da semântica de evidência sensível | TODO |
| SEC-002 | P1 | hardening de autenticação | proteção contra senhas comprometidas desabilitada | TODO |
| SEC-003 | P1 | hardening DB | funções com `search_path` implícito sinalizadas pelo advisor | TODO |
| SEC-004 | P1 | revisão de autorização | views privilegiadas precisam de revisão explícita de semântica | TODO |
| SEC-005 | P2 | storage hardening | buckets sem limites explícitos de tamanho/MIME | TODO |
| SEC-006 | P2 | abuso/operabilidade | escritas anônimas de analytics/views precisam de fronteira estreita e deduplicação | TODO |
| SEC-007 | P2 | secrets hygiene | `.env` efetivos versionados aumentam risco de commit futuro de segredo | TODO |
| SEC-008 | P3 | performance/operabilidade | advisor aponta reavaliações/initplan e policies permissivas sobrepostas | TODO |
| SEC-009 | P3 | prevenção de drift | configuração de segurança possui sincronização manual entre runtimes | TODO |
| DOC-001 | P1 | governança documental | entry points da raiz apontavam para caminhos não canônicos/inexistentes | IN_PROGRESS — PR #16 |
| WEB-001 | P3 | observabilidade/produção | smoke/SEO público completo precisa de evidência reproduzível | TODO |

## Notas de severidade

### SEC-001 — `safety-evidence`

O bucket estava vazio no snapshot. Portanto, não há vazamento atual confirmado. O risco é a configuração pública antes de receber conteúdo potencialmente sensível.

### SEC-002 — senhas comprometidas

É redução direta de risco de reutilização de credenciais e credential stuffing. Deve ser ativada e coberta por regression check.

### CI-001 — gates vermelhos

A falha é anterior ao PR documental. O risco é de assurance: um gate permanentemente vermelho deixa de separar regressão nova de ruído conhecido.

### SEC-003/004 — funções/views privilegiadas

Warnings do advisor são sinais de hardening, não prova automática de exploração. A amostra manual encontrou autorização interna em funções privilegiadas relevantes. Alterações devem preservar semântica e adicionar testes A/B.

### SEC-008 — RLS/performance

Não classificar automaticamente como vulnerabilidade. O risco principal é custo, latência e complexidade crescente.

## Controles positivos a preservar

- RLS amplo e postura fail-closed;
- autorização explícita em RPCs privilegiadas amostradas;
- validação do Stripe webhook antes de `service_role`;
- idempotência de billing;
- headers/CORS centralizados em Edge Functions;
- respostas 5xx genéricas;
- múltiplos scanners de segurança no CI;
- TypeScript strict e validações arquiteturais/SSOT;
- CSP sem `unsafe-eval` em `script-src` no snapshot auditado.

## Limitações

- a amostragem manual de RPCs não prova segurança de todas as funções;
- a auditoria visual end-to-end do domínio público não foi concluída nessa rodada;
- a causa raiz de `CI-001` ainda depende do diagnóstico em execução;
- advisor, policies, buckets e funções podem mudar após o snapshot.

## Regra operacional

Nenhuma feature que amplie coleta de evidência, autenticação, mensageria privada, billing ou acesso administrativo deve ampliar superfície sem que os P1 estejam concluídos ou tenham aceitação de risco explícita e revisável.
