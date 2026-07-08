# Status Atual do Projeto

Data: 2026-07-08
Branch: codex/ssot-cleanup
Ultimo commit validado: b0bedaaa (`refactor: consolida SSOT de formatacao e admin`)

Observacao: este documento e a fonte operacional atual. O historico abaixo fica preservado por contexto, mas qualquer registro antigo de bloqueio por falta de `git`/`node` nao representa o ambiente validado em 2026-06-06.

## Validacoes Recentes

- Supabase remoto em 2026-07-08: Advisor reexecutado e permanece em 12 achados
  totais. Os achados de aplicacao/RPC corrigiveis por migrations e Edge
  Functions foram removidos; restam apenas `public.spatial_ref_sys`,
  extensoes `postgis`/`unaccent`/`pg_trgm`/`citext` em `public`, overloads
  PostGIS `st_estimatedextent` executaveis por `anon`/`authenticated` e
  `auth_leaked_password_protection`. Preflight para habilitar RLS em
  `public.spatial_ref_sys` falhou com `ERROR: 42501: must be owner of table
  spatial_ref_sys`; portanto o item foi formalizado como
  `EXC-2026-07-08-POSTGIS-EXTENSION-OWNER`. Leaked-password protection tambem
  foi formalizado como `EXC-2026-07-08-AUTH-HIBP-DASHBOARD`, pois depende de
  Auth Settings/Management API com PAT valido e plano compativel.
- Security Authority em 2026-07-08: `validate:migrations` passou a bloquear
  futuras migrations que tentem tocar `public.spatial_ref_sys` ou
  `public.st_estimatedextent` sem declarar preflight de owner/plataforma
  vinculado a `EXC-2026-07-08-POSTGIS-EXTENSION-OWNER`. O gate
  `validate:security-authority` foi ampliado para 57 testes e valida tanto as
  excecoes canonicas quanto as travas de extension-owner, residuais do Advisor
  e alinhamento entre `supabase/config.toml` e o SSOT de senha do app. O mesmo
  gate agora valida que `verify_jwt=false` em Edge Functions permanece restrito
  as excecoes documentadas em
  `docs/governance/security/EDGE_FUNCTION_AUTH_POLICY.json` e que funcoes
  configuradas como `admin-*` ou `*-rpc` exigem `verify_jwt=true`. A validacao
  de schema da politica vive em `scripts/security/edge-function-auth-policy.mjs`
  e tem casos negativos para contrato implicito, `kind` invalido, regex
  invalida e conflito com padroes privilegiados. A validacao do contrato local
  `[functions.*]` vive em `scripts/security/edge-function-auth-config.mjs`, com
  casos negativos para `verify_jwt` ausente, `verify_jwt=false` nao autorizado,
  allowlist publica configurada com JWT e secao obsoleta sem funcao real. Toda
  Edge Function que usa `SUPABASE_SERVICE_ROLE_KEY`/`SERVICE_ROLE` agora
  precisa de classificacao explicita em `serviceRoleAllowlist`, com `kind`,
  `risk`, `label` e padroes obrigatorios conferidos contra o codigo real. Fora
  das Edge Functions, a fronteira de `service_role` fica em
  `docs/governance/security/SERVICE_ROLE_BOUNDARY_POLICY.json` e e validada por
  `scripts/security/service-role-boundary.mjs`, bloqueando env access ou
  literal sensivel em browser/public/API nao classificada.
- Scripts operacionais em 2026-07-08: o acesso runtime a
  `SUPABASE_SERVICE_ROLE_KEY` foi concentrado em
  `scripts/lib/supabase-client.mjs`, com `scripts/lib/supabase-client.ts` como
  fachada tipada. Foram migrados backup/restore de Storage, geocoding, sync
  territorial IBGE/municipal, seeds E2E, validadores remotos curtos
  (`validate-reconciliation-final`, `validate-slug-history-final`,
  `validate-etapa12-remote` e `validate-e2e-setup`), `validate-gate3-metadata.mjs`
  e `economic-benchmark-ssot.mjs`. A policy agora permite nesses caminhos apenas
  literal/documentacao da chave, nao `process.env.SUPABASE_SERVICE_ROLE_KEY`
  direto. Scripts legados de validacao (`validate-question-answers`,
  `validate-comment-likes`, `validate-constraints-final`,
  `validate-business-district-required`, `validate-implementation`,
  `validate-gate3-simple`, `validate-e2e-setup` e `economic-benchmark-ssot`)
  tambem passaram a usar as factories canonicas do helper. O gate
  `security:validate` agora bloqueia `createClient(...)` direto em `scripts/`,
  exceto dentro de `scripts/lib/supabase-client.mjs`.
- Testes E2E em 2026-07-08: a fronteira `service_role` foi expandida para
  `tests/e2e/`, `tests/helpers/` e `tests/operational/`. Specs E2E podem citar
  `SUPABASE_SERVICE_ROLE_KEY` em mensagens de setup/skip, mas nao podem mais
  ler a variavel diretamente. O acesso admin foi concentrado em
  `tests/helpers/operational-env.ts` e aplicado aos fluxos de gastronomia,
  recomendacoes, comunidade, comunicacao territorial, auth/business,
  admin-pricing e education. O mesmo helper agora tambem concentra cliente anon
  operacional (`VITE_SUPABASE_URL` + publishable/anon key), com `storageKey`
  isolada por cliente para evitar colisao de sessao nos runners. Essa fronteira
  tambem ficou enforceable no `security:validate`: `createClient(...)` e leitura
  direta de `VITE_SUPABASE_*` ficam bloqueados em `tests/e2e/`,
  `tests/helpers/` e `tests/operational/`, exceto no helper canonico. Os testes
  Vitest `gate2-validation` e `gate2-tracking-pipeline` sairam de
  `tests/e2e/` para `tests/operational/`, e `playwright.config.ts` passou a
  ignorar `*.test.ts` no `testDir` E2E para manter Playwright e Vitest
  separados. O teste real de RLS de posts tambem saiu da raiz de `tests/` para
  `tests/operational/` e passou a criar clientes anon/admin somente via
  `tests/helpers/operational-env.ts`.
- Runtime Supabase em 2026-07-08: o barrel publico
  `src/integrations/supabase/index.ts` deixou de reexportar `createClient`. A
  Security Authority agora bloqueia import/export de `createClient` vindo de
  `@supabase/supabase-js` em `src/`, exceto no cliente canonico
  `src/integrations/supabase/supabase.ts`, e em `api/`, exceto no helper
  `api/_shared/supabaseAdmin.ts`. O mesmo barrel agora concentra os tipos
  publicos `SupabaseClient`, `RealtimeChannel`,
  `RealtimePostgresChangesPayload`, `AuthChangeEvent` e `Session` usados pelo
  runtime do app; hooks de modulo devem consumir tipos expostos pelos services
  do proprio modulo, nao importar `@supabase/supabase-js` diretamente. Essa
  fronteira tambem ficou executavel no `security:validate`, que bloqueia
  import/export de `@supabase/supabase-js` em `src/` fora dos tres arquivos
  canonicos de integracao Supabase.
- Deploy gate em 2026-07-08: `verify:deploy` passou a executar
  `validate:deps`, `validate:taxonomy`,
  `validate:architecture:incremental`, `validate:architecture:governance`,
  `validate:session-context`, `validate:ssot`, `validate:hardcodes`, `validate:upload:ssot`,
  `security:validate` e `security:config:validate`, alem de exigir que esses
  scripts existam. Assim o gate principal agora falha por violacao de camada,
  ciclo arquitetural, import legado, modulo fora da taxonomia, quebra de
  governanca arquitetural, identificador ambiguo de contexto de sessao,
  regressao de hooks legados de auth/profile, quebra de SSOT/URL canonica, hardcode operacional de
  preco/coordenada/UUID/status/limite, acesso direto a upload ou otimizacao de
  imagem fora do SSOT, CSP/vercel.json fora do SSOT de seguranca, secrets
  hardcoded, CORS wildcard, uso indevido ou nao classificado de `service_role`
  em Edge Functions, uso de service role fora da fronteira canonica,
  `verify_jwt=false` fora da allowlist, brokers `admin-*`/`*-rpc` sem
  `verify_jwt=true` e regressao no bucket privado de documentos de verificacao.
  A allowlist executavel dessas excecoes vive em
  `docs/governance/security/EDGE_FUNCTION_AUTH_POLICY.json`, consumida pelo
  gate e pelos testes da Security Authority. O contrato local tambem passou a
  exigir bloco `[functions.*]` explicito para todas as Edge Functions, evitando
  dependencia de default implicito de `verify_jwt` e bloqueando
  secoes/allowlist obsoletas sem implementacao em `supabase/functions`. O gate
  tambem valida schema, categorias e regex da propria politica JSON, cobertura
  de `serviceRoleAllowlist`, fronteira `SERVICE_ROLE_BOUNDARY_POLICY.json` e o
  contrato local do `config.toml` via modulos compartilhados com a suite da
  Security Authority.
- Security Advisor remoto em 2026-07-08: criado
  `npm run security:advisor:residuals`, comando manual que executa o Advisor
  remoto e falha se aparecer achado fora dos residuais mapeados nas excecoes
  ativas. A allowlist dos `cache_key` residuais vive em
  `docs/governance/security/SUPABASE_ADVISOR_RESIDUALS.json`, sem lista
  duplicada no script. O comando tambem aceita
  `-- --advisor-json caminho/advisor.json` para auditoria offline. O modo
  offline agora tem cobertura no gate `validate:security-authority`, que valida
  export conhecido e achado desconhecido. O modo remoto nao entra no
  `verify:deploy` porque depende de rede, projeto linkado e credencial
  Supabase valida.
- Supabase/Auth em 2026-07-08: a mitigacao local da excecao
  `EXC-2026-07-08-AUTH-HIBP-DASHBOARD` foi alinhada ao SSOT de senha. O
  `supabase/config.toml` agora usa
  `password_requirements = "lower_upper_letters_digits_symbols"` com
  `minimum_password_length = 12`, e o app tambem exige 12 caracteres com
  maiuscula, minuscula, numero e caractere especial em validadores,
  placeholders e testes. A mitigacao local de senha comprometida agora fica no
  helper SSOT `checkPasswordCompromise` e cobre cadastro, redefinicao e troca de
  senha, com guard no `validate:security-authority` para impedir chamada direta
  a `HibpService` nessas superficies. Esse alinhamento agora e verificado por
  `validate:security-authority`. A protecao HIBP do provedor continua pendente no
  Dashboard/Auth Settings ou Management API, pois depende do provedor Supabase.
- Continuidade em 2026-07-06: removido o ultimo hardcode SSOT detectado por
  `validate:hardcodes` no fallback territorial publico, criando
  `TERRITORIAL_GROUP_STATUS` como contrato canonico para status de grupos
  territoriais. Documentacao viva de URLs foi alinhada ao comportamento sem
  redirect automatico de entidades comunitarias nao canonicas.
- Gate de fase reexecutado em 2026-07-06 e fechado verde: corrigida a
  persistencia de review pos-atendimento profissional para usar
  `requester_profile_id` do atendimento como SSOT, atualizada a expectativa SEO
  da aba pausada de oportunidades comunitarias para `noindex`, e corrigido
  contraste mobile em gastronomia/banner de consentimento.
- Validacoes em 2026-07-06 nesta continuidade: `npm run validate:hardcodes`,
  `npm run typecheck:app`, `npm run validate:ssot`,
  `npm run validate:docs-structure`, `npm run validate:docs-live-links` e
  eslint pontual dos arquivos alterados passaram.
- `npm run validate:phase:core`: passou em 2026-07-06 com `53 passed` no
  Playwright phase-core, alem de typecheck completo, lint, docs-live-links e
  SSOT comunitario.
- Supabase remoto em 2026-07-07: o drift local/remoto foi reconciliado. As 4
  migrations que existiam apenas no remoto foram recuperadas, as 41 migrations
  locais pendentes foram aplicadas ao projeto linkado com
  `supabase db push --linked --include-all --yes`, e
  `npm run validate:migrations:remote` agora passa sem drift. `npm run
  verify:deploy` passou apos integrar `validate:migrations` e
  `validate:migrations:remote`. Advisor remoto apos os follow-ups de
  `public-assets`, `search_path`, RLS always-true, grants anonimos
  privilegiados e hardening das RPCs LGPD `has_consent`/`record_consent`: 158
  achados, com 1 erro residual em `public.spatial_ref_sys` e warnings
  restantes de funcoes `SECURITY DEFINER` publicas/autenticadas, extensoes em
  `public` e leaked-password protection.
- Supabase/Auth em 2026-07-07: login por username saiu do RPC publico
  `get_email_by_username` e passou para a Edge Function remota
  `auth-username-login` com rate limit e resposta generica. Migration
  `20260707103853_harden_username_auth_rpc_surface` revogou `PUBLIC`, `anon` e
  `authenticated` do RPC antigo, mantendo `service_role`; verificacao remota
  confirmou `anon_execute=false` e advisor caiu para 156 achados totais / 18
  `anon_security_definer_function_executable`.
- Supabase/RPC publica em 2026-07-07: `get_site_setting(text)` deixou de ser
  `SECURITY DEFINER` via migration
  `20260707111214_harden_get_site_setting_invoker`, mantendo leitura publica
  como `SECURITY INVOKER` com grants explicitos para `anon`/`authenticated`.
  `site_settings` ficou sem DML publico e o teste remoto como role `anon`
  retornou `Achegue-se`; advisor remoto caiu para 154 achados totais / 17
  `anon_security_definer_function_executable` / 131
  `authenticated_security_definer_function_executable`.
- Supabase/reviews publicas em 2026-07-07: `get_business_reviews(uuid,
  integer, integer)` deixou de ser `SECURITY DEFINER` via migration
  `20260707112353_harden_get_business_reviews_invoker`, mantendo leitura
  publica como `SECURITY INVOKER` com grants explicitos para
  `anon`/`authenticated`. `reviews` ficou sem DML anonimo e o teste remoto como
  role `anon` retornou uma review publica ativa; advisor remoto caiu para 152
  achados totais / 16 `anon_security_definer_function_executable` / 130
  `authenticated_security_definer_function_executable`.
- Supabase/menu publico em 2026-07-07: `get_featured_menu_items(uuid)` e
  `get_active_promotions(uuid)` deixaram de ser `SECURITY DEFINER` via
  migration `20260707113531_harden_gastronomy_public_menu_rpcs_invoker`,
  mantendo leitura publica como `SECURITY INVOKER` com grants explicitos para
  `anon`/`authenticated`. `menus`, `menu_categories`, `menu_items` e
  `menu_promotions` ficaram sem DML anonimo; advisor remoto caiu para 148
  achados totais / 14 `anon_security_definer_function_executable` / 128
  `authenticated_security_definer_function_executable`.
- Supabase/feed publico de gastronomia em 2026-07-07:
  `get_recent_gastronomy_activities(text, integer, text[])` deixou de ser
  `SECURITY DEFINER` via migration
  `20260707114642_harden_gastronomy_activity_rpc_privacy`, mantendo leitura
  publica como `SECURITY INVOKER` com grants explicitos para
  `anon`/`authenticated` e sem heranca por `PUBLIC`. A RPC deixou de ler
  favoritos e compras privados; o feed publico passa a derivar apenas de
  reviews publicas visiveis por RLS. Advisor remoto caiu para 146 achados
  totais / 13 `anon_security_definer_function_executable` / 127
  `authenticated_security_definer_function_executable`.
- Supabase/helper territorial publico em 2026-07-07:
  `rpc_get_location_descendants_ids(uuid)` deixou de ser `SECURITY DEFINER` via
  migration `20260707115617_harden_location_descendants_rpc_invoker`, mantendo
  leitura publica como `SECURITY INVOKER` com grants explicitos para
  `anon`/`authenticated` e sem heranca por `PUBLIC`. Testes remotos como role
  `anon` confirmaram retorno para cidade ativa e grupo territorial ativo;
  advisor remoto caiu para 144 achados totais / 12
  `anon_security_definer_function_executable` / 126
  `authenticated_security_definer_function_executable`.
- Supabase/RPCs publicas adicionais em 2026-07-07: `get_brand_branches(uuid)`,
  `rpc_match_district_by_point(uuid, double precision, double precision)`,
  `count_lost_found_posts_by_type()` e
  `find_similar_lost_found_posts(uuid, integer)` deixaram de usar modo
  privilegiado nas migrations `20260707120534`,
  `20260707120937` e `20260707121321`. O matching territorial por ponto tambem
  foi corrigido para converter GeoJSON antes de `ST_Contains`, removendo o erro
  runtime `ST_Contains(jsonb, geometry)`. Advisor remoto caiu para 136 achados
  totais / 8 `anon_security_definer_function_executable` / 122
  `authenticated_security_definer_function_executable`.
