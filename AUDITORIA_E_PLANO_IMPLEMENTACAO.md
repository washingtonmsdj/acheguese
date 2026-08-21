# Achegue-se — Auditoria Técnica e Plano Canônico de Implementação

**Status:** ATIVO / CANÔNICO  
**Versão do plano:** V2 — reauditoria de 20/08/2026  
**Data da reauditoria:** 2026-08-20  
**Escopo:** GitHub + Supabase + Vercel  
**Repositório:** `washingtonmsdj/acheguese`  
**Branch auditada:** `main`  
**SHA de referência:** `983d95e72426ae41c1680afbabe395b3ebf61717`  
**Supabase:** projeto `Achegue-se` / ref `xhdowzacfujckjelqhtd`  
**Vercel:** projeto `acheguese` / domínio `acheguese.com.br`

> Este arquivo é o **SSOT operacional da auditoria, correções, hardening e rollout transversal**. Um item só pode ser marcado como concluído quando o código, a configuração e o runtime correspondente tiverem sido comprovados. Código escrito, PR aberto ou migration versionada não equivalem a produção corrigida.

---

## 1. Objetivo e regra de leitura

Este plano responde quatro perguntas:

1. **O que já foi corrigido e comprovado?**
2. **O que está implementado, mas ainda não foi integrado ou promovido?**
3. **O que ainda precisa ser implementado?**
4. **O que está bloqueado por CI, Vercel, Supabase ou autoridade da plataforma?**

Legenda usada neste documento:

- `DONE` — implementado e reconciliado no ambiente correspondente;
- `READY/PR` — implementação existe em PR, mas ainda não integra `main`/runtime;
- `OPEN` — trabalho real ainda precisa ser feito;
- `BLOCKED` — a próxima ação depende de infraestrutura/plataforma/validação autoritativa;
- `PLATFORM` — alteração depende de owner/extensão/plataforma e não deve ser forçada pelo papel atual;
- `P1` — bloqueia segurança, privacidade, integridade de rollout ou operação crítica;
- `P2` — hardening, menor privilégio, performance ou manutenção relevante, mas sem evidência atual de incidente crítico.

---

## 2. Resumo executivo — estado real em 20/08/2026

O projeto possui uma base de segurança significativa — RLS ampla, validações de arquitetura, migrations versionadas, CSP/HSTS, brokers privilegiados, testes e vários gates fail-closed — porém **a principal dívida atual mudou**.

A reauditoria não aponta mais “migration desconhecida” como o maior risco. As migrations críticas mais recentes já foram reconciliadas em Git. O risco principal agora está em **fluxos ativos cujo runtime ainda não está certificado ou cujo contrato está quebrado**.

### Estado confirmado

- `main` em `983d95e72426ae41c1680afbabe395b3ebf61717`;
- Supabase remoto com **366 migrations registradas**;
- migration remota mais recente: `20260820081746_harden_classified_report_rpc_contract`;
- Supabase remoto com **43 Edge Functions implantadas** no inventário atual;
- migrations críticas `20260820012139`, `20260820025810` e `20260820081746` já reconciliadas em `main`;
- gate de migrations remoto/proveniência já existe em `package.json` (`validate:migrations:remote`, `validate:migrations:provenance`);
- guard fail-closed de canary para `admin-list-users` já está em `main`;
- nenhum DDL novo e nenhum Edge deploy foram executados durante esta reauditoria.

### Riscos que hoje concentram P1

1. **LGPD/exclusão de conta:** fluxo ativo, mas arquitetura antiga está quebrada por drift de schema; `privacy-rpc.cancelAccountDeletion` implantado referencia objetos removidos.
2. **Edge runtime/proveniência:** há funções versionadas com callers ativos, mas ausentes do runtime, além de runtimes implantados atrás do source desejado.
3. **CI autoritativa:** GitHub Actions continua falhando antes dos steps de repositório; Vercel também apresenta `build-rate-limit` em previews.
4. **Sessão/Auth:** `public.user_sessions` não representa as sessões reais; a autoridade deve permanecer em Supabase Auth.
5. **Admin e território:** contratos ativos estavam inconsistentes; correções existem em PR, ainda sem rollout.
6. **HIBP:** compromised password protection permanece desabilitado.
7. **SECURITY DEFINER / menor privilégio:** inventário está muito mais claro, mas allowlist semântica e grants residuais ainda não foram concluídos.
8. **PostGIS:** advisory residual depende de ownership `supabase_admin` e não deve ser forçado pelo papel atual.

