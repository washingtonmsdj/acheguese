# Achegue-se — Auditoria Técnica e Plano Canônico de Implementação

**Status:** ATIVO / CANÔNICO  
**Data da auditoria:** 2026-08-19  
**Escopo:** GitHub + Supabase + Vercel  
**Repositório:** `washingtonmsdj/acheguese`  
**Branch auditada:** `main`  
**SHA de referência do frontend:** `694b4f962cc26695abc3bd87afed0e806f5cf580`  
**Supabase:** projeto `acheguese` / ref `xhdowzacfujckjelqhtd`  
**Vercel:** projeto `acheguese` / domínio `acheguese.com.br`

> Este documento é o plano operacional canônico para os achados da auditoria de 19/08/2026. Ele deve ser atualizado conforme cada correção for implementada, validada e promovida a produção. Não marcar um item como concluído apenas porque o código foi escrito: o critério de aceite precisa ter sido comprovado no ambiente correspondente.

---

## 1. Objetivo

Registrar em um único lugar:

- o estado técnico observado em GitHub, Supabase e Vercel;
- os riscos confirmados, riscos residuais e dívidas de hardening;
- a ordem de implementação recomendada;
- os critérios objetivos de aceite;
- os comandos/gates mínimos de validação;
- a política de release necessária para manter GitHub, Supabase e Vercel reproduzíveis e auditáveis.

Este documento não substitui os SSOTs de domínio. Ele é o **SSOT operacional da auditoria, correções e hardening transversal**.

---

## 2. Resumo executivo

O Achegue-se possui uma base de segurança e arquitetura acima da média para um SPA React/Vite com Supabase:

- ampla adoção de RLS;
- RPCs sensíveis com autorização explícita em várias áreas;
- uso de `SECURITY DEFINER` com `search_path` fixado em fluxos críticos inspecionados;
- tokens de compartilhamento de corrida gerados no servidor com entropia adequada;
- CSP, HSTS, `nosniff`, frame protection e políticas de cache na Vercel;
- Vitest, Playwright, validações de arquitetura, SSOT, migrations e segurança;
- jobs de banco e Edge Functions críticos operando sem evidência de incidente generalizado na amostra de logs revisada.

O principal risco sistêmico não está em um bypass simples de autenticação. Está na **cadeia de autoridade de release**:

1. a branch `main` não está protegida;
2. o Supabase de produção contém migrations e versões de Edge Functions posteriores ao estado versionado na `main`;
3. parte da documentação declarada como canônica aponta para arquivos inexistentes;
4. portanto, a produção ainda não pode ser considerada totalmente reproduzível a partir do GitHub.

### Classificação executiva

| Área | Estado | Interpretação |
| --- | --- | --- |
| Arquitetura de código | 🟢 | Estrutura modular, SSOT e gates existentes |
| Banco / RLS | 🟢/🟡 | Cobertura forte, com resíduos de hardening e performance |
| Auth | 🟡 | Boa base; leaked-password protection ainda desabilitada |
| GitHub / governança | 🔴 | `main` desprotegida e checks não obrigatórios |
| GitHub → Vercel | 🟢 | Deploy auditado corresponde ao SHA da `main` |
| GitHub → Supabase | 🔴 | Drift confirmado de migrations/Edge Functions |
| Runtime | 🟢 | Sem evidência de falha generalizada na janela inspecionada |
| Performance PostgreSQL | 🟡 | Índices/RLS/policies requerem saneamento progressivo |
| Documentação / SSOT | 🟡/🔴 | Links canônicos quebrados e governança parcial por domínio |

---

## 3. Modelo de prioridade

### P0 — Emergência

Vazamento ativo, acesso privilegiado sem autorização, perda/corrupção em andamento, comprometimento de credencial privilegiada ou indisponibilidade grave.

**Estado na auditoria:** nenhum P0 confirmado.

### P1 — Alta prioridade

Problema sistêmico que pode permitir release não validado, drift não reproduzível, perda de integridade operacional ou redução material da capacidade de auditoria/rollback.

### P2 — Prioridade média

Hardening, consistência, performance, redução de superfície privilegiada e melhoria de governança que devem ser resolvidos antes de escala ampla.

### P3 — Melhoria contínua

