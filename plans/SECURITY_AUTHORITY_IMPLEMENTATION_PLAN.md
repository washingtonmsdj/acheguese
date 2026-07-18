# Security Authority - Plano de Implementacao

Status: em execucao validada
Data: 2026-07-07
Responsavel operacional: Codex / desenvolvedores do projeto

## Decisao

Implementar uma Security Authority enxuta, permanente e auditavel. O objetivo
nao e criar uma enciclopedia nova, e sim centralizar regras obrigatorias,
evidencias e validadores ja existentes para reduzir regressao real em
seguranca.

Nao implementar agora uma arvore completa de Authorities para arquitetura, UX,
performance, frontend, backend ou IA. A estrutura deve permitir expansao futura,
mas a primeira entrega fica limitada a seguranca.

## Objetivo

Criar uma fonte operacional para que qualquer agente de IA ou desenvolvedor
saiba, antes de alterar codigo sensivel, quais regras aplicar, quais scripts
executar e quais evidencias anexar.

Focos iniciais:

- Supabase remoto como fonte operacional do banco.
- RLS em schemas expostos.
- RPCs e funcoes `SECURITY DEFINER`.
- `GRANT EXECUTE` para `anon`, `authenticated` e `service_role`.
- Storage publico e politicas de listagem.
- Auth, sessao e proibicao de `service_role` no browser.
- PII/LGPD e dados sensiveis.
- BOLA/IDOR em acessos por usuario, perfil, empresa, territorio e pedido.
- Migrations auditaveis e sem drift local/remoto.

## Fontes Canonicas Existentes

O plano deve reaproveitar estes pontos em vez de duplicar conteudo:

- `SECURITY.md`
- `docs/SUPABASE_SECRETS.md`
- `docs/MIGRATIONS.md`
- `docs/STATUS_ATUAL.md`
- `docs/audits/SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md`
- `docs/audits/SUPABASE_REMOTE_MIGRATION_DRIFT_2026-07-06.md`
- `src/config/security.config.ts`, se aplicavel ao runtime atual.
- `scripts/security/validate-security.mjs`
- `scripts/validate-supabase-migrations.ts`
- `scripts/validate-supabase-remote-migration-drift.ts`
- `scripts/verify-deploy-ready.mjs`
- `supabase/migrations/`

## Estrutura Alvo

Criar somente a estrutura minima:

```txt
docs/governance/
  AUTHORITIES.md
  security/
    SECURITY_AUTHORITY.md
    RISK_LEVELS.md
    AI_AGENT_RULES.md
    SUPABASE_SECURITY_MODEL.md
    EXCEPTIONS.md
```

Criar validadores novos somente quando uma regra nao estiver coberta pelos
scripts atuais. Validadores devem ficar em `scripts/` e ser chamados por
`verify:deploy` apenas quando estiverem estaveis.

## Regras Nao Negociaveis

- Nao criar redirect para mascarar problema de rota ou autorizacao.
- Nao usar mock, fallback falso ou caminho paralelo em runtime de producao.
- Nao expor `service_role`, secrets ou chaves privadas em `VITE_*`,
  `NEXT_PUBLIC_*`, browser ou logs.
- Nao usar `SECURITY DEFINER` para contornar RLS sem justificativa, grants
  explicitos, `SET search_path` e evidencia.
- Nao liberar `EXECUTE TO anon` em RPC sem classificacao publica e teste.
- Nao criar policy `TO authenticated` sem predicado real de autorizacao quando
  houver dado de usuario, perfil, empresa, pedido ou territorio.
- Nao commitar migration que gere drift local/remoto.
- Nao duplicar regra que ja tenha SSOT em outro arquivo; referenciar o SSOT.

## Niveis De Risco

Critical:

- Auth, sessao, secrets, service role, RLS, Storage, migrations, RPC
  `SECURITY DEFINER`, PII/LGPD, pagamentos, pedidos, trust/moderacao e dados de
  perfil.

High:

- Servicos Supabase no frontend/backend, rotas protegidas, guards,
  autorizacao por empresa/perfil/territorio, funcoes de escrita e dashboards
  operacionais.

Medium:

- Consultas publicas, SEO publico, sitemap, componentes com dados reais,
  filtros territoriais e integracoes que leem dados nao sensiveis.

Low:

- Texto, estilos, docs, testes isolados e refactors sem impacto em dados,
  autorizacao ou rota publica.

## Evidencia Obrigatoria Por Risco

Critical:

- Justificativa no plano ou PR.
- Migration revisada.
- Supabase Advisor ou consulta equivalente quando aplicavel.
- `npm run validate:migrations`
- `npm run validate:migrations:remote`
- `npm run security:validate`
- `npm run verify:deploy`
- Teste unitario, integracao ou E2E cobrindo autorizacao.

High:

- `npm run typecheck:app`
- `npm run lint` ou eslint pontual dos arquivos alterados.
- Teste focado do modulo afetado.
- Validacao de SSOT quando tocar rota, territorio, URL ou permissao.

Medium:

- Typecheck ou teste focado.
- Docs vivos atualizados quando comportamento publico mudar.

Low:

- Revisao manual e `git diff --check` quando houver edicao ampla de docs.

## Plano De Execucao

### Fase 0 - Inventario E Alinhamento

- [x] Confirmar quais docs de seguranca ja existem e quais estao obsoletos.
- [x] Mapear scripts atuais de seguranca, migrations, SSOT e deploy.
- [x] Mapear achados residuais do Supabase Advisor remoto.
- [x] Registrar o que sera tratado por SQL, por script, por dashboard Supabase
  e por decisao de produto.

Saida esperada: lista curta de fontes canonicas e gaps reais.

### Fase 1 - Estrutura Da Authority

- [x] Criar `docs/governance/AUTHORITIES.md`.
- [x] Criar `docs/governance/security/SECURITY_AUTHORITY.md`.
- [x] Registrar que Security Authority e a primeira autoridade ativa.
- [x] Definir regra de expansao futura sem criar diretorios vazios.

Saida esperada: ponto unico de entrada para seguranca.

### Fase 2 - Modelo Supabase Seguro

- [x] Criar `SUPABASE_SECURITY_MODEL.md`.
- [x] Documentar quando usar acesso client-side com RLS.
- [x] Documentar quando usar RPC.
- [x] Documentar quando usar service role apenas em ambiente servidor.
- [x] Documentar padrao obrigatorio para `SECURITY DEFINER`.
- [x] Documentar politica para `anon` vs `authenticated`.
- [x] Documentar tratamento dos achados residuais do Advisor.

Saida esperada: decisao clara para cada tipo de acesso Supabase.

### Fase 3 - Regras Para Agentes De IA

- [x] Criar `AI_AGENT_RULES.md`.
- [x] Definir checklist antes de editar migrations.
- [x] Definir checklist antes de editar Auth/session.
- [x] Definir checklist antes de editar services Supabase.
- [x] Definir checklist antes de editar rotas, guards e dashboards.
- [x] Definir proibicao de "corrigir" seguranca com redirect, mock ou fallback
  falso.

Saida esperada: qualquer agente sabe o que ler antes de mexer.

### Fase 4 - Matriz De Risco

- [x] Criar `RISK_LEVELS.md`.
- [x] Associar tipos de arquivo e areas do sistema a risco.
- [x] Associar risco a validacoes obrigatorias.
- [x] Registrar quando uma excecao precisa ser aberta.

Saida esperada: mudancas sensiveis exigem evidencia proporcional.

### Fase 5 - Excecoes Auditaveis

- [x] Criar `EXCEPTIONS.md`.
- [x] Definir formato minimo de excecao: contexto, risco, mitigacao,
  responsavel, validade e plano de remocao.
- [x] Proibir excecao permanente sem revisao.

Saida esperada: desvio de regra fica visivel e temporario.

### Fase 6 - Validadores Executaveis

- [x] Revisar cobertura atual de `security:validate`.
- [x] Revisar cobertura atual de `validate:migrations`.
- [x] Revisar cobertura atual de `validate:migrations:remote`.
- [x] Identificar lacunas objetivas, por exemplo:
  - `SECURITY DEFINER` sem `SET search_path`.
  - `GRANT EXECUTE TO anon` sem classificacao publica.
  - policy RLS permissiva sem predicado de ownership/escopo.
  - storage publico com listagem ampla.
  - uso de service role em codigo de browser.
- [x] Criar validadores apenas para lacunas confirmadas.
- [x] Integrar no `verify:deploy` quando houver baixa taxa de falso positivo.

Saida esperada: parte da Authority passa a ser enforceable, nao apenas texto.