---

## 3. Estado das migrations e proveniência

### 3.1 Baseline remoto

- migrations registradas: **366**;
- versão mais recente observada: **`20260820081746`**;
- migrations críticas recentes presentes no remoto:
  - `20260820000837_harden_active_admin_role_validity_contract`;
  - `20260820012139_filter_admin_role_display_validity`;
  - `20260820025810_restrict_private_classified_command_grants`;
  - `20260820081746_harden_classified_report_rpc_contract`.

### 3.2 O que foi reconciliado

`DONE`:

- `20260820025810_restrict_private_classified_command_grants` — reconciliada via PR #45;
- `20260820081746_harden_classified_report_rpc_contract` — reconciliada via PR #54;
- `20260820012139_filter_admin_role_display_validity` + source de `admin-get-user` — reconciliados via PR #57;
- guard de deploy de `admin-list-users` — reconciliado via PR #58;
- `supabase/migration-provenance.json` registra as migrations reconciliadas;
- scripts `validate:migrations:provenance` e `validate:migrations:remote` já fazem parte do fluxo de validação.

### 3.3 O que ainda falta em migrations

`OPEN/BLOCKED`:

- provar continuamente que Git e remoto permanecem equivalentes após cada merge;
- fazer o gate remoto rodar em infraestrutura CI confiável;
- não aplicar migrations novas enquanto CI/validação autoritativa estiver indisponível;
- tratar qualquer migration existente no histórico remoto, mas ausente no catálogo real, como **drift forense**, não como autorização para “reaplicar” SQL antigo.

### Correção do diagnóstico antigo F-002

O antigo F-002, descrito como “migrations amplamente divergentes”, deixa de ser tratado como mismatch genérico. O estado atual é:

- **migrations críticas conhecidas reconciliadas**;
- **proveniência/gate implementados**;
- risco residual concentrado em **drift de objetos pós-migration** e na falta de CI autoritativa.

---

## 4. Inventário de Edge Functions — runtime versus código

### 4.1 Runtime remoto atual

Foram observadas **43 Edge Functions implantadas**. Entre as mais relevantes para esta auditoria:

- `admin-list-users`;
- `admin-get-user`;
- `privacy-rpc`;
- `session-context`;
- `role-commands`;
- `profile-commands`;
- `billing-entitlements`;
- `media-assets` / `media-assets-cleanup`;
- `process-timeouts`;
- `auto-dispatch-ride`;
- `get-push-config`;
- `nominatim-proxy`;
- demais brokers de community, mobility, delivery, events e billing.

Não usar contagens históricas antigas de Edge Functions como autoridade. O baseline atual verificado é o inventário remoto desta reauditoria.

### 4.2 Funções versionadas/configuradas ausentes do runtime — classificação

#### A. Caller ativo; rollout necessário após correção/validação

- `admin-get-user-auth-summary`
  - caller ativo na governança administrativa;
  - contrato cliente ↔ handler estava quebrado;
  - correção em PR #66;
  - não implantar antes da integração e gate.

- `territorial-get-tree`
  - caller ativo em `AdminTerritoryManagement`;
  - handler antigo retornava shape incompatível;
  - correção em PR #67.

- `territorial-update-location`
  - caller ativo;
  - handler auditado como próximo do schema atual;
  - rollout deve fazer parte do lote territorial certificado.

- `territorial-update-group`
  - caller ativo;
  - rollout deve acompanhar leitura/update territorial.

- `territory-ai-content`
  - rota/admin caller ativo;
  - depende de `LOVABLE_API_KEY` + `ALLOWED_ORIGINS`;
  - preflight de secrets ampliado em PR #64.

#### B. Caller ativo, mas **deploy proibido no source atual**

- `user-delete-account`;
- `user-export-data`.

Motivo: o source atual referencia schema/autoridade obsoletos e não pode ser promovido com segurança. Ver F-010 / issue #68.

#### C. Sem consumidor ativo confirmado / infraestrutura dormente

- `admin-create-user` — nenhum caller ativo confirmado além do próprio source/configuração;
- `admin-suspend-profile` — método cliente existe, mas nenhum caller de produto foi encontrado;
- `ai-text`;
- `ai-vision`;
- `ai-image` — hook existe, mas consumidor final não foi confirmado.

**Regra:** não implantar essas funções apenas porque estão no Git. Primeiro decidir entre remover, documentar como futura ou reativar com owner de produto e teste de integração.

---

## 5. P1 — backlog crítico atualizado