Defesa em profundidade, ergonomia operacional, custo, limpeza e padronização.

---

# 4. Achados

## F-001 — `main` sem branch protection

**Prioridade:** P1  
**Status:** ABERTO  
**Área:** GitHub / CI / Release

### Evidência

A branch `main` foi observada com proteção desabilitada, sem required status checks obrigatórios.

O projeto já possui vários gates relevantes, mas, sem branch protection/ruleset, esses gates podem ser contornados por push/merge direto.

### Risco

- código não certificado pode chegar à `main`;
- Vercel pode publicar uma alteração sem todos os gates desejados;
- migrations/contratos podem ser alterados sem review obrigatório;
- force-push ou mudanças administrativas podem reduzir rastreabilidade;
- a existência de CI não equivale a enforcement de CI.

### Correção

Criar um ruleset/branch protection para `main` com, no mínimo:

- [ ] pull request obrigatório;
- [ ] ao menos 1 review obrigatório para mudanças sensíveis quando houver equipe disponível;
- [ ] dismiss stale approvals após novos commits;
- [ ] required status checks para build, typecheck, segurança, migrations e validações arquiteturais críticas;
- [ ] branch up-to-date antes do merge, se compatível com o fluxo;
- [ ] bloquear force-push;
- [ ] bloquear deletion;
- [ ] restringir bypass administrativo ao mínimo necessário;
- [ ] exigir resolução de conversas de review quando aplicável.

### Critério de aceite

- consulta da branch/ruleset mostra proteção ativa;
- tentativa de merge sem checks obrigatórios falha;
- tentativa de push direto por papel não autorizado falha;
- checks definidos como release gates não podem ser ignorados no fluxo normal.

---

## F-002 — Drift confirmado entre GitHub e Supabase de produção

**Prioridade:** P1  
**Status:** ABERTO  
**Área:** Supabase / GitHub / Release / Disaster Recovery

### Evidência

O Supabase de produção contém migrations aplicadas em 19/08/2026 que não estavam reproduzíveis a partir da `main` auditada, incluindo, entre outras:

- `20260819085526_server_generate_ride_share_tokens`;
- `20260819090115_lock_down_qr_code_browser_writes`;
- `20260819090920_drop_legacy_ride_request_share_token`;
- `20260819122126_harden_dispatch_timeout_scheduler`;
- `20260819125641_guard_spatial_ref_sys_browser_writes`.

Também foi observado indício de que código de Edge Function implantado está à frente do helper correspondente disponível na `main`.

### Risco

- produção não é reconstruível a partir do repositório;
- rollback e disaster recovery ficam menos confiáveis;
- revisão de segurança no GitHub não representa integralmente o runtime;
- CI de migrations pode aprovar um estado que não corresponde ao banco real;
- correções manuais podem ser sobrescritas ou esquecidas.

### Correção imediata

Até a reconciliação terminar:

- [ ] evitar novas mudanças manuais de schema/functions em produção, exceto emergência documentada;
- [ ] inventariar todas as migrations remotas ausentes localmente;
- [ ] recuperar o SQL exato dessas migrations e versioná-lo em `supabase/migrations/`;
- [ ] comparar todas as Edge Functions implantadas com `supabase/functions/`;
- [ ] trazer para GitHub qualquer versão implantada que seja posterior/diferente;
- [ ] validar que o repositório consegue reconstruir o contrato atual do banco;
- [ ] registrar provenance de deploy por commit SHA.

### Controle permanente

Implementar um gate que compare:

`migrations versionadas` ↔ `supabase_migrations.schema_migrations` ↔ `estado esperado do release`.

Para Edge Functions, manter manifesto de release contendo, por função:

- nome;
- versão/deployment esperado;
- hash do source/bundle ou commit SHA;
- data de promoção;
- ambiente.

### Critério de aceite

- todas as migrations remotas aparecem no GitHub na ordem correta;
- não há migration aplicada em produção sem arquivo equivalente versionado;
- Edge Functions críticas têm source equivalente ao deployment atual;
- um clone limpo + processo documentado consegue reproduzir o estado esperado;
- CI falha quando existe migration remota não versionada ou função divergente.

---

## F-003 — Documentação canônica quebrada