- Supabase/contadores publicos em 2026-07-07: `increment_business_views(uuid)`,
  `increment_professional_views(uuid)` e `increment_vaga_view_count(uuid)`
  deixaram de ser executaveis diretamente por `PUBLIC`, `anon` e
  `authenticated` nas migrations `20260707122417` e `20260707123630`; o browser
  agora chama a Edge Function `track-public-view`, implantada no remoto com
  `--no-verify-jwt`, rate limit, whitelist de entidade e validacao UUID. O bug
  SQL de ambiguidade de parametro/coluna nos contadores de empresa/profissional
  tambem foi corrigido. Smoke HTTP remoto retornou `202 {"ok":true}`. Advisor
  remoto caiu para 130 achados totais / 5
  `anon_security_definer_function_executable` / 119
  `authenticated_security_definer_function_executable`.
- Supabase/snapshots publicos em 2026-07-07:
  `get_public_business_snapshot_by_slug(text,text,text,text)` e
  `get_public_gastronomy_snapshot_by_slug(text,text,text,text)` passaram a
  `SECURITY INVOKER` na migration `20260707124348`, mantendo `EXECUTE`
  explicito para `anon` e `authenticated` sem heranca por `PUBLIC`. Smoke
  remoto como role `anon` retornou snapshots de negocio e gastronomia para uma
  pizzaria ativa. Advisor remoto caiu para 126 achados totais / 3
  `anon_security_definer_function_executable` / 117
  `authenticated_security_definer_function_executable`; os achados anonimos
  restantes sao apenas overloads `st_estimatedextent` do PostGIS.
- Supabase/PostGIS em 2026-07-07: a migration `20260707124929` tentou revogar
  execucao publica dos overloads `st_estimatedextent`, mas o remoto manteve as
  ACLs porque os grants da extensao foram concedidos por `supabase_admin` e a
  migration linkada executa como `postgres`. Estado remoto confirmado:
  126 achados totais / 3 `anon_security_definer_function_executable` / 117
  `authenticated_security_definer_function_executable`, com os 3 anonimos ainda
  restritos a `st_estimatedextent`.
- Supabase/RPCs internas em 2026-07-07: a migration `20260707133656` removeu
  `EXECUTE` de `authenticated` para nove funcoes internas/trigger-only sem
  caller runtime de browser (`audit_education_lead_status_change`,
  `can_use_premium_link`, `check_suspension_expiry`, `generate_unique_handle`,
  `get_pending_webhooks`, `initialize_notification_preferences`,
  `initialize_user_mfa_status`, `trigger_start_dispatch` e
  `validate_profile_link_same_account`), mantendo `service_role`.
  `update_session_activity(text)` foi preservada por ser chamada por
  `SessionService`. Advisor remoto caiu para 117 achados totais / 3
  `anon_security_definer_function_executable` / 108
  `authenticated_security_definer_function_executable`.
- Supabase/RPCs autenticadas em 2026-07-07: as migrations `20260707134401` e
  `20260707134629` removeram `EXECUTE` de `authenticated` para helpers sem
  caller runtime/policy e para helpers chamados apenas por rotinas
  privilegiadas. A Edge Function `admin-notifications-rpc` foi criada e
  implantada com `requireAdmin`, rate limit e whitelist de acoes; a migration
  `20260707134943` moveu as RPCs `admin_notifications_get_*` para esse broker e
  removeu execucao direta por `authenticated`. Smoke remoto sem JWT de usuario
  retornou `401`. Advisor remoto caiu para 86 achados totais / 3
  `anon_security_definer_function_executable` / 77
  `authenticated_security_definer_function_executable`.
- Supabase/pricing admin em 2026-07-07: a Edge Function
  `admin-pricing-rpc` foi criada e implantada com `verify_jwt=true`,
  `requireAdmin`, rate limit, whitelist de acoes e validacao de que
  `performedBy` pertence ao usuario autenticado. A migration `20260707140908`
  removeu `EXECUTE` direto de `authenticated` dos RPCs
  `activate_pricing_rule` e `create_active_pricing_rule`, mantendo apenas
  `service_role`. Verificacao remota confirmou `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`; smoke remoto sem
  JWT retornou `401`. Advisor remoto atual: 84 achados totais / 3
  `anon_security_definer_function_executable` / 75
  `authenticated_security_definer_function_executable`.
- Supabase/site settings admin em 2026-07-07: a Edge Function
  `admin-site-settings-rpc` foi criada e implantada com `verify_jwt=true`,
  `requireAdmin`, rate limit, whitelist de acoes, whitelist de chaves e
  validacao de valor por tipo de setting. A migration `20260707141904` removeu
  `EXECUTE` direto de `authenticated` dos RPCs `get_all_site_settings` e
  `upsert_site_setting`, mantendo apenas `service_role`; `get_site_setting`
  segue publico como `SECURITY INVOKER`. Verificacao remota confirmou
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`; smoke remoto sem JWT retornou `401`. Advisor
  remoto atual: 82 achados totais / 3
  `anon_security_definer_function_executable` / 73
  `authenticated_security_definer_function_executable`.
- Supabase/comunicacao territorial admin em 2026-07-07: a Edge Function
  `admin-communication-rpc` foi criada e implantada com `verify_jwt=true`,
  `requireAdmin`, rate limit, whitelist de acoes e validacao de payload. O
  frontend admin deixou de chamar diretamente os RPCs
  `admin_approve_communication_channel` e
  `admin_reject_communication_channel_request`. A migration `20260707143712`
  ajustou os RPCs para receber o `admin_user_id` real quando chamados via
  `service_role`, preservando `reviewed_by_user_id`, `approved_by_user_id` e
  auditoria, e removeu `EXECUTE` direto de `authenticated`. Verificacao remota
  confirmou `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true`; smoke remoto sem JWT retornou `401`. Advisor
  remoto atual: 80 achados totais / 3
  `anon_security_definer_function_executable` / 71
  `authenticated_security_definer_function_executable`.
- Supabase/comunicacao territorial usuario em 2026-07-07: a Edge Function
  `communication-rpc` foi criada e implantada com `verify_jwt=true`,
  autenticacao obrigatoria, rate limit, whitelist de acoes e validacao de
  payload. O servico de comunicacao territorial deixou de chamar diretamente
  os RPCs de mutacao `request_communication_channel`,
  `create_communication_publication`, `update_communication_publication_draft`
  e `publish_communication_publication`. A migration `20260707145342` moveu
  esses RPCs para execucao exclusiva por `service_role`, preservando o usuario
  real via `actor_user_id`, e converteu `can_channel_publish_in_location(uuid,
  uuid)` para `SECURITY INVOKER`. Verificacao remota confirmou
  `anon_execute=false`, `authenticated_execute=false` e
  `service_role_execute=true` nas mutacoes; smoke remoto sem JWT retornou
  `401`. Em seguida, a migration `20260707151447` moveu o helper RLS
  `communication_current_user_can_manage_channel(uuid)` para o schema privado
  `private`, atualizou as policies dependentes e removeu o helper publico da
  superficie RPC. Verificacao remota confirmou `public_helper=null`,
  `anon_private_execute=false`, `authenticated_private_execute=true` e policies
  apontando para `private.communication_current_user_can_manage_channel`.
  Advisor remoto atual: 74 achados totais / 3
  `anon_security_definer_function_executable` / 65
  `authenticated_security_definer_function_executable`, sem achados restantes
  de comunicacao.
- Supabase/notificacoes em 2026-07-07: as operacoes de leitura/marcacao
  `mark_notification_as_read`, `mark_all_notifications_as_read` e
  `get_unread_notifications_count` deixaram de ser chamadas como RPCs
  privilegiadas pelo browser. `NotificationService` passou a usar
  `public.notifications` diretamente com RLS e filtro explicito por
  `user_id = usuario autenticado`; a migration `20260707152429` removeu
  `EXECUTE` de `authenticated` desses tres RPCs, mantendo apenas
  `service_role`. Verificacao remota confirmou `authenticated_execute=false`
  nos tres RPCs e Advisor remoto atual: 71 achados totais / 3
  `anon_security_definer_function_executable` / 62
  `authenticated_security_definer_function_executable`.
- Supabase/gastronomia nichos em 2026-07-07: os RPCs de versionamento
  `add_niche_capability`, `has_niche_capability` e
  `mark_niche_needs_upgrade` sairam da superficie executavel por
  `authenticated`. `has_niche_capability` passou a `SECURITY INVOKER` e a
  leitura de capability no frontend agora usa `public.gastronomy_profiles`
  diretamente sob RLS. As mutacoes de capability/upgrade foram bloqueadas no
  servico de browser ate existirem por caminho admin/server autorizado. A
  migration `20260707153515` foi aplicada ao remoto; verificacao confirmou
  `authenticated_execute=false` nos tres RPCs e `service_role_execute=true`.
  Em seguida, a migration `20260707155447` removeu `INSERT`, `UPDATE` e
  `DELETE` amplos de `authenticated` em `public.gastronomy_profiles` e
  restaurou apenas grants por coluna para campos operacionais. Verificacao
  remota confirmou que `authenticated` nao tem mais escrita em
  `enabled_capabilities`, `missing_capabilities`, `needs_niche_upgrade`,
  `niche_config_version`, `support_level`, `operational_mode`,
  `primary_niche_key`, `last_niche_upgrade_at` ou `plan_tier`.
  Advisor remoto atual: 68 achados totais / 3
  `anon_security_definer_function_executable` / 59
  `authenticated_security_definer_function_executable`, sem achados de nicho.
- Supabase/favoritos de negocios em 2026-07-07: o frontend de gastronomia
  deixou de chamar o RPC privilegiado `get_business_favorites_count` para
  contagem publica/de dono. `FavoritesQueryService.getBusinessFavoritesCount`
  agora le o contador canonico `business_data.favorites_count` sob RLS da
  propria tabela. A migration `20260707160719` converteu o RPC para
  `SECURITY INVOKER`, removeu `EXECUTE` de `PUBLIC`, `anon` e `authenticated`,
  e manteve apenas `service_role`. Verificacao remota confirmou
  `security_definer=false`, `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true`.
  Advisor remoto atual: 67 achados totais / 3
  `anon_security_definer_function_executable` / 58
  `authenticated_security_definer_function_executable`, sem achados de
  `get_business_favorites_count`.
- Supabase/business_data em 2026-07-07: a migration `20260707162026`
  removeu grants amplos de `anon` e `authenticated` em
  `public.business_data`. `anon` e `authenticated` ficaram apenas com
  `SELECT` em nivel de tabela; `authenticated` recebeu `INSERT`/`UPDATE`
  somente por coluna operacional. Flags administrativas (`is_verified`,
  `is_premium`) e agregados/counters (`favorites_count`,
  `recommendations_count`, `rating`, `total_reviews`, `total_products`) nao
  sao mais gravaveis diretamente via Data API com JWT de usuario. A Edge
  Function `admin-business-rpc` foi criada e implantada com `verify_jwt=true`,
  `requireAdmin`, rate limit e `service_role` para as acoes administrativas
  `setVerification` e `setPremium`; smoke remoto sem JWT retornou `401`.
  Verificacao remota confirmou `anon`/`authenticated` sem `DELETE`,
  `TRUNCATE`, `REFERENCES`, `TRIGGER` ou DML amplo em `business_data`.
- Supabase/create_notification em 2026-07-07: a migration `20260707192404`
  converteu `create_notification` para `SECURITY INVOKER`, manteve
  `EXECUTE` apenas para `authenticated` e `service_role`, e adicionou guarda
  interna que bloqueia usuario autenticado criando notificacao para outro
  `user_id`. `NotificationService.createNotification` tambem passou a bloquear
  chamadas cross-user no browser. `notifications` e `notification_preferences`
  perderam grants amplos de `anon`/`authenticated`; `authenticated` ficou com
  operacoes e colunas minimas para RLS de notificacao propria/preferencias
  proprias. Verificacao remota confirmou `security_definer=false`,
  `anon_execute=false`, `authenticated_execute=true`,
  `service_role_execute=true`, grants por coluna e policies explicitas por
  operacao. Advisor remoto atual: 66 achados totais / 3
  `anon_security_definer_function_executable` / 57
  `authenticated_security_definer_function_executable`, sem achado de
  `create_notification`.
- Supabase/community notifications em 2026-07-07: criada e implantada a Edge
  Function `community-notifications-rpc` com `verify_jwt=true`, autenticacao
  obrigatoria, rate limit e `service_role` somente dentro do broker. O broker
  valida ownership do `actorProfileId`, confirma eventos reais em
  `post_likes_new`, `posts` e `comments`, resolve o destinatario a partir do
  dominio e so entao chama `create_notification`; o browser nao envia
  `user_id` de destinatario. `posts.mutations` e
  `communityBusinessLogic` passaram a usar
  `CommunityNotificationBrokerService` para curtidas/mencoes e caminhos
  preparados de comentarios/respostas. Smoke remoto sem JWT retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`.
- Supabase/professional notifications em 2026-07-07: criada e implantada a
  Edge Function `professional-notifications-rpc` com `verify_jwt=true`,
  autenticacao obrigatoria, rate limit e `service_role` somente dentro do
  broker. Mensagens e propostas de leads agora passam por
  `ProfessionalNotificationBrokerService`; o browser envia apenas
  `messageId`/`quoteId`, e o broker valida `sender_user_id`,
  `professional_user_id`, ownership do profissional e participacao no lead
  antes de resolver o destinatario. A criacao de lead, que pode ser anonima,
  ficou no trigger interno `create_professional_lead_created_event()`, com
  `SECURITY DEFINER`, `search_path` fixo, sem `EXECUTE` para `anon` ou
  `authenticated`, e insercao da notificacao do profissional resolvida no
  banco. Smoke remoto sem JWT retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
  verificacao remota confirmou `anon_execute=false`,
  `authenticated_execute=false`, `service_role_execute=true` para o trigger.
- Supabase/session-rpc em 2026-07-07: criada e implantada a Edge Function
  `session-rpc` com `verify_jwt=true`, autenticacao obrigatoria, rate limit e
  `service_role` somente dentro do broker. `get_active_profile`,
  `switch_active_profile` e `check_user_mfa_required` deixaram de ser
  executaveis diretamente por `authenticated`; o browser chama
  `SessionRpcService`, e o broker deriva `p_user_id` do JWT validado em vez de
  aceitar id de usuario no payload. Smoke remoto sem JWT retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
  verificacao remota confirmou `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true` para os tres
  RPCs. Advisor remoto atual: 63 achados totais / 3
  `anon_security_definer_function_executable` / 54
  `authenticated_security_definer_function_executable`, sem match para
  `get_active_profile`, `switch_active_profile` ou
  `check_user_mfa_required`.