## P1-01 — Proteção de `main`

**Status:** `OPEN`

Ainda falta garantir por configuração do GitHub:

- PR obrigatório para `main`;
- checks obrigatórios;
- bloqueio de force-push;
- restrição de bypass;
- política de review compatível com o tamanho do projeto.

**Critério de aceite:** proteção observada diretamente na configuração do repositório e comprovada com branch/PR de teste.

---

## P1-02 — CI-001: GitHub Actions falha antes do código

**Status:** `BLOCKED`
**Issue:** #17

Evidência repetida:

- jobs falham antes de qualquer step do repositório;
- `steps=null` em jobs de Security Check;
- Heavy PR Certification permanece sem runner/execução autoritativa em eventos observados;
- logs indisponíveis/`BlobNotFound` em execuções afetadas.

**Não fazer:** remover scanners, transformar gate obrigatório em opcional ou repetir cegamente runs sem resolver a infraestrutura.

**Critério de aceite:** pelo menos uma sequência representativa de PRs com jobs executando steps reais e gates obrigatórios verdes.

---

## P1-03 — CI-002: Vercel `build-rate-limit`

**Status:** `BLOCKED`

Vercel deixou de ser fallback confiável para validar código novo em determinados PRs. O problema observado é de infraestrutura/quota de build e ocorre antes da validação da alteração.

Impacto confirmado:

- PR #59 não recebeu uma validação nova autoritativa;
- PRs reconciliados com blobs já previamente validados puderam usar prova composicional, mas **código realmente novo não deve usar esse atalho**.

**Critério de aceite:** preview builds novos voltam a executar normalmente e um commit inédito passa o pipeline completo.

---

## P1-04 — Edge provenance e rollout guard

**Status:** `READY/PR + OPEN`

Já existe em `main`:

- canary fail-closed de `admin-list-users`;
- check-only por padrão;
- `--apply` explícito;
- SHA esperado de 40 caracteres;
- worktree limpa;
- branch `main`/detached SHA;
- project-ref coerente com `supabase/config.toml`;
- SHA-256 do bundle;
- deploy limitado a `supabase functions deploy <slug> --project-ref <ref> --use-api`;
- proibição de `--prune` e `--no-verify-jwt`.

Em PR:

- #59 — adiciona `admin-get-user` ao canary guard;
- #62 — gate mais amplo de proveniência de runtime Edge;
- #64 — preflight de secrets/configuração.

Ainda falta:

- validar código novo dos PRs com CI autoritativa;
- integrar os gates;
- produzir runbook único de rollout;
- registrar SHA/source/bundle/runtime version após cada promoção.

**Critério de aceite:** nenhuma Edge crítica pode ser implantada por caminho não auditável; drift runtime ↔ Git deve ser detectável automaticamente.

---

## P1-05 / F-010 — LGPD: exclusão, cancelamento e exportação de dados

**Status:** `CRITICAL / OPEN`
**Issue canônico:** #68
**PRs relacionados:** #69 e #70

Este é o maior novo achado da reauditoria.

### Drift confirmado

A migration histórica `20260419150002_create_user_deletion_schedule` consta como aplicada no histórico remoto, porém:

- `public.user_deletion_schedule` não existe mais no catálogo atual;
- não foi encontrada migration posterior registrada justificando o `DROP`;
- `public.cancel_account_deletion_for_user(uuid,text)` ainda existe e é restrita a `service_role`, mas seu corpo referencia:
  - `public.user_deletion_schedule` — ausente;
  - `public.profiles.deleted_at` — coluna ausente.

Consequência: a ação implantada `privacy-rpc.cancelAccountDeletion` pode falhar por dependência de schema inexistente.

### `user-delete-account` não pode ser implantada como está

O source atual contém referências incompatíveis, incluindo:

- `businesses.owner_id` em vez do modelo atual por perfil;
- `ride_requests.passenger_id` em vez de `passenger_profile_id`;
- `profiles.deleted_at` / `document_number` inexistentes;
- `user_roles.granted` inexistente;
- campos antigos em classifieds/subscriptions;
- revogação de sessão via `public.user_sessions`, que não é autoridade real de Auth.

Além disso:

- não há worker de purge no repositório;
- não há job remoto `pg_cron` para processar a fila antiga de exclusão;
- recriar apenas a tabela histórica criaria uma promessa de “purge em 30 dias” sem executor.

### `user-export-data` também precisa ser reescrita