**Prioridade:** P2  
**Status:** EM CORREÇÃO POR ESTE DOCUMENTO  
**Área:** Governança / Segurança / Onboarding

### Evidência

O README apontava `docs/audits/MASTER_REPORT.md` como auditoria estrutural ativa, mas o caminho não existia na `main` auditada.

O `SECURITY.md` apontava como canônicos:

- `docs/SECURITY.md`;
- `docs/SUPABASE_SECRETS.md`;
- `docs/EDGE_FUNCTION_SECRETS.md`.

Esses caminhos também não existiam na `main` auditada.

### Risco

- operadores seguem instruções inexistentes ou antigas;
- procedimentos de segredo/release podem ser duplicados ou contraditórios;
- um auditor não consegue identificar o SSOT real;
- documentação deixa de funcionar como controle operacional.

### Correção

Este arquivo passa a ser o documento canônico para a auditoria e plano transversal.

- [x] criar `AUDITORIA_E_PLANO_IMPLEMENTACAO.md` na raiz;
- [ ] atualizar `README.md` para apontar este documento como auditoria/plano ativos;
- [ ] atualizar `SECURITY.md` para remover links canônicos inexistentes;
- [ ] adicionar validação automática de links/caminhos documentais relevantes;
- [ ] definir owner explícito da documentação operacional.

### Critério de aceite

- nenhum link declarado como canônico retorna arquivo inexistente;
- `npm run validate:docs-structure` passa;
- CI possui checagem de referências canônicas ou equivalente.

---

## F-004 — Leaked Password Protection desabilitada no Supabase Auth

**Prioridade:** P2  
**Status:** ABERTO  
**Área:** Auth

### Evidência

O Security Advisor do Supabase retornou `Leaked Password Protection Disabled` na auditoria.

### Risco

Senhas conhecidas em vazamentos podem continuar sendo usadas, aumentando risco de credential stuffing e reutilização de credenciais comprometidas.

### Correção

- [ ] habilitar leaked password protection / HaveIBeenPwned no Supabase Auth, conforme disponibilidade do plano;
- [ ] confirmar política mínima de senha;
- [ ] preservar MFA/TOTP e políticas de reautenticação já existentes;
- [ ] rodar o Advisor novamente após a mudança.

### Critério de aceite

O Security Advisor deixa de retornar `auth_leaked_password_protection` e testes de autenticação continuam passando.

---

## F-005 — Superfície extensa de RPCs `SECURITY DEFINER`

**Prioridade:** P2  
**Status:** ABERTO / REQUER INVENTÁRIO  
**Área:** PostgreSQL / Authorization

### Evidência

O Advisor aponta várias funções `SECURITY DEFINER` executáveis por `anon` ou `authenticated`.

A amostra inspecionada de funções sensíveis mostrou controles adequados em vários casos: `search_path` explícito, validação de `auth.uid()`, ownership/admin checks e auditoria. Portanto, o warning não deve ser convertido automaticamente em vulnerabilidade.

### Risco residual

Com dezenas de funções privilegiadas, a segurança depende de cada função preservar corretamente:

- identidade do chamador;
- autorização do recurso;
- validação de parâmetros;
- `search_path` seguro;
- rate limit/limites de lote quando necessário;
- resposta mínima;
- grants intencionais.

Uma única função fora do padrão pode criar bypass.

### Correção

Criar inventário/allowlist de RPCs `SECURITY DEFINER` contendo:

- assinatura;
- owner;
- roles com EXECUTE;
- motivo para `SECURITY DEFINER`;
- autorização interna utilizada;
- `search_path`;
- exposição pública intencional ou não;
- teste negativo correspondente.

Depois:

- [ ] revogar EXECUTE de `anon` onde não for estritamente necessário;
- [ ] revogar EXECUTE de `authenticated` em rotinas administrativas broker-only;
- [ ] preferir `SECURITY INVOKER` onde ele seja suficiente;
- [ ] mover helpers internos para schema não exposto quando apropriado;
- [ ] adicionar teste que falha para qualquer nova função `SECURITY DEFINER` fora da allowlist.

### Critério de aceite

- 100% das funções `SECURITY DEFINER` expostas possuem classificação explícita;
- nenhuma função administrativa depende apenas de o usuário estar autenticado;
- nenhuma função crítica usa `search_path` mutável;
- CI detecta regressões de grants e novas funções fora da allowlist.