Resultado em 2026-07-07: `validate:migrations` passou a aplicar regras
forward-only a partir de `20260707000000` para decisao explicita de Data API em
tabelas publicas novas, classificacao de RPC concedida a `anon`/`PUBLIC` e
classificacao de listagem publica ampla em `storage.objects`. Como
`verify:deploy` ja executa `validate:migrations`, o gate ficou integrado sem
novo script paralelo.

### Fase 7 - Piloto E Ajuste

- [x] Rodar piloto tecnico do fluxo em fixtures de migration Supabase.
- [x] Integrar o piloto ao gate de release via `validate:security-authority`.
- [x] Rodar o fluxo em uma mudanca real de Supabase.
- [x] Rodar o fluxo em uma mudanca real de frontend sem risco critico.
- [x] Ajustar excesso de burocracia.
- [x] Registrar evidencias em doc de auditoria quando houver alteracao critica.

Saida esperada: processo utilizavel sem travar desenvolvimento.

Resultado parcial em 2026-07-07: o validador de migrations foi refatorado para
permitir teste isolado e ganhou cobertura em
`tests/security/security-authority-migrations.test.ts`. O piloto tecnico cobre
falha e caminho permitido para decisao Data API em tabela publica nova, RPC
concedida a `anon`/`PUBLIC` e listagem ampla em `storage.objects`. A regra ficou
enforceable e testada sem depender do Supabase remoto. Em seguida,
`validate:security-authority` foi integrado ao `verify:deploy`, com evidencia em
`docs/audits/SECURITY_AUTHORITY_PILOT_2026-07-07.md`.

Resultado adicional em 2026-07-07: o fluxo foi aplicado a uma mudanca real de
frontend/arquitetura sem risco critico. A correcao removeu dependencias
indevidas entre camadas, moveu o SSOT de `centralRoutes` para `core/routing`,
passou imports Supabase para o barrel publico e eliminou import de `core` em um
componente `shared`. Evidencias registradas em
`docs/audits/SECURITY_AUTHORITY_PILOT_2026-07-07.md`.

Resultado adicional em 2026-07-08: o fluxo foi aplicado a testes
E2E/operacionais que acessam Supabase remoto. O helper
`tests/helpers/operational-env.ts` virou o ponto unico para cliente admin e
anon/publishable em testes, sem leitura direta de `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_SECRET_KEY` ou `VITE_SUPABASE_*` nos specs. `playwright.config.ts`
tambem passou a ignorar `*.test.ts` no `testDir` E2E, e os Gates 2 baseados em
Vitest foram realocados para `tests/operational/`, evitando mistura de runners.
Em seguida, a regra deixou de ser apenas convenção: `security:validate` passou
a bloquear leitura direta de `VITE_SUPABASE_*` e `createClient(...)` em
`tests/e2e/`, `tests/helpers/` e `tests/operational/`, exceto no helper
canonico. A suite `validate:security-authority` passou a cobrir esse contrato
com 57 testes. O teste real de RLS de posts tambem foi realocado para
`tests/operational/` e deixou de importar `createClient` ou `supabaseAdmin` do
runtime publico, usando apenas o helper operacional canonico.

Resultado adicional em 2026-07-08: o fluxo tambem foi aplicado aos scripts
operacionais Node/TS. `scripts/lib/supabase-client.mjs` passou a expor
`createSupabaseScriptClient` alem de `createServiceRoleClient` e
`createAnonClient`, permitindo remover `createClient(...)` direto de validadores
legados e do fallback API de `economic-benchmark-ssot`. A policy
`SERVICE_ROLE_BOUNDARY_POLICY.json` foi apertada para bloquear `createClient(...)`
em `scripts/` fora do helper canonico, com cobertura em
`validate:security-authority`.

Resultado adicional em 2026-07-08: o fluxo foi aplicado ao runtime Supabase do
app. `src/integrations/supabase/index.ts` deixou de reexportar `createClient`,
preservando apenas `supabase`, tipos e helpers. O gate `security:validate`
passou a bloquear import/export de `createClient` vindo de
`@supabase/supabase-js` em `src/`, exceto no cliente canonico
`src/integrations/supabase/supabase.ts`, e em `api/`, exceto no helper
`api/_shared/supabaseAdmin.ts`. Em seguida, imports diretos de tipos Supabase
no runtime (`core` e services de gastronomia) foram migrados para
`@/integrations/supabase`; hooks de gastronomia passaram a consumir o tipo
exposto pelo service do modulo para manter a fronteira de camadas. A regra foi
promovida para `security:validate`, que agora bloqueia import/export de
`@supabase/supabase-js` em `src/` fora dos arquivos canonicos de integracao.

Resultado adicional em 2026-07-08: a duvida sobre "Supabase espalhado" foi
transformada em regra executavel. O acesso direto `supabase.from`,
`supabase.rpc`, `supabase.storage` e `supabase.auth` ficou proibido em
`pages`, `components`, `hooks` e `contexts`; telas devem consumir
services/repositories ou hooks de dominio. Services e repositories continuam
sendo boundaries validos para consultas Supabase quando RLS/RPC/Edge Function
forem o controle real. O gate `security:validate` passou a executar
`scripts/security/supabase-access-boundary.mjs`, com cobertura negativa e
positiva em `validate:security-authority`.

Resultado adicional em 2026-07-08: chamadas de Edge Function no formato broker
`{ action, params }` passaram a compartilhar
`src/core/infrastructure/edge-functions/edgeFunctionBroker.ts`. Foram migrados os
services de role, privacy, community, mobility, delivery, profile, location,
billing entitlements, reviews e notificacoes. A pasta centralizada ficou
limitada ao comportamento transversal de transporte/log/envelope; regras de
dominio e queries permanecem nos services/repositories dos respectivos modulos,
evitando uma pasta Supabase monolitica.

Resultado adicional em 2026-07-08: a migracao do helper de broker foi concluida
para todos os `body: { action, params }` restantes. Communication territorial,
admin communication, admin business, admin notifications, site settings e admin
pricing passaram a usar o mesmo helper. O helper tambem ganhou modo de comando
sem exigir payload de retorno, evitando respostas artificiais. A verificacao
por `rg` confirmou que `body: { action, params }` ficou restrito ao helper.

Resultado adicional em 2026-07-08: a verificacao manual do broker virou gate
executavel. `scripts/security/edge-function-broker-boundary.mjs` agora bloqueia
`body: { action, params }` fora de
`src/core/infrastructure/edge-functions/edgeFunctionBroker.ts`, e
`security:validate` executa essa regra junto das demais fronteiras Supabase. A
cobertura em `validate:security-authority` inclui caminho proibido, helper
canonico permitido, payload Edge Function nao-broker permitido e exclusao de
testes.

Resultado adicional em 2026-07-08: o gate `verify:deploy` passou a executar
`validate:deps` e `validate:ssot` antes de Supabase/security. Isso promove as
fronteiras de camada, ciclos arquiteturais, imports legados e SSOT de URLs para
contrato de release, evitando depender de validacao manual separada antes do
lancamento.

Resultado adicional em 2026-07-08: o mesmo gate passou a executar
`validate:hardcodes` e `validate:upload:ssot`. O validador de hardcodes tambem
foi corrigido para falhar com qualquer violacao reportada, nao apenas com
severidade `critical`; isso evita que preco, coordenada, UUID, status, limite
operacional ou mock importado passem como aviso decorativo.

Resultado adicional em 2026-07-08: `verify:deploy` tambem passou a executar
`validate:taxonomy`, `validate:architecture:incremental`,
`validate:architecture:governance` e `security:config:validate`. O SSOT de
configuracao de seguranca foi revisado em `src/config/security.config.ts` e o
proximo review ficou marcado para 2026-08-07, eliminando warning vencido antes
de promover o gate.

Resultado adicional em 2026-07-08: `validate:session-context` foi limpo e
promovido para `verify:deploy`. O `RideRepository` legado passou a usar o tipo
gerado de `ride_requests`, `passenger_profile_id`, `driver_profile_id`,
`origin_lat`/`origin_lng` e `final_price`, removendo `driver_id` e outros
campos antigos que nao existem no schema canonico.

Resultado Supabase real em 2026-07-07: a migration
`20260707102718_harden_lgpd_consent_rpc_authorization.sql` foi criada via
Supabase CLI, aplicada ao projeto remoto linkado e validada. Ela remove
`anon`/`PUBLIC` das RPCs LGPD `has_consent` e `record_consent`, fixa
`search_path` e adiciona autorizacao interna por usuario autenticado, admin ou
`service_role`. O advisor remoto caiu de 21 para 19 achados
`anon_security_definer_function_executable`, e `validate:migrations:remote`
confirmou historico local/remoto sincronizado.