O export atual usa relacionamentos antigos e coleta manualmente conjuntos de tabelas. O schema atual possui grande quantidade de relações ligadas a `profiles`, inclusive mensagens, moderação, mobilidade, pedidos, anúncios e auditoria.

Não usar `select *` dinâmico ou “exportar tudo por FK” como atalho: isso pode incluir dados de terceiros, moderação ou segurança que não pertencem ao titular.

### Arquitetura segura definida até aqui

A UI atual promete que, durante `status=scheduled`, o usuário ainda pode cancelar a exclusão. Portanto **ban + logout imediato** quebraria o próprio fluxo de cancelamento autenticado.

O alvo deve ser um **modo de conta pendente de exclusão**:

- autenticação mínima permanece disponível para privacidade/cancelamento;
- operações normais da aplicação ficam indisponíveis;
- estado deve ser reversível durante a janela;
- purge só começa após a janela e torna-se fase irreversível separada.

Controles existentes que podem suportar essa fase:

- `profiles.is_active`;
- `profiles.is_suspended` / `suspended_until`;
- `profile_members.is_active`;
- `user_roles.is_active` + `revoked_at`;
- Supabase Auth como autoridade de sessão.

### PR #69 — guard de rollout LGPD

Bloqueia explicitamente rollout dos sources antigos de `user-delete-account` e `user-export-data` enquanto marcadores de schema obsoleto permanecerem.

### PR #70 — fundação de autoridade reversível

Propõe `account_deletion_requests` e RPCs service-role-only com:

- estados `scheduled/cancelled/processing/completed/failed`;
- janela de 30 dias;
- RLS;
- browser sem acesso direto;
- `SECURITY DEFINER` + `search_path` fixo + timeout;
- retries idempotentes sem estender a janela;
- cancelamento sem depender de `profiles.deleted_at`.

O PR deliberadamente **não** faz purge, delete de Auth, delete de Storage, ban, logout ou anonimização.

### O que ainda precisa ser implementado para fechar F-010

1. boundary global de “pending deletion” que permita apenas privacidade/reativação;
2. broker de pedido com preconditions do schema atual;
3. snapshot/hold reversível de perfis e roles sem ressuscitar privilégios revogados por admin;
4. cancelamento que restaure apenas estado colocado em hold pelo próprio fluxo;
5. matriz formal de exportação LGPD por domínio/tabela/campo;
6. nova `user-export-data` com prova de completude e redaction de terceiros;
7. worker/scheduler de purge idempotente e observável;
8. tratamento explícito de objetos Storage antes do Auth user;
9. política de anonimização/retenção por domínio;
10. remoção final de Auth somente na fase irreversível;
11. testes positivos/negativos e recovery/compensação;
12. só então liberar rollout das Edge Functions.

**Critério de aceite:** request → modo restrito → cancelamento/recovery → vencimento → purge completo, todos comprovados em ambiente não-prod, com auditoria e idempotência.

---

## P1-06 / F-011 — Autoridade de sessão

**Status:** `READY/PR + OPEN`
**PRs relacionados:** #60 e #61

Achado confirmado em auditoria anterior:

- `public.user_sessions` estava vazio;
- `auth.sessions` possuía as sessões reais;
- portanto `public.user_sessions` não pode ser tratado como autoridade de revogação.

Regra canônica:

- autenticação/sessão: Supabase Auth;
- qualquer tracker público pode ser telemetria, nunca a autoridade que “desloga” usuários;
- operações privilegiadas devem derivar identidade de token/sessão real.

Ainda falta integrar os guards que proíbem regressão para o modelo stale e remover/renomear semântica que sugira autoridade onde só existe telemetria.

**Critério de aceite:** nenhum fluxo crítico depende de `public.user_sessions` para determinar validade de sessão.

---

## P1-07 / F-012 — Admin runtime e contratos

**Status:** `READY/PR + OPEN`

### `admin-get-user`

O source desejado em `main` já filtra role válida por:

- `is_active=true`;
- `revoked_at IS NULL`;
- `expires_at` ainda válido.

O runtime remoto observado permanece atrás do source desejado. O rollout deve usar o guard de #59 quando houver validação autoritativa.

### `admin-get-user-auth-summary`

Caller ativo confirmado. O handler retorna envelope `summary`, mas o loader cliente lia campos top-level/snake_case.

PR #66:

- corrige loader;
- tipa o DTO;
- adiciona regressão de contrato.

**Critério de aceite:** integração do PR + deploy controlado + página administrativa retornando auth summary real sem `null/false` por mismatch de shape.