- Supabase/billing entitlements em 2026-07-07: criada e implantada a Edge
  Function `billing-entitlements-rpc` com `verify_jwt=true`, autenticacao
  obrigatoria, rate limit e `service_role` somente dentro do broker.
  `get_user_active_subscription`, `user_has_plan`, `user_has_feature` e
  `get_user_entitlement_limit` deixaram de ser executaveis diretamente por
  `authenticated`; `SubscriptionService` passou a usar
  `BillingEntitlementsRpcService`, e o broker deriva `p_user_id` do JWT
  validado. Smoke remoto sem JWT retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
  verificacao remota confirmou `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true` para os quatro
  RPCs. Contagem remota direta em `pg_proc`: 50
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`, sem match no Advisor para os
  quatro RPCs de billing.
- Supabase/session revocation em 2026-07-07: `revoke_user_session` e
  `revoke_all_user_sessions` deixaram de ser executaveis diretamente por
  `authenticated`. O `session-rpc` existente foi estendido para revogacao de
  sessoes com `verify_jwt=true`, derivando o usuario real do JWT e atualizando
  `user_sessions` com filtro obrigatorio `user_id = usuario autenticado`, sem
  chamar os RPCs legados com `service_role`. Smoke remoto sem JWT retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
  verificacao remota confirmou `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true` para os dois
  RPCs legados. Contagem remota direta em `pg_proc`: 48
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Supabase/reviews de negocios em 2026-07-07: criada e implantada a Edge
  Function `business-reviews-rpc` com `verify_jwt=true`, autenticacao
  obrigatoria, rate limit e `service_role` somente dentro do broker.
  `can_user_review_business`, `create_business_review`,
  `update_business_review`, `delete_business_review` e
  `add_business_review_response` deixaram de ser executaveis diretamente por
  `authenticated`; `ReviewQueryService` passou a usar
  `BusinessReviewsRpcService`. O broker deriva o usuario do JWT e valida
  acesso ao perfil por owner, `profile_members` ativo ou admin canonico antes
  de escrever em `reviews`. Smoke remoto sem JWT retornou
  `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`;
  verificacao remota confirmou `anon_execute=false`,
  `authenticated_execute=false` e `service_role_execute=true` para os cinco
  RPCs legados. Contagem remota direta em `pg_proc`: 43
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Supabase/privacy e session activity em 2026-07-07: criada e implantada a
  Edge Function `privacy-rpc` com `verify_jwt=true` para `record_consent`, e
  `session-rpc` foi estendido com `updateSessionActivity`. Os callers de
  consentimento passaram a usar `PrivacyRpcService`, sem aceitar `user_id`
  confiavel do browser; a atividade de sessao agora atualiza apenas a linha do
  `user_id` autenticado e do bearer token atual. A migration
  `20260707212504` tambem corrigiu `unique_active_consent` para unicidade
  parcial em `revoked_at IS NULL`, preservando historico LGPD. Smoke remoto
  sem JWT retornou `401` para ambos os brokers; grants remotos confirmados:
  `anon_execute=false`, `authenticated_execute=false`,
  `service_role_execute=true` para `record_consent` e
  `update_session_activity`. Advisor remoto oficial: 50 findings totais, 41
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Supabase/location SSOT em 2026-07-07: criada e implantada a Edge Function
  `location-rpc` com `verify_jwt=true` para
  `rpc_upsert_canonical_city_by_ibge`. `LocationGeocodingService` passou a usar
  `LocationRpcService`, sem executar o helper diretamente pelo browser. A
  migration `20260707213810` permite `service_role` no helper legado, remove
  `EXECUTE` direto de `authenticated` e mantem apenas o broker como caminho de
  escrita. Smoke remoto sem JWT retornou `401`; grants remotos:
  `anon_execute=false`, `authenticated_execute=false`,
  `service_role_execute=true`. Advisor remoto oficial: 49 findings totais, 40
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Supabase/mobilidade dispatch em 2026-07-07: criada e implantada a Edge
  Function `mobility-rpc` com `verify_jwt=true` para
  `accept_ride_atomic`, `log_ride_dispatch_attempt`,
  `update_latest_ride_dispatch_attempt`, `cancel_pending_ride_offers` e
  `release_driver_availability_for_ride`. `MobilityOfferService`,
  `MobilityAuditService` e `DriverAvailabilityService` deixaram de chamar
  esses RPCs diretamente pelo browser. O broker deriva usuario do JWT, valida
  ownership do `driverProfileId` para aceite ou participante/admin para
  auditoria/disponibilidade, e so entao chama os helpers legados com
  `service_role`; as migrations `20260707220108` e `20260707224108` removeram
  `EXECUTE` direto de `authenticated` dos cinco helpers. A funcao
  `accept_ride_atomic` tambem foi corrigida para continuar exigindo
  elegibilidade do motorista mesmo quando chamada por `service_role`. Smoke
  remoto sem JWT retornou `401`; grants remotos: `anon_execute=false`,
  `authenticated_execute=false`, `service_role_execute=true`. Advisor remoto
  oficial: 34 findings totais, 25
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Supabase/delivery orders em 2026-07-07: criada e implantada a Edge Function
  `delivery-rpc` com `verify_jwt=true` para os 10 RPCs mutantes de
  pedido/entrega: `delivery_create_order`,
  `delivery_transition_logistics_status`, `delivery_mark_picked_up`,
  `delivery_attach_delivery_proof`, `delivery_mark_delivered`,
  `delivery_transition_financial_status`, `delivery_report_occurrence`,
  `delivery_resolve_occurrence`, `delivery_update_order_notes` e
  `delivery_update_order_source_metadata`. `OrderDeliverySSOTService` deixou
  de executar esses RPCs diretamente pelo browser e passou por
  `DeliveryRpcService`. O broker valida JWT, acesso ao `actorProfileId` por
  dono/membro/admin e papel especifico no pedido antes de usar `service_role`;
  a migration `20260707222343` removeu `EXECUTE` direto de `authenticated`
  dos 10 helpers. Smoke remoto sem JWT retornou `401`; grants remotos:
  `anon_execute=false`, `authenticated_execute=false`,
  `service_role_execute=true`. Advisor remoto oficial: 35 findings totais, 26
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Supabase/comunidade conteudo em 2026-07-07: criada e implantada a Edge
  Function `community-rpc` com `verify_jwt=true` para criacao de alerta,
  criacao de ocorrencia, incremento de edicao de alerta, melhor resposta de
  QA e contadores de participantes de eventos. `CommunityAlertService`,
  `CommunityIssueService`, `CommunityQAService`, `CommunityEventsRuntimeService`
  e `AdminEventsService` deixaram de executar diretamente os RPCs
  `create_community_alert`, `create_community_issue`,
  `increment_alert_edit_count`, `mark_best_answer`,
  `increment_event_participants` e `decrement_event_participants`. A migration
  `20260707225829` removeu `EXECUTE` direto de `authenticated` de oito
  assinaturas, mantendo apenas `service_role`; os helpers de criacao preservam
  usuario real via `_actor_user_id` inserido somente pelo broker e continuam
  exigindo residencia verificada. Smoke remoto sem JWT retornou `401`; grants
  remotos: `anon_execute=false`, `authenticated_execute=false`,
  `service_role_execute=true`. Advisor remoto oficial: 26 findings totais, 17
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Supabase/perfis em 2026-07-07: criada e implantada a Edge Function
  `profile-rpc` com `verify_jwt=true` para criacao de perfil, alteracao de
  handle, exclusao de perfil, transferencia de ownership e convite de membro
  por email. `MultiProfileService`, `ProfileMembersService` e os bootstraps
  E2E deixaram de executar diretamente `create_profile_with_extension`,
  `update_profile_handle`, `delete_profile`, `transfer_profile_ownership` e
  `invite_profile_member_by_email`. A migration `20260707232826` moveu a
  logica para helpers internos com `actor_user_id` explicito, criou wrappers
  `service_role` para o broker e removeu `EXECUTE` direto de
  `authenticated` dos cinco RPCs antigos. Smoke remoto sem JWT retornou
  `401`; grants remotos nos helpers antigos, wrappers publicos e helpers
  privados: `anon_execute=false`, `authenticated_execute=false`,
  `service_role_execute=true`. Advisor remoto oficial: 21 findings totais, 12
  `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Supabase/roles em 2026-07-07: criada e implantada a Edge Function
  `role-rpc` com `verify_jwt=true` para leitura de roles e checks
  `hasRole`, `getUserRoles`, `isAdmin` e `isSuperAdmin`. `RoleService` deixou de
  executar diretamente `has_role`, `get_user_roles`, `is_admin` e
  `is_super_admin`; o broker valida JWT, permite leitura apenas do proprio
  usuario ou por admin canonico, e chama os helpers legados com `service_role`.
  A migration `20260707234302` removeu `EXECUTE` direto de `anon` e
  `authenticated` de `has_role` e `get_user_roles`, mantendo apenas
  `service_role`. Em seguida, a migration `20260708000031` moveu 116 referencias
  de policies RLS para helpers `private.*` e removeu `EXECUTE` direto de
  `authenticated` dos wrappers publicos `auth_can_access_profile`,
  `can_manage_profile`, `group_can_manage_members`, `is_admin`,
  `is_admin_from_roles`, `is_admin_user` e `is_super_admin`. Smoke remoto sem
  JWT retornou `401`; policies remotas ficaram com zero referencias publicas ou
  unqualified aos helpers antigos. Advisor remoto oficial: 12 findings totais,
  3 `authenticated_security_definer_function_executable` e 3
  `anon_security_definer_function_executable`.
- Security Authority em 2026-07-07: criada a governanca minima em
  `docs/governance/security`, com regras para Supabase/RLS/RPC/Storage,
  matriz de risco, regras para agentes de IA e excecoes auditaveis. O gate
  `validate:security-authority` foi integrado ao `verify:deploy`, cobrindo por
  teste isolado as classificacoes de Data API, RPC publica e listagem ampla de
  Storage. A Fase 7 foi exercitada em mudanca real de frontend/arquitetura e
  em migration real aplicada ao Supabase remoto
  (`20260707102718_harden_lgpd_consent_rpc_authorization`). Evidencia registrada em
  `docs/audits/SECURITY_AUTHORITY_PILOT_2026-07-07.md`.
- Auditoria SSOT/admin em 2026-06-06: duplicatas e orfaos de componentes admin foram removidos de `src/modules/admin/components`, mantendo `src/core/admin/components` como fonte canonica para componentes compartilhados.
- Auditoria de formatacao em 2026-06-06: formatacao BRL foi consolidada em `src/shared/utils/currency.ts`; formatacao de metricas compactas foi consolidada em `src/shared/utils/formatters.ts`.
- Validacoes em 2026-06-06: `npm run lint`, `npm run typecheck:app`, `npx vitest run src/shared/utils/currency.test.ts src/shared/utils/formatters.test.ts`, `npm run validate:deps`, `npm run validate:hardcodes`, `npm run validate:ssot` e `git diff --check` passaram.
- Auditoria de dead code em 2026-06-06: servicos transitorios `MobilityService.refactored` e `ProfileService.refactored` foram removidos junto com os testes que apenas protegiam esses arquivos orfaos; os facades canonicos permanecem em `MobilityService.ts` e `ProfileService.ts`.
- Auditoria de storage SSOT em 2026-06-06: buckets de upload do app foram centralizados em `src/core/media/config/storageBuckets.ts`; `backup-storage.ts` deixou de usar lista hardcoded e passou a consultar os buckets reais do Supabase.
- Auditoria de backup/restore em 2026-06-06: `backup-storage.ts` e `restore-storage.ts` passaram a preservar objetos em subpastas, evitando backup ou restore parcial de buckets com paths hierarquicos.
- Auditoria estatica de lancamento em 2026-05-26: scripts de teste passaram a apontar para arquivos versionados; assets PWA/SEO foram recriados; runtime de billing legado de gastronomia foi removido; `stripe-webhook` e edge functions antigas de assinatura de gastronomia foram excluidas do repositorio.
- Auditoria SSOT de billing em 2026-05-26: acessos runtime a `gastronomy_subscriptions` e `business_subscriptions` foram removidos de `src`, mantendo `user_subscriptions` como tabela canonica.
- Bloqueio de validacao em 2026-05-26: `npm`, `node` via shell e `git` nao estao acessiveis no ambiente local atual; validacoes de build/typecheck/lint/E2E precisam ser reexecutadas em ambiente com toolchain Node instalada.
- `npm run lint`: passou em 2026-05-07.
- `npm run typecheck`: passou em 2026-05-07.
- `npm run build`: passou em 2026-05-07.
- `npm run validate:architecture:delivery`: passou em 2026-05-06.
- `npm run validate:architecture:community`: passou em 2026-05-06.
- `npm run validate:taxonomy`: passou em 2026-05-06.
- `npm test -- src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts`: passou em 2026-05-06.
- `npm test -- src/core/professional/__tests__/ProfessionalLeadSSOT.test.ts`: passou em 2026-05-06.
- Smoke Playwright Chromium em rotas publicas principais: passou em 2026-05-06.
- Smoke Playwright Chromium de servicos/profissionais em `tests/e2e/professional-operational.spec.ts`: passou em 2026-05-06 contra servidor isolado `127.0.0.1:8090`.
- Smoke Playwright Chromium de onboarding publico em `tests/e2e/onboarding-public.spec.ts`: passou em 2026-05-06 contra servidor isolado `127.0.0.1:8106`.
- Smoke Playwright Chromium de paginas institucionais em `tests/e2e/institutional-public.spec.ts`: passou em 2026-05-06 contra servidor isolado `127.0.0.1:8107`.
- Navegador embutido em `http://localhost:8080/cadastro`: validado em 2026-05-06 com `#main-content` unico, marca `Achegue-se`, heading `Crie sua conta` e sem erros de console.
- Navegador embutido em `http://127.0.0.1:8080/`: revalidado em 2026-05-07 com landing carregando normalmente (`Entrar no Meu Bairro` e `Cadastrar meu negocio` visiveis) apos hardening de auth/session no frontend.
- Governanca de docs: `git diff --check` passou em 2026-05-06; avisos restantes sao apenas LF/CRLF do Windows.
- `npm test -- src/app/components/__tests__/Breadcrumbs.spec.tsx`: passou em 2026-05-06.
- `npm test -- src/modules/business/premium/pages/PremiumBusinessCheckoutPage.spec.tsx`: passou em 2026-05-07.
- `npm test -- src/integrations/supabase/__tests__/supabaseConfig.spec.ts`: passou em 2026-05-07.
- `npx vitest --run src/core/routing/seo/__tests__/buildTerritorialMetadata.spec.ts`: passou em 2026-05-07.
- `npx playwright test tests/e2e/landing-public.spec.ts --project=chromium --reporter=list`: passou em 2026-05-07.
- `npx playwright test tests/e2e/landing-public.spec.ts`: passou em 2026-05-08 com `5/5`, cobrindo cidade, bairro, area, modulos publicos e comunidade territorial canonica.
- `npm test -- src/core/routing/seo/__tests__/buildTerritorialMetadata.spec.ts`: passou em 2026-05-07 com 4 testes.
- `npx playwright test tests/e2e/professional-operational.spec.ts --project=chromium --reporter=list`: passou em 2026-05-07 com 2 testes.
- `npx playwright test tests/e2e/gastronomy-operational.spec.ts --reporter=list`: passou em 2026-05-08 com `4/4`, cobrindo fluxo autenticado cliente->loja (pedido ate estado terminal) e acesso operacional do motoboy.
- `npx playwright test tests/e2e/professional-operational.spec.ts --reporter=list`: passou em 2026-05-08 com `2/2`.
- `npx playwright test tests/e2e/professional-leads-operational.spec.ts --reporter=list`: passou em 2026-05-08 com `1/1`, cobrindo fluxo autenticado `lead -> proposta -> aceite -> atendimento` e validacao da Central Profissional.
- `npx playwright test tests/e2e/landing-public.spec.ts -g "complexo short route resolves" --reporter=list`: passou em 2026-05-08 com `1/1`, validando o comportamento antigo de alias curto `/complexo`; supersedido pela regra vigente de nao preservar alias curto como segunda superficie publica.
- `npx playwright test tests/e2e/professional-leads-operational.spec.ts --reporter=list`: reexecutado em 2026-05-08 com `1/1` verde apos hardening de ambiente E2E.
- `npx playwright test tests/e2e/professional-leads-operational.spec.ts --reporter=list`: passou em 2026-05-08 com `1/1` apos incluir assert de dados reais de `professional_data` (raio, areas e disponibilidade) na Central Profissional.
- `npx playwright test tests/e2e/professional-leads-operational.spec.ts --reporter=list`: revalidado em 2026-05-08 com `1/1` apos hardening do bloco operacional da Central Profissional e persistencia de avaliacao pos-servico.
- `npm run typecheck`: passou em 2026-05-08 apos limpeza SSOT de comunidade/grupos.
- `npm run lint`: passou em 2026-05-08 apos limpeza SSOT de comunidade/grupos.
- `npm run build`: passou em 2026-05-08 apos limpeza SSOT de comunidade/grupos.
- `npm run typecheck`: passou em 2026-05-08 apos integracoes reais de comentarios/contestacao/moderacao na comunidade.
- `npm run lint`: passou em 2026-05-08 apos integracoes reais de comentarios/contestacao/moderacao na comunidade.
- `npm run build`: passou em 2026-05-08 apos integracoes reais de comentarios/contestacao/moderacao na comunidade.
- `npm run typecheck`: passou em 2026-05-08 apos hardening de rotas canonicas da comunidade (city/district/area) via helper SSOT.
- `npm run lint`: passou em 2026-05-08 apos hardening de rotas canonicas da comunidade (city/district/area) via helper SSOT.
- `npm run build`: passou em 2026-05-08 apos hardening de rotas canonicas da comunidade (city/district/area) via helper SSOT.