Resultado Auth/Supabase em 2026-07-07: a Edge Function
`auth-username-login` foi criada e implantada no Supabase remoto com
`--no-verify-jwt`. O frontend deixou de chamar `get_email_by_username` via RPC,
passando a receber somente a sessao autenticada; a Edge Function chama esse RPC
como dependencia privada via `service_role`. A migration
`20260707103853_harden_username_auth_rpc_surface.sql` revogou `PUBLIC`, `anon`
e `authenticated` de `get_email_by_username`, mantendo apenas `service_role`.
Consulta direta no remoto confirmou `anon_execute=false`,
`authenticated_execute=false`, `public_execute=false` e
`service_role_execute=true`. O advisor remoto caiu para 18 achados
`anon_security_definer_function_executable`, e `get_email_by_username` nao e
mais reportado.

Resultado RPC publica de leitura em 2026-07-07: a migration
`20260707111214_harden_get_site_setting_invoker.sql` foi criada via Supabase
CLI e aplicada ao projeto remoto linkado. `get_site_setting(text)` deixou de
ser `SECURITY DEFINER` e passou a `SECURITY INVOKER`, mantendo `EXECUTE`
explicito para `anon` e `authenticated` sem heranca por `PUBLIC`. A tabela
`site_settings` ficou com `SELECT` publico e sem `INSERT`, `UPDATE` ou
`DELETE` para `anon`/`authenticated`. Teste remoto como role `anon` retornou
`Achegue-se` para `public.get_site_setting('site_name')`. O advisor remoto caiu
para 154 achados totais, 17 `anon_security_definer_function_executable` e 131
`authenticated_security_definer_function_executable`; `get_site_setting` nao e
mais reportado.

Resultado RPC publica de reviews em 2026-07-07: a migration
`20260707112353_harden_get_business_reviews_invoker.sql` foi criada via
Supabase CLI e aplicada ao projeto remoto linkado. `get_business_reviews(uuid,
integer, integer)` deixou de ser `SECURITY DEFINER` e passou a
`SECURITY INVOKER`, mantendo `EXECUTE` explicito para `anon` e
`authenticated` sem heranca por `PUBLIC`. A tabela `reviews` manteve `SELECT`
publico, mas perdeu `INSERT`, `UPDATE` e `DELETE` para `anon`. Teste remoto
como role `anon` retornou a review publica ativa do negocio
`ec806e1f-63f1-40d8-bbdc-cecd8576cb46`. O advisor remoto caiu para 152 achados
totais, 16 `anon_security_definer_function_executable` e 130
`authenticated_security_definer_function_executable`; `get_business_reviews`
nao e mais reportado.

Resultado RPCs publicas de menu em 2026-07-07: a migration
`20260707113531_harden_gastronomy_public_menu_rpcs_invoker.sql` foi criada via
Supabase CLI e aplicada ao projeto remoto linkado. `get_featured_menu_items`
e `get_active_promotions` deixaram de ser `SECURITY DEFINER` e passaram a
`SECURITY INVOKER`, mantendo `EXECUTE` explicito para `anon` e
`authenticated` sem heranca por `PUBLIC`. As tabelas `menus`,
`menu_categories`, `menu_items` e `menu_promotions` mantiveram `SELECT`
publico, mas perderam `INSERT`, `UPDATE` e `DELETE` para `anon`. Teste remoto
como role `anon` retornou quatro itens em destaque para o negocio
`cd709a71-03e0-4edb-8114-743599ac960d` e executou
`get_active_promotions` sem erro. O advisor remoto caiu para 148 achados
totais, 14 `anon_security_definer_function_executable` e 128
`authenticated_security_definer_function_executable`; as duas RPCs nao sao mais
reportadas.

Resultado RPC publica de atividades em 2026-07-07: a migration
`20260707114642_harden_gastronomy_activity_rpc_privacy.sql` foi criada via
Supabase CLI e aplicada ao projeto remoto linkado.
`get_recent_gastronomy_activities(text, integer, text[])` deixou de ser
`SECURITY DEFINER` e passou a `SECURITY INVOKER`, mantendo `EXECUTE` explicito
para `anon` e `authenticated` sem heranca por `PUBLIC`. A funcao deixou de ler
sinais privados de favoritos e compras no endpoint publico; por enquanto, o
feed publico deriva apenas de reviews publicas visiveis por RLS. Testes remotos
como role `anon` confirmaram 0 linhas para filtros `favorite` e `order`. O
advisor remoto caiu para 146 achados totais, 13
`anon_security_definer_function_executable` e 127
`authenticated_security_definer_function_executable`; a RPC de atividades nao
e mais reportada.

Resultado RPC publica territorial em 2026-07-07: a migration
`20260707115617_harden_location_descendants_rpc_invoker.sql` foi criada via
Supabase CLI e aplicada ao projeto remoto linkado.
`rpc_get_location_descendants_ids(uuid)` deixou de ser `SECURITY DEFINER` e
passou a `SECURITY INVOKER`, mantendo `EXECUTE` explicito para `anon` e
`authenticated` sem heranca por `PUBLIC`. A funcao le apenas `locations`,
`territorial_groups` e `territorial_group_members`, que ja possuem leitura
publica controlada por RLS. Testes remotos como role `anon` confirmaram retorno
para uma cidade ativa e para o grupo territorial ativo. O advisor remoto caiu
para 144 achados totais, 12 `anon_security_definer_function_executable` e 126
`authenticated_security_definer_function_executable`; a RPC territorial nao e
mais reportada.

Resultado RPC publica de rede de empresas em 2026-07-07: a migration
`20260707120534_harden_brand_branches_rpc_invoker.sql` foi criada via
Supabase CLI e aplicada ao projeto remoto linkado. `get_brand_branches(uuid)`
deixou de usar modo privilegiado e passou a `SECURITY INVOKER`, mantendo
`EXECUTE` explicito para `anon` e `authenticated` sem heranca por `PUBLIC`.
Teste remoto como role `anon` retornou a filial publica ativa do brand hub de
teste.

Resultado RPC publica de matching territorial por ponto em 2026-07-07: a
migration `20260707120937_harden_match_district_by_point_rpc_invoker.sql` foi
criada via Supabase CLI e aplicada ao projeto remoto linkado.
`rpc_match_district_by_point(uuid, double precision, double precision)` passou
a `SECURITY INVOKER` e foi corrigida para converter `neighborhood_boundaries`
em GeoJSON para geometry PostGIS antes de `ST_Contains`, removendo erro runtime
`ST_Contains(jsonb, geometry)`. Teste remoto como role `anon` executou sem erro
no dataset atual.

Resultado RPCs publicas de achados/perdidos em 2026-07-07: a migration
`20260707121321_harden_lost_found_public_read_rpcs_invoker.sql` foi criada via
Supabase CLI e aplicada ao projeto remoto linkado.
`count_lost_found_posts_by_type()` e
`find_similar_lost_found_posts(uuid, integer)` passaram a `SECURITY INVOKER`,
mantendo `EXECUTE` explicito para `anon` e `authenticated` sem heranca por
`PUBLIC`. O matching tambem passou a limitar internamente `p_limit` entre 1 e
20. O advisor remoto caiu para 136 achados totais, 8
`anon_security_definer_function_executable` e 122
`authenticated_security_definer_function_executable`.

Resultado contadores publicos de visualizacao em 2026-07-07: as migrations
`20260707122417_harden_public_view_counters_edge_broker.sql` e
`20260707123630_fix_public_view_counter_rpc_parameters.sql` foram criadas via
Supabase CLI e aplicadas ao projeto remoto linkado. `increment_business_views`,
`increment_professional_views` e `increment_vaga_view_count` nao sao mais
executaveis por `PUBLIC`, `anon` ou `authenticated`; a execucao ficou restrita a
`service_role` e foi movida para a Edge Function publica `track-public-view`,
com rate limit, whitelist de entidade e validacao UUID. A correcao tambem removeu
ambiguidade SQL nos parametros dos contadores de empresa/profissional. Smoke
HTTP remoto retornou `202 {"ok":true}`. O advisor remoto caiu para 130 achados
totais, 5 `anon_security_definer_function_executable` e 119
`authenticated_security_definer_function_executable`.