---

## P1-08 — Território administrativo

**Status:** `READY/PR + OPEN`

Caller ativo confirmado em `AdminTerritoryManagement`.

`territorial-get-tree` versionada tinha múltiplos mismatches:

- retornava `{ tree: ... }` enquanto o cliente esperava dados top-level;
- só raízes aninhadas em `locations`;
- grupos não retornavam como coleção top-level;
- memberships ausentes;
- flags operacionais estavam escondidas em `metadata`;
- cache era `public` apesar de endpoint administrativo.

PR #67 reconcilia:

- `locations` planas;
- `groups` planos;
- memberships serializáveis convertidos novamente para `Map` no domínio;
- flags canônicas no topo;
- cache `private, no-store`;
- auth admin e env fail-closed mantidos.

Ainda falta:

- integrar #67;
- certificar `territorial-update-location` e `territorial-update-group` no mesmo lote;
- validar secret preflight;
- promover o trio por deploy auditado;
- validar tela administrativa end-to-end.

---

## P1-09 / F-004 — Compromised password protection / HIBP

**Status:** `OPEN`
**Issue:** #13

O advisor do Supabase continua informando que compromised/leaked password protection está desabilitado.

**Ação:** habilitar a proteção no Auth Dashboard e comprovar o comportamento.

**Critério de aceite:** advisor não reporta mais `auth_leaked_password_protection` e teste controlado de senha comprometida falha conforme esperado.

---

## P1-10 / F-005 — SECURITY DEFINER allowlist semântica

**Status:** `OPEN`, com inventário estrutural avançado
**Issue principal:** #15

Baseline atual auditado:

- total `SECURITY DEFINER`: **382**;
- `public`: **241**;
- `private`: **141**.

Superfície pública:

- 66 executáveis por `authenticated`;
- 9 executáveis por `anon`;
- 3 executáveis por `PUBLIC`;
- 57 authenticated-only no recorte analisado.

Dos 9 anon-executable, seis RPCs de aplicação têm semântica pública plausível e devem ser avaliadas para allowlist explícita:

- `get_community_poll_for_post(uuid)`;
- `get_professional_trust_reputation(uuid)`;
- `get_ride_rating_summary(uuid)`;
- `get_shared_ride_safety_data(text)`;
- `profile_public_territory_projection(uuid,uuid)`;
- `track_analytics_event(...)`.

As outras três são overloads PostGIS `st_estimatedextent`.

Estruturalmente:

- 24 funções authenticated-only mutantes analisadas tinham markers de autorização/erro;
- 33 funções authenticated-only de leitura tinham markers `auth.*`/`private.*`;
- isto **não substitui revisão semântica**.

Ainda falta:

- completar allowlist por função;
- registrar justificativa e owner;
- provar grants mínimos;
- bloquear novas SECURITY DEFINER sem entry de governança.

**Critério de aceite:** toda SECURITY DEFINER browser-executable classificada como pública/intencional, autenticada/intencional ou indevida/corrigida.

---

## P1-11 / F-009 — Grants privados e `vaga_applications`

**Status:** `OPEN`

Grants observados em funções `private` SECURITY DEFINER:

- `PUBLIC`: 0;
- `anon`: 5;
- `authenticated`: 38;
- `service_role`: 50.

Cinco helpers privados ainda executáveis por `anon`:

- `private.auth_can_view_group(uuid)`;
- `private.current_active_profile_id()`;
- `private.is_admin(uuid)`;
- `private.is_admin_from_roles(uuid)`;
- `private.is_admin_user(uuid)`.

Em `vaga_applications`:

- RLS está habilitado;
- probe como `anon` retornou zero linhas;
- porém grants de tabela e policies `TO public` são mais amplos que o necessário.

Sequência segura:

1. confirmar semântica do produto;
2. trocar policies de operações autenticadas de `public` para `authenticated`;
3. revogar DML desnecessário de `anon`;
4. reavaliar quais helpers privados ainda precisam de EXECUTE por `anon`;
5. adicionar regressão SQL;
6. recontar catálogo.

**Critério de aceite:** nenhuma permissão anon existe apenas por herança histórica ou conveniência.

---

## P1-12 / F-006 — PostGIS e objetos extension-owned

**Status:** `PLATFORM/BLOCKED`
**Issue:** #12

Achados:

- os três `st_estimatedextent` expostos sem `search_path` explícito são ownership `supabase_admin`/PostGIS;
- `spatial_ref_sys` também é objeto extension-owned;
- advisor aponta extensões no schema `public` (`postgis`, `citext`, `pg_trgm`, `unaccent`);
- papel operacional atual não é superuser e não deve forçar mudança de ownership/ACL da extensão.

Já existe preflight fail-closed de ownership.

**Não fazer:** reaplicar agressivamente `REVOKE`, mover extensão ou alterar owner sem caminho suportado pela plataforma.

**Critério de aceite:** remediação owner-approved pela Supabase ou exceção formal/documentada com monitoramento.

---

## 6. P2 — segurança estrutural e performance

## P2-01 — Tabelas com RLS ativo e zero policies

**Status:** `OPEN / CLASSIFICATION`

Advisor atual reporta **20 tabelas** com RLS habilitado e nenhuma policy, incluindo superfícies `private` e `public`.

Exemplos:

- `private.alpha_execution_log`;
- `private.alpha_rollout_control`;
- `private.community_direct_message_audit`;
- `private.notification_outbox`;
- `public.analytics_sessions`;
- `public.banned_users`;
- `public.community_social_audit_log`;
- `public.emergency_delivery`;
- `public.group_message_reactions`;
- `public.review_helpfulness`;
- `public.trust_admin_actions`;
- `public.trust_events`;
- `public.user_active_profiles`.

RLS sem policy pode ser **deny-all intencional**. Não criar policies automaticamente.

Ação:

1. classificar cada tabela como server-only/deny-all ou browser-accessível;
2. documentar deny-all intencional;
3. criar policy somente onde o produto exige acesso;
4. adicionar teste de catálogo.

---

## P2-02 — Foreign keys sem índice de suporte

**Status:** `OPEN`

Probe de catálogo encontrou **104 foreign keys sem índice de suporte correspondente** no recorte `public/private`.

Não criar 104 índices cegamente. Priorizar por:

1. tabelas de alto tráfego;
2. JOIN/DELETE/UPDATE reais;
3. tamanho e crescimento;
4. `EXPLAIN (ANALYZE, BUFFERS)` em ambiente seguro;
5. impacto de write amplification.

**Critério de aceite P2:** top offenders por tráfego corrigidos e backlog residual explicitamente aceito.

---

## P2-03 — Custo de políticas RLS

**Status:** `OPEN`

Há **602 policies** no recorte `public/private`.

Leitura estrutural encontrou:

- 352 policies com chamadas Auth no `USING`;
- 152 `WITH CHECK` com chamadas Auth.

Isso não significa que todas estejam erradas. O advisor/performance deve orientar quais chamadas por-row precisam virar initPlan (`(select auth.uid())`, etc.) ou ser reestruturadas.

Ação:

- priorizar tabelas quentes;
- eliminar chamadas repetidas por linha onde semanticamente seguro;
- evitar multiplicidade de permissive policies redundantes;
- medir antes/depois.

---

## P2-04 — Índices redundantes/unused e políticas permissivas múltiplas

**Status:** `OPEN`

Manter como trilha separada do P1. Usar advisor + métricas de uso, não somente heurísticas estáticas.

Objetivo:

- remover índice realmente redundante somente após confirmar constraints/queries;
- consolidar policies permissivas quando isso simplificar o planner sem mudar autorização;
- não trocar segurança por micro-otimização.

---

## 7. PRs abertos e ordem recomendada

PRs de segurança/contrato ativos nesta reauditoria:

- #59 — `admin-get-user` no guarded canary;
- #60 — stale public session issue canary;
- #61 — bloqueio de public session authority;
- #62 — Edge runtime provenance gate;
- #64 — Edge secrets preflight, incluindo `territory-ai-content`;
- #66 — contrato `admin-get-user-auth-summary`;
- #67 — contrato `territorial-get-tree`;
- #69 — bloqueio de rollout LGPD stale;
- #70 — fundação reversível de deletion request;
- #52/#53 — reorganização estrutural ampla do repositório.

### Ordem recomendada

#### Fase A — gates que reduzem risco sem tocar produção

1. #69 — blocklist/preflight LGPD;
2. #62 — provenance gate;
3. #64 — secrets preflight;
4. #60/#61 — sessão stale/authority guards.

Todos precisam de validação CI real antes de merge quando houver código novo.

#### Fase B — reconciliação de contratos

5. #66 — admin auth summary;
6. #67 — território;
7. #59 — canary `admin-get-user` após validação autoritativa.

#### Fase C — autoridade LGPD