- `npx playwright test tests/e2e/community-territorial-operational.spec.ts --project=chromium --reporter=list`: passou em 2026-05-08 com `3/3`, cobrindo comunidade territorial em cidade, bairro e area (`feed/grupos`) sem lock no suspense global.
- `npm run typecheck`: passou em 2026-05-08 apos limpeza final de hardcodes de rota da comunidade (widgets/perfil/achados/recomendacoes).
- `npm run lint`: passou em 2026-05-08 apos limpeza final de hardcodes de rota da comunidade (widgets/perfil/achados/recomendacoes).
- `npm run build`: passou em 2026-05-08 apos limpeza final de hardcodes de rota da comunidade (widgets/perfil/achados/recomendacoes).
- `npm run generate:sitemap`: passou em 2026-05-08 com escrita real de `public/sitemap.xml` via Supabase (`locations=134`, `groups=1`).
- `npx playwright test tests/e2e/community-territorial-operational.spec.ts --project=chromium --reporter=list`: revalidado em 2026-05-08 com `3/3` verde apos hardening de prontidao territorial.
- `npm test -- src/core/routing/seo/__tests__/TerritorialSEO.spec.ts`: passou em 2026-05-08 com `3/3`, blindando politica canonical/noindex de rotas comunitarias duplicadas vs rotas sociais proprias.
- `npm run lint`: passou em 2026-05-08 sem warnings apos extrair policy de SEO territorial para util dedicado.
- `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: passou em 2026-05-08 com `3/3`, validando indexabilidade de rotas territoriais publicas/sociais e politica obrigatoria de `noindex + canonical publico` nas rotas comunitarias duplicadas de modulo.
- `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: ampliado e revalidado em 2026-05-08 com `4/4` (publico indexavel + duplicacoes comunitarias `empresas/servicos/classificados` com `noindex`, incluindo canonical publico validado em classificado).
- `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: ampliado novamente em 2026-05-08 com `6/6`, cobrindo duplicacoes comunitarias `servicos`, `classificados`, `vagas`, `eventos` e `mobilidade` com politica `noindex` (e canonical publico validado em `classificados`) sem regressao de rota publica indexavel.
- `npx playwright test tests/e2e/community-social-seo.spec.ts --project=chromium --reporter=list`: politica atualizada em 2026-07-05: rotas sociais da comunidade (`feed` e `grupos`) usam `noindex, follow` e canonical proprio do portal.
- `npm run test:e2e:seo`: passou em 2026-05-08 com `8/8`, consolidando regressao SEO territorial/comunidade em comando unico (`territorial-seo.spec.ts` + `community-social-seo.spec.ts`).
- `npm run validate:seo:phase`: passou em 2026-05-08 (`typecheck + lint + test:e2e:seo`), virando gate operacional da etapa SEO.
- `npm run validate:operations:phase`: passou em 2026-05-08 (`typecheck + lint + test:e2e:operations`) com `35/35` nos cenarios operacionais de central/mobilidade, gastronomia e profissionais.
- `npm run validate:phase:core`: passou em 2026-05-08, consolidando gate unico de release tecnica interna (`typecheck` + `lint` + `test:e2e:phase-core`).
- CI SSOT atualizado em 2026-05-08: `.github/workflows/ssot-tests.yml` agora exige `npm run validate:phase:core` no status final do workflow.
- `npm run validate:phase:core`: reexecutado em 2026-05-08 apos consolidar o gate em uma unica partida Playwright; passou com `46/46` E2E (`SEO + comunidade territorial + central/mobilidade + gastronomia + profissionais`).
- `npm run validate:phase:core`: reexecutado novamente em 2026-05-08 apos limpar warnings transitorios de reconexao/OSRM e estabilizar o E2E do motoboy; passou com `46/46` E2E.
- `npx playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list`: passou em 2026-05-11 com `4/4`.
- `npm run build`: passou em 2026-05-11.
- `npm run validate:phase:core`: passou em 2026-05-11 com `52 passed`, `4 skipped` (skips esperados condicionados a credenciais/ambiente administrativo), cobrindo SEO territorial, comunidade social, comunidade territorial, central, gastronomia, profissionais e mobile auth dashboards.
- `npm run validate:phase:core`: passou em 2026-05-12 com `55 passed`, `1 skipped` (skip administrativo esperado condicionado a `SUPABASE_SERVICE_ROLE_KEY`), cobrindo SEO territorial, comunidade social, comunidade territorial, central, gastronomia, profissionais e mobile auth dashboards.

## Modulos/Fases Concluidos

- Fase 0: Preparacao e baseline.
- Fase 1: Arquitetura, taxonomia e rotas canonicas.
- Fase 2: Mobilidade, motorista e motoboy.

## Fase Atual

Fase 3: Gastronomia e delivery integrado.

Plano mestre de execucao por fases: `docs/PLANO_MESTRE_EXECUCAO_INTEGRAL_SSOT.md`.

### Concluido Na Fase 3

- Pedido de gastronomia cria `orders` SSOT e entrega motoboy vinculada por `order.id`.
- `OrderDeliveryLinkService` sincroniza status de `ride_requests` para `orders.logistics_status`.
- Loja lista pedidos via `OrderService`/`OrderDeliverySSOTService`, sem depender de colunas legadas.
- Detalhe do pedido exibe timeline, tracking, comprovante de entrega e dados do snapshot operacional.
- `OrderDeliveryNotificationService` cria notificacoes para cliente, loja e motoboy.
- `confirm()` nativo removido dos fluxos destrutivos de gastronomia auditados.
- Billing legado de gastronomia arquivado em `billing/legacy`.
- Nichos beta ficam fora da experiencia publica.
- Painel operacional da loja adicionado ao detalhe do pedido para aceitar, preparar, marcar pronto, despachar/entregar e cancelar com motivo.
- SSOT de confianca operacional iniciado em `core/trust` com `trust_events`, feedback privado da loja sobre cliente/motoboy e fila admin de eventos.
- Cancelamento tardio solicitado pelo cliente em pedido ja em preparo/pronto/saiu para entrega passa a gerar evento privado para analise admin.
- Cliente/passageiro pode registrar feedback privado sobre motorista/motoboy no historico de mobilidade.
- Motorista/motoboy pode registrar feedback privado sobre passageiro/cliente e, em entregas de gastronomia vinculadas a pedido, sobre a loja.
- `TrustPolicyService` calcula score operacional por persona, reincidencia 30/90 dias, risco e politica de despacho.
- Admin visualiza perfis em atencao com score, reincidencia e acao recomendada na fila de confianca.
- Mobilidade/entregas bloqueiam novos chamados para cliente, motorista ou motoboy em risco critico ate revisao admin.
- Acoes administrativas formais de confianca foram criadas em `trust_admin_actions`: aviso, restricao temporaria e desbloqueio com auditoria.
- Mobilidade aplica impacto graduado em prioridade para `watchlist`/`restricted`, sem bloqueio automatico fora de risco critico.
- Cliente agora abre o detalhe publico do pedido por `/gastronomia/pedidos/:orderId`, recebe link na notificacao e avalia a loja no pos-entrega via `ReviewQueryService`; notas baixas tambem geram evento privado no SSOT `core/trust`.
- Checkout premium de gastronomia foi corrigido para conduzir o cliente ao detalhe canonico do pedido criado (`/gastronomia/pedidos/:orderId`) em vez de devolve-lo ao carrinho apos a confirmacao; a navegacao ficou blindada por `PremiumBusinessCheckoutPage.spec.tsx`.
- Auth/session do frontend foi endurecido em dev: o storage key do Supabase deixou de usar o lock generico `token`, o bootstrap inicial ganhou fallback explicito via `getSession()` no `SessionService`, e o aviso esperado de storage em dev saiu do nivel `warn`, reduzindo colisao de lock e falso timeout de bootstrap.
- Dashboard de gastronomia passou a exibir status operacional, pedidos do dia, resumo de cardapio e areas de entrega por hooks/servicos canonicos, removendo contadores fixos enganosos.
- `OperationConfigForm` foi realinhado ao contrato canonico de `useOperationConfig` (`updateConfig`/`isUpdating`) para pausa de loja e ajuste de tempo.
- Gestao de cardapio agora expoe disponibilidade, estoque atual, alerta de estoque baixo e acao rapida "marcar esgotado" usando `MenuService`/`useMenuItems` como SSOT.
- Playwright operacional de gastronomia criado em `tests/e2e/gastronomy-operational.spec.ts`; ele valida a tela autenticada de cardapio quando `E2E_GASTRONOMY_BUSINESS_ID` aponta para loja real com cardapio configurado.
- Playwright operacional de gastronomia foi fortalecido com bootstrap automatico de loja E2E (perfil business, membership, `business_data` e seed minimo de `menus/menu_categories/menu_items`), eliminando dependencia de `E2E_GASTRONOMY_BUSINESS_ID` manual e validando rotas autenticadas de cardapio/dashboard em ambiente local.
- Suite `tests/e2e/gastronomy-operational.spec.ts` foi expandida para incluir fluxo autenticado cliente+loja no mesmo pedido (rota publica `/gastronomia/pedidos/:orderId` e rota operacional `/central/empresas/:businessId/gastronomia/pedidos/:orderId`).
- Suite `tests/e2e/gastronomy-operational.spec.ts` agora roda sem skip (`4 passed`): bootstrap automatico de identidade+empresa+cardapio, login resiliente, validacao de cardapio/dashboard, fluxo autenticado cliente+loja com pedido fixture via RPC e cobertura canonica da Central do Motoboy em `/central/motoboy/entregas` (operacao ativa ou onboarding guardado).
- Suite `tests/e2e/gastronomy-operational.spec.ts` foi reexecutada em 2026-05-08 com `4/4` verde (`--reporter=list`) mantendo cobertura ponta a ponta autenticada sem regressao.
- Fluxo operacional da loja no E2E foi endurecido para progressao de estado ate terminal no detalhe do pedido (`aceitar -> preparar -> pronto -> saiu/retirado -> entregue`), com assert final de encerramento operacional sem acao pendente.
- O mesmo E2E agora valida a transicao para a rota publica do pedido apos entrega, garantindo que o cliente ve o detalhe/timeline e que o painel interno `Operacao da loja` nao aparece fora da Central.
- Onboarding de motoboy na Central foi alinhado para rota canonica de cadastro (`/central/motoboy/cadastro`) nos empty states/guards auditados, e o E2E valida clique deterministico do CTA `Cadastrar como Motoboy` na area principal com navegacao correta.
- CTAs restantes de onboarding de mobilidade na Central/Perfil foram migrados de `/create-driver` para rotas canonicas da Central (`/central/motorista/cadastro` e `/central/motoboy/cadastro`), com varredura de TSX nesses modulos sem referencias residuais ao caminho legado.
- Rota legada `/create-driver` foi removida do runtime canonico (rotas e sincronizacao de contexto) e o `src` nao possui mais referencia ativa a esse caminho.
- Blindagem anti-regressao adicionada em `src/modules/mobility/__tests__/MobilityCanonicalOnboardingRoutes.test.ts`, validando que `/create-driver` nao reaparece no runtime e que CTAs criticos permanecem nas rotas canonicas da Central.
- Documentacao tecnica viva da Central/Mobilidade foi alinhada ao estado atual (sem `/create-driver` operacional) em guias e relatorios internos auditados.
- Suite E2E da Central (`tests/e2e/central/central-validation.spec.ts`) foi revalidada com cenario de compatibilidade legado explicito e esta 100% verde (`28 passed`), cobrindo rotas principais, subrotas de mobilidade, regras de acesso e UX basica.
- Sincronizacao de status pedido->entrega foi blindada com teste unitario dedicado em `src/modules/mobility/delivery/__tests__/OrderDeliveryLinkService.spec.ts`, cobrindo mapeamentos canonicos e regras de transicao (avanco progressivo, bloqueio de reversao e terminais, cancelamento/falha direta).
- Smoke de contrato SSOT `GastronomyOperationalSSOT.test.ts` cobre rota publica do pedido, notificacao com link, review publico + trust privado, guard de operacoes da loja, dashboard sem contadores falsos e operacao de estoque/disponibilidade do cardapio.
- Funil SSOT de profissionais foi destravado no banco com migrations pendentes (`20260506100000_create_professional_leads.sql`) e ajuste de RLS em `professional_service_engagements` (`20260508120000_fix_professional_engagement_insert_rls.sql`), eliminando falha de trigger no aceite da proposta.
- Rota canonica `/central/profissional` foi corrigida em `AppRoutes` para renderizar `CentralProfissionalPage` via filho `index`, removendo estado em branco apenas com menu/lateral.
- E2E autenticado de profissionais `tests/e2e/professional-leads-operational.spec.ts` ficou verde (`1 passed`) com bootstrap de perfil profissional, fixture de lead/proposta/aceite e validacao de tracking + Central.
- `ReviewsService` (mutations SSOT) foi corrigido para `*_reviews_new`: removeu envio de colunas inexistentes (`job_type` e payload arbitrario), padronizando insert/update apenas com campos reais da tabela; isso destravou a avaliacao pos-servico no fluxo profissional.
- E2E autenticado de profissionais foi expandido para validar tambem submissao de avaliacao no tracking e persistencia real em `professional_reviews_new`, com polling robusto para estados de carregamento da Central.
- `ProfessionalGuard` foi reforcado para revalidar perfis via `SessionService.getUserProfiles` (consulta backend) antes do empty-state, reduzindo falso negativo de contexto de sessao.
- E2E `professional-leads-operational.spec.ts` foi estabilizado para cenarios reais da Central Profissional (painel completo, estado sem servico publicado e fallback de cadastro), mantendo validacao de tracking+avaliacao persistida.
- Central Profissional deixou de ser placeholder: `/central/profissional` agora usa `ProfessionalFacade` para listar servicos do perfil, disponibilidade, metricas, avaliacao e acoes de edicao/visualizacao.
- Servicos/Profissionais ganhou funil canonico de orcamento em `core/professional`: `professional_leads`, `professional_lead_messages`, `professional_lead_quotes`, `professional_service_engagements`, eventos de historico, RLS, notificacao transacional, CTA no perfil publico/legado, acompanhamento do cliente e atualizacao de status pela Central.
- Central Profissional agora mostra pedidos de orcamento recebidos pelo `ProfessionalLeadService`, com resposta ao cliente, proposta estruturada de valor/prazo/escopo, aceite convertido automaticamente em atendimento contratado e acoes de contatado/orcamento enviado/concluido/arquivado, sem acesso direto de UI a tabelas.
- O aceite de proposta profissional agora gera `professional_service_engagements` por trigger SQL, com RLS de participantes, painel de atendimentos contratados na Central e painel de acompanhamento para o cliente.
- Avaliacao de profissional pos-servico agora passa por `ProfessionalLeadService.submitEngagementReview`: somente o cliente do `professional_service_engagements` concluido consegue avaliar pelo `ReviewsService`.
- Vitrine publica de servicos agora expoe `main#main-content`, mantendo o skip-link global funcional e cobrindo a rota publica no smoke E2E profissional.
- Onboarding publico de cadastro e confirmacao agora usa a marca `Achegue-se`, expoe `main#main-content` e possui smoke Playwright dedicado para evitar regressao na porta de entrada do usuario.
- Paginas institucionais publicas (`/sobre`, `/contato`, `/termos`, `/privacidade`) foram alinhadas a marca `Achegue-se`, expoem `main#main-content` e possuem smoke Playwright dedicado.
- Documentacao viva realinhada: `STATUS.md` e `VALIDACAO_FINAL_E_PROXIMOS_PASSOS.md` agora sao redirecionamentos historicos; `README`, `INDEX`, `DOCUMENTATION_INDEX`, `INDEX_CANONICO`, `DOCUMENT_REPLACEMENTS` e `AUDITORIA_DOCS_OBSOLETOS` apontam para `STATUS_ATUAL.md` e para o plano executavel como SSOT.
- Rota historica com typo `businesss` foi canonicalizada: `/businesss` redireciona para `/empresas`, `/businesss/:id/catalogo` para `/empresas/:id/catalogo`, `/admin/businesss` para `/admin/empresas`, e o breadcrumb usa apenas `empresas` como rota canonica.
- Comunidade e offline cache deixaram de usar `confirm()` nativo nos fluxos auditados de exclusao de post/comentario e limpeza de cache; a confirmacao agora usa `ConfirmActionDialog` do design system, mantendo hooks/servicos sem responsabilidade de UI.
- Feed de comunidade (core/modulo) deixou de ter handlers no-op para curtir/salvar/compartilhar/denunciar: as acoes agora disparam `usePostActions` (`likePost`, `savePost`, `sharePost`, `reportPost`) no SSOT de posts/moderacao.
- Comentarios do feed agora possuem edicao inline funcional no `CommentItem` (salvar/cancelar, persistencia via `commentService.updateComment` e marcador `(editado)` em tempo real), removendo placeholder de "edicao em desenvolvimento".
- Criacao de post no caminho legado/canonico foi alinhada ao SSOT territorial: `useCreatePost` agora resolve `locationId/location_id` de forma obrigatoria e `PostsFacade.mutations.createPost` persiste `reach` no insert.
- Detalhe de classificado deixou de exibir metrica fake de visualizacoes (`Math.random`), removendo dado artificial da UI e mantendo consistencia com SSOT.
- Detalhe de classificado passou a persistir favorito por anuncio em `localStorage` (estado consistente entre sessoes) e o compartilhamento ganhou fallback resiliente quando `navigator.share`/clipboard falham.
- Classificados ganhou comentarios/perguntas publicas no detalhe do anuncio (`classified_comments`): listagem cronologica, envio autenticado, exclusao pelo autor e RLS dedicado por migration.
- Classificados passou a preservar `status` real no mapper SSOT e o dono do anuncio pode pausar, reativar ou marcar como vendido no detalhe usando `updateClassified`, `reactivateClassified` e `markAsSold`.
- Card do vendedor no detalhe do classificado deixou de exibir avaliacao/selo fake; agora mostra anuncios ativos e, quando existir dado real de review, exibe nota/media real do vendedor via `getReviewStats`.
- Classificados agora tem feedback privado bilateral pos-negocio no detalhe do anuncio: vendedor avalia compradores reais (participantes de conversa) e comprador avalia vendedor apenas quando participou de conversa do anuncio vendido, via `ClassifiedTrustFeedbackPanel` + `ClassifiedTrustService` + `MessagingService.getClassifiedConversationParticipants`.
- Fila admin de confianca operacional foi ampliada com filtros por contexto (pedido, corrida, entrega, classificado, servico, comunidade), contadores por tipo, selecao multipla e acoes em lote (under_review/confirmed/penalized + aviso/restricao temporaria/desbloqueio) mantendo auditoria no SSOT `core/trust`.
- Comentarios/perguntas de classificados agora permitem denuncia privada direto do frontend, gerando `trust_events` do tipo incidente (`reason_code=classified_comment_report`) com evidencia contextual para moderacao admin; a fila de confianca passou a destacar o comentario denunciado no card do evento.
- UX de denuncia de comentarios de classificados foi profissionalizada: dialog dedicado com motivo, detalhes opcionais, estado de envio e bloqueio de fechamento durante submissao; fila admin ganhou filtro rapido `Apenas pendentes` para triagem operacional.
- Fila admin agora exibe contexto operacional do comentario denunciado (id curto, autor, data e preview do conteudo quando disponivel em evidencia), reduzindo decisao cega na moderacao.
- Fila admin ganhou CTA rapido para abrir o anuncio relacionado diretamente do evento de classificado (`/classificados/:id`) em nova aba, acelerando verificacao do contexto real.
- Fluxo admin de moderacao de comentarios de classificados foi profissionalizado com dupla navegacao contextual no card: abrir anuncio publico e abrir fila admin de denuncias (`/admin/classificados/denuncias`) quando o motivo for denuncia de comentario.
- Denuncia de comentario em classificado agora tem anti-duplicidade por ator/comentario no SSOT (`trust_events` ativos/em analise) e feedback visual no frontend de "denuncia enviada por voce", evitando spam de denuncia repetida.
- Fila admin de confianca ganhou triagem dedicada para este fluxo: contador de denuncias de comentarios abertas e filtro rapido `Apenas denuncias de comentario`, combinavel com `Apenas pendentes`.
- Fila admin recebeu barra de decisao rapida fixa no topo quando ha selecao em lote, acelerando operacoes de moderacao (em analise, confirmar, penalizar e aviso) sem perder as acoes completas detalhadas abaixo.
- Redundancia da moderacao em lote removida: a barra fixa virou ponto unico de comando (analise, confirmar, penalizar, aviso, restricao 7/30d e desbloqueio), simplificando UX admin sem perda de capacidade.
- Acoes destrutivas em lote da fila admin agora exigem confirmacao explicita via `ConfirmActionDialog` (penalizar, restringir 7/30 dias e desbloquear), com controle de estado pendente e sem `confirm()` nativo.
- SEO territorial das landings canonicas foi corrigido no SSOT: hubs de bairro/grupo agora usam titulo editorial (`Territorio | Achegue-se`) e modulos seguem com titulo operacional; a regra ficou blindada por `src/core/routing/seo/__tests__/buildTerritorialMetadata.spec.ts`.
- Rota publica curta `/complexo` foi revalidada end-to-end contra a landing canonica `/ba/salvador/area/complexo-do-nordeste-de-amaralina`, sem erro territorial e com metadados corretos.
- SEO territorial dos modulos publicos foi corrigido para rotas com prefixo (`/empresas/...`, `/servicos/...`): o parser agora extrai `Salvador` corretamente, em vez de tratar `ba` como cidade.
- Landings raiz `/empresas` e `/servicos` ganharam Helmet proprio e foram cobertas no smoke publico; a suite tambem valida titulos territoriais finais para empresas e servicos no Complexo.
- Smoke de profissionais/servicos removeu espera fixa por tempo e passou a validar saida real do loader global por polling.
- Decisao de produto/arquitetura para roteamento territorial registrada em `docs/DECISAO_ROTEAMENTO_TERRITORIAL.md`: cidade/site geral, modulos publicos e comunidade local agora possuem papeis distintos documentados.
- Roteamento territorial v2 aplicado: grupos territoriais usam `/area/:groupSlug` no site publico, modulos, comunidade, helpers, SEO e sitemap.
- Ambiente Playwright ficou deterministico no SSOT: `PLAYWRIGHT_BASE_URL` padrao em `http://127.0.0.1:8099` e `webServer.reuseExistingServer=false` para evitar suite rodar contra servidor stale/manual em dev.
- Central Profissional agora exibe bloco operacional com campos reais de `professional_data` (raio de atendimento, areas e disponibilidade), sem placeholder; E2E autenticado foi atualizado para validar esses dados no fluxo `lead -> proposta -> aceite -> atendimento -> avaliacao`.
- Avaliacao pos-servico profissional esta protegida por regra de backend no SSOT (`ProfessionalLeadService.submitEngagementReview`): apenas cliente do atendimento concluido pode avaliar; o E2E autenticado valida envio e persistencia real em `professional_reviews_new`.
- Moderacao de comentarios/perguntas de classificados foi consolidada na mesma trilha administrativa de confianca: `/admin/classificados/denuncias` agora usa `TrustEventsQueue` com filtro travado em `trust_events` de contexto `classified` + `reason_code` de comentario, removendo fila operacional paralela para esse fluxo.
- Admin/Moderacao foi consolidado em fila unica SSOT: `AdminModeracao` e `AdminModeracaoCompleta` agora usam `TrustEventsQueue` + audit log real de `trust_admin_actions` (via `TrustEventService.listAdminActions`), removendo dependencias legadas de trilhas sem fonte canonica de dados.
- Comunidade/Grupos removeu fallback mock em runtime no SSOT: `CommunityService.getGroups/getGroupsPage`, `GroupService.getGroupById/getGroupMembers` e `SocialInteractionsService` (mensagens/denuncias de grupo) agora operam somente com persistencia real, retornando estado vazio controlado em erro/ausencia de dados.
- Comunidade removeu TODOs funcionais criticos: `PostDetailModal` envia comentario real via `commentService`; `useUnifiedDetailModal` cria comentario/upvote real em `CivicReportService`; `DisputeMentionModal` gera `trust_events` reais para moderacao; `useDirectMessages.reportConversation` registra incidente em `TrustEventService` e bloqueia conversa de forma auditavel.
- `LocationFilter` foi alinhado ao perfil ativo do SSOT (`useSessionContext`), removendo dependencia de `user_metadata` legado para cidade/bairro/rua.
- Hooks legados duplicados em `modules/community` foram consolidados para SSOT por re-export canonico (`useGrupos` e `useComunidadePage`), removendo divergencia funcional entre `core` e `modules`.
- `createReplyNotification` em `communityBusinessLogic` foi implementado com fluxo real: busca comentario pai via `commentService`, evita auto-notificacao e cria notificacao de resposta para o autor original.
- Edicao de post da comunidade foi concluida no fluxo real (sem placeholder): `handleEditPost` abre `CreatePostModal` em modo edicao com dados iniciais do post, e o submit persiste via `postService.updatePost`.
- `CreatePostModal` agora suporta modo criacao/edicao no mesmo SSOT, com estado inicial (`content/type/reach`) e CTA/contexto visual especifico para salvar alteracoes.
- `npm run typecheck`, `npx eslint` pontual nos arquivos alterados e `npm run build` passaram em 2026-05-08 apos entrega da edicao de post.
- Navegacao de abas em `ComunidadePage` deixou de montar URL manual por regex e passou a usar helper canonico (`buildCommunityTabUrlFromPath`), cobrindo cidade, bairro e grupo em `/area/:groupSlug`.
- `useCommunityUrls` (core/routing e core/community) foi alinhado ao SSOT territorial para `groups`, usando rota contextual `${feed}/grupos` em vez de caminhos soltos/fora de contexto.
- Sitemap dinamico foi fechado no SSOT de roteamento territorial: `generateAndSaveSitemap` consulta Supabase (`locations` + `territorial_groups` + membros), gera URLs publicas canonicas de cidade/bairro/grupo + modulos e nao emite URLs `/comunidade/...` no sitemap publico.
- Runtime compartilhado para script/SPA foi endurecido sem gambiarra: `logger` e bootstrap `supabase` ficaram compativeis com ambiente Node (`process.env`) e Vite (`import.meta.env`) sem quebrar frontend.
- Regra de SEO territorial virou SSOT isolado em `src/core/routing/seo/territorialSeoPolicy.ts`: rotas `/comunidade/.../:modulo-publico` recebem `noindex, follow` + canonical da rota publica equivalente; rotas sociais proprias (`feed/grupos`) tambem usam `noindex, follow`.
- `TerritorialLayout` ganhou `TerritorialFallbackSEO` para manter emissao minima de `robots/canonical` quando a resolucao territorial entra em fallback de erro, sem quebrar renderizacao das paginas.
- `CommunityTerritorialShell` passou a emitir fallback de `canonical/robots` via `territorialSeoPolicy` no shell, reforcando consistencia SEO durante transicoes/hidratacao das rotas comunitarias.
- Suite E2E operacional da Central foi endurecida com `goto` resiliente (`waitUntil=commit`, retry curto) e validacao de conteudo via polling de landmarks/texto em vez de `networkidle`, eliminando flakiness de bootstrap no ambiente local.
- Cenario operacional do motoboy em gastronomia foi estabilizado para aceitar prontidao real de layout (`main/header/texto`) sem falso negativo de elemento oculto em transicao de UI.
- Comunidade territorial entrou no gate de fase: `npm run validate:community:phase` cobre cidade, bairro e grupo territorial (`/area/:groupSlug`) via Playwright e agora compoe `npm run validate:phase:core`.
- Rotas de comunidade em nivel cidade foram alinhadas ao `CommunityTerritorialShell`: `/comunidade/:state/:city`, `/feed`, `/grupos`, `/alertas` e `/problemas` usam o cockpit social canonico em vez de cair no layout territorial generico.
- Geolocalizacao publica deixou de tratar permissao negada pelo usuario como `warn` no console; o estado esperado agora e log informativo, mantendo warnings para falhas inesperadas.
- Gate core foi consolidado em uma unica execucao Playwright (`npm run test:e2e:phase-core`) para evitar multiplas partidas frias do Vite no mesmo comando de release.
- ReconnectionManager deixou de emitir `warn` para estados transitorios esperados de stale/lost connection; erros reais e limite de reconexao seguem como erro/warning.
- Validacao do OSRM publico em dev deixou de emitir `warn` quando o provider externo esta indisponivel; em producao a indisponibilidade continua como warning.