Resultado snapshots publicos em 2026-07-07: a migration
`20260707124348_harden_public_snapshot_rpcs_invoker.sql` foi criada via
Supabase CLI e aplicada ao projeto remoto linkado.
`get_public_business_snapshot_by_slug(text,text,text,text)` e
`get_public_gastronomy_snapshot_by_slug(text,text,text,text)` passaram a
`SECURITY INVOKER`, mantendo `EXECUTE` explicito para `anon` e `authenticated`
sem heranca por `PUBLIC`. Smoke remoto como role `anon` retornou os dois
snapshots para uma pizzaria ativa. O advisor remoto caiu para 126 achados
totais, 3 `anon_security_definer_function_executable` e 117
`authenticated_security_definer_function_executable`.

Tentativa PostGIS em 2026-07-07: a migration
`20260707124929_revoke_public_postgis_estimatedextent_execute.sql` foi aplicada
ao remoto, mas os grants dos overloads `st_estimatedextent` permaneceram porque
as ACLs da extensao foram concedidas por `supabase_admin` e migrations linkadas
executam como `postgres`. O advisor remoto permaneceu em 126 achados totais, 3
`anon_security_definer_function_executable` e 117
`authenticated_security_definer_function_executable`.

Resultado RPCs internas/trigger-only em 2026-07-07: a migration
`20260707133656_revoke_authenticated_from_internal_trigger_and_unused_rpcs.sql`
foi criada via Supabase CLI e aplicada ao remoto. Nove funcoes internas sem
caller runtime de browser (`audit_education_lead_status_change`,
`can_use_premium_link`, `check_suspension_expiry`, `generate_unique_handle`,
`get_pending_webhooks`, `initialize_notification_preferences`,
`initialize_user_mfa_status`, `trigger_start_dispatch` e
`validate_profile_link_same_account`) perderam `EXECUTE` para
`authenticated`, mantendo `service_role`. `update_session_activity(text)` foi
mantida porque `SessionService` ainda chama a RPC. O advisor remoto caiu para
117 achados totais, 3 `anon_security_definer_function_executable` e 108
`authenticated_security_definer_function_executable`.

Resultado RPCs autenticadas sem caller/policy em 2026-07-07: as migrations
`20260707134401_revoke_authenticated_from_unused_no_dependency_rpcs.sql` e
`20260707134629_revoke_authenticated_from_internal_helper_rpcs.sql` foram
aplicadas ao remoto, removendo `EXECUTE` de `authenticated` para helpers sem
caller runtime e para helpers chamados apenas por rotinas privilegiadas. O
advisor remoto caiu para 92 achados totais, 3
`anon_security_definer_function_executable` e 83
`authenticated_security_definer_function_executable`.

Resultado admin notifications em 2026-07-07: criada e implantada a Edge
Function `admin-notifications-rpc`, com `requireAdmin`, rate limit e whitelist
de acoes. A migration
`20260707134943_route_admin_notifications_rpcs_through_edge_function.sql`
removeu `EXECUTE` direto de `authenticated` das RPCs
`admin_notifications_get_*`, mantendo `service_role`. Smoke remoto sem JWT de
usuario retornou `401`. O advisor remoto caiu para 86 achados totais, 3
`anon_security_definer_function_executable` e 77
`authenticated_security_definer_function_executable`.

Resultado admin pricing em 2026-07-07: criada e implantada a Edge Function
`admin-pricing-rpc`, com `verify_jwt=true`, `requireAdmin`, rate limit,
whitelist de acoes e validacao de ownership entre `performedBy` e o usuario
autenticado. A migration
`20260707140908_route_admin_pricing_rpcs_through_edge_function.sql` removeu
`EXECUTE` direto de `authenticated` dos RPCs `activate_pricing_rule` e
`create_active_pricing_rule`, mantendo `service_role`. Smoke remoto sem JWT
retornou `401`. O advisor remoto caiu para 84 achados totais, 3
`anon_security_definer_function_executable` e 75
`authenticated_security_definer_function_executable`.

Resultado admin site settings em 2026-07-07: criada e implantada a Edge
Function `admin-site-settings-rpc`, com `verify_jwt=true`, `requireAdmin`,
rate limit, whitelist de acoes, whitelist de chaves e validacao de valores por
tipo de setting. A migration
`20260707141904_route_admin_site_settings_rpcs_through_edge_function.sql`
removeu `EXECUTE` direto de `authenticated` dos RPCs `get_all_site_settings` e
`upsert_site_setting`, mantendo `service_role`. O helper publico
`get_site_setting(text)` permanece `SECURITY INVOKER`. Smoke remoto sem JWT
retornou `401`. O advisor remoto caiu para 82 achados totais, 3
`anon_security_definer_function_executable` e 73
`authenticated_security_definer_function_executable`.

Resultado admin comunicacao territorial em 2026-07-07: criada e implantada a
Edge Function `admin-communication-rpc`, com `verify_jwt=true`, `requireAdmin`,
rate limit, whitelist de acoes e validacao de UUID/payload. O servico
`AdminCommunicationTerritorialService` deixou de chamar diretamente
`admin_approve_communication_channel` e
`admin_reject_communication_channel_request`. A migration
`20260707143712_route_admin_communication_rpcs_through_edge_function.sql`
removeu `EXECUTE` direto de `authenticated`, manteve `service_role` e ajustou
os RPCs para receber o `admin_user_id` real do broker, preservando auditoria e
campos de revisao/aprovacao. Smoke remoto sem JWT retornou `401`. O advisor
remoto caiu para 80 achados totais, 3
`anon_security_definer_function_executable` e 71
`authenticated_security_definer_function_executable`.

Resultado comunicacao territorial usuario em 2026-07-07: criada e implantada
a Edge Function `communication-rpc`, com `verify_jwt=true`, autenticacao
obrigatoria, rate limit, whitelist de acoes e validacao de payload. O servico
`CommunicationTerritorialService` deixou de chamar diretamente os RPCs de
mutacao `request_communication_channel`, `create_communication_publication`,
`update_communication_publication_draft` e `publish_communication_publication`.
A migration
`20260707145342_route_communication_mutation_rpcs_through_edge_function.sql`
removeu `EXECUTE` direto de `authenticated` desses RPCs, manteve
`service_role`, passou o usuario real como `actor_user_id` e converteu
`can_channel_publish_in_location(uuid, uuid)` para `SECURITY INVOKER`.
Smoke remoto sem JWT retornou `401`. O advisor remoto caiu para 75 achados
totais, 3 `anon_security_definer_function_executable` e 66
`authenticated_security_definer_function_executable`. O helper
`communication_current_user_can_manage_channel(uuid)` foi mantido
temporariamente porque policies RLS atuais dependem dele; a revogacao foi
testada em transacao e causou `permission denied` durante leitura protegida por
policy.

Resultado helper RLS privado de comunicacao em 2026-07-07: a migration
`20260707151447_move_communication_rls_helper_to_private_schema.sql` criou o
schema privado `private`, moveu o helper
`communication_current_user_can_manage_channel(uuid)` para esse schema,
atualizou as quatro policies dependentes e removeu a funcao homonima de
`public`. Verificacao remota confirmou que o helper publico nao existe mais,
`anon` nao tem `USAGE` nem `EXECUTE` no helper privado, `authenticated` tem
`EXECUTE` apenas para execucao das policies, e as leituras protegidas por RLS
nao geram mais `permission denied`. O advisor remoto caiu para 74 achados
totais, 3 `anon_security_definer_function_executable` e 65
`authenticated_security_definer_function_executable`, sem achados de
comunicacao.

Resultado leitura de notificacoes em 2026-07-07: a migration
`20260707152429_harden_notification_read_rpcs.sql` removeu `EXECUTE` direto de
`authenticated` dos RPCs `mark_notification_as_read`,
`mark_all_notifications_as_read` e `get_unread_notifications_count`, mantendo
`service_role`. O `NotificationService` passou a usar update/select direto em
`public.notifications` com RLS e filtro explicito pelo usuario autenticado.
Verificacao remota confirmou `authenticated_execute=false` nos tres RPCs. O
advisor remoto caiu para 71 achados totais, 3
`anon_security_definer_function_executable` e 62
`authenticated_security_definer_function_executable`.

Resultado nichos de gastronomia em 2026-07-07: a migration
`20260707153515_harden_gastronomy_niche_capability_rpcs.sql` removeu
`EXECUTE` direto de `authenticated` dos RPCs `add_niche_capability`,
`has_niche_capability` e `mark_niche_needs_upgrade`, mantendo `service_role`.
`has_niche_capability` deixou de ser `SECURITY DEFINER`; o frontend passou a
ler `gastronomy_profiles.enabled_capabilities` diretamente sob RLS, e as
mutacoes de capability/upgrade foram bloqueadas no servico de browser ate
existir caminho admin/server autorizado. Verificacao remota confirmou
`authenticated_execute=false` e `service_role_execute=true` nos tres RPCs. A
follow-up migration
`20260707155447_harden_gastronomy_profile_column_grants.sql` removeu
`INSERT`, `UPDATE` e `DELETE` amplos de `authenticated` em
`public.gastronomy_profiles` e manteve escrita direta apenas em colunas
operacionais. Campos de plano, capabilities e versionamento de nicho nao sao
mais gravaveis pelo Data API com JWT de usuario. O advisor remoto caiu para 68
achados totais, 3
`anon_security_definer_function_executable` e 59
`authenticated_security_definer_function_executable`, sem matches de nicho.