8. #70 — somente após revisão de migration/proveniência e CI autoritativa;
9. implementar boundary `pending deletion`;
10. broker reversível;
11. export matrix/export broker;
12. purge worker/scheduler;
13. probes não-prod;
14. rollout.

#### Fase D — rollouts Edge controlados

Promover apenas funções cujo caller, contrato, secrets e source hash tenham sido certificados.

#### Fase E — refactor estrutural

#52 e #53 devem ficar por último. Eles movem grande quantidade de arquivos e podem mascarar ou conflitar com paths de segurança, migrations e documentação.

**Regra:** não fazer cleanup estrutural amplo enquanto os PRs de segurança/proveniência e o plano canônico ainda estiverem em movimento.

---

## 8. O que NÃO deve ser feito agora

- não implantar `user-delete-account` atual;
- não implantar `user-export-data` atual;
- não reaplicar `20260419150002_create_user_deletion_schedule` como atalho;
- não executar purge de contas até existir worker idempotente e política de retenção;
- não usar `public.user_sessions` como autoridade de logout/revogação;
- não promover `admin-get-user-auth-summary` antes de integrar contrato;
- não promover `territorial-get-tree` antigo;
- não implantar Edge “porque existe no Git” sem caller/owner/contrato;
- não desabilitar gates para contornar CI-001;
- não usar Vercel rate-limited como prova de código novo;
- não forçar DDL em objetos PostGIS extension-owned;
- não criar policies em tabelas RLS deny-all sem entender a intenção;
- não criar 104 índices automaticamente;
- não mergear #52/#53 antes da estabilização dos PRs críticos.

---

## 9. Roadmap operacional

### Etapa 0 — restaurar capacidade de provar mudanças

- [ ] resolver CI-001 / runners;
- [ ] resolver Vercel `build-rate-limit` ou estabelecer outro gate autoritativo equivalente;
- [ ] confirmar branch protection de `main`;
- [ ] integrar provenance/secrets/session guards.

### Etapa 1 — fechar runtime admin/território

- [ ] integrar #66;
- [ ] integrar #67;
- [ ] validar #59;
- [ ] executar preflight de secrets;
- [ ] rollout controlado de admin/território;
- [ ] smoke tests de telas administrativas.

### Etapa 2 — reconstruir LGPD

- [ ] integrar guard #69;
- [ ] validar foundation #70;
- [ ] criar modo global `pending deletion`;
- [ ] criar broker request/restore;
- [ ] formalizar export matrix;
- [ ] reescrever export;
- [ ] implementar worker/scheduler de purge;
- [ ] Storage cleanup policy;
- [ ] Auth final-delete;
- [ ] recovery/compensation tests;
- [ ] end-to-end em não-prod;
- [ ] rollout certificado.

### Etapa 3 — Auth e least privilege

- [ ] habilitar HIBP;
- [ ] fechar F-005 allowlist;
- [ ] fechar F-009 grants/policies;
- [ ] classificar 20 tabelas RLS sem policies;
- [ ] resolver ou formalizar F-006/PostGIS.

### Etapa 4 — performance

- [ ] rankear 104 FKs sem índice por tráfego/custo;
- [ ] otimizar policies RLS hot-path;
- [ ] revisar permissive policies múltiplas;
- [ ] revisar índices redundantes/unused;
- [ ] medir regressão antes/depois.

### Etapa 5 — organização do repositório

- [ ] rebase/revisão #52;
- [ ] rebase/revisão #53;
- [ ] preservar paths canônicos de migrations/security docs;
- [ ] atualizar referências quebradas após move;
- [ ] somente então consolidar documentação em nova árvore.

---

## 10. Gates mínimos antes de produção

Um release de segurança só pode ser promovido quando, no mínimo:

### Git / CI

- [ ] branch protection ativa;
- [ ] PR revisado;
- [ ] CI executa steps reais;
- [ ] typecheck passa;
- [ ] lint passa;
- [ ] testes relevantes passam;
- [ ] build passa;
- [ ] security gates passam.

### Migrations

- [ ] `validate:migrations`;
- [ ] `validate:migrations:provenance`;
- [ ] `validate:migrations:remote`;
- [ ] migration ainda não aplicada ou exatamente reconciliada;
- [ ] pós-condições de catálogo explícitas;
- [ ] rollback/compensação definidos quando aplicável.

### Edge