---

## F-006 — `spatial_ref_sys` usa controle compensatório em vez de menor privilégio direto

**Prioridade:** P2  
**Status:** HARDENING ABERTO  
**Área:** PostGIS / Grants

### Evidência

`public.spatial_ref_sys` permanece sem RLS e os papéis de browser apresentam grants de escrita no catálogo de privilégios.

Entretanto, a migration remota `guard_spatial_ref_sys_browser_writes` instalou triggers que bloqueiam INSERT/UPDATE/DELETE/TRUNCATE para `anon` e `authenticated`. Também foi confirmado que esses papéis não possuem `CREATE` em `public` nem em `extensions`.

**Conclusão da auditoria:** não foi classificado como bypass explorável confirmado; existe defesa compensatória ativa.

### Melhoria recomendada

O estado preferido é remover a permissão na origem em vez de depender do trigger.

- [ ] estudar compatibilidade do PostGIS gerenciado antes de alterar grants;
- [ ] revogar DML/TRUNCATE de `anon` e `authenticated` se suportado;
- [ ] preservar somente permissões realmente necessárias;
- [ ] manter os triggers como defesa adicional se não prejudicarem operação/upgrade;
- [ ] reexecutar Advisor e testes geoespaciais.

### Critério de aceite

- browser roles não possuem privilégios de escrita efetivos sobre `spatial_ref_sys`;
- funcionalidades geoespaciais continuam operacionais;
- upgrade/manutenção do PostGIS não é quebrado pela mudança.

---

## F-007 — Autoridade de dispatch ainda pode ser consolidada

**Prioridade:** P2  
**Status:** ABERTO  
**Área:** Mobility / Concorrência / PostgreSQL

### Evidência

A migration remota `harden_dispatch_timeout_scheduler` já moveu uma parte relevante do retry/timeout para PostgreSQL usando mecanismos adequados de concorrência, como `FOR UPDATE ... SKIP LOCKED`, limites de tentativa e audit trail.

Ainda existe lógica de dispatch inicial em Edge Function, criando autoridade dividida entre runtime Edge e banco para decisões críticas.

### Risco

- concorrência entre workers;
- duplicidade de atribuição;
- regras divergentes entre Edge e banco;
- dificuldade de provar atomicidade fim a fim.

### Correção

- [ ] definir um único comando transacional de autoridade no PostgreSQL para claim/assignment crítico;
- [ ] Edge Function vira broker/orquestrador, não dona da transição final;
- [ ] usar locking/CAS/idempotência no banco;
- [ ] garantir audit log único;
- [ ] adicionar testes de concorrência/replay.

### Critério de aceite

Duas execuções concorrentes para a mesma corrida não conseguem produzir dois motoristas válidos ou duas transições incompatíveis.

---

## F-008 — Dívida de performance no PostgreSQL

**Prioridade:** P2  
**Status:** ABERTO / ITERATIVO  
**Área:** Database Performance

### Evidência

O Performance Advisor aponta grupos como:

- foreign keys sem índice de suporte;
- RLS com chamadas de identidade reavaliadas por linha em alguns contratos;
- múltiplas permissive policies para a mesma operação;
- índices aparentemente não utilizados.

### Correção

Executar por impacto, não por volume de warnings.

#### Ordem

1. [ ] mapear queries quentes e tabelas de maior crescimento;
2. [ ] indexar FKs usadas em joins/deletes/updates críticos;
3. [ ] corrigir resíduos de `auth_rls_initplan` onde aplicável;
4. [ ] consolidar policies redundantes sem alterar semântica;
5. [ ] revisar índices não utilizados somente com workload representativo;
6. [ ] medir antes/depois com `EXPLAIN (ANALYZE, BUFFERS)` quando seguro em ambiente adequado.

### Não fazer

- não remover índices em massa apenas porque o Advisor os chama de unused;
- não reescrever RLS sensível sem testes de autorização positivos e negativos;
- não otimizar tabelas frias antes das rotas quentes.

### Critério de aceite

Melhora mensurável nas consultas-alvo, sem regressão de autorização e sem aumento relevante de locks/escrita.

---

