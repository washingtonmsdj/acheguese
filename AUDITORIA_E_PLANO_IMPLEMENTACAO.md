# Achegue-se — Auditoria Técnica e Plano Canônico de Implementação

**Status:** ATIVO / CANÔNICO  
**Versão do plano:** V2.1 — execução iniciada em 20/08/2026  
**Data da reauditoria:** 2026-08-20  
**Última atualização operacional:** 2026-08-20  
**Escopo:** GitHub + Supabase + Vercel  
**Repositório:** `washingtonmsdj/acheguese`  
**Branch:** `main`  
**SHA operacional antes desta atualização:** `ae1017f9db8f0f4e5b21a14c92e81604d91374aa`  
**Supabase:** projeto `Achegue-se` / ref `xhdowzacfujckjelqhtd`  
**Vercel:** projeto `acheguese` / domínio `acheguese.com.br`

> Este arquivo é o **SSOT operacional da auditoria, correções, hardening e rollout transversal**. Um item só é `PROD/DONE` quando o runtime correspondente foi comprovado. Código merged, migration versionada ou guard integrado não equivalem a produção corrigida.

---

## 1. Legenda de estado

- `GIT/DONE` — alteração integrada à `main`, sem implicar promoção de runtime;
- `PROD/DONE` — alteração aplicada/implantada e comprovada no ambiente remoto correspondente;
- `READY/PR` — implementação existe em PR, ainda não integrada;
- `OPEN` — implementação real ainda falta;
- `BLOCKED` — próxima ação depende de CI, Vercel, plataforma, configuração administrativa ou validação autoritativa;
- `PLATFORM` — objeto/control plane pertence à plataforma e não deve ser forçado pelo papel atual;
- `P1` — segurança, privacidade, autoridade, rollout ou operação crítica;
- `P2` — hardening, performance ou manutenção relevante sem evidência atual de incidente crítico.

Regra de execução:

1. não reduzir gates para obter verde;
2. não equiparar merge a deploy;
3. não aplicar DDL novo enquanto a validação autoritativa estiver quebrada;
4. não implantar Edge a partir de source conhecido como stale;
5. toda promoção deve registrar SHA Git, versão runtime, contrato, configuração e prova pós-rollout.

---

## 2. Resumo executivo atual

A execução do plano **foi iniciada**. O primeiro lote priorizou mecanismos fail-closed, proveniência e migrations de hardening que podem ser versionadas sem alterar produção automaticamente.

### 2.1 O que entrou na `main` neste lote

`GIT/DONE`:

- PR #69 — bloqueio fail-closed de rollout dos handlers LGPD stale;
- PR #62 — migration para remover `authenticated EXECUTE` do helper órfão `private.group_can_manage_members(uuid,uuid)`;
- PR #64 — preflight de nomes de secrets para cron handlers e `territory-ai-content`;
- PR #60 — migration para restaurar autoridade `authenticated` de `public.vaga_applications`;
- PR #72 — substituto limpo do #61; migration que revoga `anon EXECUTE` de quatro helpers administrativos privados e preserva `current_active_profile_id()`;
- PR #59 — `admin-get-user` adicionado ao caminho canário de deploy protegido;
- PR #70 — fundação reversível de autoridade LGPD versionada;
- PR #65 — preflight remoto de drift de `verify_jwt`/existência de Edge Functions.

PR #61 foi fechado como `superseded` pelo #72 porque sua branch empilhada reapresentava o diff do #60 após squash-merge.

### 2.2 O que **não** foi promovido

`PROD/PENDING`:

- nenhuma das migrations novas deste lote foi aplicada ao Supabase;
- nenhum Edge Function foi implantado;
- nenhum secret foi lido, alterado ou criado;
- nenhum handler LGPD stale foi implantado;
- `admin-get-user` remoto continua no runtime existente;
- #66 e #67 continuam sem merge porque mudam runtime/frontend e não possuem typecheck/build autoritativos.

### 2.3 Bloqueios dominantes continuam ativos

- GitHub Actions continua falhando antes de executar steps do repositório (`steps=null`);
- Heavy PR segue sem execução confiável nos runs observados;
- Vercel continua retornando `build-rate-limit` para código novo;
- `main` continua sem branch protection (`protected=false`);
- o conector atual não expõe write de branch protection/rulesets;
- HIBP/compromised password protection continua pendente;
- objetos PostGIS extension-owned continuam dependentes de `supabase_admin`/plataforma.