- [ ] caller confirmado;
- [ ] contrato cliente/handler confirmado;
- [ ] `verify_jwt` coerente com o desenho;
- [ ] secrets obrigatórios comprovados por nome, nunca impressos;
- [ ] bundle/source hash registrado;
- [ ] project ref correto;
- [ ] deploy guard/check-only passa;
- [ ] smoke test pós-deploy;
- [ ] runtime version/provenance registrados.

### Segurança

- [ ] nenhuma credencial em logs;
- [ ] browser sem service-role authority;
- [ ] RLS/grants verificados;
- [ ] authz fail-closed;
- [ ] operação destrutiva idempotente ou compensável;
- [ ] advisor rechecado.

---

## 11. Critério de “security-ready”

O projeto pode ser considerado **security-ready para operação normal** quando:

- CI autoritativa estiver estável;
- branch protection estiver ativa;
- HIBP estiver habilitado;
- drift Edge crítico estiver reconciliado;
- `admin-get-user`/admin summary/território estiverem certificados no runtime;
- nenhum fluxo ativo depender de `public.user_sessions` como autoridade;
- F-005/F-009 estiverem fechados ou tiverem allowlist formal;
- PostGIS residual estiver formalmente resolvido/excepcionado pela autoridade correta;
- tabelas RLS sem policy estiverem classificadas;
- nenhuma função ativa e privilegiada estiver “versionada, mas não implantada” sem decisão explícita.

---

## 12. Critério de “LGPD-ready”

Além de `security-ready`, o produto só deve ser considerado **LGPD-ready para exclusão/exportação self-service** quando:

- pedido de exclusão for persistido em autoridade atual;
- usuário entrar em modo restrito reversível;
- cancelamento dentro da janela funcionar;
- perfis/roles restaurados forem exatamente os colocados em hold pelo fluxo;
- exportação tiver matriz de cobertura aprovada;
- export não expuser dados de terceiros/segurança;
- purge tiver scheduler/worker real;
- Storage tiver tratamento explícito;
- Auth user for removido somente na fase final;
- retries forem idempotentes;
- falhas parciais tiverem recuperação/compensação;
- fluxo completo tiver prova não-prod.

Até lá, `user-delete-account` e `user-export-data` antigos permanecem **não implantáveis**.

---

## 13. Issues canônicos

- #12 — PostGIS/platform advisory blockers;
- #13 — compromised password protection/HIBP;
- #15 — exposed surfaces / SECURITY DEFINER / grants;
- #17 — CI runner failing before repository steps;
- #68 — LGPD deletion/export authority.

Evitar abrir issues duplicados; subtarefas devem ser registradas nos issues canônicos ou vinculadas explicitamente.

---

## 14. Histórico desta reauditoria

### 20/08/2026

- atualizado SHA de referência para `983d95e72426ae41c1680afbabe395b3ebf61717`;
- confirmado baseline de 366 migrations remotas;
- confirmado runtime atual de 43 Edge Functions;
- reclassificado F-002: migrations críticas conhecidas reconciliadas, gate/proveniência ainda dependem de CI confiável;
- incorporados PRs #59, #60, #61, #62, #64, #66, #67, #69 e #70 ao roadmap;
- adicionado F-010 LGPD como P1 crítico;
- documentado drift de `user_deletion_schedule`/`cancel_account_deletion_for_user`;
- documentada proibição de rollout dos handlers LGPD stale;
- adicionada classificação de Edge ausente por caller/risco;
- adicionada autoridade de sessão Supabase Auth;
- adicionada dívida de 20 tabelas RLS sem policies para classificação;
- medidos 104 foreign keys sem índice de suporte;
- medidos 602 policies no recorte `public/private` para trilha de performance;
- separado backlog P1 de segurança/privacidade do P2 de performance;
- #52/#53 movidos explicitamente para depois da estabilização de segurança.

---

## 15. Próxima execução recomendada

A próxima sequência técnica deve ser:

1. recuperar validação autoritativa de CI/Vercel;
2. integrar os guards de baixo risco (#69, #62, #64, #60/#61) após validação;
3. integrar contratos #66/#67;
4. validar e integrar #59;
5. concluir boundary global de `pending deletion` antes de qualquer broker destrutivo;
6. validar #70 e só aplicar a nova authority migration após gates/proveniência;
7. reconstruir export/purge LGPD;
8. fechar HIBP + F-005 + F-009;
9. tratar P2/performance;
10. somente então retomar #52/#53.

Este plano deve ser atualizado a cada mudança de estado (`OPEN` → `READY/PR` → `DONE`) com evidência de Git e runtime, nunca por expectativa.