## F-009 — Grants do schema `private` podem ser mais restritos

**Prioridade:** P2/P3  
**Status:** ABERTO  
**Área:** Least Privilege

### Evidência

O schema `private` não está entre os schemas expostos pela Data API, o que reduz a superfície externa. Não foi encontrada exposição direta equivalente a `/rest/v1/rpc` desse schema na configuração auditada.

Ainda assim, existem permissões de `USAGE`/`EXECUTE` mais amplas que o mínimo necessário para papéis de browser.

### Correção

- [ ] inventariar funções privadas realmente chamadas por fluxos autorizados;
- [ ] revogar `EXECUTE` desnecessário de `anon`/`authenticated`;
- [ ] manter grants por allowlist;
- [ ] criar gate que impeça adicionar `private` aos schemas expostos sem decisão explícita.

### Critério de aceite

Browser roles possuem apenas privilégios privados necessários e qualquer mudança de exposição é detectada por CI.

---

## F-010 — Higiene de `.env` pode ser menos ambígua

**Prioridade:** P3  
**Status:** ABERTO  
**Área:** Secrets / Developer Experience

### Evidência

O repositório trata `.env` como template público e possui regras para impedir `service_role`. Na amostra auditada não foi encontrado segredo privilegiado real versionado.

Porém arquivos com nomes como `.env.production` versionados criam risco humano de alguém inserir valor real em um arquivo já rastreado.

### Correção

- [ ] preferir nomes explicitamente de template (`.env.example`, `.env.production.example`);
- [ ] manter arquivos reais em mecanismos de segredo da Vercel/Supabase/ambiente local;
- [ ] secret scan no CI;
- [ ] validar ausência de chaves `service_role`, JWT signing secret e credenciais de provedores em blobs Git.

### Critério de aceite

Nenhum arquivo versionado com nome de ambiente real é necessário para armazenar valores de runtime e os templates contêm somente placeholders/publicáveis.

---

## F-011 — Hardening adicional de GitHub Actions

**Prioridade:** P3  
**Status:** ABERTO  
**Área:** Supply Chain

### Correção

- [ ] pin de actions de terceiros por commit SHA em workflows sensíveis;
- [ ] `permissions:` mínimo por workflow/job;
- [ ] evitar tokens com escopo maior que o necessário;
- [ ] revisar secrets disponíveis em PRs/forks;
- [ ] manter Dependabot/Renovate ou processo equivalente para atualização dos pins.

### Critério de aceite

Workflows de release/segurança usam dependências pinadas e permissões explícitas mínimas.

---

## F-012 — Frequência de `media-assets-cleanup` deve ser justificada por SLO/custo

**Prioridade:** P3  
**Status:** ABERTO  
**Área:** Operação / Custo

### Evidência

Na janela de logs auditada, `media-assets-cleanup` executava aproximadamente a cada 5 minutos, normalmente concluindo com HTTP 200 e duração na ordem de poucos segundos.

### Correção

- [ ] medir backlog médio e tempo máximo aceitável para limpeza;
- [ ] calcular custo/execuções por dia;
- [ ] manter 5 min apenas se houver justificativa de produto/SLO;
- [ ] considerar frequência adaptativa ou maior intervalo se a fila normalmente estiver vazia.

### Critério de aceite

Frequência documentada com SLO e custo esperado, sem crescimento indevido de ativos órfãos.

---

# 5. Pontos positivos confirmados

Estes itens foram considerados controles válidos na auditoria e devem ser preservados durante as correções.

## 5.1 Vercel / HTTP

- CSP configurada;
- `frame-ancestors 'none'`;
- `X-Frame-Options: DENY`;
- HSTS;
- `X-Content-Type-Options: nosniff`;
- Referrer Policy;
- cache longo para assets imutáveis;
- HTML e service worker com política que evita servir release antigo por cache indevido;
- build de produção auditado concluído com sucesso;
- deployment de produção auditado correspondia ao SHA da `main`.

## 5.2 Supabase / segurança

- cobertura de RLS ampla no schema público;
- rotinas sensíveis amostradas com authorization checks explícitos;
- `search_path` fixado em fluxos `SECURITY DEFINER` importantes inspecionados;
- token de segurança de corrida gerado server-side com 16 bytes aleatórios (32 hex chars), expiração e revogação;
- scheduler de timeout de dispatch com locking/limites/auditoria;
- schema `private` não exposto pela Data API na configuração auditada;
- triggers de compensação instalados para impedir browser DML em `spatial_ref_sys`.