Resultado favoritos de negocios em 2026-07-07: a migration
`20260707160719_harden_business_favorites_count_rpc.sql` removeu
`EXECUTE` direto de `authenticated` do RPC `get_business_favorites_count`,
converteu a funcao para `SECURITY INVOKER` e manteve apenas `service_role`.
`FavoritesQueryService.getBusinessFavoritesCount` deixou de chamar RPC
privilegiado no browser e passou a ler o contador canonico
`business_data.favorites_count` sob RLS. Verificacao remota confirmou
`security_definer=false`, `anon_execute=false`,
`authenticated_execute=false` e `service_role_execute=true`; o Advisor remoto
caiu para 67 achados totais, 3
`anon_security_definer_function_executable` e 58
`authenticated_security_definer_function_executable`, sem match de
`get_business_favorites_count`. Durante a verificacao, foi identificado que
`business_data` ainda possui grants amplos para `anon`/`authenticated`; isso
fica como etapa propria porque exige mapear os fluxos legitimos de criacao e
edicao de empresas antes de reduzir grants por coluna.

Resultado `business_data` grants em 2026-07-07: a migration
`20260707162026_harden_business_data_column_grants.sql` removeu grants amplos
de `anon` e `authenticated` em `public.business_data`. `anon` e
`authenticated` mantem apenas `SELECT` em nivel de tabela; `authenticated`
recebe `INSERT`/`UPDATE` somente em colunas operacionais. Flags admin
(`is_verified`, `is_premium`) e agregados/counters (`favorites_count`,
`recommendations_count`, `rating`, `total_reviews`, `total_products`) nao sao
mais gravaveis via Data API com JWT de usuario. A Edge Function
`admin-business-rpc` foi criada e implantada com `verify_jwt=true`,
`requireAdmin`, rate limit e `service_role` para `setVerification` e
`setPremium`; `AdminBusinessService` passou a usar esse broker. Smoke remoto
sem JWT retornou `401`. Verificacao remota confirmou que `anon` e
`authenticated` nao possuem `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` nem
DML amplo em `business_data`. O Advisor permaneceu em 67 achados totais, 3
`anon_security_definer_function_executable` e 58
`authenticated_security_definer_function_executable`, pois grants de tabela
amplos nao aparecem como esse tipo de finding.

Resultado `create_notification` em 2026-07-07: a migration
`20260707192404_harden_create_notification_security.sql` converteu
`create_notification` para `SECURITY INVOKER`, manteve `EXECUTE` apenas para
`authenticated` e `service_role`, e adicionou guarda interna contra criacao de
notificacao para outro `user_id` por usuario autenticado. O
`NotificationService` passou a bloquear chamadas cross-user no browser antes
do RPC. `notifications` e `notification_preferences` tiveram grants amplos de
`anon`/`authenticated` removidos e receberam policies/grants por operacao e por
coluna para notificacao/preferencia propria. Verificacao remota confirmou
`security_definer=false`, `anon_execute=false`, `authenticated_execute=true`,
`service_role_execute=true`, grants por coluna e ausencia de match
`create_notification` no Advisor. O Advisor caiu para 66 achados totais, 3
`anon_security_definer_function_executable` e 57
`authenticated_security_definer_function_executable`.

Resultado `community-notifications-rpc` em 2026-07-07: criada e implantada a
Edge Function `community-notifications-rpc` com `verify_jwt=true`,
autenticacao obrigatoria, rate limit e `service_role` apenas no broker. O
broker valida que o `actorProfileId` pertence ao usuario autenticado, confirma
eventos reais de comunidade em `post_likes_new`, `posts` e `comments`, resolve
o destinatario pelo dominio e chama `create_notification` sem aceitar
`user_id` de destinatario vindo do browser. `posts.mutations` e
`communityBusinessLogic` passaram a usar
`CommunityNotificationBrokerService`; caminhos de comentario/resposta exigem
`commentId`/`replyCommentId` reais para evitar notificacao baseada apenas em
texto do cliente. Smoke remoto sem JWT retornou `401`.

Atualizacao de estado em 2026-07-13: este broker foi substituido por
derivacao transacional privada no PostgreSQL (`20260713150000`). A fonte de
verdade atual esta em `docs/STATUS_ATUAL.md` e
`plans/COMMUNITY_CONNECTORS_RELIABILITY_PLAN.md`; o registro acima permanece
somente como evidencia historica da transicao.

Resultado `professional-notifications-rpc` em 2026-07-07: criada e implantada
a Edge Function `professional-notifications-rpc` com `verify_jwt=true`,
autenticacao obrigatoria, rate limit e `service_role` apenas no broker.
`ProfessionalLeadService` deixou de chamar `NotificationService` para criar
notificacoes de terceiros; mensagens e propostas agora enviam somente
`messageId`/`quoteId` para `ProfessionalNotificationBrokerService`. O broker
valida registros reais em `professional_lead_messages`,
`professional_lead_quotes` e `professional_leads`, confirma que o usuario
autenticado e o sender/profissional correto e resolve o destinatario no
servidor. Como leads podem ser criados anonimamente, a notificacao de
`lead_created` ficou no trigger interno
`create_professional_lead_created_event()`, com `SECURITY DEFINER`,
`search_path=public, pg_temp`, sem `EXECUTE` para `anon` ou `authenticated`.
Smoke remoto sem JWT retornou `401`, verificacao remota confirmou
`anon_execute=false` e `authenticated_execute=false` no trigger, e o Advisor
permaneceu em 66 achados sem match para a nova trigger.

Resultado `session-rpc` em 2026-07-07: criada e implantada a Edge Function
`session-rpc` com `verify_jwt=true`, autenticacao obrigatoria, rate limit e
`service_role` apenas no broker. `get_active_profile`,
`switch_active_profile` e `check_user_mfa_required` deixaram de ser
executaveis diretamente por `authenticated`; `SessionService`,
`ProfileService`, `profile.queries` e `MFAService` passaram a usar
`SessionRpcService`. O browser nao envia `p_user_id`; o broker valida o JWT e
deriva o usuario real antes de chamar os RPCs com `service_role`. Smoke remoto
sem JWT retornou `401`, verificacao remota confirmou `anon_execute=false`,
`authenticated_execute=false` e `service_role_execute=true` nos tres RPCs, e o
Advisor caiu para 63 achados totais, 3
`anon_security_definer_function_executable` e 54
`authenticated_security_definer_function_executable`, sem match para
`get_active_profile`, `switch_active_profile` ou
`check_user_mfa_required`.

Resultado `billing-entitlements-rpc` em 2026-07-07: criada e implantada a Edge
Function `billing-entitlements-rpc` com `verify_jwt=true`, autenticacao
obrigatoria, rate limit e `service_role` apenas no broker.
`get_user_active_subscription`, `user_has_plan`, `user_has_feature` e
`get_user_entitlement_limit` deixaram de ser executaveis diretamente por
`authenticated`; `SubscriptionService` passou a usar
`BillingEntitlementsRpcService`. O browser nao envia `p_user_id`; o broker
valida o JWT e deriva o usuario real antes de chamar os RPCs com
`service_role`. Smoke remoto sem JWT retornou `401`, verificacao remota
confirmou `anon_execute=false`, `authenticated_execute=false` e
`service_role_execute=true` nos quatro RPCs. A contagem remota direta caiu para
50 `authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`, sem match no Advisor para os
quatro RPCs de billing.