---

## 3. Baseline remoto que continua autoritativo

### 3.1 Supabase migrations

Último baseline remoto comprovado:

- **366 migrations registradas**;
- versão remota mais recente: `20260820081746_harden_classified_report_rpc_contract`.

As migrations abaixo agora existem em Git, mas **não constam como aplicadas no remoto**:

1. `20260821001800_restrict_vaga_applications_browser_authority.sql` — PR #60;
2. `20260821002600_revoke_residual_anon_private_admin_helper_execute.sql` — PR #72;
3. `20260821003100_revoke_orphan_authenticated_group_member_helper_execute.sql` — PR #62;
4. `20260821011000_create_account_deletion_request_authority.sql` — PR #70.

Portanto, até aplicação controlada e pós-probe, esses itens são `GIT/DONE` e `PROD/PENDING`.

### 3.2 Edge Functions

Inventário remoto atual comprovado: **43 Edge Functions**.

Configuração Git: **55 slugs** em `supabase/config.toml`.

Não há slug remoto sem configuração local no snapshot auditado.

Configuradas/versionadas, mas não implantadas: **12**:

1. `admin-create-user`;
2. `admin-get-user-auth-summary`;
3. `admin-suspend-profile`;
4. `ai-image`;
5. `ai-text`;
6. `ai-vision`;
7. `territorial-get-tree`;
8. `territorial-update-group-visibility`;
9. `territorial-update-location-visibility`;
10. `territory-ai-content`;
11. `user-delete-account`;
12. `user-export-data`.

A existência em Git **não autoriza deploy**. Cada slug precisa de caller, contrato, auth policy, secrets, source provenance e critério de produto.

---

## 4. Execução realizada — evidência e efeito

## 4.1 PR #69 — guard LGPD stale

**Estado:** `GIT/DONE`  
**Produção:** não altera runtime  
**Merge:** `cf16fabe7d0f1b364a531f268b8ba2bfbf77a9c6`

O guard bloqueia rollout de:

- `user-delete-account`;
- `user-export-data`;

enquanto os sources contiverem marcadores comprovados de schema/autoridade obsoletos.

A validação reabriu os dois handlers e confirmou os marcadores stale presentes. Portanto o bloqueio não é teórico.

---

## 4.2 PR #62 — helper órfão autenticado

**Estado:** `GIT/DONE / PROD/PENDING`  
**Merge:** `bd436260379e08fd48a133daed88912f33084a1b`

Migration:

`20260821003100_revoke_orphan_authenticated_group_member_helper_execute.sql`

Probe remoto anterior ao merge comprovou para:

`private.group_can_manage_members(uuid,uuid)`:

- `SECURITY DEFINER=true`;
- `anon EXECUTE=false`;
- `authenticated EXECUTE=true`;
- `service_role EXECUTE=true`;
- referências em policies atuais: **0**.

A migration revoga browser EXECUTE e preserva `service_role`, com pós-condições fail-closed.

**Não aplicada ao Supabase.**

---

## 4.3 PR #64 — preflight de Edge secrets

**Estado:** `GIT/DONE`  
**Merge:** `bc7ebc4c63eefa599e313c068271f6c5369907c7`

O preflight usa somente `supabase secrets list --project-ref ... --output json` e valida **nomes**, nunca valores/digests.

Contratos agora cobertos:

- `media-assets-cleanup` → `ALLOWED_ORIGINS`, `CRON_SECRET`;
- `process-timeouts` → `ALLOWED_ORIGINS`, `CRON_SECRET`;
- `auto-dispatch-ride` → `ALLOWED_ORIGINS`, `CRON_SECRET`;
- `territory-ai-content` → `ALLOWED_ORIGINS`, `LOVABLE_API_KEY`;
- requisitos anteriores de `get-push-config`/`nominatim-proxy` permanecem.

Nenhum secret foi lido/alterado neste lote.

---

## 4.4 PR #60 — `vaga_applications`

**Estado:** `GIT/DONE / PROD/PENDING`  
**Merge:** `1e9457d3c145a3208709c4b0dac43ffc31061f63`

Probe remoto imediatamente anterior ao merge comprovou:

- RLS ativo;
- tabela com 0 linhas;
- `anon` e `authenticated` ainda com privilégios excessivos, inclusive `TRUNCATE`, `TRIGGER` e `REFERENCES`;
- quatro policies ainda em role `PUBLIC`.

A migration versionada:

- restringe as quatro policies a `authenticated`;
- remove privilégios de `PUBLIC`/`anon`;
- regranta a `authenticated` exatamente `SELECT, INSERT, UPDATE, DELETE`;
- preserva service role/owner;
- falha se o contrato final divergir.

A migration original do domínio já estabelecia esse contrato authenticated-only e o caller ativo exige `activeProfile`.

**Não aplicada ao Supabase.**

---

## 4.5 PR #72 — helpers privados anônimos

**Estado:** `GIT/DONE / PROD/PENDING`  
**Merge:** `72bf53bfa89497bdd9f4ad8b6bc3bb67768b1c33`

Substitui #61.

Fresh caller audit comprovou que os quatro helpers abaixo não possuem caller anônimo `SECURITY INVOKER` legítimo:

- `private.auth_can_view_group(uuid)`;
- `private.is_admin(uuid)`;
- `private.is_admin_from_roles(uuid)`;
- `private.is_admin_user(uuid)`.

A migration revoga `PUBLIC, anon EXECUTE` desses quatro e preserva `authenticated`.

`private.current_active_profile_id()` **não é alterada**, pois `public.list_community_groups_page(...)` é `SECURITY INVOKER`, executável por `anon` e depende dela.

**Não aplicada ao Supabase.**

---

## 4.6 PR #59 — canary `admin-get-user`

**Estado:** `GIT/DONE / PROD/PENDING`  
**Merge:** `b40077e55ddf7be8b7b0b1e83aa539917fc154de`

O deploy guard agora permite somente:

- `admin-list-users`;
- `admin-get-user`.

Para `--apply` continua exigindo:

- SHA Git exato de 40 hex;
- worktree limpa;
- `main` ou checkout detached do SHA autorizado;
- project ref igual ao `project_id` versionado;
- `verify_jwt=true`;
- source contract esperado;
- hash SHA-256 do bundle;
- Supabase CLI oficial;
- sem `--prune`;
- sem `--no-verify-jwt`.

O source atual de `admin-get-user` foi rechecado e contém:

- `requireAdmin(req)`;
- body limitado a 4096 bytes;
- `getUserSchema`;
- `auth.admin.getUserById(userId)`;
- filtro de roles `is_active=true`, `revoked_at IS NULL` e `expires_at` válido.

**Nenhum `--apply` foi executado.**

Runtime remoto observado continua:

- `admin-get-user` v18;
- `verify_jwt=true`.

---

## 4.7 PR #70 — authority LGPD reversível

**Estado:** `GIT/DONE / PROD/PENDING`  
**Merge:** `b84cf6c0a64a144c84a96d7351a82ba24eea295a`

Migration:

`20260821011000_create_account_deletion_request_authority.sql`

Precondições revalidadas no remoto antes do merge:

- `public.account_deletion_requests` não existe;
- `request_account_deletion_for_user(uuid,text,boolean)` não existe;
- `cancel_account_deletion_for_user(uuid,text)` existe;
- `public.user_deletion_schedule` não existe;
- `profiles.deleted_at` não existe.

O cancel RPC remoto atual é `SECURITY DEFINER`, service-role-only, mas seu corpo ainda referencia exatamente os dois objetos ausentes acima.

A nova fundação cria:

- `account_deletion_requests` com estados `scheduled/cancelled/processing/completed/failed`;
- janela de 30 dias;
- slots de snapshot reversível;
- RLS e browser roles sem acesso direto;
- request RPC service-role-only;
- substituição compatível do cancel RPC;
- `SECURITY DEFINER` + `search_path=pg_catalog, public, pg_temp` + `statement_timeout=5s`;
- retries idempotentes sem ampliar uma janela já `scheduled`;
- pós-condições de catálogo e grants.

A migration deliberadamente **não**:

- bane usuário;
- revoga sessão;
- anonimiza perfil;
- apaga Storage;
- apaga `auth.users`;
- cria scheduler/purge worker.

**Não aplicada ao Supabase.**

---

## 4.8 PR #65 — drift remoto de auth Edge

**Estado:** `GIT/DONE`  
**Merge:** `ae1017f9db8f0f4e5b21a14c92e81604d91374aa`