## 5.3 Engenharia

- Vitest e Playwright;
- validações de SSOT;
- validações arquiteturais incrementais e de governança;
- validação de migrations;
- checks de segurança e autoridade;
- documentação arquitetural forte em Territory e Feed.

---

# 6. Plano de implementação por fases

## Fase 0 — Congelar drift e estabelecer baseline

**Objetivo:** não aumentar a diferença entre GitHub e produção enquanto a reconciliação acontece.

- [ ] registrar SHA atual de GitHub/Vercel;
- [ ] exportar lista de migrations remotas;
- [ ] listar versões de todas as Edge Functions implantadas;
- [ ] registrar advisors atuais de segurança/performance;
- [ ] evitar mutation manual de produção fora de procedimento de emergência;
- [ ] criar inventário de exceções existentes.

**Saída:** baseline reproduzível e lista fechada de divergências.

---

## Fase 1 — Governança obrigatória de GitHub

**Objetivo:** tornar os gates existentes uma barreira real de release.

- [ ] proteger `main`;
- [ ] definir required checks;
- [ ] revisar quem pode bypassar;
- [ ] impedir force-push/delete;
- [ ] definir política para migrations e mudanças de segurança;
- [ ] considerar CODEOWNERS para `supabase/`, `.github/workflows/`, `SECURITY.md` e contracts críticos.

**Definition of Done:** nenhum release normal consegue entrar em `main` sem os gates definidos.

---

## Fase 2 — Reconciliar Supabase com GitHub

**Objetivo:** transformar GitHub novamente em source of truth reproduzível.

- [ ] versionar migrations remotas ausentes;
- [ ] comparar schema esperado vs remoto;
- [ ] comparar Edge Functions locais vs implantadas;
- [ ] importar mudanças válidas feitas fora do Git;
- [ ] remover/aposentar código local obsoleto somente após prova de que não é runtime ativo;
- [ ] criar manifesto de provenance;
- [ ] criar check automático de drift.

**Definition of Done:** produção não contém mudança estrutural ou função crítica sem equivalente versionado.

---

## Fase 3 — Hardening de segurança

**Objetivo:** reduzir controles compensatórios e superfície privilegiada.

- [ ] habilitar leaked-password protection;
- [ ] inventariar `SECURITY DEFINER`;
- [ ] allowlist de grants;
- [ ] reduzir grants de `private`;
- [ ] limpar grants de `spatial_ref_sys` de forma compatível com PostGIS;
- [ ] revisar extensões instaladas em `public` (`unaccent`, `pg_trgm`, `citext`, `postgis`) antes de qualquer migração de schema;
- [ ] testar autorização negativa para admins, moderação, trust, safety e messaging.

**Definition of Done:** Advisor residual possui somente warnings aceitos/documentados e todo privilégio exposto tem owner/motivo/teste.

---

## Fase 4 — Consistência, concorrência e performance

**Objetivo:** preparar o sistema para maior carga sem perder propriedades de autorização.

- [ ] consolidar autoridade transacional de dispatch;
- [ ] corrigir FKs sem índice nas rotas quentes;
- [ ] otimizar RLS com initplan onde aplicável;
- [ ] reduzir policies redundantes;
- [ ] revisar índices ociosos com dados reais;
- [ ] medir consultas de feed, território, messaging, mobility, business e search.

**Definition of Done:** principais fluxos têm SLO, índices coerentes e testes de concorrência/authorization.

---

## Fase 5 — Governança documental e observabilidade

**Objetivo:** garantir que operação e arquitetura continuem coerentes após o hardening.

- [ ] link checker/validador de docs canônicas;
- [ ] atualizar status deste documento a cada entrega;
- [ ] governança macro para Community, Business, Services, Events, Mobility, Search, Notifications, Messaging e AI em lotes priorizados;
- [ ] SLOs e alertas para jobs/Edge Functions críticos;
- [ ] rotina periódica de advisor/drift/release audit.

**Definition of Done:** documentação canônica não possui links quebrados e a divergência de produção é detectável automaticamente.