## Atualizacao Operacional Da Fase 3

- Fase ativa permanece Gastronomia e delivery integrado; nao abrir nova fase antes do gate.
- P0 ja validados no gate core: Servicos/Profissionais, Marketplace/Classificados e Admin/Moderacao.
- P0 de Gastronomia/Delivery fechados nesta etapa: matriz de notificacoes, realtime da loja e elegibilidade de area no checkout (hook + service + componente + testes).
- `SUPABASE_SERVICE_ROLE_KEY` e bloqueio real apenas para asserts administrativos/seeds multi-persona; o fluxo funcional autenticado nao deve ser mascarado por skip amplo.
- Hooks de pedidos de gastronomia agora invalidam `orders` e `order_timeline_events` por realtime Supabase; notificacoes de status de pedido agora carregam audiencia e metadata auditavel.

## Atualizacao 2026-05-12 (Gate Core Revalidado)

- Gate principal reexecutado de ponta a ponta sem regressao:
1. `npm run typecheck`: passou.
2. `npm run lint`: passou.
3. `npm run test:e2e:phase-core`: passou com `55 passed`, `1 skipped`.
4. `npm run build`: passou.
- Cobertura validada no ciclo:
1. SEO territorial (`territorial-seo.spec.ts`).
2. Comunidade social e territorial (`community-social-seo.spec.ts`, `community-territorial-operational.spec.ts`).
3. Gastronomia operacional autenticada.
4. Central (incluindo subrotas motorista/motoboy e compatibilidade legada controlada).
5. Profissionais (landing/tracking + funil autenticado de leads).
6. Mobile público e mobile autenticado em dashboards centrais.
- Fase ativa permanece `Fase 3: Gastronomia e delivery integrado`.

## Atualizacao 2026-05-12 (SEO Territorial - Hardening Comunidade)

- `resolveSeoPolicy` foi corrigido para classificar duplicacao de modulo publico dentro da comunidade tambem no nivel cidade:
1. cidade: `/comunidade/:state/:city/:modulo-publico`
2. bairro: `/comunidade/:state/:city/:district/:modulo-publico`
3. area: `/comunidade/:state/:city/area/:groupSlug/:modulo-publico`
- Todas as tres variacoes agora aplicam `robots: noindex, follow` e `canonical` para a rota publica equivalente do modulo.
- Blindagem adicionada em teste unitario de policy:
1. `src/core/routing/seo/__tests__/TerritorialSEO.spec.ts` ganhou caso explicito de nivel cidade (`/comunidade/ba/salvador/empresas -> /empresas/ba/salvador`).
- Validacoes desta entrega:
1. `npm test -- src/core/routing/seo/__tests__/TerritorialSEO.spec.ts`: passou (4/4).
2. `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: passou (8/8).
3. `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` esperado.
4. Cobertura E2E ampliada para nivel cidade em `tests/e2e/territorial-seo.spec.ts` (`/comunidade/ba/salvador/empresas`).
5. `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: reexecutado com cobertura ampliada e passou (9/9).
6. `npm run validate:phase:core`: reexecutado apos ampliar cobertura, passou com `56 passed`, `1 skipped` esperado.

## Atualizacao 2026-05-12 (Comunidade - Widgets e Rotas Canonicas)

- Classificados proximos (core/modules) agora usam rota territorial canonica no CTA de listagem (`useModuleUrls().classifieds`) e fallback curto via `classifiedUrlService.buildShortUrl(...)`, removendo navegacao generica fixa.
- Widgets de ranking da comunidade (core/modules) deixaram hardcodes de rota:
1. `"/ranking"` foi migrado para `useAppUrls().ranking`.
2. `"/profile/:id"` foi migrado para `useAppUrls().profile.public(...)`.
- Cards de perfil mencionado (core/modules) deixaram rota legada `"/profile/:id"` e passaram para helper canonico de perfil publico (`buildPublicProfileUrl`).
- Widget de sugestoes da sidebar foi consolidado em implementacao canônica nova (`SuggestionsWidgetSSOT`) para eliminar hardcode residual de perfil e CTA:
1. perfil pessoa: helper `buildPublicProfileUrl(...)`.
2. CTA `Explorar Mais`: `appUrls.search`.
3. Sidebars de comunidade (core/modules) apontam para o widget SSOT.
- Validacoes desta entrega:
1. `npm run typecheck`: passou.
2. `npm run lint`: passou.
3. `npm run validate:phase:core`: passou com `56 passed`, `1 skipped` esperado.

## Atualizacao 2026-05-12 (Blindagem Anti-Regressao de Rotas)

- Novos testes SSOT para impedir reintroducao de rotas hardcoded legadas em componentes ativos da comunidade:
1. `src/core/community/__tests__/CommunityRouteSSOT.test.ts`:
   valida ausencia de `"/profile/"` em fontes ativas de `core/modules community` (com excecao controlada do arquivo legado travado).
2. `src/core/community/__tests__/CommunityNavigationSSOT.test.ts`:
   valida ausencia de hardcodes `"/classificados"` e `"/ranking"` nos componentes ativos de nearby/ranking auditados.
- Validacoes desta etapa:
1. `npm test -- src/core/community/__tests__/CommunityRouteSSOT.test.ts src/core/community/__tests__/CommunityNavigationSSOT.test.ts`: passou (`2/2`).
2. `npm run validate:phase:core`: passou com `56 passed`, `1 skipped` esperado.

## Atualizacao 2026-05-12 (Gate Oficial com SSOT de Comunidade)

- O gate oficial da fase (`validate:phase:core`) foi fortalecido para incluir blindagens de rota da comunidade como etapa obrigatoria:
1. novo script `test:ssot:community` em `package.json`.
2. `validate:phase:core` agora executa: `typecheck` + `lint` + `test:ssot:community` + `test:e2e:phase-core`.
- Suite `test:ssot:community` consolidada com 3 testes:
1. `CommunityRouteSSOT.test.ts`.
2. `CommunityNavigationSSOT.test.ts`.
3. `CommunityLegacyIsolationSSOT.test.ts`.
- Ajuste de robustez aplicado em `CommunityLegacyIsolationSSOT` para ignorar arquivo ponte (re-export), evitando falso positivo sem relaxar regra de runtime.
- Validacoes desta etapa:
1. `npm run validate:phase:core`: passou com `56 passed`, `1 skipped` esperado.
2. `npm run build`: passou.