Novo preflight read-only compara:

- `[functions.<slug>] verify_jwt` de `supabase/config.toml`;
- `EDGE_FUNCTION_AUTH_POLICY.json`;
- `supabase functions list --project-ref <ref> --output json`.

Falha em:

- função remota sem config;
- `verify_jwt` ilegível;
- drift remoto ↔ Git;
- `verify_jwt=false` fora da allowlist;
- opcionalmente, em `--strict-existence`, função configurada não implantada.

O snapshot remoto atual deve bloquear deliberadamente em pelo menos:

- `sitemap`: remoto `verify_jwt=true`, Git `verify_jwt=false`.

Isso **não autoriza** mudar o Git para combinar com o runtime antigo; o alvo continua sendo rollout controlado da política/source atual, se a Edge `sitemap` continuar necessária.

---

## 5. Bloqueios comprovados durante a execução

## 5.1 CI-001 — hosted jobs morrem antes dos steps

**Status:** `BLOCKED`  
**Issue:** #17

Evidência nova registrada no issue #17:

- PR #72, Security Check run `32437493854`:
  - `Run Tests`: `failure`, `steps=null`;
  - `Lint and Type Check`: `failure`, `steps=null`;
  - `Validate No Hardcoded Credentials`: `failure`, `steps=null`;
  - `Maps Architecture Enforcement`: `failure`, `steps=null`.
- PR #66, Security Check run `32434625632`: mesmos quatro jobs com `steps=null`;
- PR #59, run `32431194609`: mesmos quatro jobs com `steps=null`;
- PR #70, run `32435433932`: mesmos quatro jobs com `steps=null`;
- PR #65, run `32433611650`: mesmos quatro jobs com `steps=null`.

Conclusão operacional: a falha continua localizada **antes da execução do código do repositório**.

Não fazer:

- `continue-on-error` para mascarar o resultado;
- remover scanners;
- repetir runs cegamente;
- tratar ausência de steps como falha do código alterado.

Critério de aceite:

- jobs hosted iniciam steps reais;
- typecheck/lint/test/security executam;
- sequência representativa de PRs passa de forma reproduzível.

---

## 5.2 Vercel build-rate-limit

**Status:** `BLOCKED`

Todos os SHAs novos inspecionados continuam recebendo status Vercel `failure` apontando para `upgradeToPro=build-rate-limit`.

Portanto Vercel não serve atualmente como fallback para validar código funcional novo.

Critério de aceite:

- preview build inédito executa normalmente;
- build/typecheck do commit realmente roda;
- resultado deixa de ser pré-build/quota.

---

## 5.3 Branch protection

**Status:** `BLOCKED / ADMIN`
**Issue:** #28

Estado remoto confirmado:

- `main protected=false`;
- required status checks desligados.

O conector GitHub disponível nesta execução não expõe write de branch protection/rulesets. Não contornar via ações indiretas.

Primeira configuração segura, quando houver acesso administrativo:

- exigir PR;
- bloquear force-push;
- bloquear delete de `main`;
- exigir resolução de conversas/review compatível;
- minimizar bypass;
- **não** tornar os checks atualmente quebrados obrigatórios até CI/Vercel voltarem a funcionar, para evitar deadlock de merges;
- depois adicionar checks estáveis como obrigatórios.

---

## 6. PRs funcionais preparados, mas deliberadamente não merged

## 6.1 PR #66 — admin auth summary

**Estado:** `READY/PR + BLOCKED`

Bug confirmado:

- handler versionado retorna `{ summary: { ...camelCase } }`;
- loader em `main` lê campos top-level/snake_case;
- após um rollout futuro, a UI continuaria produzindo `null/false`.

O #66 corrige o DTO/loader e adiciona teste de contrato.

Caller ativo confirmado em `AdminProfileGovernanceService`.

**Por que não foi merged:** muda frontend em runtime e não há typecheck/build autoritativo disponível.

---

## 6.2 PR #67 — território administrativo

**Estado:** `READY/PR + BLOCKED`

Schema remoto foi revalidado e contém todas as colunas/FK usados pelo handler proposto, inclusive:

`territorial_groups_anchor_city_id_fkey` → `anchor_city_id REFERENCES locations(id)`.

O #67 corrige:

- dataset plano `locations`;
- coleção top-level `groups`;
- `groupMembers` serializável → `Map` no domínio;
- flags canônicas no topo;
- `private, no-store`;
- env fail-closed;
- método/auth admin.

**Por que não foi merged:** altera cliente + Edge source funcional e não há typecheck/build autoritativo.

---

## 6.3 PR #63 — autoridade de sessão

**Estado:** `READY/PR + BLOCKED`

Achado já confirmado:

- `public.user_sessions`: 0 linhas no probe auditado;
- `auth.sessions`: centenas de sessões reais;
- runtime `session-rpc` usa Supabase Auth para revogação;
- source Git anterior anunciava ações extras baseadas em `user_sessions` que não representam a autoridade real.

O #63 reconcilia Git/cliente com Supabase Auth.

**Não mergear enquanto código funcional novo não puder ser typechecked/buildado de forma autoritativa.**

---

## 7. P1 — estado atual por domínio

## P1-01 — Branch protection

**Estado:** `BLOCKED / ADMIN`

Ação restante: aplicar proteção no GitHub quando houver write administrativo e depois comprovar por leitura + PR de teste.

---

## P1-02 — CI autoritativa

**Estado:** `BLOCKED`

Maior bloqueio transversal. Sem recuperar CI, código funcional deve permanecer em PR.

---

## P1-03 — Vercel

**Estado:** `BLOCKED`

Resolver quota/build-rate-limit ou estabelecer outro gate autoritativo equivalente.

---

## P1-04 — Edge provenance / auth / secrets

**Estado:** `GIT/DONE + PROD/OPEN`

Já em Git:

- canary `admin-list-users` + `admin-get-user`;
- secrets preflight;
- remote `verify_jwt` drift preflight;
- migrations provenance/remoto já existentes.

Ainda falta:

- rodar preflights em ambiente autorizado;
- resolver drift `sitemap`;
- certificar source/shared bundle dos próximos rollouts;
- registrar runtime version/hash após deploy;
- não usar `--strict-existence` até as 12 funções ausentes serem classificadas/resolvidas.

---

## P1-05 — LGPD exclusão/exportação

**Estado:** `CRITICAL / GIT-PARTIAL / PROD-BROKEN`
**Issue:** #68

O runtime atual ainda não está LGPD-ready.

Já entregue em Git:

- rollout guard stale (#69);
- authority reversível (#70).

Ainda falta implementar:

1. boundary global de `pending deletion`;
2. broker de request que derive identidade do JWT e chame a authority service-role-only;
3. snapshot/hold reversível de perfis/roles sem reativar privilégios revogados administrativamente;
4. cancel/restore que reverta somente o que o fluxo colocou em hold;
5. matriz formal de exportação por domínio/campo/ownership;
6. nova `user-export-data` com redaction de dados de terceiros/segurança;
7. worker/scheduler de purge idempotente;
8. política de retenção/anonymization por domínio;
9. cleanup explícito de Storage ownership;
10. remoção final do usuário no Supabase Auth somente na fase irreversível;
11. compensation/recovery para falha parcial;
12. testes E2E não-prod de request → restricted → cancel e request → expiry → purge.

Até tudo isso existir:

- `user-delete-account` antigo = **não implantável**;
- `user-export-data` antigo = **não implantável**;
- não reaplicar `user_deletion_schedule` histórico como atalho.

---

## P1-06 — Sessão/Auth

**Estado:** `READY/PR + BLOCKED`

Autoridade canônica:

- sessão/revogação = Supabase Auth;
- tabelas públicas de sessão, se mantidas, são telemetria, nunca fonte autoritativa.

Próximo passo após CI: validar e integrar #63.

---

## P1-07 — Admin

**Estado:** `PARTIAL`

- `admin-get-user` source já reconciliado em Git;
- canary guard agora cobre `admin-get-user` (#59);
- runtime remoto ainda v18;
- `admin-get-user-auth-summary` continua ausente do runtime;
- #66 corrige contrato cliente/handler, mas está bloqueado por CI.

Próximo rollout admin somente após:

1. CI funcional;
2. #66 integrado;
3. secrets/config preflight;
4. canary check-only no SHA autorizado;
5. deploy controlado;
6. smoke test da página administrativa;
7. registro de versão/proveniência.

---

## P1-08 — Território

**Estado:** `READY/PR + BLOCKED`

- #67 preparado;
- schema remoto compatível com o handler proposto;
- funções territoriais de gestão ainda ausentes do runtime;
- secrets de `territory-ai-content` agora possuem preflight versionado.

Próximo rollout territorial somente após CI, integração de #67 e certificação do lote de update/read.

---

## P1-09 — HIBP

**Estado:** `OPEN`
**Issue:** #13

Compromised/leaked password protection permanece pendente.

Aceite:

- habilitar no Auth;
- advisor deixa de reportar o problema;
- teste controlado confirma rejeição esperada.

---

## P1-10 — SECURITY DEFINER

**Estado:** `OPEN`, com inventário estrutural avançado
**Issue:** #15

Baseline:

- total: **382**;
- `public`: **241**;
- `private`: **141**;
- public executável por authenticated: 66;
- public executável por anon: 9;
- public `PUBLIC`: 3;
- private anon EXECUTE antes das migrations pendentes: 5;
- private authenticated EXECUTE antes das migrations pendentes: 38.

Atenção: os números de grants remotos **não devem ser reduzidos no plano ainda**, pois as migrations #60/#62/#72 não foram aplicadas.

Ainda falta:

- allowlist semântica por função;
- justificativa/owner;
- prova de menor privilégio;
- gate para novas SECURITY DEFINER browser-executable.

---

## P1-11 — Grants privados / `vaga_applications`

**Estado:** `GIT/DONE / PROD/PENDING`

Código/migrations estão em `main` (#60, #62, #72), mas catálogo remoto continua no estado anterior até aplicação.

Ordem remota obrigatória quando gates voltarem:

1. `20260821001800_restrict_vaga_applications_browser_authority`;
2. `20260821002600_revoke_residual_anon_private_admin_helper_execute`;
3. `20260821003100_revoke_orphan_authenticated_group_member_helper_execute`;
4. recontar grants/policies e executar probes de regressão.

Não aplicar fora dessa ordem lógica.

---

## P1-12 — PostGIS

**Estado:** `PLATFORM/BLOCKED`
**Issue:** #12

Três overloads `st_estimatedextent` continuam sem explicit `search_path` sob ownership de extensão/plataforma.

Não forçar owner/ACL/move de extensão com papel operacional atual.

Aceite:

- remediação suportada pela Supabase, ou
- exceção formal documentada com monitoramento.

---

## 8. P2 — dívida quantificada

## P2-01 — RLS ativo e zero policies

**Estado:** `OPEN / CLASSIFICATION`

Baseline: **20 tabelas**.

Não criar policies automaticamente. Classificar cada uma como:

- server-only / deny-all intencional;
- browser-accessível com policy faltante;
- legado a remover.

---

## P2-02 — Foreign keys sem índice

**Estado:** `OPEN`

Baseline: **104 foreign keys** sem índice de suporte correspondente no recorte auditado.

Priorizar por tráfego, cardinalidade, JOIN/DELETE/UPDATE reais e `EXPLAIN`, não por contagem bruta.

---

## P2-03 — custo de RLS

**Estado:** `OPEN`

Baseline:

- **602 policies** no recorte `public/private`;
- 352 com chamadas Auth no `USING`;
- 152 `WITH CHECK` com chamadas Auth.

Priorizar hot paths e medir antes/depois.

---

## P2-04 — índices/policies redundantes

**Estado:** `OPEN`

Usar advisor + métricas. Não remover índice ou consolidar policy apenas por heurística estática.

---

## 9. Edge drift específico que ainda precisa ser tratado

### `sitemap`

**Estado:** `OPEN / DRIFT CONFIRMED`

Remoto:

- v14;
- `verify_jwt=true`;
- source antigo;
- histórico de CORS `*`/fallback/rotas antigas observado na auditoria.

Git:

- `verify_jwt=false`;
- manifesto classifica como `public-read`;
- source atual é a direção desejada se a Edge continuar necessária.

Antes de deploy:

1. confirmar se a Edge ainda é necessária, pois o repo também possui sitemap estático;
2. preflight de secrets/config;
3. CI/build;
4. rollout controlado ou depreciação explícita.

### `get-push-config`

**Estado:** `OPEN / SOURCE-DRIFT`

Runtime remoto observado possui fallback VAPID legado; Git atual exige `VAPID_PUBLIC_KEY` e falha fechado.

Não copiar fallback de produção para Git. Confirmar secret por nome e promover source atual somente com gate.

### `media-assets-cleanup`

**Estado:** `PARTIAL DRIFT`

Entrypoint remoto estava alinhado, mas bundle `_shared/security.ts` é revisão antiga em relação à `main`.

Próximo rollout deve registrar bundle compartilhado, não apenas entrypoint.

---

## 10. Ordem de execução a partir de agora

## Fase 0 — recuperar capacidade de provar código

1. resolver CI-001;
2. resolver Vercel build-rate-limit ou estabelecer gate autoritativo equivalente;
3. aplicar branch protection administrativa sem deadlock de checks quebrados;
4. provar PR novo com typecheck/lint/tests/build/security executados de verdade.

## Fase 1 — integrar código funcional já preparado

Depois da Fase 0:

1. #63 — sessão/Auth;
2. #66 — admin auth summary;
3. #67 — território;
4. rebase/refresh de qualquer PR funcional cujo base SHA tenha envelhecido;
5. executar validação completa antes de merge.

## Fase 2 — aplicar hardenings de banco já versionados

Em ambiente controlado e com provenance gate verde:

1. aplicar #60 migration;
2. probes de grants/policies;
3. aplicar #72 migration;
4. probes de anon callers;
5. aplicar #62 migration;
6. recontar SECURITY DEFINER/grants;
7. rodar advisors security/performance;
8. registrar resultado no issue #15 e neste plano.

## Fase 3 — LGPD foundation não-prod

A migration #70 deve ser tratada separadamente do lote simples de grants porque substitui o cancel RPC ativo.

Antes de produção:

1. executar migration em não-prod/dev branch;
2. provar preconditions/postconditions;
3. testar request/retry/cancel;
4. provar que `privacy-rpc` continua compatível;
5. implementar `pending deletion` + hold/restore;
6. só então considerar aplicação em produção.

## Fase 4 — Edge admin/território

1. executar secrets preflight;
2. executar remote auth drift preflight;
3. corrigir/deprecar `sitemap` conscientemente;
4. canary check-only no SHA exato;
5. deploy `admin-get-user` somente após gate verde;
6. rollout `admin-get-user-auth-summary` após #66;
7. rollout territorial após #67;
8. smoke tests e registro de runtime version/hash.

## Fase 5 — completar LGPD

1. request broker;
2. restricted mode;
3. restore compensável;
4. export matrix;
5. export broker;
6. purge worker/scheduler;
7. Storage cleanup;
8. retention/anonymization;
9. Auth final delete;
10. E2E não-prod;
11. rollout certificado.

## Fase 6 — Auth/least privilege/P2

1. HIBP;
2. F-005 allowlist;
3. fechar grants remotos após migrations;
4. classificar 20 tabelas RLS sem policy;
5. resolver/formalizar PostGIS;
6. atacar FKs/RLS por hot path.

## Fase 7 — refactor estrutural

#52/#53 ficam por último. Não mover em massa migrations/security docs enquanto os controles críticos ainda estão sendo estabilizados.

---

## 11. Gates mínimos antes de qualquer produção

### Git / CI

- [ ] branch protection ativa;
- [ ] PR revisado;
- [ ] CI executa steps reais;
- [ ] typecheck verde;
- [ ] lint verde;
- [ ] testes relevantes verdes;
- [ ] build verde;
- [ ] security gates verdes.

### Migrations

- [ ] `validate:migrations`;
- [ ] `validate:migrations:provenance`;
- [ ] `validate:migrations:remote`;
- [ ] versão ainda não aplicada ou exatamente reconciliada;
- [ ] preconditions conferidas no catálogo remoto;
- [ ] pós-condições explícitas;
- [ ] rollback/compensação definido quando aplicável;
- [ ] pós-probe e advisors após apply.

### Edge

- [ ] caller confirmado;
- [ ] contrato cliente/handler confirmado;
- [ ] `verify_jwt` coerente com manifesto/config/runtime;
- [ ] secrets obrigatórios comprovados por nome;
- [ ] source/shared bundle hash registrado;
- [ ] project ref correto;
- [ ] check-only passa;
- [ ] apply somente no SHA autorizado;
- [ ] smoke test pós-deploy;
- [ ] versão runtime/proveniência registradas.

### Segurança

- [ ] browser sem service-role authority;
- [ ] RLS/grants rechecados;
- [ ] authz fail-closed;
- [ ] credenciais nunca impressas;
- [ ] destrutivo idempotente ou compensável;
- [ ] advisor rechecado.

---

## 12. Critério de `security-ready`

O projeto só é `security-ready` quando:

- CI autoritativa estiver estável;
- branch protection estiver ativa;
- HIBP estiver habilitado;
- drift Edge crítico estiver resolvido/depreciado explicitamente;
- admin/território estiverem certificados no runtime;
- sessão usar Supabase Auth como autoridade;
- F-005/F-009 estiverem fechados ou formalmente allowlisted;
- PostGIS residual estiver resolvido ou excepcionado pela autoridade correta;
- tabelas RLS sem policy estiverem classificadas;
- nenhuma função privilegiada estiver “configurada mas não implantada” sem decisão explícita.

---

## 13. Critério de `LGPD-ready`

Além de `security-ready`, exclusão/exportação self-service só é `LGPD-ready` quando:

- authority atual de request existir em produção;
- restricted mode for real e reversível;
- cancelamento restaurar somente estado colocado em hold pelo fluxo;
- export matrix estiver aprovada;
- export não vazar dados de terceiros/segurança;
- purge worker/scheduler existir;
- Storage tiver tratamento explícito;
- Auth for removido somente na fase final;
- retries forem idempotentes;
- falhas parciais tiverem compensação;
- fluxo completo tiver prova não-prod e pós-rollout.

Até lá, handlers LGPD antigos permanecem **não implantáveis**.

---

## 14. Issues/PRs canônicos

Issues:

- #12 — PostGIS/platform blockers;
- #13 — HIBP;
- #15 — exposed surfaces / SECURITY DEFINER / grants;
- #17 — CI-001;
- #28 — branch protection;
- #68 — LGPD deletion/export authority.

PRs funcionais bloqueados:

- #63 — session/Auth authority;
- #66 — admin auth summary;
- #67 — territorial contract.

PRs integrados neste lote:

- #59;
- #60;
- #62;
- #64;
- #65;
- #69;
- #70;
- #72, substituindo #61.

Refactor adiado:

- #52;
- #53.

---

## 15. Histórico operacional

### 20/08/2026 — reauditoria V2

- baseline de 366 migrations e 43 Edge Functions;
- 55 configs Edge / 12 ausentes do runtime;
- F-010 LGPD elevado a P1 crítico;
- 382 SECURITY DEFINER inventariadas;
- 20 tabelas RLS sem policies para classificação;
- 104 FKs sem índice de suporte;
- 602 policies RLS medidas;
- CI-001 e Vercel quota confirmados como bloqueios externos à execução dos steps;
- `main` confirmada sem branch protection.

### 20/08/2026 — execução lote 1

- #69 merged: guard LGPD stale;
- #62 merged: orphan helper revoke migration versionada;
- #64 merged: Edge secrets preflight ampliado;
- #60 merged: `vaga_applications` authority migration versionada;
- #61 encerrado como superseded;
- #72 merged: anon private helper revoke migration versionada;
- #59 merged: canary `admin-get-user` protegido;
- #70 merged: reversible LGPD authority foundation versionada;
- #65 merged: remote Edge auth drift preflight;
- #66 revalidado e mantido bloqueado por CI;
- #67 revalidado contra schema remoto e mantido bloqueado por CI;
- evidência nova de `steps=null` registrada no #17;
- nenhuma migration aplicada;
- nenhum Edge deploy executado;
- nenhum secret alterado.

---

## 16. Próxima execução canônica

A próxima execução deve começar por **recuperar capacidade de validação**, e em paralelo pode continuar preparando PRs sem promover runtime:

1. diagnosticar/resolver CI-001 e starvation/runner;
2. resolver Vercel build-rate-limit;
3. aplicar branch protection quando houver write administrativo;
4. manter #63/#66/#67 em draft até typecheck/build reais;
5. preparar o próximo lote LGPD (`pending deletion` + broker reversível) em PR separado, sem deploy;
6. quando CI voltar, validar/mergear os PRs funcionais;
7. somente então aplicar as migrations de menor privilégio e testar #70 em não-prod;
8. seguir para rollouts Edge auditados.

Este arquivo deve continuar distinguindo sempre **Git integrado** de **produção comprovada**.
