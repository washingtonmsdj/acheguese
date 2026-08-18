# Relatório Mestre de Auditoria

Status: ATIVO  
Snapshot: 2026-08-18  
Escopo: GitHub `washingtonmsdj/acheguese` (`main`), Supabase `acheguese` (`xhdowzacfujckjelqhtd`) e superfície pública de `acheguese.com.br`.

## 1. Objetivo

Este documento registra o estado de segurança e engenharia observado na auditoria de 2026-08-18 e funciona como ponte entre evidência, priorização e execução.

A execução está detalhada em:

- [`SECURITY-REMEDIATION-PLAN-2026-08.md`](./SECURITY-REMEDIATION-PLAN-2026-08.md)
- [`SECURITY-IMPLEMENTATION-CHECKLIST.md`](./SECURITY-IMPLEMENTATION-CHECKLIST.md)
- [`SECURITY-VERIFICATION-MATRIX.md`](./SECURITY-VERIFICATION-MATRIX.md)

## 2. Sumário executivo

A fundação observada é forte para o tamanho do produto: RLS está essencialmente universal nas tabelas de aplicação, há autorização interna em RPCs privilegiadas amostradas, billing/webhooks possuem controles coerentes, e o repositório já tem gates de segurança relevantes no CI.

O maior risco sistêmico atual é **complexidade e drift entre múltiplos domínios, policies, funções privilegiadas, storage, Edge Functions e documentação**.

Não foi confirmada nesta auditoria uma vulnerabilidade crítica explorável que justifique declarar incidente ativo. Foram identificadas configurações de risco e itens de hardening que devem ser tratados antes do crescimento de volume e dados sensíveis.

Após a abertura do PR documental desta auditoria, foi confirmada uma falha operacional preexistente: `Security Scan` e `Security Check` já estavam falhando de forma recorrente em PRs anteriores com a mesma base `main`. Isso não prova vulnerabilidade no produto, mas reduz a confiabilidade dos gates como mecanismo de detecção de novas regressões e passa a ser tratado como `CI-001`.

## 3. Baseline técnico observado

### 3.1 Banco e autorização

- Aproximadamente 241 tabelas no schema `public` no snapshot auditado.
- RLS habilitado em 240/241; a exceção observada foi `spatial_ref_sys` (infraestrutura PostGIS, não tabela de negócio).
- `anon` e `authenticated` não possuem `CREATE` no schema `public`.
- Funções administrativas amostradas validam `auth.uid()`, perfil/estado e papel/permissão antes de mutações privilegiadas.
- Funções de comunidade/mensageria amostradas validam identidade, ownership/membership e, em vários fluxos, rate limiting.

### 3.2 Billing

`billing-webhook` usa `verify_jwt=false` intencionalmente porque é chamado pelo Stripe. O controle correto foi observado:

- método restrito;
- limite de corpo;
- rate limiting;
- exigência de `stripe-signature`;
- validação criptográfica com `constructEvent` e webhook secret;
- uso de `service_role` somente após validação da assinatura;
- idempotência por evento;
- registro de sucesso/falha.

Classificação: **controle adequado no trecho auditado; não tratar `verify_jwt=false` isoladamente como vulnerabilidade**.

### 3.3 CI/CD e frontend

O repositório possui gates de segurança que incluem ESLint security, `npm audit` high/critical, Semgrep, Gitleaks, busca de padrões XSS/token/cookie e TypeScript strict. O build Vercel valida configuração, CSP, Turnstile, typecheck e lint antes do bundle.

A configuração Vercel observada possui CSP, HSTS, proteção contra framing, MIME sniffing, políticas de referrer/features e cache explícito para assets/HTML/service workers.

Entretanto, os workflows `Security Scan` e `Security Check` foram observados falhando em múltiplos PRs anteriores ao PR documental atual. Até o fechamento deste snapshot, a API identificou os runs/jobs, mas o download dos logs retornou `BlobNotFound`; portanto a causa raiz do step ainda não está confirmada e deve ser investigada sem mascarar o gate.

## 4. Achados ativos