## P0 Abertos

- [CONCLUIDO] Servicos/Profissionais: validar Central Profissional, resposta, proposta estruturada, aceite e atendimento contratado com perfil real e dados de `professional_data`.
- [CONCLUIDO] Servicos/Profissionais: validar avaliacao pos-servico controlada por atendimento concluido com perfis reais.
- [CONCLUIDO] Marketplace/Classificados: consolidar moderacao dedicada para comentarios/perguntas publicas de anuncios na mesma trilha administrativa de confianca.
- [EM VALIDACAO] Comunidade/Feed: hardening territorial blindado por testes SSOT versionados; ainda exige reexecucao completa de `npm run validate:phase:core` em ambiente com Node/npm.
- [EM VALIDACAO] Comunidade/Feed: revalidacao visual de edicao/exclusao/comentarios segue como criterio de aceite antes de release publico amplo.
- [CONCLUIDO] Admin/Moderacao: consolidar fila unica, audit log e moderacao transversal alem da fila inicial de confianca operacional.
- [CONCLUIDO] Notificacoes: matriz completa por evento/audiencia/rota canonica consolidada em `docs/MATRIZ_NOTIFICACOES_FASE3_SSOT.md` e blindada por contrato E2E/SSOT.
- [EM VALIDACAO] SEO/Rotas: politica de indexacao/canonical ganhou specs versionadas e assets sociais/PWA; falta rodar gate completo no ambiente de CI/deploy.
- [CONCLUIDO] Billing/Seguranca: fluxo de gastronomia deixou de chamar `gastronomy_subscriptions` e edge functions antigas; checkout/webhook canonicamente usam `user_subscriptions`, contexto de negocio e catalogo publicado.

## P1 Abertos

- [CONCLUIDO] Gastronomia: painel realtime de fila da loja.
- [CONCLUIDO] Gastronomia: validacao visual final do fluxo de elegibilidade de area no checkout (bloqueio sem destino + habilitacao com destino).
- [CONCLUIDO] Mobile/PWA: validar dashboards complexos autenticados em telas pequenas (core publico + central autenticada em 360px).
- [CONCLUIDO] E2E: adicionar specs autenticadas para gastronomia e mobilidade operacional.

## Bloqueios/Riscos

- Ambiente E2E local carrega `.env.local` com precedencia sobre `.env.test`; login e recovery anonimos passam, mas os testes autenticados ainda dependem de seeds reais por modulo.
- Validacao Playwright de gastronomia autenticada resolve `businessId` automaticamente via `/central/empresas`, com bootstrap de perfil empresarial quando necessario.
- `SUPABASE_SERVICE_ROLE_KEY` ausente ainda limita asserts administrativos profundos no setup E2E, embora login/recovery e fluxo autenticado da loja estejam passando com bootstrap anonimo controlado.
- Criacao automatica de pedido fixture E2E ainda e sensivel a permissao de insert em `orders` para a conta de teste; quando negada pelo ambiente, o teste pode perder profundidade de assert no fluxo pedido->entrega.
- `SUPABASE_SERVICE_ROLE_KEY` ausente continua como limitador para asserts administrativos profundos e seeds transversais controladas entre personas (cliente/loja/motoboy) em um unico cenario E2E.
- `SUPABASE_SERVICE_ROLE_KEY` ausente limita asserts administrativos e criacao/limpeza automatica de usuarios, empresas e seeds para testes autenticados.
- Para rodar o Playwright de gastronomia, configurar `E2E_USER_EMAIL` e `E2E_USER_PASSWORD`; `E2E_GASTRONOMY_BUSINESS_ID` virou opcional.
- Algumas validacoes historicas do Playwright existentes no repositorio podem depender de ambiente/seed especifico.
- Docs historicos em `docs/archive`, `docs/historico` e relatorios antigos ainda contem afirmacoes antigas; usar este arquivo e `docs/ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md` como fonte viva.
- Ambiente local de 2026-05-26 nao possui `npm`/`git` acessiveis; qualquer decisao final de lancamento deve exigir CI verde com `npm run typecheck`, `npm run lint`, `npm run validate:phase:core`, `npm run security:validate` e `npm run verify:deploy`.

## Proxima Tarefa Recomendada

Avancar para fechamento total da Fase 3 (sem abrir Fase 4):

1. Fechar matriz completa de notificacoes operacionais por persona/canal em gastronomia e mobilidade.
2. Consolidar evidencias visuais finais do realtime da fila da loja e sincronizacao de estado cliente/loja/motoboy sem polling paralelo.
3. Executar validacao visual final de area de entrega e bloqueio de checkout fora da area em todos os fluxos.
4. Rodar gate final da fase (`typecheck`, `lint`, `test:e2e:phase-core`, `build`) e atualizar status final da fase.

## Atualizacao 2026-05-08 (Checkout Delivery SSOT)

- `npm run typecheck`: passou apos reforco do checkout de gastronomia com validacao canonica de area de entrega antes de criar pedido.
- `npm run lint`: passou apos reforco do checkout de gastronomia com validacao canonica de area de entrega antes de criar pedido.
- `npm test -- src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts`: passou com `7/7` apos reforco do checkout de gastronomia.
- `npm run build`: passou apos reforco do checkout de gastronomia com bloqueio de endereco fora da area.
- Checkout de gastronomia agora usa destino salvo no fluxo de confirmacao e valida elegibilidade por bairro/cidade/estado via `DeliveryAreaService.checkEligibility` antes de criar pedido SSOT.
- Pedido delivery agora e bloqueado com mensagem explicita quando o endereco esta fora da area configurada pela loja.
- TrustEventService agora notifica envolvidos quando um `trust_event` e criado/atualizado (ator e sujeito, sem auto-notificacao duplicada), com metadata auditavel e link canonico por contexto.
- TrustEventService agora notifica sujeito e admin quando uma `trust_admin_action` e aplicada, preservando fluxo principal mesmo quando notificacao falha (falha isolada com log `warn`).
- `npm run typecheck`: passou em 2026-05-08 apos integracao de notificacoes no SSOT de confianca.
- `npm run build`: passou em 2026-05-08 apos integracao de notificacoes no SSOT de confianca.
- Matriz de notificacoes operacionais de delivery foi detalhada no SSOT com eventos explicitos (`order_accepted`, `order_preparing`, `order_ready_for_pickup`, `courier_picked_up`, `order_delivered`, `order_canceled_by_merchant`, `delivery_failed`, `delivery_proof_attached`, etc.).
- `OrderDeliverySSOTService` agora dispara eventos semanticos no ponto operacional correto (coleta, entrega e transicoes), mantendo links canonicos para cliente, loja e motoboy.
- `npm run typecheck`: passou em 2026-05-09 apos detalhamento da matriz de notificacoes operacionais.
- `npm run build`: passou em 2026-05-09 apos detalhamento da matriz de notificacoes operacionais.
- E2E administrativo de gastronomia foi aprofundado em `assertAdministrativeOrderEvidence`: agora valida estado terminal em `order_timeline_events`, evento semantico em `notifications.metadata.event` e consulta de trilha `trust_admin_actions` quando existir `trust_event` do pedido.
- Resiliencia dos testes de UI da Central foi reforcada para estados intermediarios de shell: fallback valida URL canonica e ausencia de suspense global, evitando falso negativo por `main` temporariamente oculto.
- `npx playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list`: passou em 2026-05-09 com `4/4` apos reforco de asserts administrativos + hardening de estabilidade do spec.
- `npx playwright test tests/e2e/central/central-validation.spec.ts --project=chromium --reporter=list`: passou em 2026-05-09 com `28/28` e `1 skipped` esperado (auditoria admin profunda de mobilidade condicionada a `SUPABASE_SERVICE_ROLE_KEY`).
- `tests/e2e/central/central-validation.spec.ts` ganhou bloco `Central - Auditoria Admin de Mobilidade` para validar trilha canonica (`ride_requests`, `notifications`, `trust_events`, `trust_admin_actions`) com skip explicito quando credencial admin nao estiver presente.

## Atualizacao 2026-05-09 (Notificacoes Semanticas de Cancelamento)

- `npm run typecheck`: passou em 2026-05-09 apos ajuste de evento semantico de cancelamento por ator no SSOT de delivery.
- `npx playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list`: passou em 2026-05-09 com `4/4` apos ajuste de notificacao semantica no cancelamento.
- OrderDeliverySSOTService.transitionLogisticsStatus agora diferencia `order_canceled_by_customer` vs `order_canceled_by_merchant` conforme `actor_profile_id`, evitando evento incorreto na trilha operacional e administrativa.
- TrustEventService.notifyTrustAdminAction agora resolve URL de contexto para o sujeito via `trust_event` vinculado (quando existir), evitando envio indevido de usuario comum para `/admin/moderacao`; admin permanece com rota de fila administrativa.
- `useOrders` e `useOrderDetails` removeram `refetchInterval` fixo e mantiveram sincronizacao por canal realtime + invalidacao de query no SSOT.
- `npm run test:e2e:phase-core`: passou em 2026-05-09 com `46 passed` e `1 skipped` esperado (auditoria admin profunda condicionada a `SUPABASE_SERVICE_ROLE_KEY`).
- `npm run build`: passou em 2026-05-09 apos hardening de realtime-first e limpeza de encoding.
- Teste de contrato GastronomyOperationalSSOT.test.ts foi ampliado para blindar realtime-first sem polling fixo e obrigatoriedade de DeliveryAreaService.checkEligibility no checkout delivery.
- `npm test -- src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts`: passou em 2026-05-09 com `9/9` apos ampliacao de cobertura SSOT.
- Matriz formal de notificacoes da fase foi consolidada em `docs/MATRIZ_NOTIFICACOES_FASE3_SSOT.md` (eventos, audiencia e rotas canonicas por persona).

## Atualizacao 2026-05-09 (Checkout Delivery - Bloqueio Visual de Destino)

- `GastronomyCheckoutSheet` agora exibe bloco de `Destino de entrega` no checkout quando a loja opera com delivery.
- Sem destino valido, o botao de confirmar pedido fica bloqueado antes do submit e a UI mostra mensagem explicita.
- O fluxo continua validando elegibilidade no hook e no service (SSOT), sem fonte paralela.
- `npm run typecheck`: passou em 2026-05-09.
- `npm run lint`: passou em 2026-05-09.
- `npx playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list`: passou em 2026-05-09 com `4/4`.

## Atualizacao 2026-05-09 (Checkout Delivery - Cenarios de Elegibilidade)

- Testes de componente do checkout agora cobrem os dois cenarios principais de elegibilidade no frontend:
  - sem destino de entrega valido: botao de confirmar permanece bloqueado com mensagem explicita;
  - com destino de entrega salvo: botao de confirmar fica habilitado.
- Arquivo de teste: `src/modules/business/gastronomy/components/GastronomyCheckoutSheet.spec.tsx`.
- `npm test -- src/modules/business/gastronomy/components/GastronomyCheckoutSheet.spec.tsx`: passou em 2026-05-09 com `2/2`.
- `npm run typecheck`: passou em 2026-05-09.
- `npm run lint`: passou em 2026-05-09.

## Atualizacao 2026-05-09 (Mobilidade E2E Operacional Dedicada)

- Nova suite autenticada de mobilidade criada: `tests/e2e/mobility-operational.spec.ts`.
- Cobertura adicionada:
  - motorista em `/central/motorista/corridas` com readiness de layout e ausencia de lock transitorio;
  - motoboy em `/central/motoboy/entregas` com dois caminhos validos: operacao ativa ou onboarding canonico (`/central/motoboy/cadastro`).
- Novo script: `npm run test:e2e:mobility-operational`.
- `npm run test:e2e:operations` passou a incluir a suite de mobilidade dedicada.
- Validacoes executadas:
  - `npm run test:e2e:mobility-operational`: passou em 2026-05-09 com `2/2`.
  - `npm run typecheck`: passou em 2026-05-09.
  - `npm run lint`: passou em 2026-05-09.

## Atualizacao 2026-05-09 (Mobile Core Layout 360px)

- Nova suite E2E mobile adicionada: `tests/e2e/mobile-core-layout.spec.ts`.
- Validacao de layout em viewport `360x800` para rotas publicas criticas:
  - `/`
  - `/cadastro`
  - `/servicos/ba/salvador/area/complexo-do-nordeste-de-amaralina`
- Cada cenario valida renderizacao util (main/conteudo) e ausencia de overflow horizontal no documento.
- O fluxo de navegacao foi endurecido com retry curto de `goto` para reduzir falso negativo por instabilidade transitoria de carregamento.
- `npx playwright test tests/e2e/mobile-core-layout.spec.ts --project=chromium --reporter=list`: passou em 2026-05-09 com `3/3`.

## Atualizacao 2026-05-09 (Gate Core com Mobile)