Resultado `session-rpc` revogacao de sessoes em 2026-07-07: o broker
existente `session-rpc` foi estendido para revogar sessao individual e revogar
todas as sessoes do usuario autenticado, sem chamar os RPCs legados com
`service_role`. O broker valida o JWT e atualiza `user_sessions` diretamente
com filtro obrigatorio `user_id = usuario autenticado`; quando
`exceptCurrent=true`, preserva a sessao do bearer token atual. `revoke_user_session`
e `revoke_all_user_sessions` deixaram de ser executaveis diretamente por
`authenticated`, mantendo apenas `service_role`. Smoke remoto sem JWT retornou
`401`, verificacao remota confirmou `anon_execute=false`,
`authenticated_execute=false` e `service_role_execute=true` nos dois RPCs
legados. A contagem remota direta caiu para 48
`authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Resultado `business-reviews-rpc` em 2026-07-07: criada e implantada a Edge
Function `business-reviews-rpc` com `verify_jwt=true`, autenticacao
obrigatoria, rate limit e `service_role` apenas no broker.
`can_user_review_business`, `create_business_review`,
`update_business_review`, `delete_business_review` e
`add_business_review_response` deixaram de ser executaveis diretamente por
`authenticated`; `ReviewQueryService` passou a usar o adapter canonico
`BusinessReviewService`. Como os RPCs legados dependem de `auth.uid()`, o
broker nao os chama com `service_role`; ele valida o JWT, replica a autorizacao
por owner, `profile_members` ativo ou admin canonico, valida pedido entregue
quando `order_id` existe e escreve em `public.reviews` com filtros explicitos.
Smoke remoto sem JWT retornou `401`, verificacao remota confirmou
`anon_execute=false`, `authenticated_execute=false` e
`service_role_execute=true` nos cinco RPCs legados. A contagem remota direta
caiu para 43 `authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Resultado `privacy-rpc` + `session-rpc` activity em 2026-07-07: criada e
implantada a Edge Function `privacy-rpc` com `verify_jwt=true` para
`record_consent`; `ConsentService` e `PrivacySettingsService` passaram a usar
`PrivacyRpcService`, sem enviar `user_id` confiavel no payload. O broker deriva
o usuario do JWT e chama o helper legado com `p_user_id` do usuario
autenticado. O `session-rpc` foi estendido com `updateSessionActivity`, que
atualiza `user_sessions` apenas quando `user_id` e `session_token` pertencem
ao bearer token atual. `record_consent` e `update_session_activity` deixaram de
ser executaveis diretamente por `authenticated`, mantendo apenas
`service_role`; a migration `20260707212504` tambem corrigiu
`unique_active_consent` para indice parcial em `revoked_at IS NULL`. Smokes
remotos sem JWT para `privacy-rpc` e `session-rpc` retornaram `401`; grants
remotos foram verificados com `anon_execute=false`,
`authenticated_execute=false` e `service_role_execute=true`. O Advisor remoto
oficial caiu para 50 achados totais, 41
`authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Atualizacao em 2026-07-17: `privacy-rpc` v2 tambem passou a executar o
cancelamento de exclusao de conta. O browser nao envia `user_id`; o broker
deriva o ator do JWT e chama `cancel_account_deletion_for_user`, exclusiva de
`service_role`. A migration `20260717143000` foi aplicada ao remoto, removeu o
contrato antigo ausente, reconciliou oito ACLs historicos e a verificacao final
confirmou `anon_execute=false`, `authenticated_execute=false` e
`service_role_execute=true` para o novo comando. A migration
`20260717144000` tornou o comando idempotente e protegido contra concorrencia
com lock da agenda de exclusao.

Resultado `location-rpc` em 2026-07-07: criada e implantada a Edge Function
`location-rpc` com `verify_jwt=true` para
`rpc_upsert_canonical_city_by_ibge`. `LocationGeocodingService` passou a usar
`LocationRpcService`, com validacao de UF, cidade e codigo IBGE no broker. A
migration `20260707213810` atualizou o helper legado para permitir
`service_role` no caminho server-side, removeu `EXECUTE` direto de
`authenticated` e manteve apenas `service_role`. Smoke remoto sem JWT retornou
`401`, grants remotos foram verificados com `anon_execute=false`,
`authenticated_execute=false` e `service_role_execute=true`. O Advisor remoto
oficial caiu para 49 achados totais, 40
`authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Resultado `mobility-rpc` em 2026-07-07: criada e implantada a Edge Function
`mobility-rpc` com `verify_jwt=true` para `log_ride_dispatch_attempt`,
`update_latest_ride_dispatch_attempt`, `cancel_pending_ride_offers` e
`release_driver_availability_for_ride`. `MobilityAuditService` e
`DriverAvailabilityService` passaram a usar `MobilityRpcService`, sem executar
os helpers diretamente pelo browser. O broker deriva usuario do JWT, valida
participacao na corrida por perfil de passageiro/motorista ou admin canonico,
e chama os helpers legados com `service_role`. A migration `20260707220108`
removeu `EXECUTE` direto de `authenticated` dos quatro helpers, mantendo
apenas `service_role`. Smoke remoto sem JWT retornou `401`, grants remotos
foram verificados com `anon_execute=false`, `authenticated_execute=false` e
`service_role_execute=true`. O Advisor remoto oficial caiu para 45 achados
totais, 36 `authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Resultado `delivery-rpc` em 2026-07-07: criada e implantada a Edge Function
`delivery-rpc` com `verify_jwt=true` para os 10 RPCs mutantes de
pedido/entrega (`delivery_create_order`,
`delivery_transition_logistics_status`, `delivery_mark_picked_up`,
`delivery_attach_delivery_proof`, `delivery_mark_delivered`,
`delivery_transition_financial_status`, `delivery_report_occurrence`,
`delivery_resolve_occurrence`, `delivery_update_order_notes` e
`delivery_update_order_source_metadata`). `OrderDeliverySSOTService` passou a
usar `DeliveryRpcService`, sem executar os helpers diretamente pelo browser. O
broker deriva usuario do JWT, valida acesso ao `actorProfileId` por
dono/membro/admin, valida o papel permitido para cada acao no pedido e so entao
chama os helpers legados com `service_role`. A migration `20260707222343`
removeu `EXECUTE` direto de `authenticated` dos 10 helpers, mantendo apenas
`service_role`. Smoke remoto sem JWT retornou `401`, grants remotos foram
verificados com `anon_execute=false`, `authenticated_execute=false` e
`service_role_execute=true`. O Advisor remoto oficial caiu para 35 achados
totais, 26 `authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Resultado `mobility-rpc` aceite atomico em 2026-07-07: o broker existente foi
estendido para `accept_ride_atomic`, e `MobilityOfferService` deixou de chamar
o RPC diretamente pelo browser. O broker deriva usuario do JWT, valida que o
`driverProfileId` pertence ao usuario autenticado ou a um admin canonico, e so
entao chama o helper legado com `service_role`. A migration `20260707224108`
removeu `EXECUTE` direto de `authenticated`, manteve apenas `service_role` e
corrigiu a funcao para continuar exigindo motorista verificado, online,
disponivel e apto para a estrategia mesmo quando chamada por `service_role`.
Smoke remoto sem JWT retornou `401`; grants remotos foram verificados com
`anon_execute=false`, `authenticated_execute=false` e
`service_role_execute=true`. O Advisor remoto oficial caiu para 34 achados
totais, 25 `authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Resultado `community-rpc` em 2026-07-07: criada e implantada a Edge Function
`community-rpc` com `verify_jwt=true` para criacao de alerta, criacao de
ocorrencia, contador de edicao de alerta, melhor resposta de QA e contadores de
participantes de eventos. `CommunityAlertService`, `CommunityIssueService`,
`CommunityQAService`, `CommunityEventsRuntimeService` e `AdminEventsService`
deixaram de chamar diretamente os helpers privilegiados pelo browser. A
migration `20260707225829` removeu `EXECUTE` direto de `authenticated` de
`create_community_alert` em tres assinaturas, `create_community_issue`,
`increment_alert_edit_count`, `mark_best_answer`,
`increment_event_participants` e `decrement_event_participants`. Os helpers de
criacao passam a aceitar `_actor_user_id` apenas no caminho `service_role` do
broker, preservando residencia verificada e auditoria com usuario real. Smoke
remoto sem JWT retornou `401`; grants remotos foram verificados com
`anon_execute=false`, `authenticated_execute=false` e
`service_role_execute=true`. O Advisor remoto oficial caiu para 26 achados
totais, 17 `authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Atualizacao eventos em 2026-07-09: participacao e check-in de eventos foram
movidos para `event-rpc` com `verify_jwt=true` e RPCs atomicas dedicadas
(`join_event_participation`, `leave_event_participation`,
`check_in_event_participation` e `check_in_event_participation_by_code`). O
`community-rpc` permanece responsavel por alerta, ocorrencia, contador de
edicao de alerta e melhor resposta de QA. Os helpers legados
`increment_event_participants` e `decrement_event_participants` tiveram
`EXECUTE` de `service_role` revogado pela migration `20260709005208` e foram
removidos do contrato remoto pela migration
`20260709011223_drop_legacy_event_counter_rpcs.sql`.