---

# 7. Backlog priorizado

## P1 — executar primeiro

- [ ] **P1-01** Proteger `main` e tornar checks obrigatórios.
- [ ] **P1-02** Reconciliar migrations Supabase remotas com GitHub.
- [ ] **P1-03** Reconciliar Edge Functions implantadas com source versionado.
- [ ] **P1-04** Criar gate de provenance/drift GitHub ↔ Supabase.

## P2 — após estabilização de provenance

- [ ] **P2-01** Habilitar leaked-password protection.
- [ ] **P2-02** Inventário/allowlist de `SECURITY DEFINER`.
- [ ] **P2-03** Reduzir grants desnecessários em `private`.
- [ ] **P2-04** Remover grants browser-write de `spatial_ref_sys` se compatível.
- [ ] **P2-05** Consolidar autoridade do dispatch.
- [ ] **P2-06** Corrigir FKs sem índice prioritárias.
- [ ] **P2-07** Reduzir resíduos de RLS initplan/policies redundantes.
- [ ] **P2-08** Fechar governança documental canônica.

## P3 — melhoria contínua

- [ ] **P3-01** Pin de GitHub Actions por SHA.
- [ ] **P3-02** `permissions:` mínimos em workflows.
- [ ] **P3-03** Simplificar estratégia de `.env` para templates explícitos.
- [ ] **P3-04** Revisar frequência/custo de cleanup de mídia.
- [ ] **P3-05** Revisar extensões em `public` com plano de migração seguro.
- [ ] **P3-06** Revisar índices unused somente com workload real.

---

# 8. Política de release proposta

Após a Fase 2, a seguinte regra passa a ser não negociável:

## 8.1 Código

Toda mudança de produção deve estar associada a um commit/PR rastreável.

## 8.2 Banco

Nenhuma alteração estrutural permanente deve ser aplicada apenas manualmente no Dashboard/SQL Editor sem migration equivalente versionada.

Em emergência:

1. aplicar a contenção mínima necessária;
2. registrar horário, executor, SQL e motivo;
3. criar imediatamente a migration equivalente;
4. validar idempotência/compatibilidade;
5. reconciliar GitHub antes do próximo release normal.

## 8.3 Edge Functions

Nenhum deployment manual deve permanecer como versão canônica sem o source correspondente na branch de release.

## 8.4 Vercel

Produção deve apontar para commit conhecido e certificado. Rollback deve apontar para deployment/commit conhecido, não para um estado sem provenance.

## 8.5 Segredos

- segredo real nunca entra no Git;
- `service_role` nunca entra em `VITE_*` ou browser bundle;
- JWT signing secret, provider secrets, cron secrets e chaves administrativas permanecem em stores de segredo apropriados;
- templates versionados contêm placeholders ou valores públicos somente.

---

# 9. Gates mínimos antes de release

Manter os comandos existentes e tornar os aplicáveis obrigatórios no CI:

```bash
npm run security:validate
npm run security:config:validate
npm audit
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
npm run validate:ssot
npm run validate:hardcodes
npm run validate:architecture:incremental -- --json
npm run validate:architecture:governance -- --json
npm run validate:docs-structure
npm run typecheck
npm run build
node scripts/verify-deploy-ready.mjs
```

Além deles, adicionar progressivamente:

```text
validate:supabase-drift
validate:edge-function-provenance
validate:canonical-doc-links
validate:security-definer-allowlist
validate:branch-release-contract
```

Os nomes acima são propostas de contratos; podem ser adaptados à convenção existente desde que a função permaneça equivalente.

---

# 10. Testes obrigatórios por classe de mudança

## Auth

- login válido/inválido;
- logout determinístico;
- refresh/revogação;
- MFA quando exigido;
- senha comprometida rejeitada após habilitar HIBP;
- rate limit/anti-enumeration.

## RLS / RPC

Para cada mudança sensível:

- anon permitido;
- anon proibido;
- authenticated owner permitido;
- authenticated non-owner proibido;
- admin permitido quando aplicável;
- perfil banido/restrito proibido quando aplicável;
- input fora do contrato rejeitado.

## Mobility / concorrência