- `package.json` ganhou script dedicado `test:e2e:mobile-core-layout` para execucao isolada da suite mobile.
- `test:e2e:phase-core` passou a incluir `tests/e2e/mobile-core-layout.spec.ts` no gate canonico da fase.
- `test:e2e:phase-core` agora tambem inclui `tests/e2e/mobile-auth-dashboards.spec.ts` (cobertura autenticada da Central em 360px).
- Resultado pratico: validacao mobile publica (360px) deixa de ser check avulso e passa a bloquear regressao no pipeline principal (`validate:phase:core`).
- `npm run validate:phase:core`: reexecutado em 2026-05-09 apos integracao mobile autenticada; passou com `53 passed` e `1 skipped` esperado.
- `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: ampliado em 2026-05-09 para blindar tambem `empresas` duplicado na comunidade (bairro + area) com `noindex + canonical publico`; passou com `8/8`.
- `npm run validate:phase:core`: reexecutado em 2026-05-09 apos ampliacao SEO de `empresas` duplicado na comunidade; passou com `55 passed` e `1 skipped` esperado.
- `npm run typecheck`: passou em 2026-05-10 apos hardening de tipagem em hooks de comunidade (`useGroupChat`, `useGroups`, `useCommunityRollout` em `core/modules`).
- `npm run lint`: passou em 2026-05-10 apos o mesmo hardening de tipagem.
- `npm run validate:phase:core`: reexecutado em 2026-05-10; passou com `55 passed` e `1 skipped` esperado (assert admin profundo condicionado a `SUPABASE_SERVICE_ROLE_KEY`).

## Atualizacao 2026-05-09 (Mobile Autenticado na Central)

- Nova suite E2E: `tests/e2e/mobile-auth-dashboards.spec.ts`.
- Cobertura autenticada em viewport `360x800`:
  - `/central`
  - `/central/empresas`
  - `/central/motorista/corridas`
  - `/central/motoboy/entregas` (com fallback canonico de onboarding quando aplicavel).
- Novo script dedicado: `npm run test:e2e:mobile-auth-dashboards`.
- Novo agregado mobile: `npm run test:e2e:mobile`.
- Novo gate de fase mobile: `npm run validate:mobile:phase` (`typecheck` + `lint` + `test:e2e:mobile`).
- Validacao executada:
  - `npm run validate:mobile:phase`: passou em 2026-05-09 com `7/7` E2E mobile.

## Atualizacao 2026-05-09 (Hardening de Tipagem - Comunidade Feed)

- `communityBusinessLogic` foi refatorado para remover `as any` repetido em notificacoes de comentario/curtida:
  - novo helper `getPostOwnerProfileId` centraliza regra de dono do post;
  - fluxo de notificacao evita duplicidade de fallback e mantem bloqueio de auto-notificacao.
- Hooks espelho `useUnifiedFeed` em `core` e `modules` foram tipados com derivacao canonicamente ancorada no `PostAdapter`:
  - arrays de entrada deixaram de usar `any[]`;
  - filtro por tipo removeu cast `as any` desnecessario.
- Validacoes executadas apos o hardening:
  - `npm run typecheck`: passou em 2026-05-09.
  - `npm run lint`: passou em 2026-05-09.
  - `npm run validate:phase:core`: passou em 2026-05-09 com `55 passed` e `1 skipped` esperado.

## Atualizacao 2026-05-10 (Hardening de Tipagem - Servicos de Comunidade)

- src/core/community/services/CommunityQAService.ts recebeu tipagem explicita para rows de perguntas/respostas/likes e removeu casts ny no fluxo principal de leitura/criacao/like/mencoes.
- src/core/community/services/CommunityService.ts teve boundary de grupos tipado (GroupRow, GroupCreateInput) e remoção de casts supabase as any no arquivo.
- `npm run validate:phase:core`: reexecutado em 2026-05-10 apos limpeza residual de tipagem em `core/modules community`; passou com `55 passed` e `1 skipped` esperado.
- Limpeza residual concluida em comunidade: `modules/community/services/CommunityRolloutService`, `modules/community/nearby/hooks/useNearbyEntities`, `core/community/components/cards/PostCard` e `core/community/components/Leaderboard` sem `any`/`as any` nesses pontos.
- `landing/services` hardening em 2026-05-10: `types.ts`, `landing.queries.ts` e `LandingFeaturedService.ts` tipados sem `any` residual no modulo; `npm run validate:phase:core` manteve `55 passed` e `1 skipped` esperado.



- `npm run validate:phase:core`: revalidado em 2026-05-11 apos ajuste canonico dos scripts Playwright com `node --use-system-ca`; passou com `55 passed` e `1 skipped` esperado, sem erro TLS ao final da suite.
- `npm run validate:operations:phase`: revalidado em 2026-05-11; passou com `37 passed` e `1 skipped` esperado.
- `npm run validate:mobile:phase`: revalidado em 2026-05-11; passou com `7 passed`.

## Atualizacao Continua 2026-05-11 (lote tipagem/qualidade)

- Limpeza estrita de tipagem em hooks de mobilidade (useRideChat, useMobility, useGeolocation, useDriverLocation, useCommunityPosts, useMobilidade) removendo ny/as any residual e mantendo contratos SSOT.
- Limpeza estrita de tipagem em gastronomia (useMenuItems, useDeliveryRequests, useAnalytics, MenuService, NicheVersioningService, illing/types) com substituicao de ny por tipos explicitos/unknown e guards de union.
-
npm run typecheck: passou em 2026-05-11 apos os ajustes.
-
npm run lint: passou em 2026-05-11 apos os ajustes.
-
npm run test:e2e:phase-core: passou em 2026-05-11 com 55 passed, 1 skipped (skip esperado por credencial/ambiente admin).

- 2026-05-11 (continuidade): corrigido SSOT de area de entrega em DeliveryAreaService para preservar valores  (uso de ?? em vez de ||), normalizacao de endereco na elegibilidade e hardening UX no GastronomyDeliveryDestinationPanel (submit bloqueado com endereco vazio).
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado), mantendo fluxo operacional cliente/loja/motoboy verde.

- 2026-05-11 (notificacoes/trust hardening): OrderDeliveryNotificationService agora usa entrega parcial resiliente (Promise.allSettled) e deduplicacao por usuario+evento+status para reduzir auto-notificacao duplicada. TrustEventService tambem foi endurecido com envio resiliente em
otifyTrustEventCreated e
otifyTrustAdminAction, sem bloquear notificacoes restantes em caso de falha isolada.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (realtime fila da loja): useOrders endurecido para nao invalidar fila de uma loja com eventos globais de order_timeline_events; agora o hook invalida apenas quando o order_id do evento pertence aos pedidos carregados da loja (Set memoizado), mantendo SSOT e reduzindo ruido/reloads desnecessarios.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (eligibilidade hardening): useDeliveryEligibility agora normaliza
eighborhood/city/state com 	rim(), usa chave de cache normalizada e bloqueia fetch com campos apenas de espaco em branco, evitando inconsistencias de elegibilidade e cache duplicado.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

-
npm run validate:phase:core: passou em 2026-05-11 apos os hardenings recentes (realtime, elegibilidade e notificacoes), com 55 passed e 1 skipped (skip esperado por credencial admin/service-role).

- 2026-05-11 (consistencia de cache no detalhe): useOrderDetails passou a invalidar tambem ['orders', businessId] e ['order-stats', businessId] apos atualizar notas internas, evitando divergencia entre detalhe e fila/indicadores da loja.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (ux operacional motoboy+tracking): MotoboyDeliveryActions agora impede fechamento de dialogs durante acao em andamento (isLoading) e desabilita cancelamento nesses estados para evitar interrupcao de operacoes criticas. OrderTrackingCard foi endurecido para nao renderizar mapa com coordenadas invalidas (0/0); quando coordenadas faltam, exibe estado explicito aguardando dados no SSOT.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (tracking realtime SSOT): useOrderTracking migrou para subscription realtime de
ide_requests (filtro source_type='gastronomy' + match por source_id=orderId) com polling apenas como fallback leve. Tambem foi corrigida a tipagem de
efetch para retorno assíncrono e eliminada duplicacao de status ativos em constante unica.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (contrato SSOT delivery link): corrigido OrderDeliveryLinkService.applyOrderTransition para nao enviar proof em cancelOrder/failOrder (contrato canônico aceita prova apenas em markDelivered), removendo inconsistência de payload e mantendo tipagem/semântica do SSOT.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (realtime lista filtrada): useOrders corrigido para validar eventos de order_timeline_events por vinculo canonical (orders.id + source_id=businessId) antes de invalidar cache. Isso evita ruido global sem perder pedidos que entram no filtro atual por mudanca de status.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (react-query v5 contract): corrigido useOrderTracking para assinatura canônica de
efetchInterval no TanStack Query v5 (query => query.state.data), eliminando uso de assinatura antiga e garantindo fallback polling correto por status ativo.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (otimizacao canal tracking): useOrderTracking passou a assinar
ide_requests com filtro direto por source_id=orderId e validacao de source_type='gastronomy' no payload. Reduz processamento de eventos nao relacionados sem abrir excecao de contexto.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (debounce realtime pedidos): useOrders recebeu coalescencia de invalidacao (250ms) para eventos em rajada de orders/order_timeline_events, reduzindo refetch redundante sem perder consistencia do SSOT. Cleanup do timer incluido no unmount do canal realtime.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (debounce realtime detalhe): useOrderDetails recebeu coalescencia de invalidacao (250ms) para eventos em rajada de orders/order_timeline_events, reduzindo refetch redundante na tela de detalhe e mantendo consistencia SSOT. Timer tambem limpo no unmount.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (cache realtime timeline): useOrders passou a memorizar order_id ja verificados como pertencentes ao usinessId no canal de timeline, reduzindo consultas repetidas de validacao canônica (orders.id + source_id) sem abrir excecao de SSOT.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11 (reexecucao com timeout maior).
-
px playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list: passou em 2026-05-11 com 2 passed, 2 skipped (skips condicionais de ambiente/certificado).

- 2026-05-11 (blindagem SSOT realtime): testes de arquitetura operacional em GastronomyOperationalSSOT.test.ts foram ampliados para travar regressao de realtime/coalescencia em useOrders, useOrderDetails e useOrderTracking (filtro canonical por source_id, debounce de invalidacao, assinatura React Query v5 e fallback polling controlado).
-
pm test -- src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts: passou em 2026-05-11 com 10/10 testes.
-
npm run typecheck: passou em 2026-05-11.
-
npm run lint: passou em 2026-05-11.

- 2026-05-11 (estabilizacao E2E profissionais): corrigido professional-leads-operational.spec.ts para verificar persistencia de avaliacao com sessao unica de consulta (sem login repetido a cada poll), reduzindo flakiness do fluxo autenticado de leads/propostas/engagement.
-
npm run validate:phase:core: passou em 2026-05-11 com 55 passed, 1 skipped apos a estabilizacao do E2E de profissionais.


## Atualizacao 2026-05-11 (Gate Core + Build)

- `npm run build`: passou em 2026-05-11.
- `npm run typecheck`: passou em 2026-05-11.
- `npm run lint`: passou em 2026-05-11.
- `npm run validate:phase:core`: passou em 2026-05-11 com `55 passed`, `1 skipped` (skip administrativo condicional de `SUPABASE_SERVICE_ROLE_KEY`).
- Suite `tests/e2e/mobile-auth-dashboards.spec.ts` entrou no gate core e passou (`4/4`), cobrindo `central`, `central/empresas`, `central/motorista/corridas` e `central/motoboy/entregas` em 360px.
- Hardening SSOT de Gastronomia concluido nesta etapa: debounce/coalescencia de invalidacao realtime em pedidos/timeline/tracking, sincronizacao canônica por `ride_requests` (`source_type='gastronomy'`, `source_id=orderId`) e resiliencia de notificacoes/trust com falha isolada sem quebrar fluxo principal.

### Proximo Bloco Tecnico (sem abrir nova fase)

1. Fechar P0 de Comunidade/Feed que permanece aberto no status vivo: hardening territorial/visibilidade em pontos residuais de hooks/widgets/paginas.
2. Revalidar browser fluxo de comunidade (edicao/exclusao/comentarios) em rotas canonicas territoriais.
3. Reexecutar gate final da etapa apos ajustes (`typecheck`, `lint`, `validate:phase:core`, `build`).

## Atualizacao 2026-05-11 (P0 Comunidade - Widgets Territoriais)

- Falha real corrigida em widgets da comunidade: `TopPostsWidget` e `PopularTagsWidget` (core e modules) dependiam de `filters.location_id` inexistente no hook de filtros local, podendo desativar consulta silenciosamente.
- Correção SSOT aplicada: widgets agora usam `useTerritoryFilter` canônico, cobrindo escopo `location` e `group` com agregacao de resultados por `location_id` (sem campo legado).
- Arquivos atualizados:
  - `src/core/community/components/PopularTagsWidget.tsx`
  - `src/core/community/components/TopPostsWidget.tsx`
  - `src/modules/community/components/PopularTagsWidget.tsx`
  - `src/modules/community/components/TopPostsWidget.tsx`
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Comunidade - Ranking Territorial de Usuarios)

- Falha real corrigida no `TopUsersWidget` (core/modules): ranking ainda filtrava por `user_metadata.city/neighborhood`, fora do SSOT territorial ativo.
- Correção aplicada: widget agora resolve cidade/bairro via contexto territorial canônico (`useTerritorialContextOptional`) com fallback de localizacao ativa (`useCommunityLocation`), sem dependencia de metadado legado de usuario.
- Escopo de bairro respeita somente quando o territorio resolvido/ativo for `district`; em grupo/cidade, consulta usa contexto de cidade.
- Arquivos atualizados:
  - `src/core/community/components/TopUsersWidget.tsx`
  - `src/modules/community/components/TopUsersWidget.tsx`
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Comunidade - Contrato de Feed Territorial)

- Inconsistencia corrigida no `CommunityFeed` da camada `modules`: o componente nao expunha `territoryFilter` no contrato, diferindo da versao canonica em `core`.
- Risco eliminado: em cenarios de grupo territorial com cobertura parcial, o feed podia perder o recorte territorial explicitamente injetado pela pagina/chamada.
- Correcao aplicada:
  - `src/modules/community/components/feed/CommunityFeed.tsx` agora aceita `territoryFilter?: TerritoryFilter` e repassa para `useCommunityFeedSimple`.
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Comunidade - Sincronia Hook Modules)

- Divergencia estrutural corrigida: `src/modules/community/hooks/feed/useCommunityFeed.ts` estava em versao anterior, sem suporte explicito a `territoryFilter` injetado pela pagina/componente.
- Hook sincronizado com contrato canônico de `core`: agora aceita `territoryFilter`, usa `useModuleTerritoryFilter` como fallback e mantem chave/enable por `territoryFilterKey` + `isTerritoryFilterReady`.
- Ajuste complementar: `src/modules/community/components/feed/CommunityFeed.tsx` passou a enviar `userLocation.location_id` com fallback para ambos formatos (`locationId` e `location_id`).
- Validacoes apos sincronizacao:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Comunidade - Fallback de Identidade Territorial no Feed Core)

- Ajuste de consistencia `core/modules` aplicado em `src/core/community/components/feed/CommunityFeed.tsx`.
- `userLocation.location_id` agora usa fallback para ambos formatos de perfil (`locationId` e `location_id`), evitando divergencia silenciosa entre camadas e reduzindo risco de feed sem contexto territorial em runtime.
- Validacoes apos ajuste:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Comunidade - Hook de Territorio do Morador)

- Divergencia `core/modules` corrigida em `useCommunityTerritory`:
  - versao `core` lia apenas `activeProfile.locationId`;
  - versao `modules` lia apenas `activeProfile.location_id`.
- As duas versoes agora usam fallback canônico unico (`locationId ?? location_id`) para resolver o territorio do morador sem falso vazio por formato de payload.
- Arquivos atualizados:
  - `src/core/community/hooks/useCommunityTerritory.ts`
  - `src/modules/community/hooks/useCommunityTerritory.ts`
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Comunidade - Presentation Territorial)

- Correcao aplicada em `src/core/community/utils/communityTerritoryPresentation.ts` para fallback completo de identificador territorial de perfil.
- `ProfileLike` passou a aceitar `location_id` alem de `locationId`.
- Resolucao de `locationId` no retorno agora usa `locationId ?? location_id`, evitando perda de contexto quando payload vier em snake_case.
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Comunidade - Alerta de Panico em Modules)

- Falha real corrigida em `src/modules/community/components/PanicAlertButton.tsx`.
- O fluxo de envio de alerta exigia apenas `profile.location_id`, podendo falhar quando o perfil viesse no formato `locationId`.
- Correcao aplicada: adicionado `resolveProfileLocationId(profile)` com fallback canônico (`locationId` -> `location_id`) e uso desse valor no `createPost` de seguranca.
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (Gate Core Revalidado em Execucao Continua)

- Revalidacao completa executada sem paliativos para fechar o ciclo atual antes do proximo bloco de implementacao.
- Resultado do gate:
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run test:e2e:phase-core`: passou com `55 passed`, `1 skipped` (skip condicional por `SUPABASE_SERVICE_ROLE_KEY`).
  - `npm run validate:phase:core`: passou (execucao completa em ~10 min).
- Observacao operacional:
  - O comando `validate:phase:core` precisa timeout maior em ambiente local por incluir a suite E2E completa; nao e falha funcional.
- Proximo foco P0:
  - continuar pente-fino de consistencia territorial `core/modules` em comunidade/mobilidade sem introduzir novas fontes de verdade.

## Atualizacao 2026-05-11 (P0 Mobilidade - Resolver Territorial de Motoboy)

- Inconsistencia real corrigida em `src/modules/mobility/services/MotoboySourceResolverService.ts`.
- `getProfileSummaryById` lia apenas `location_id`; quando o payload vinha em `locationId`, o fluxo de resolucao territorial podia retornar vazio e degradar elegibilidade/roteamento operacional.
- Correcao aplicada: fallback canônico unico `locationId ?? location_id` antes de expor `location_id` no summary.
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint -- src/modules/mobility/services/MotoboySourceResolverService.ts`: passou.

## Atualizacao 2026-05-11 (P0 Mobilidade - Navegacao e Coleta Motoboy)

- Inconsistencia de navegacao operacional corrigida em `src/modules/profile/utils/profileNavigation.ts`.
- A secao `delivery` do perfil apontava diretamente para a rota legada `/perfil/mobilidade/motoboy/entregas`; agora usa `profileMobilityRoutes.motoboy.entregas`, que resolve para a rota canonica `/central/motoboy/entregas`.
- Ajuste de consistencia aplicado em `src/modules/mobility/components/CreateDeliveryModal.tsx`: fallback de `location_id` passou de `||` para `??`, preservando o valor resolvido e tratando fallback apenas quando o dado esta realmente ausente.
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint -- src/modules/profile/utils/profileNavigation.ts src/modules/mobility/components/CreateDeliveryModal.tsx src/modules/mobility/services/MotoboySourceResolverService.ts`: passou.
  - `node --use-system-ca ./node_modules/playwright/cli.js test tests/e2e/central/central-validation.spec.ts tests/e2e/mobile-auth-dashboards.spec.ts --project=chromium --reporter=list`: passou com `32 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Delivery - Remocao de Ilha Legada `delivery_requests`)

- Removida a ilha antiga de gastronomia que ainda expunha `DeliveryService`, `useDeliveryRequests`, `DeliveryRequestCard` e `CreateDeliveryRequestDialog` sobre a tabela legada `delivery_requests`.
- O fluxo operacional atual permanece no SSOT: `orders` para pedido e `ride_requests` com `ride_mode='motoboy'` para entrega/motoboy, via `useDelivery`, `RideOperationalService` e `OrderDeliveryLinkService`.
- Ajustes complementares de fallback territorial:
  - `src/core/community/utils/communityTerritoryPresentation.ts`
  - `src/core/community/hooks/composer/useCreatePost.ts`
  - `src/modules/community/hooks/composer/useCreatePost.ts`
  - `src/modules/mobility/services/MotoboySourceResolverService.ts`
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint -- src/core/community/utils/communityTerritoryPresentation.ts src/core/community/hooks/composer/useCreatePost.ts src/modules/community/hooks/composer/useCreatePost.ts src/modules/mobility/services/MotoboySourceResolverService.ts src/modules/business/gastronomy/pages/DeliveryManagementPage.tsx`: passou.
  - `node --use-system-ca ./node_modules/playwright/cli.js test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=list`: passou com `4 passed`.

## Atualizacao 2026-05-11 (P0 Rotas/Fallbacks - SSOT Global)