| ID | Severidade | Classe | Achado | Estado |
| --- | --- | --- | --- | --- |
| SEC-001 | Alta | configuração de risco | Bucket `safety-evidence` público apesar da semântica de evidência sensível | Aberto |
| SEC-002 | Alta | hardening de autenticação | Proteção contra senhas vazadas/comprometidas desabilitada no Supabase Auth | Aberto |
| CI-001 | Alta | assurance/operabilidade | `Security Scan` e `Security Check` falham de forma recorrente, reduzindo a capacidade do CI de distinguir regressão nova de dívida preexistente | Aberto — issue #17 |
| SEC-003 | Média | hardening DB | Warnings de `function_search_path_mutable` em funções; reduzir dependência de resolução implícita | Aberto |
| SEC-004 | Média | revisão de autorização | Views `SECURITY DEFINER` apontadas pelo advisor precisam de revisão explícita de necessidade/semântica | Aberto |
| SEC-005 | Média | storage hardening | Buckets com ausência de limites explícitos de tamanho/MIME | Aberto |
| SEC-006 | Média | abuso/operabilidade | Escritas anônimas permissivas para analytics/views precisam de fronteira estreita, rate limit e deduplicação | Aberto |
| SEC-007 | Média | hygiene de secrets | Arquivos `.env`/`.env.production` versionados criam risco de futuro commit de segredo real | Aberto |
| SEC-008 | Média | performance/operabilidade | Advisor indica RLS com initplan/reavaliações e policies permissivas sobrepostas | Aberto |
| SEC-009 | Baixa | prevenção de drift | Configuração de segurança das Edge Functions declara sincronização manual com outro SSOT | Aberto |
| DOC-001 | Média | governança documental | `README.md`/`SECURITY.md` possuíam referências canônicas para arquivos inexistentes | Em correção neste PR |
| WEB-001 | A confirmar | observabilidade/produção | Auditoria visual completa do domínio público não foi concluída pela ferramenta de fetch; SEO/indexação precisa de verificação específica | Aberto |

## 5. Notas sobre severidade

### SEC-001 — `safety-evidence`

No snapshot auditado o bucket estava vazio. Portanto, a auditoria **não confirma vazamento atual de evidências**. O problema é a configuração pública antes de o bucket receber dados reais.

### SEC-002 — senhas comprometidas

É uma redução direta do risco de credential stuffing/reuso de credenciais. Deve ser ativada e validada sem depender de mudança de frontend.

### CI-001 — gates de segurança vermelhos

A falha do CI é preexistente ao PR documental: foi observada em PRs #10, #11 e #14, além do PR #16. Isso significa que a documentação não introduziu a regressão. O risco aqui é de **assurance**: quando um gate está permanentemente vermelho, uma vulnerabilidade nova pode ficar misturada ao ruído conhecido. A correção deve restaurar o gate; não convertê-lo silenciosamente em `continue-on-error`.

### SEC-003/004 — funções/views privilegiadas

O advisor fornece sinal de hardening, não prova de exploração. Na amostra manual, funções privilegiadas relevantes possuíam autorização interna adequada. A correção deve preservar a semântica existente e adicionar testes de regressão.

### SEC-008 — performance de RLS

Não classificar como vulnerabilidade automaticamente. O risco é custo crescente, latência e complexidade de avaliação conforme o volume aumenta.

## 6. Controles positivos a preservar

- RLS amplo e postura fail-closed nas tabelas de aplicação.
- Autorização explícita em RPCs privilegiadas amostradas.
- Validação correta do Stripe webhook antes de `service_role`.
- Idempotência em billing.
- CORS/security headers centralizados em Edge Functions.
- Respostas 5xx genéricas ao cliente.
- CI com múltiplos scanners/gates — a composição é boa, embora `CI-001` exija restaurar a saúde operacional desses gates.
- TypeScript strict e validações arquiteturais/SSOT.
- CSP sem `unsafe-eval` em `script-src` no snapshot auditado.

## 7. Limitações do snapshot

- A amostragem manual de RPCs não prova segurança de todas as funções do banco.
- A ferramenta de navegação não conseguiu completar uma auditoria visual end-to-end de `acheguese.com.br` nesta rodada.
- Os logs completos do `Security Scan`/`Security Check` não puderam ser baixados pela API no momento do diagnóstico inicial; a causa raiz de `CI-001` ainda precisa de logs de Actions.
- Estado de advisor, policies, buckets e funções pode mudar após este snapshot; reauditorias devem comparar contra este documento.

## 8. Próxima decisão

Nenhuma feature nova que aumente coleta de evidência, autenticação, mensageria privada, billing ou acesso administrativo deve ampliar superfície antes dos itens P1 do plano de remediação estarem concluídos ou explicitamente aceitos como risco.

A fonte operacional para execução é o checklist ativo, não este relatório.