- duas aceitações simultâneas;
- timeout concorrente com aceite;
- replay da mesma request;
- retries de dispatch;
- idempotência após erro parcial.

## Release / drift

- migration local ausente remotamente;
- migration remota ausente localmente;
- Edge Function local diferente da implantada;
- deploy Vercel em SHA diferente do release aprovado.

---

# 11. Domínios e governança arquitetural

O marco arquitetural existente mostra maturidade maior em **Territory** e **Feed**, com Feed formalmente congelado. Os seguintes domínios ainda requerem governança macro progressiva:

- Community;
- Business;
- Services / Professional;
- Events;
- Mobility;
- Search;
- Notifications;
- Messaging;
- AI.

A recomendação é **não tentar congelar todos ao mesmo tempo**. Ordem sugerida, baseada em risco transversal:

1. Mobility;
2. Messaging;
3. Notifications;
4. Community;
5. Business / Services;
6. Search;
7. Events;
8. AI.

Cada domínio deve chegar a:

- ownership explícito;
- SSOT de dados;
- portas públicas autorizadas;
- contratos de autorização;
- roadmap;
- auditoria;
- milestone;
- critérios de freeze quando maduros.

---

# 12. Registro de decisões desta auditoria

## D-001 — Não classificar `spatial_ref_sys` como vulnerabilidade explorável confirmada

Motivo: embora os grants de escrita apareçam no catálogo e RLS esteja desabilitado, existem triggers ativos que bloqueiam DML/TRUNCATE de `anon` e `authenticated`, e esses papéis não possuem `CREATE` nos schemas relevantes. Permanece um item de hardening.

## D-002 — Não transformar todos os warnings `SECURITY DEFINER` em vulnerabilidades

Motivo: funções sensíveis amostradas possuíam autorização explícita e `search_path` controlado. A superfície é grande e exige inventário, mas severidade deve ser baseada no contrato real de cada RPC.

## D-003 — Considerar drift GitHub ↔ Supabase como o problema sistêmico principal

Motivo: controles corretos aplicados fora do source of truth continuam sendo um risco de release, rollback e auditoria.

## D-004 — Preservar a arquitetura de headers da Vercel

Motivo: o baseline auditado de CSP/HSTS/frame/cache está adequado e não deve ser simplificado durante outras correções.

---

# 13. Como atualizar este documento

Para cada item concluído:

1. trocar o status somente após validação;
2. marcar checklist correspondente;
3. registrar PR/commit/migration/deployment associado;
4. registrar data da validação;
5. registrar resultado do gate/Advisor relevante;
6. se o desenho mudou, atualizar também o SSOT de domínio correspondente.

Modelo:

```text
Item: P1-02
Status: CONCLUÍDO
PR/Commit: <id>
Migration(s): <versões>
Validado em: <data>
Ambiente: production
Evidência: validate:migrations:remote PASS + drift=0
```

---

# 14. Estado da execução

| Item | Estado inicial em 2026-08-19 |
| --- | --- |
| P1-01 Branch protection | ABERTO |
| P1-02 Migrations Supabase reconciliadas | ABERTO |
| P1-03 Edge Functions reconciliadas | ABERTO |
| P1-04 Gate automático de drift | ABERTO |
| P2-01 Leaked password protection | ABERTO |
| P2-02 SECURITY DEFINER allowlist | ABERTO |
| P2-03 Private schema grants | ABERTO |
| P2-04 PostGIS grants | ABERTO |
| P2-05 Dispatch authority | ABERTO |
| P2-06/07 Performance/RLS | ABERTO |
| P2-08 Documentação canônica | EM ANDAMENTO |

---

## Veredito

O Achegue-se não apresentou, nesta auditoria, evidência de P0 ou de uma falha generalizada de autorização em produção. A base técnica possui controles reais e úteis.

O próximo salto de maturidade não depende de adicionar mais features nem mais scanners. Depende de transformar os controles existentes em uma **cadeia obrigatória e reproduzível de release**:

> **GitHub versiona e aprova → CI prova → Supabase/Vercel promovem → produção continua reproduzível → drift é detectado automaticamente.**

Enquanto essa cadeia não estiver fechada, o projeto permanece funcional e razoavelmente protegido, mas com risco operacional evitável em auditoria, rollback e manutenção de segurança.