Atualizacao `community-rpc` em 2026-07-14: o broker foi reduzido ao contrato
ativo `createAlert`; ocorrencias, QA e eventos permanecem em seus dominios e
brokers canonicos. A migration
`20260714090000_add_community_rpc_scale_controls.sql` adicionou limite atomico
por usuario/acao, inacessivel ao browser, com comportamento fail-closed. A
telemetria usa `function_audit` sem payload de conteudo e e consultada apenas
por RPCs administrativos de percentis e SLO. O middleware generico de Deno KV
foi documentado corretamente como defesa complementar, nao como contador
atomico autoritativo. A migration `20260714093000` limita a retencao da
telemetria do broker a 90 dias, com limpeza horaria em lotes via Supabase Cron
e funcao privada sem grants de navegador.

Resultado `profile-rpc` em 2026-07-07: criada e implantada a Edge Function
`profile-rpc` com `verify_jwt=true` para criacao de perfil, alteracao de
handle, exclusao de perfil, transferencia de ownership e convite de membro por
email. `MultiProfileService` e `ProfileMembersService` deixaram de chamar
diretamente os helpers privilegiados pelo browser; os bootstraps E2E tambem
passaram a usar a Edge Function. A migration `20260707232826` moveu a logica
para helpers internos com `actor_user_id` explicito, criou wrappers
`service_role` para o broker e removeu `EXECUTE` direto de `authenticated` de
`create_profile_with_extension`, `update_profile_handle`, `delete_profile`,
`transfer_profile_ownership` e `invite_profile_member_by_email`. Smoke remoto
sem JWT retornou `401`; grants remotos foram verificados com
`anon_execute=false`, `authenticated_execute=false` e
`service_role_execute=true` nos helpers antigos, wrappers publicos e helpers
privados. O Advisor remoto oficial caiu para 21 achados totais, 12
`authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`.

Resultado `role-rpc` e helpers RLS privados em 2026-07-07/2026-07-08: criada e
implantada a Edge Function `role-rpc` com `verify_jwt=true` para `hasRole`,
`getUserRoles`, `isAdmin` e `isSuperAdmin`. `RoleService` deixou de chamar
diretamente `has_role`, `get_user_roles`, `is_admin` e `is_super_admin` pelo
browser. O broker valida JWT, limita leitura ao proprio usuario ou a admin
canonico, e chama os helpers legados com `service_role`. A migration
`20260707234302` removeu `EXECUTE` direto de `anon` e `authenticated` de
`has_role(uuid, app_role)` e `get_user_roles(uuid)`, mantendo apenas
`service_role`. A migration `20260708000031` criou equivalentes `private.*` para
os helpers de autorizacao usados por RLS, reescreveu 116 referencias de policies
para o schema privado e removeu `EXECUTE` direto de `authenticated` dos wrappers
publicos `auth_can_access_profile`, `can_manage_profile`,
`group_can_manage_members`, `is_admin`, `is_admin_from_roles`, `is_admin_user` e
`is_super_admin`. Smoke remoto sem JWT retornou `401`; grants remotos foram
verificados com wrappers publicos `anon_execute=false`,
`authenticated_execute=false` e `service_role_execute=true`. O Advisor remoto
oficial caiu para 12 achados totais, 3
`authenticated_security_definer_function_executable` e 3
`anon_security_definer_function_executable`, todos os achados
`SECURITY DEFINER` restantes concentrados nos overloads PostGIS
`st_estimatedextent`.

## Definicao De Pronto

A Security Authority inicial esta pronta quando:

- `docs/governance/AUTHORITIES.md` existe e aponta para a autoridade ativa.
- `docs/governance/security/SECURITY_AUTHORITY.md` referencia os SSOTs atuais.
- `RISK_LEVELS.md`, `AI_AGENT_RULES.md`, `SUPABASE_SECURITY_MODEL.md` e
  `EXCEPTIONS.md` existem.
- Validadores existentes estao mapeados no processo.
- `validate:security-authority` existe e e chamado por `verify:deploy`.
- Nenhuma regra duplica conteudo canonico sem link para a origem.
- `npm run validate:docs-structure` passa.
- `npm run validate:docs-live-links` passa.
- Para mudancas em Supabase, `npm run validate:migrations`,
  `npm run validate:migrations:remote` e `npm run verify:deploy` passam.

## Proxima Acao Recomendada

O hardening de aplicacao/RPC esta fechado para o escopo atual do Advisor. O
Advisor remoto em 2026-07-08 segue com 12 achados totais: `spatial_ref_sys`,
quatro extensoes em `public`, seis warnings nos overloads PostGIS
`st_estimatedextent` e `auth_leaked_password_protection`.

Guard adicional implementado em 2026-07-08: `validate:migrations` agora bloqueia
futuras migrations que toquem `public.spatial_ref_sys` ou
`public.st_estimatedextent` sem o marcador de preflight
`security-authority: extension-owner-preflight
EXC-2026-07-08-POSTGIS-EXTENSION-OWNER`. O marcador so pode ser usado depois
de evidencia real de owner/plataforma; ele existe para evitar repetir migration
padrao sem ownership suficiente.

Guard remoto opcional implementado em 2026-07-08:
`npm run security:advisor:residuals` executa o Advisor remoto e falha se surgir
qualquer achado fora dos 12 residuais mapeados nas excecoes. O comando aceita
que achados conhecidos desaparecam, para nao bloquear a correcao de HIBP ou
PostGIS quando forem resolvidos por plataforma/Auth Settings. A allowlist de
`cache_key` agora fica em
`docs/governance/security/SUPABASE_ADVISOR_RESIDUALS.json`, evitando duplicacao
hardcoded no script. O mesmo comando tambem aceita
`-- --advisor-json caminho/advisor.json` para validar um export offline; esse
caminho tem cobertura automatizada no gate `validate:security-authority`.

Resultado adicional em 2026-07-08: foi criado o operador read-only
`npm run security:postgis:preflight` para a excecao
`EXC-2026-07-08-POSTGIS-EXTENSION-OWNER`. O script consulta o catalogo remoto
linkado via `supabase db query --linked --output json`, avalia owner/schema/RLS
de `spatial_ref_sys`, extensoes em `public` e grants de `st_estimatedextent`,
e retorna `blocked`, `ready` ou `resolved` sem executar `ALTER`, `REVOKE`,
`GRANT` ou migration. A Security Authority cobre SQL read-only, parser do JSON
da CLI e avaliacao de ownership em fixtures offline.
Execucao real em 2026-07-08 retornou `blocked`: extensoes `citext`, `pg_trgm`,
`postgis`, `unaccent`, `public.spatial_ref_sys` e tres overloads
`public.st_estimatedextent` continuam owned por `supabase_admin` e nao devem
receber migration padrao ate haver rota de plataforma/owner aprovada.
Nova execucao em 2026-07-08 confirmou o mesmo `blocked`; isso preserva a
excecao aberta e impede usar o marcador `extension-owner-preflight` sem rota de
plataforma/owner.

Resultado readiness em 2026-07-08: `npm run validate:docs-structure` e
`npm run validate:docs-live-links` passaram, fechando os gates documentais
citados na definicao de pronto.
Resultado Advisor em 2026-07-08: `npm run security:advisor:residuals` validou
12 achados remotos, todos dentro da allowlist canonica
`docs/governance/security/SUPABASE_ADVISOR_RESIDUALS.json`.

Resultado Auth policy em 2026-07-08: a mitigacao local da excecao HIBP foi
alinhada ao SSOT de senha. O `supabase/config.toml` ficou com
`minimum_password_length = 12` e
`password_requirements = "lower_upper_letters_digits_symbols"`, valor suportado
pela CLI local. O app passou a usar o mesmo minimo canonico em validadores,
mensagens, placeholders de cadastro/reset/perfil e teste de politica de senha.
O gate `validate:security-authority` tambem passou a validar esse alinhamento
para impedir regressao.

Resultado Auth/HIBP local em 2026-07-08: a checagem de senha comprometida foi
centralizada em `src/core/auth/utils/compromisedPassword.ts`. Cadastro,
redefinicao e troca de senha agora usam `checkPasswordCompromise`, e
`validate:security-authority` bloqueia chamada direta a `HibpService` nessas
superficies. Isso reduz risco enquanto `EXC-2026-07-08-AUTH-HIBP-DASHBOARD`
segue aberta no provedor Supabase.

Resultado Auth/HIBP remoto em 2026-07-08: foi criado
`scripts/security/supabase-auth-hibp.mjs` e o script
`npm run security:auth:hibp`. Ele consulta/aplica
`password_hibp_enabled=true` via Management API quando houver PAT e plano
compativel, usando o project ref linkado sem imprimir segredo. O comando fica
fora do `verify:deploy` porque depende de credencial remota e estado do plano
Supabase, mas sua existencia e contrato sao cobertos por
`validate:security-authority`.