- `src/core/routing/hooks/useAppUrls.ts` deixou de duplicar manualmente as rotas de motorista/motoboy da Central e agora reutiliza `useMobilityUrls()` como fonte unica para `profile.mobilidade.motorista` e `profile.mobilidade.motoboy`.
- `src/core/community/hooks/page/useComunidadePage.ts` alinhou a resolucao de territorio do perfil para `locationId ?? location_id`, mantendo o mesmo contrato usado nos demais hooks/componentes de comunidade.
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint -- src/core/routing/hooks/useAppUrls.ts src/core/community/hooks/page/useComunidadePage.ts src/core/community/utils/communityTerritoryPresentation.ts src/core/community/hooks/composer/useCreatePost.ts src/modules/community/hooks/composer/useCreatePost.ts src/modules/mobility/services/MotoboySourceResolverService.ts`: passou.
  - `node --use-system-ca ./node_modules/playwright/cli.js test tests/e2e/community-territorial-operational.spec.ts tests/e2e/central/central-validation.spec.ts --project=chromium --reporter=list`: passou com `31 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Mobilidade - Rotas Canonicas em Constante Pura)

- Criado `src/modules/mobility/routes/mobilityRoutes.ts` como fonte pura e reutilizavel das rotas canonicas de motorista, motoboy e passageiro.
- `useMobilityUrls`, `profileMobilityRoutes`, navegacao da Central, atalhos do perfil e notificacoes operacionais deixaram de repetir strings de `/central/motorista/*` e `/central/motoboy/*`.
- `OrderDeliveryNotificationService` e `RideOperationalService` agora usam `mobilityRoutes` para links de motoboy/motorista, permitindo uso do mesmo SSOT fora de componentes React.
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npm run lint -- src/modules/mobility/routes/mobilityRoutes.ts src/modules/mobility/hooks/useMobilityUrls.ts src/modules/profile/utils/profileMobilityNavigation.ts src/modules/mobility/delivery/services/OrderDeliveryNotificationService.ts src/modules/mobility/core/RideOperationalService.ts src/modules/central/components/centralNavigation.config.ts src/modules/central/pages/CentralHubPage.tsx src/modules/profile/sections/ResumoSection.tsx src/modules/profile/pages/PerfilIdentidadesPage.tsx src/modules/profile/pages/mobilidade/PerfilMobilidadeCadastroPage.tsx src/modules/mobility/components/ActiveRideWidget.tsx src/modules/mobility/__tests__/MobilityCanonicalOnboardingRoutes.test.ts`: passou.
  - `npm test -- src/modules/mobility/__tests__/MobilityCanonicalOnboardingRoutes.test.ts`: passou com `2 passed`.
  - `node --use-system-ca ./node_modules/playwright/cli.js test tests/e2e/central/central-validation.spec.ts --project=chromium --reporter=list`: passou com `28 passed`, `1 skipped` condicional de service role.

## Atualizacao 2026-05-11 (P0 Rotas/SEO - Empresas, Gastronomia e Comunidade)

- Consolidada navegacao runtime de empresas/gastronomia para `businessManagementRoutes`:
  - redirecionamento legado de empresa em `AppRoutes`;
  - `BusinessAdminGuard`;
  - `useAppUrls().profile.businesses`;
  - `BusinessUrlService.buildUrls().dashboard`;
  - `useBusinessUrls().dashboard`;
  - links operacionais de pedido em notificacoes, trust e checkout premium.
- Mantido SSOT de motoboy via `mobilityRoutes`, inclusive no redirect legado de entregas.
- Corrigida falha real de SEO em rota comunitaria duplicada de vagas: `VagasPublicLayout` deixa de emitir SEO proprio quando renderizado dentro de `/comunidade/...`, evitando sobrescrever o `noindex, follow` do shell comunitario.
- Fortalecido `CommunityTerritorialShell` para sincronizar canonical/robots a partir de `resolveSeoPolicy`, mantendo a comunidade como fonte de SEO para rotas duplicadas embutidas.
- E2E territorial ajustado para aguardar `domcontentloaded` e polling de head com margem real de SPA, sem alterar as assercoes de canonical/noindex.
- Limpeza complementar: removidos trailing spaces/linhas extras de EOF apontados por `git diff --check` em arquivos ja modificados no worktree.
- Validacoes apos correcao:
  - `npm run typecheck`: passou.
  - `npx eslint` nos arquivos tocados de rota/SEO: passou.
  - `npm test -- src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts src/modules/business/premium/pages/PremiumBusinessCheckoutPage.spec.tsx`: passou com `12 passed`.
  - `node --use-system-ca ./node_modules/playwright/cli.js test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: passou com `8 passed`.
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` condicional de service role.



## Atualizacao 2026-05-11 (Gate Core Revalidado + Higiene de Docs)

- Revalidacao tecnica concluida sem regressao:
  - `npm run validate:phase:core`: passou com `55 passed`, `1 skipped` (skip administrativo condicional por `SUPABASE_SERVICE_ROLE_KEY`).
- Higiene estrutural aplicada em documentacao viva:
  - `docs/STATUS_ATUAL.md` sanitizado para remover bytes nulos (`\0`) e manter leitura por tooling (`rg`, validadores e auditoria automatica).
- Proximo passo P0 em execucao:
  - continuar fechamento de pendencias residuais de Comunidade/Feed + SEO/canonical em producao, mantendo Fase C ativa ate zerar pendencias criticas.

## Atualizacao 2026-05-12 (P0 Comunidade - Saneamento de Detalhe Achados/Perdidos)

- Hardening aplicado no fluxo de detalhe de Achados/Perdidos em `core`:
  - `src/core/community/pages/AchadoPerdidoDetailPage.tsx` foi sincronizado com a implementacao canonica de `modules`, removendo regressao de encoding/mojibake em textos e estados visiveis da tela.
  - O detalhe continua usando servico/layer SSOT (`lostFoundService`) e componentes canonicos de localizacao (`LostFoundMiniMap`, `LostFoundLocationCard`).
- Validacoes executadas apos o ajuste:
  - `npm run typecheck`: passou.
  - `npx eslint src/core/community/pages/AchadoPerdidoDetailPage.tsx`: passou.
  - `npx playwright test tests/e2e/community-territorial-operational.spec.ts tests/e2e/community-social-seo.spec.ts --project=chromium --reporter=list`: passou com `5/5`.

## Atualizacao 2026-05-12 (P0 Comunidade - Saneamento de Recomendacao Detail em Core)

- Saneamento seguro aplicado em `src/core/community/pages/RecomendacaoDetailPage.tsx`:
  - Correcoes de encoding/mojibake em textos e comentarios visiveis.
  - Sem alteracao de regra de negocio, filtros territoriais ou permissao.
- Validacoes executadas:
  - `npm run typecheck`: passou.
  - `npx eslint src/core/community/pages/RecomendacaoDetailPage.tsx`: passou.
  - `npx playwright test tests/e2e/community-social-seo.spec.ts --project=chromium --reporter=list`: passou com `2/2`.

## Atualizacao 2026-05-12 (P0 Comunidade - Saneamento de Achados/Evento em Core)

- Saneamento de UX aplicado sem alterar regra territorial:
  - `src/core/community/pages/AchadosPerdidosPage.tsx`: textos/emoji/comentarios corrigidos (mojibake removido), mantendo filtros e `territoryFilter` atuais.
  - `src/core/community/pages/EventoDetailPage.tsx`: encoding corrigido e alinhamento SSOT para `EventsService` canonico de `modules/community/events`.
- Validacoes executadas:
  - `npm run typecheck`: passou.
  - `npx eslint src/core/community/pages/EventoDetailPage.tsx src/core/community/pages/AchadosPerdidosPage.tsx`: passou.
  - `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: passou com `8/8`.

## Atualizacao 2026-05-12 (P0 Comunidade - Hardening E2E Territorial/SEO)

- Estabilizacao dos specs de comunidade sem afrouxar regra:
  - `tests/e2e/community-territorial-operational.spec.ts`: `open()` agora usa `domcontentloaded`, remove banner de consentimento quando presente e valida resolucao com caminho comunitario + landmark/conteudo.
  - `tests/e2e/community-social-seo.spec.ts`: `openRoute()` passou a aguardar `domcontentloaded` e fechar consent banner para evitar falso negativo de canonical/robots.
- Resultado:
  - `npx playwright test tests/e2e/community-territorial-operational.spec.ts tests/e2e/community-social-seo.spec.ts --project=chromium --reporter=list`: passou com `5/5`.
  - `npm run typecheck`: passou.

## Atualizacao 2026-05-12 (P0 Mobilidade - Tracking URL Canonica No Motor Operacional)

- Hardening SSOT aplicado em `src/modules/mobility/core/RideOperationalService.ts`:
  - Notificacoes de transicao operacional para passageiro deixaram de montar `"/mobilidade/buscando/${rideId}"` manualmente.
  - Agora usam `mobilityRoutes.passageiro.buscando(rideId)` como fonte canonica unica de rota.
- Anti-regressao adicionada em `src/modules/mobility/__tests__/MobilityCanonicalOnboardingRoutes.test.ts`:
  - Garante presenca do helper canonico e bloqueia retorno de template string hardcoded da rota.
- Validacoes executadas nesta etapa:
  - `npx vitest --run src/modules/mobility/__tests__/MobilityCanonicalOnboardingRoutes.test.ts`: passou com `3 passed`.
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou em 2026-05-12 com `56 passed`, `1 skipped` (skip admin condicional por `SUPABASE_SERVICE_ROLE_KEY`).

## Atualizacao 2026-05-12 (P0 Delivery - Guard Anti-Regressao Da Tabela Legada)

- Novo teste de contrato SSOT criado em `src/modules/mobility/delivery/__tests__/DeliverySSOTGuard.test.ts` para bloquear reintroducao de acesso real a `delivery_requests` no fluxo ativo de delivery.
- O guard audita os pontos canonicos (`OrderDeliverySSOTService`, `OrderDeliveryLinkService`, checkout de gastronomia e `DeliveryManagementPage`) e exige manutencao do fluxo via `ride_requests`/motoboy.
- Validacoes executadas:
  - `npx vitest --run src/modules/mobility/delivery/__tests__/DeliverySSOTGuard.test.ts src/modules/mobility/__tests__/MobilityCanonicalOnboardingRoutes.test.ts`: passou com `4 passed`.
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.

## Atualizacao 2026-05-12 (P0 Mobilidade - Matriz De Notificacao Operacional Auditavel)

- Hardening aplicado em `src/modules/mobility/core/RideOperationalService.ts` para trilha de notificacoes operacionais:
  - Metadata de notificacao agora inclui `ride_id`, `state`, `event`, `audience` e `ride_mode` (corrida comum ou motoboy).
  - Cancelamentos agora usam evento semantico por ator (`ride_canceled_by_driver` / `ride_canceled_by_passenger`) em vez de evento generico unico.
  - Mantido SSOT de rota canonica por helper (`mobilityRoutes.passageiro.buscando(rideId)` e rotas centrais de motorista/motoboy).
- Anti-regressao adicionada em `src/modules/mobility/__tests__/MobilityOperationalNotificationsSSOT.test.ts`.
- Validacoes executadas nesta etapa:
  - `npx vitest --run src/modules/mobility/__tests__/MobilityOperationalNotificationsSSOT.test.ts src/modules/mobility/__tests__/MobilityCanonicalOnboardingRoutes.test.ts src/modules/mobility/delivery/__tests__/DeliverySSOTGuard.test.ts`: passou com `5 passed`.
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou em 2026-05-12 com `56 passed`, `1 skipped` (skip admin condicional por `SUPABASE_SERVICE_ROLE_KEY`).

## Atualizacao 2026-05-12 (P0 Governanca De Docs - Limpeza Estrutural Da Raiz)

- Executado pente-fino de documentacao obsoleta na raiz de `docs/` sem apagar historico:
  - `108` arquivos de analise/refatoracao/sessao/progresso/resumo foram movidos para `docs/historico/root-markdown-2026-05-cleanup/`.
  - Politica de navegacao atualizada em `docs/README.md` e `docs/INDEX_CANONICO.md` apontando o novo lote historico.
  - `docs/audits/AUDITORIA_DOCS_OBSOLETOS.md` atualizado com marcacoes de concluido parcial da limpeza.
- Objetivo cumprido: reduzir ruido de SSOT e impedir que snapshot antigo concorra com `docs/STATUS_ATUAL.md`.

## Atualizacao 2026-05-12 (P0 Frontend + E2E Admin Mobilidade)

- Frontend foi revalidado com foco em responsividade e fluxo operacional real:
  - `tests/e2e/mobile-core-layout.spec.ts` + `tests/e2e/mobile-auth-dashboards.spec.ts` passaram com `7/7` (360px, landing/cadastro/servicos e dashboards centrais de empresa/motorista/motoboy).
- Auditoria E2E da Central de mobilidade foi endurecida em `tests/e2e/central/central-validation.spec.ts`:
  - Assert administrativo agora aceita rotas canonicas de passageiro/motoboy/motorista.
  - Notificacoes auditadas por metadata semantica (`audience`, `ride_mode`) e eventos de cancelamento por ator quando presentes.
- Validacoes executadas nesta etapa:
  - `node --use-system-ca ./node_modules/playwright/cli.js test tests/e2e/central/central-validation.spec.ts --project=chromium --reporter=list`: passou com `28 passed`, `1 skipped` condicional de service role.
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.

## Atualizacao 2026-05-12 (P0 Contrato Trust/Notificacao - Hardening Anti-Regressao)

- Teste SSOT de gastronomia endurecido em `src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts`:
  - Agora exige metadados de audiencia em notificacoes transacionais de delivery (`customer`, `merchant`, `courier`).
  - Agora exige metadados de audiencia na trilha trust (`subject`, `actor`, `admin`) com links canonicos ja validados.
- Validacoes executadas:
  - `npm test -- src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts`: passou com `11 passed`.
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou em 2026-05-12 com `56 passed`, `1 skipped` (skip admin condicional por `SUPABASE_SERVICE_ROLE_KEY`).

## Atualizacao 2026-05-12 (P0 Governanca Docs - Validador Automatico De Links Vivos)

- Criado validador automatizado de links dos documentos vivos:
  - Script: `scripts/validate-doc-live-links.ts`
  - Comando: `npm run validate:docs-live-links`
- Escopo do validador:
  - `docs/README.md`
  - `docs/INDEX_CANONICO.md`
  - `docs/DOCUMENTATION_INDEX.md`
  - `docs/STATUS.md`
  - `docs/VALIDACAO_FINAL_E_PROXIMOS_PASSOS.md`
- Objetivo: impedir regressao de navegacao/documentacao apos limpeza de docs e movimentacoes para historico.
- Validacoes executadas:
  - `npm run validate:docs-live-links`: passou.
  - `npm run typecheck`: passou.
  - `npm run lint`: passou.
  - `npm run validate:phase:core`: passou em 2026-05-12 com `56 passed`, `1 skipped` (skip admin condicional por `SUPABASE_SERVICE_ROLE_KEY`).



## Atualizacao 2026-05-12 (Correcao Definitiva de Rotas Comunitarias Area + SEO)

- Rotas comunitarias duplicadas de modulo deixaram de usar redirecionamento (`Navigate`) e passaram a renderizar no `CommunityTerritorialShell`, preservando URL comunitaria para SEO canonico:
1. distrito: `/comunidade/:state/:city/:territorySlug/:modulo`
2. area: `/comunidade/:state/:city/area/:groupSlug/:modulo`
- Redirecionamento legado que colapsava `area/:groupSlug` para `:territorySlug` foi removido do runtime.
- Rotas de area foram explicitamente expandidas para `feed`, `grupos`, `alertas`, `problemas`, `achados-e-perdidos` e modulos duplicados (`empresas`, `servicos`, `classificados`, `gastronomia`, `vagas`, `eventos`, `mapa`, `mobilidade`).
- Validacoes executadas apos a correcao:
1. `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: passou (9/9).
2. `npm run validate:phase:core`: passou com `56 passed`, `1 skipped` esperado.
3. `npm run validate:docs-live-links`: passou.
- Resultado: canonical/noindex voltou a ficar consistente em cidade, bairro e area sem rota hardcoded e sem paliativo.

## Atualizacao 2026-05-12 (Hardening SSOT de Notificacoes Operacionais)

- Cobertura unitária adicionada para notificacoes transacionais do fluxo de pedidos:
1. `src/modules/mobility/delivery/__tests__/OrderDeliveryNotificationService.spec.ts`.
2. Valida audiencia (`customer|merchant|courier`) em metadata.
3. Valida URLs de acao canonicas por persona (`/gastronomia/pedidos/:orderId`, `/central/empresas/:businessId/gastronomia/pedidos/:orderId`, `/central/motoboy/entregas`).
4. Valida evento de cancelamento por cliente com tipo `warning` e contexto de evento preservado.
- Validacoes executadas:
1. `npm test -- src/modules/mobility/delivery/__tests__/OrderDeliveryNotificationService.spec.ts`: passou (2/2).
2. `npm run validate:phase:core`: passou com `56 passed`, `1 skipped` esperado.