Resultado adicional em 2026-07-08: o operador remoto de HIBP foi endurecido
para auditoria. O script agora valida formato de project ref e nome da env var
do PAT antes de chamar a Management API, e aceita `--json` para gerar evidencia
estruturada sem expor o token. A Security Authority cobre parse de argumentos,
validacao de entradas e status sanitizado sem chamada de rede.
Resultado adicional em 2026-07-08: o modo JSON do operador HIBP passou a emitir
status estruturado tambem quando o bloqueio e ausencia de PAT. O comando ainda
falha com exit code diferente de zero, mas produz evidencia parseavel com
`status=blocked`, `blocker=missing_pat`, project ref e nome da env var esperada,
sem imprimir valor de token.

Resultado Edge Function auth policy em 2026-07-08: o modelo Supabase passou a
documentar que `verify_jwt=false` e excecao operacional. O gate
`validate:security-authority` valida que funcoes sem JWT estejam exatamente na
allowlist canonica e que funcoes configuradas como `admin-*` ou `*-rpc` devem
manter `verify_jwt=true`. O gate
`security:validate` tambem passou a ler `supabase/config.toml` e bloquear a
mesma regressao no caminho principal de deploy. A allowlist sem JWT foi movida
para `docs/governance/security/EDGE_FUNCTION_AUTH_POLICY.json`, consumida pelo
validador e pelos testes para evitar listas paralelas. O contrato tambem passou
a exigir que toda Edge Function tenha bloco `[functions.*]` explicito em
`supabase/config.toml`, com `verify_jwt=true` por padrao e `false` apenas para
webhook assinado, cron com segredo ou endpoint publico allowlistado. O
validador tambem falha para secoes/allowlist que apontem para Edge Functions
sem diretorio real em `supabase/functions`, e valida schema, categorias e regex
da propria politica JSON antes de aceitar o contrato. A validacao foi isolada
em `scripts/security/edge-function-auth-policy.mjs`, compartilhada pelo gate
`security:validate` e pela suite `validate:security-authority`, que inclui
casos negativos para impedir contrato implicito, `kind` invalido, regex
invalida e conflito com nomes que sempre exigem JWT. O parser/validador do
contrato local `[functions.*]` foi isolado em
`scripts/security/edge-function-auth-config.mjs`, com fixtures negativas para
`verify_jwt` ausente, `verify_jwt=false` nao autorizado, allowlist publica
configurada com JWT, secao obsoleta sem diretorio real e broker privilegiado
sem JWT. A mesma politica agora contem `serviceRoleAllowlist`: qualquer Edge
Function que use `SUPABASE_SERVICE_ROLE_KEY`/`SERVICE_ROLE` precisa declarar
`kind`, `risk`, `label` e padroes obrigatorios. O gate compara a allowlist com
os arquivos reais e falha para funcao sem classificacao, classificacao sem
implementacao, classificacao sem uso real de `service_role` ou ausencia do
controle exigido.

Resultado deploy gate em 2026-07-08: `verify:deploy` passou a executar
`security:validate`, nao apenas verificar sua existencia no `package.json`.
Com isso, validacoes de secrets hardcoded, CORS wildcard, uso de `service_role`
em Edge Functions, `verify_jwt` das Edge Functions e bucket privado de
documentos entram no gate principal de release.

Resultado fronteira `service_role` em 2026-07-08: criada a policy canonica
`docs/governance/security/SERVICE_ROLE_BOUNDARY_POLICY.json` para classificar
onde `SUPABASE_SERVICE_ROLE_KEY`, `SERVICE_ROLE_KEY` ou
`VITE_SUPABASE_SERVICE_ROLE_KEY` podem aparecer fora das Edge Functions. O
validador `scripts/security/service-role-boundary.mjs` e consumido por
`security:validate` e bloqueia segredo/env access em `src/`, `public/` ou API
runtime fora de caminho allowlistado. A cobertura em
`validate:security-authority` subiu para 68 testes, incluindo fixtures
negativas para browser source, asset publico e caminho de auditoria que so pode
conter literal historico, nao acesso runtime a env.

Resultado concentracao de scripts operacionais em 2026-07-08: o helper runtime
`scripts/lib/supabase-client.mjs` passou a ser a unica fronteira de
`process.env.SUPABASE_SERVICE_ROLE_KEY` para scripts migrados, enquanto
`scripts/lib/supabase-client.ts` virou fachada tipada. Foram migrados
backup/restore de Storage, geocoding, sync territorial IBGE/municipal, seeds
E2E, validadores remotos curtos, `validate-gate3-metadata.mjs` e
`economic-benchmark-ssot.mjs`. A policy `SERVICE_ROLE_BOUNDARY_POLICY.json`
agora permite nesses scripts apenas literal/documentacao da chave; se voltarem a
ler `process.env.SUPABASE_SERVICE_ROLE_KEY` direto, `security:validate` falha.
A cobertura da Authority subiu para 68 testes, com casos especificos para helper
runtime permitido, fachada tipada proibida e operadores migrados proibidos.

Resultado concentracao E2E em 2026-07-08: a fronteira `service_role` passou a
escanear `tests/e2e/`, `tests/helpers/` e `tests/operational/`. O unico helper
de teste autorizado a ler `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY`
e `tests/helpers/operational-env.ts`; specs E2E ficam limitadas a literal de
mensagem/setup. Foram migrados os fluxos de gastronomia, recomendacoes,
comunidade, comunicacao territorial, auth/business, admin-pricing e education
para usar o helper operacional em vez de montar clientes admin diretamente.

Resultado readiness em 2026-07-08: o scan Codex Security
`43a63bb9-5fc0-4cd4-a0f3-3f1387b1daa2` foi concluido contra o commit
`303ff478ac29a7c2bd7d0a354c81970fd0bdf8fc`, escopo `supabase`, com `309/309`
linhas do worklist fechadas e `0` achados reportaveis. Em seguida,
`npm run security:postgis:preflight` confirmou `status=blocked` para
`EXC-2026-07-08-POSTGIS-EXTENSION-OWNER`, `npm run security:auth:hibp --
--json` confirmou `status=blocked`/`missing_pat` para
`EXC-2026-07-08-AUTH-HIBP-DASHBOARD`, `npm run security:advisor:residuals`
validou os 12 residuais mapeados e `npm run verify:deploy` passou com
`PROJETO PRONTO PARA DEPLOY`.

Resultado revalidacao em 2026-07-09: `npm run validate:security-authority`
passou com `68/68`, `npm run security:validate` passou,
`npm run security:advisor:residuals` validou novamente os 12 residuais
mapeados, `npm run security:postgis:preflight` retornou `status=blocked` por
ownership `supabase_admin` e `npm run security:auth:hibp -- --json` retornou
`status=blocked`/`missing_pat` sem expor token.

Resultado revalidacao em 2026-07-13: `npm run security:advisor:residuals`
confirmou os mesmos 12 achados, todos dentro da allowlist canonica;
`npm run security:postgis:preflight` continuou `blocked` pelos objetos da
plataforma owned por `supabase_admin`; e `npm run security:auth:hibp --check`
permaneceu bloqueado por ausencia de `SUPABASE_ACCESS_TOKEN` ou
`SUPABASE_MANAGEMENT_API_TOKEN` com escopo de Management API. Nenhuma
credencial implicita foi lida e nenhuma alteracao cega foi aplicada.

Proxima etapa recomendada antes do lancamento:

- resolver `EXC-2026-07-08-POSTGIS-EXTENSION-OWNER` por uma janela dedicada de
  plataforma/Supabase, com owner correto (`supabase_admin`) ou via suportada
  para mover/reinstalar extensoes fora de `public` e tratar
  `spatial_ref_sys`;
- resolver `EXC-2026-07-08-AUTH-HIBP-DASHBOARD` habilitando leaked-password
  protection no Auth Settings ou via Management API com PAT valido;
- reexecutar `supabase db advisors --linked --type security --fail-on none` e
  fechar as excecoes somente se os achados sumirem.

Nao repetir migration padrao como `postgres` para `spatial_ref_sys` ou
`st_estimatedextent` sem preflight aprovado: em 2026-07-08, `alter table
public.spatial_ref_sys enable row level security` falhou com
`ERROR: 42501: must be owner of table spatial_ref_sys`, e a migration anterior
que tentou revogar `st_estimatedextent` nao alterou os grants da extensao.
