# Achegue-se — Execução `main`-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Data do checkpoint GitHub:** 2026-09-24  
**Repositório:** `washingtonmsdj/acheguese`  
**Linha ativa:** `main`  
**Baseline operacional auditada:** `main@f6968c3c90bfe1a1ca698cab50d63456167a9333` (merge de #356). Este checkpoint registra o estado do código; não promove um novo release. Qualquer merge posterior gera outro SHA e exige nova prova exact-SHA antes de promoção.

Este documento consolida ordem de execução, blockers e Definition of Done. Ele é um **registro operacional**, não uma fotografia autoritativa do que existe no produto. A fonte de verdade para decidir o que existe, o que está ativo e o que deve ser corrigido é sempre o **projeto real**: código da `main`, rotas, owners, serviços, schema/migrations, contratos, testes, deploy/runtime e comportamento observado.


## Estado operacional atual — 2026-09-23

- `main` auditada: `ab7b4c6ccb8ead82388dd5862aa99e654a6dfe19` (merge de #350);
- #327 / #325 removeu módulos pausados da árvore pública ativa, criou `activeLazyImports.ts` e fez URLs públicas sem owner ativo caírem no 404 canônico;
- o head `fa747aa7c877d7a086b92277940681a27abba844` de #327 passou Dependency Lock, Security Check/Scan, Auth Concept, Visual Regression, SSOT Territorial, Heavy exact-SHA e SSOT Enforcement antes do merge;
- #329 — Central active-only integrado: `/central/*` monta somente Business/Empresas + infraestrutura via `activeCentralLazyImports.ts`; módulos pausados ficam fora do grafo e URL sem owner cai no 404 canônico;
- #330 — `centralLazyImports.ts` aposentado após censo provar ausência de caller runtime; ratchets agora preservam owners físicos/lifecycle em vez de barrel artificial;
- #331 — `CommunityTerritoryRoutes.tsx` aposentado após censo provar ausência de caller runtime; builders canônicos de URL e owners Community permanecem preservados nos bounded contexts;
- #333 integrado — `src/app/routes/lazyImports.ts` e a cadeia órfã `TerritorialModulePages.tsx` → `launchPausedComponent.ts` → `LaunchPausedPage.tsx` foram aposentados; ratchets agora preservam owners físicos/lifecycle e impedem recriação do grafo morto; `activeLazyImports.ts` + `ActiveTerritorialModulePages.tsx` permanecem como boundaries públicos ativos;
- #337 integrado — Perto de mim passou a tratar a rota territorial como autoridade canônica, preservando contexto de território/grupo e boundaries de Business;
- #338 integrado — sugestões da Busca agora são derivadas somente de providers lifecycle-enabled; módulos pausados deixaram de ser promovidos por sugestões hardcoded;
- #339 integrado — o preview de mapa da Busca preserva a URL canônica de Business já produzida pelo Search Core no CTA destacado;
- #341 integrado — pins de resultados da Busca passaram a executar navegação real; Business delega ao owner canônico e não reconstrói URL no mapa;
- #342 integrado — pins do mini-mapa de Perto de mim passaram a abrir `business.canonicalUrl`, alinhando card e mapa ao mesmo owner público;
- #343 integrado — o hero/mapa de Empresas agora respeita `filteredBusinesses` inclusive quando o resultado é zero, sem reexibir silenciosamente a coleção não filtrada;
- #350/#351 foram reavaliados: pausar Notificações por causa do recorte de verticais misturava capability horizontal com módulo de produto. O PR #353 corrige essa classificação, reativa Notificações e preserva os verticais pausados fail-closed;
- os heads finais de #337, #338, #339, #341, #342 e #343 passaram os gates aplicáveis de unit/runtime, lint/typecheck, arquitetura, segurança, E2E público, Regression, Heavy exact-SHA e SSOT Enforcement antes dos respectivos merges; isso certifica os PRs, mas não substitui prova pós-merge/deploy/smoke do SHA atual da `main`;
- o blocker de release autenticado continua #305: o broker remoto está alinhado ao source e recebe OIDC válido, mas o upstream Supabase/Auth segue reproduzindo `503 auth_upstream_unavailable` / connection timeout; #309 continua separado como autoridade de deploy de Edge Functions. Nenhum merge herda certificação anterior: a `main@7a749254...` precisa de sua própria prova exact-SHA de deploy + smoke antes de promoção.

### Evidência pós-#333 — exact-main `42d91ea...`

- Vercel: **success** no mesmo SHA;
- release identity: **exact**, deployed SHA = expected SHA = `42d91ea9454de0fe8c3250cc75d230cb1bceeb9c`;
- SSOT Enforcement: **success**;
- Heavy exact-main: **success**;
- SSOT Territorial: Phase Core, Runtime, E2E público e Regression **success**;
- smoke autenticado: **failure externa #305**, com quatro cenários interrompidos no broker por `HTTP 503 [auth_upstream_unavailable]` antes de validar as superfícies privadas;
- run territorial: `35918986268`, job autenticado: `107377764638`;
- logs Supabase da mesma janela: 504 em Auth token + 522 em múltiplas APIs PostgREST, provando indisponibilidade upstream mais ampla que o frontend.

### Blockers atuais do primeiro release

1. **#305 — indisponibilidade ampla do data plane Supabase:** o projeto canônico aparece `ACTIVE_HEALTHY`, porém no smoke exact-main `/auth/v1/token` produziu 12 × HTTP 504 e múltiplas rotas PostgREST independentes produziram HTTP 522 com ~19–20 s de origin time. O broker OIDC v3 recebe corretamente `repo:washingtonmsdj/acheguese:ref:refs/heads/main` e retorna `503 auth_upstream_unavailable` porque o upstream falha; consulta SQL simples também expira. Investigar infraestrutura/Observability/Supabase antes de alterar app. Não mascarar com retry/timeout maior, fallback, redirect, troca de fixture, RLS alternativo ou bypass OIDC.
2. **#309 — autoridade automática de deploy Supabase:** o PAT do GitHub Actions recebe 403 ao atualizar Edge Functions. Rotacionar o secret para PAT scoped com `Edge Functions: Read-write` / `deploy_edge_function`; não usar `service_role` como substituto.
3. **Exact-SHA pós-merge:** qualquer mudança, inclusive documentação, gera novo candidato. Security/lint/typecheck/tests/build/E2E/deploy/smoke precisam pertencer ao mesmo SHA final.

O incidente antigo de hosted runners com jobs vazios foi encerrado no issue #17. O diagnóstico mais recente de alocação intermitente permanece rastreado em #89 e não autoriza workaround de workflow; os PRs #342 e #343 receberam runner real e concluíram Heavy exact-SHA com sucesso. O blocker comprovado do release autenticado continua #305, com #309 separado para autoridade automática de deploy Supabase.


## Corte de lançamento MVP — 2026-09-19

Este corte substitui, para fins de **prioridade de lançamento**, a ordem histórica de certificação por módulo. O objetivo imediato é colocar no ar um MVP verificável, pequeno e seguro no território de lançamento, sem exigir que módulos deliberadamente pausados sejam concluídos antes do primeiro release público.

### Escopo público do candidato

A decisão definitiva de release de **2026-09-21** separa domínio de produto e capabilities horizontais:

- **Domínio ativo:** Empresas/Business;
- **Capabilities ativas:** Mapa, Perto de mim, Busca, Mensagens e Notificações;
- **Plataforma ativa:** Auth, Perfis/Conta, Território, Localização, Central, segurança, storage e observabilidade.
- **Regra de lifecycle:** pausar um vertical não pausa automaticamente uma capability horizontal. Notifications permanece ativa para Conta/Business e futuros providers; módulos verticais continuam isolados individualmente.

Mensagens é horizontal e, no MVP, registra **somente Business Direct Messaging**. Classificados e Community preservam seus agregados, mas não entram na Inbox enquanto seus domínios estiverem pausados.

O lifecycle canônico pertence a `productModuleRegistry.ts` + `platformCapabilityRegistry.ts`, avaliados por `lifecycleRegistry.ts`. `launchScope.ts` é apenas compatibilidade derivada. Superfícies administrativas são compostas por `adminSurfaceScope.ts`, que herda esses registries e não mantém uma segunda lista de módulos pausados. A Central privada segue o mesmo fail-closed: somente Business/Empresas e infraestrutura ativa podem integrar seu grafo runtime; módulos pós-MVP não recebem rota/placeholder privado.

Ficam explicitamente **pós-MVP**, preservados e isolados até trabalho/certificação individual: Comunidade, Gastronomia, Serviços profissionais, Classificados, Pontos Turísticos, Educação, Vagas/Oportunidades, Eventos, Comunicação territorial, Mobilidade, Cupons, Gamificação, Analytics público, Alertas, Issues, Achados e Perdidos, Safety familiar e Billing.

A regra de modularidade é fail-closed: pausar um módulo no registry remove sua navegação, suas rotas públicas e seus loaders/discovery ativos. No shell público, módulo `paused` não possui `<Route>` nem placeholder; o owner permanece apenas no bounded context pós-MVP. Reativação futura deve ocorrer pelo owner canônico e suas dependências, nunca por redirect, alias ou exceção local.

O primeiro release continua territorial. **Cobertura uniforme dos 170 bairros de Salvador não é critério do MVP**; expansão municipal e rollout bairro a bairro ficam para depois da estabilização do território inicial.

### Regras permanentes antes do release

- manter convergência Git ↔ Supabase/runtime e o ledger de migrations já fechado;
- manter LGPD destrutivo fail-closed enquanto purge/export não estiverem certificados;
- manter módulos pausados fora de navegação, rotas funcionais, prefetch, discovery, providers e loaders ativos;
- não aceitar mocks conceituais, aliases ou redirects como substituto de owner/rota canônicos;
- promover somente o SHA que tiver deploy real e smoke do mesmo commit.

### Correções de gate identificadas neste corte

- [x] `tools/release/verify-deploy-ready.mjs` já reconhece o `buildCommand` canônico `node tools/release/run-vercel-production-build.mjs`, alinhado a `vercel.json`. Não manter este item como blocker.
- [x] `tests/e2e/launch-scope-public.spec.ts` e `tests/architecture/launch-scope-e2e-alignment.test.ts` foram realinhados ao corte definitivo de 2026-09-21: Business/Empresas é o domínio ativo; Mapa, Perto de mim, Busca e Mensagens são capabilities horizontais ativas; os demais domínios públicos devem render isolamento de lançamento.

### Progresso consolidado do corte público — 2026-09-19

- [x] Corte MVP definitivo de 2026-09-21: `productModuleRegistry.ts` mantém Business como domínio ativo; `platformCapabilityRegistry.ts` mantém Map/Nearby/Search/Messaging e infraestrutura transversal; `nearby` depende de Map + Location + Business; Messaging usa apenas provider Business no MVP.
- [x] Home, Busca e perfil profissional público deixaram de aceitar dados `concept-mock` no runtime.
- [x] Pontos Turísticos deixou de exibir proximidade simulada.
- [x] Eventos pagos falham fechado enquanto não há checkout habilitado; inscrições gratuitas continuam no fluxo real.
- [x] Upsells Premium foram retirados das superfícies públicas enquanto Billing permanece pausado.
- [x] Gastronomia removeu rotas/telas `concept-mock` do roteador normal e consolidou checkout/rastreamento nas implementações reais.
- [x] Central/Business removeram o bypass DEV por `?concept-mock=1`; previews de gestão e mocks de Motoboy sem caller foram aposentados do runtime e do lazy barrel.
- [x] Conta e Mensagens não possuem mais bypass DEV de `ProtectedRoute`; perfis/conversas demonstrativos foram removidos do runtime.
- [x] Mensagens usa perfis da sessão e threads persistidas, limpa estado privado ao trocar perfil e não exibe controles sem ação real.
- [x] O E2E de launch scope mantém `communityCommunication=false` e prova fail-closed para Community enquanto Messaging horizontal permanece independente e ativo com provider Business.
- [x] Cadastro de interesse deixou de sintetizar identidade de e-mail e aceita telefone como canal real quando aplicável (PR #221; migration remota `20260920012056_allow_phone_only_community_interest_mvp`).
- [x] Novas solicitações automáticas de exclusão de conta ficam fail-closed no MVP: rollout certificado + flag de ambiente são obrigatórios, a UI direciona ao canal DPO e o `PrivacySettingsService` bloqueia callers diretos; solicitações antigas continuam visíveis/canceláveis sem promessa de purge automático.
- [x] Empresas R4 parcial: a vitrine filtra categorias de módulos pausados antes de qualquer derivação visual; probe remoto rollback-only provou `public_business_search` → `get_public_business_snapshot_by_slug` → URL canônica com dado real do território de lançamento. Browser E2E/deploy same-SHA seguem pendentes por infraestrutura. Ver `checkpoints/2026-09-21-business-mvp-public-flow.md`.
- [x] Business discovery R4 parcial: Busca, Home, Mapa, Perto de Mim e busca espacial/IA agora herdam o launch scope de categorias; probe remoto mostrou 7/7 resultados espaciais brutos como `educacao` no recorte do launch cluster, confirmando o vazamento corrigido. Ver `checkpoints/2026-09-21-business-discovery-launch-boundary.md`.
- [x] Serviços R4 parcial: todo profissional público agora precisa de slug roteável; o único legado foi backfillado, `public_professional_search` falha fechado, RLS positiva/negativa foi provada em rollback e `profile-rpc` remoto v20 está equalizado ao source. Ver `checkpoints/2026-09-21-professional-mvp-public-flow.md`.
- [x] Higiene de dados MVP: fixtures persistentes de Business/Professional foram retiradas das superfícies públicas sem apagar dados; escolas foram preservadas como dataset real declarado e continuam sob `education=false`. Ver `checkpoints/2026-09-21-synthetic-public-fixture-quarantine.md`.
- [x] O fluxo público de Vagas não mantém mais writer oculto para `highlightType="premium"` enquanto Billing está pausado (PR #223).
- [x] Snapshots de produto já classificados como históricos (`DEMO-READY`, `PROJECT-HEALTH-REPORT`, `PROJECT-SCORE`) saíram da árvore documental ativa e foram preservados em `docs/10-archive/product/` (PR #224).
- [x] Tipos Supabase foram revalidados no SHA auditado: Git e runtime têm 731731 caracteres normalizados e `exact=true`.
- [x] O Supabase canônico mantém 60 Edge Functions implantadas e as 60 estão `ACTIVE`; as funções versionadas mas deliberadamente não implantadas continuam sujeitas ao rollout/authority próprio.
- [~] Reconciliação de migrations avançou no PR #225 sem executar DDL. Após Safety G71/G72/G75–G80, o estado chegou a 683 locais, 666 remotas, 657 exatas, 26 local-only e 9 remote-only.
- [x] CI hospedado está operacional e executa steps/logs reais; o incidente #17 foi encerrado. PRs #310–#316 fecharam gates reais, e a `main` `4452f686...` mantém Security/Heavy/SSOT Enforcement verdes.
- [x] Vercel publicou a `main` `4452f686...` com status `success`; o blocker de release não é mais build/deploy público, e sim a sessão autenticada real (#305).
- [~] O ledger de migrations avançou sem executar DDL: G71/G72/G75–G80 foram alinhadas às oito identidades `reconcile_*` realmente registradas no Supabase após prova de equivalência token-a-token. Estado daquela etapa: 683 locais / 666 remotas / 657 exatas / 26 local-only / 9 remote-only.
- [~] Quatro identidades adicionais de Mobilidade foram alinhadas após prova token-a-token: `remove_provisional_mobility_fare_floor`, `persist_mobility_cancellation_reason`, `enforce_server_owned_mobility_quotes` e `require_explicit_mobility_quote_id`. O bloco de preço terminal da entrega não foi alterado porque o SQL remoto é materialmente diferente.
- [~] A cadeia terminal de entrega foi reconciliada como uma sequência de três migrations remotas canônicas (`make_delivery_final_price_server_owned`, `restore_atomic_delivery_completion_with_server_owned_price`, `ignore_client_final_price_in_delivery_wrapper`). Ao fim dessa etapa restavam apenas G42/G43 como remote-only; este corte fecha essas duas identidades.
- [x] G42 e G43 phase 1 territoriais foram retiradas de `migrations-pending` e promovidas às identidades reais do ledger após equivalência token-a-token; os quatro Edge territoriais auditados estão `ACTIVE` com `verify_jwt=true`. G43 phase 2 permanece pendente porque o frontend ainda usa o writer compatível.
- [x] Business/Mapa G154 foi promovido ao runtime: índices de `public_business_search` existem e as RPCs espaciais não consultam mais a relação legada inexistente `businesses`; o trigger de signup agora honra o @ escolhido.
- [x] Eventos voltou a ter persistência canônica de itens salvos: `event_saved_items` foi criado com RLS forçada, policies own-only e o registry de `ProfileSavedEntityService` deixou de apontar para `event_favorites` já aposentado.
- [x] G36/G37 foram promovidos após dry-run: RPCs legados de Perfil foram removidos sem `CASCADE`, e os brokers profissionais passaram a rejeitar cobertura textual legada também no boundary SQL.
- [x] Ledger de migrations fechado: **673 locais ativas / 673 remotas / 673 exatas / 0 local-only / 0 remote-only**. Os 13 SQLs não aplicados de Mobilidade foram preservados como pending, coerente com `PUBLIC_LAUNCH_SURFACES.mobility=false`.
- [x] O Heavy automático de PR foi migrado para `windows-latest`, preservando provenance, exact-SHA, LGPD/security contracts, arquitetura MVP e E2Es. O workflow manual self-hosted continua disponível como caminho especial, mas não é requisito para certificar PRs do próprio repositório.
- [x] Canal DPO público revalidado: `submit-dpo-request` está ACTIVE, com origin/rate-limit/honeypot/Turnstile fail-closed; testes DPO foram realinhados às migrations canônicas e `.env.production` agora declara a `VITE_TURNSTILE_SITE_KEY` exigida pelo gate. O `admin-privacy-rpc` remoto ainda está em v3 sem o fallback de paginação da `main`, pendente do rollout self-hosted autorizado.
- [x] O publisher de tipos Supabase não escreve mais diretamente na `main`: `supabase-types-sync.yml` usa a branch `automation/supabase-types-sync`, cria/atualiza PR, dispara Security/SSOT gates e o ratchet `supabase-types-sync-pr-authority.test.ts` impede regressão.
- [x] O gate de deploy legal foi endurecido: `VITE_LEGAL_FORUM` tornou-se obrigatório, `VITE_CONTACT_EMAIL`/`VITE_DPO_EMAIL` precisam ter formato válido e `VITE_PUBLIC_SITE_URL` precisa usar HTTPS; o ratchet DPO protege esse contrato.
- [x] Flags de produção foram reconciliadas ao launch scope comunitário: `VITE_FEATURE_COMMUNITY_ALERTS=false` e `VITE_FEATURE_COMMUNITY_ISSUES=false`; o ratchet de rotas exige que Alertas/Problemas permaneçam pausados até certificação.
- [x] Vagas/Eventos foram revalidados também no runtime remoto: ambos estão sem dados fictícios e com empty state real. Eventos agora separa falha de leitura de lista vazia por `getEventsStrict()` + retry; Vagas não promete candidatura no SEO quando `total=0`.
- [ ] A prova de build/deploy/smoke do mesmo SHA continua blocker real de release.


### Higiene de branches — 2026-09-19

- o remoto possuía 152 branches no início da auditoria e passou a 153 após os cortes recentes, com `delete_branch_on_merge=false`; esse setting explica o acúmulo após squash merge;
- 74 branches são heads intactos de PRs já mergeados e 3 branches sem PR estão completamente contidas na `main`: **77 são candidatas seguras à remoção física do ref**;
- 72 branches sem PR mergeado conhecido ainda possuem commits exclusivos; duas branches alteradas depois de merge (`cleanup/active-compat-facades-20260919` e `codex/identidade-visual-achegue-se`) também carregam delta exclusivo. Preservar todas até prova de supersessão;
- `cleanup/active-compat-facades-20260919` foi alterada após o PR mergeado e mantém delta adicional; preservar até análise específica;
- não reutilizar branch apenas para reduzir contagem quando ela estiver divergida da `main`: no checkpoint atual, `work/mvp-urgent` está 45 commits à frente e 79 atrás da `main`, com delta exclusivo; preservar até reconciliação própria. Trabalho urgente novo deve partir do SHA exato da `main` quando a branch existente não puder ser comprovadamente reutilizada sem carregar histórico/delta estranho;
- regra: branch só pode ser apagada automaticamente quando o PR correspondente foi mergeado e o head não foi alterado depois, ou quando a branch é comprovadamente contida na `main`; demais casos exigem comparação de conteúdo/provenance.
- a integração GitHub disponível neste chat não expõe `DELETE ref` nem alteração de `delete_branch_on_merge`; portanto não mascarar a limpeza movendo refs antigas para `main`. A exclusão física deve usar GitHub CLI/API autenticada ou autoridade administrativa equivalente, aplicando a classificação segura já registrada.
- [x] `tools/github/cleanup-merged-branches.mjs` + `npm run maintenance:branches` materializam essa política: dry-run por padrão, `--apply` explícito, revalidação de SHA/proteção/PR aberto antes de cada DELETE e novo compare para branches classificadas por contenção. Checkpoint: `docs/08-roadmap/checkpoints/2026-09-20-branch-hygiene.md`.

### Ordem de execução até MVP

1. **R0 — congelar escopo:** nenhuma feature nova até o primeiro release; corrigir apenas blocker, regressão, segurança, dados de lançamento e qualidade necessária ao núcleo.
2. **R1 — convergência:** **fechado no ledger** (673/673 exatas); manter a igualdade de tipos e reexecutar os validadores no mesmo SHA candidato.
3. **R2 — release authority:** publisher de tipos via PR **fechado**; faltam CI realmente executando e branch protection exigindo o caminho aprovado.
4. **R3 — Auth/Privacy/Security:** fechar autenticação e superfícies sensíveis do escopo; manter delete/export destrutivos fail-closed.
5. **R4 — certificação funcional:** certificar Business + Mapa + Perto de mim + Busca + Mensagens/Business Direct Messaging, além da infraestrutura estritamente necessária ao fluxo. Busca assistida também deve respeitar o lifecycle e não executar handlers de módulos pausados.
6. **R5 — exact-SHA:** security + lint + typecheck + tests + build + E2E + deploy real + smoke do mesmo SHA.
7. **R6 — lançar MVP:** abrir somente superfícies certificadas e iniciar acompanhamento de erros/uso. Todo restante passa ao backlog durante/pós-MVP.

### Não bloqueia o primeiro release

Não usar como motivo para adiar o MVP: limpeza das 38 refs históricas remanescentes, redesign amplo, refatoração estética sem bug, cobertura de todos os bairros de Salvador, otimizações sem evidência de gargalo, Mobilidade, Educação, IA/virtual try-on, Cupons, Gamificação, Analytics público, expansão de monetização e hardening de capacidades que permaneçam comprovadamente pausadas e isoladas.

## Snapshot remoto — 2026-09-18

- Commits publicados em `main`: `7d7f1af6e` (catálogo de conceitos da outra conversa), `1778d727f` (remoção de caller frontend do RPC service-only, validação de migrations e evidências de segurança) e `7fd8aa36a` (reconciliação dos nomes de 32 migrations com o ledger remoto e anotações de autoridade).
- O deploy de produção Vercel `dpl_5GFF3fK11jgMDwyz8LN4tyU92ixM` chegou a `READY` para o SHA `1778d727fb0fca510210c5e2c42dd31a4d23e3fb`; o check Vercel passou e `https://acheguese.com.br` respondeu HTTP 200. O `build:vercel` remoto passou com 21 inputs, typecheck, lint sem erros (2 avisos conhecidos) e Vite; o pre-push `typecheck:ci` também passou.
- Os runs GitHub `35332329297`, `35332329254` e `35332329371` desse SHA falharam com `steps=[]`; o log de job retorna `log not found`. Não há evidência de etapa de código executada, portanto não contam como checks verdes.
- Testes locais focados: 96 passaram e 1 falhou ao exigir evidência externa para seis exceções vencidas no registro de segurança. Os testes novos de parser/validador passaram. `npm run validate:migrations` passou localmente.
- O ledger Supabase continua sem reconciliação completa: remoto 645 migrations, local 664 arquivos, 628 identidades exatas, 36 locais sem identidade remota e 17 remotas sem arquivo local. O commit `7fd8aa36a` apenas alinhou 32 nomes já confirmados no ledger remoto, sem reaplicar DDL; os mismatches restantes continuam bloqueados.
- A proteção de `main` permanece parcial: admins sujeitos, force-push/deleção bloqueados e resolução de conversas exigida; PR obrigatório, required checks e restrição de push seguem ausentes (#28).

Este snapshot descreve o último SHA com alteração de código; qualquer commit posterior, inclusive documental, precisa ser conferido no SHA que passar a ser o head remoto.

## Checkpoint 2026-09-09 — Mobilidade: remoção de bridges mortos e reconciliação runtime

Estado técnico anterior a este checkpoint documental: `d3490f45630f3d02117d4abe65d4473da70ca2fa`.

- [x] removido `src/modules/mobility/components/driver/DriverSettingsLayout.tsx`: re-export sem callers; o owner real permanece em `src/core/mobility/components/driver/DriverSettingsLayout.tsx`;
- [x] removido `src/modules/mobility/components/driver/ServiceAreaSettings.tsx`: wrapper sem callers; a capacidade permanece no `ServiceAreasManager` canônico;
- [x] ratchet `tests/security/mobility-driver-coverage-authority.test.ts` agora impede retorno desses bridges e do hook `useDriverServiceArea`;
- [x] runtime Supabase canônico reconfirmado `ACTIVE_HEALTHY`;
- [x] `mobility-rpc` remoto está em **v20 ACTIVE**, `verify_jwt=true`, e o source remoto é byte-a-byte igual ao arquivo versionado na `main`;
- [x] `ride_requests`: `authenticated` possui apenas `SELECT`; `INSERT/UPDATE/DELETE` continuam exclusivos de `service_role`;
- [x] `service_areas`: `anon/authenticated` possuem apenas `SELECT`; writes continuam exclusivos de `service_role`;
- [x] não existe coverage persistida em `service_areas` no snapshot atual; logo, a limpeza acima não removeu dados ou capacidade operacional;
- [x] existe rollout de Mobilidade ativo no banco para um território, mas o rollout público global continua launch-paused e **não deve ser habilitado** sem certificação completa.

**Próximo gate:** continuar a certificação de Mobilidade pela autoridade real: validar os casos positivos/negativos do broker v20 e dos commands de disponibilidade/dispatch, depois E2E operacional e smoke responsivo no mesmo SHA. Não reintroduzir wrappers em `src/modules`, writers diretos no browser ou tabelas paralelas para acelerar o gate.

## Checkpoint 2026-09-09 — Mobilidade G15: dispatch audit somente atômico

- [x] ações browser/broker obsoletas `logDispatchAttempt` e `updateLatestDispatchAttempt` removidas de `mobility-rpc`, `MobilityRpcService` e `MobilityAuditService`;
- [x] helpers genéricos `canWriteDispatchAudit` e `requireDispatchWriteAccess` removidos do broker;
- [x] migration canônica `20260909180639_retire_legacy_mobility_dispatch_audit_rpcs_g15.sql` aplicada no Supabase e versionada em Git;
- [x] `can_write_ride_dispatch_audit`, `log_ride_dispatch_attempt` e `update_latest_ride_dispatch_attempt` removidas do banco após prova de zero dependentes;
- [x] `ride_dispatch_audit` continua preservado e é escrito pelos commands server-owned atômicos de dispatch;
- [x] `mobility-rpc` remoto: **v21 ACTIVE**, `verify_jwt=true`, source remoto idêntico ao arquivo da `main`;
- [x] advisors de segurança não reportam os helpers aposentados;
- [x] ratchet de segurança atualizado para impedir retorno do caminho pré-atômico.

**Próximo gate:** revisar as autorizações genéricas restantes do broker por ação concreta, começando por resolução de entrega falha e liberação de disponibilidade. Preservar somente atores com necessidade operacional real; não criar nova authority paralela.

## Checkpoint 2026-09-09 — Dependências de produção G17: blocker de audit corrigido

- [x] causa real do último build Vercel inspecionado: `npm audit --omit=dev --audit-level=moderate` bloqueou o deploy por vulnerabilidade crítica em `maplibre-gl <= 6.4.0`;
- [x] `maplibre-gl` migrado de 5.21.1 para **6.4.1**, primeira release corrigida, com lockfile alinhado;
- [x] migração v6 aplicada de forma estrutural: imports ESM por namespace, worker Vite dedicado via `?worker&url` + `setWorkerUrl`, sem default import antigo;
- [x] resolução de imagens ausentes migrada de `styleimagemissing -> addImage` para `setMissingStyleImageResolver`, exigido pela API v6;
- [x] cópias de produção de `postcss-selector-parser` sob Tailwind/PostCSS Nested atualizadas de 6.1.2 para **6.1.4**; o 6.0.10 restante é dependência exata de tooling de desenvolvimento e fica fora do audit `--omit=dev`;
- [x] ratchets adicionados em `tests/security/maplibre-runtime-security.test.ts` e `tests/release/vercel-production-security-gate.test.mjs`;
- [ ] **certificação de build ainda não pode ser marcada verde**: o status Vercel do SHA atual respondeu `Deployment rate limited — retry in 24 hours` no plano Hobby. Isso é blocker externo de execução, não prova de compilação aprovada;
- [ ] repetir o gate de produção no mesmo SHA (ou descendente sem mudanças funcionais relevantes) quando o provider liberar novos builds.

**Regra:** não contornar o audit, não reduzir `audit-level`, não usar `npm audit fix --force` e não interpretar rate-limit do provider como aprovação de build.

## Checkpoint 2026-09-09 — Mobilidade G18/G19: fechamento terminal atômico

Problemas confirmados no código/runtime:
- `logRideStateChange` ainda permitia ao participante gerar entradas genéricas em `ride_state_audit`, embora os commands atômicos já fossem os owners reais das transições;
- `cancelPendingOffers` executava uma segunda escrita depois do cancelamento da corrida, permitindo estado terminal com oferta ainda aberta se a chamada seguinte falhasse;
- `releaseDriverAvailabilityForRide` / `DriverAvailabilityService.releaseBusy` também eram uma segunda escrita pós-transição, permitindo corrida final com motorista preso em `busy`;
- o primeiro desenho G19A revelou no probe transacional uma violação real de `check_available_requirements`: motorista online sem coordenadas não pode ser marcado `is_available=true`.

Correção de raiz aplicada:
- [x] audit genérico de estado removido do browser, broker, facade e pós-transição; o PIN mantém auditoria própria server-owned em `operational_verifications`;
- [x] `MobilityAuditService` e `RideOperationalPostTransition` removidos fisicamente após zero callers;
- [x] migration remota/versionada `20260909185003_atomize_terminal_ride_offer_invalidation_g18.sql`: estado terminal invalida `ride_offers pending/sent` na mesma transação;
- [x] `cancel_pending_ride_offers(uuid)` removida após prova de zero dependentes;
- [x] migration `20260909190551_atomize_terminal_dispatch_driver_release_g19.sql`: o transition command passou a fechar dispatch pendente e liberar ownership `busy` na mesma transação;
- [x] migration corretiva `20260909191423_fix_terminal_driver_release_availability_g19.sql`: auto-retorno para `available` exige motorista online + latitude/longitude + `last_location_update` nos últimos 5 minutos; sem GPS recente, busy é limpo e o motorista permanece `online_warming_up`;
- [x] probe real com `BEGIN/ROLLBACK` comprovou: sem GPS a transição final conclui e não publica disponibilidade; com GPS recente volta disponível; uma corrida diferente não limpa o `active_ride_id` atual; offer, dispatch e audit fecham de forma consistente;
- [x] `mobility-rpc` remoto atualizado para **v24 ACTIVE**, `verify_jwt=true`, com source do entrypoint byte-a-byte igual à `main`;
- [x] broker v24 não contém `logRideStateChange`, `cancelPendingOffers`, `releaseDriverAvailabilityForRide` nem `canAccessRideAsParticipantOrAdmin`;
- [x] migration `20260909191733_retire_terminal_driver_release_helper_g19.sql` removeu `release_driver_availability_for_ride(uuid,uuid)` depois do cutover do Edge e de prova de zero dependentes/referências;
- [x] snapshot pós-cutover: **0** corridas finais com offers abertas, **0** dispatch `pending` e **0** motoristas busy ligados a corrida final;
- [x] Gate 5 operacional agora verifica o próprio transition command, inclusive isolamento por `active_ride_id` e fluxo motoboy `delivered -> completed`;
- [x] advisors pós-DDL não registraram finding novo específico de G18/G19; `ride_state_audit` continua RLS sem policy como superfície server-owned/fail-closed.

**Estado:** G18/G19 fechados no banco e no Edge. Mobilidade permanece `PUBLIC_LAUNCH_SURFACES.mobility=false`: isto corrige autoridade/atomicidade, mas não substitui a certificação E2E/same-SHA/deploy.

**Próximo gate:** continuar a auditoria por operação concreta das funções `SECURITY DEFINER` ainda executáveis por `authenticated`, priorizando safety share, lifecycle/trust e leitura/escrita de dados de corrida. Não recriar helpers genéricos para facilitar o browser.

## Regra máxima — projeto primeiro, documentação depois

Esta regra é obrigatória para qualquer IA/agente que continuar o Achegue-se:

1. **não decidir remoção, adiamento, escopo ou arquitetura apenas lendo docs**; antes de qualquer decisão estrutural, inspecionar o código e o estado real do projeto;
2. docs podem estar desatualizadas, incompletas ou obsoletas; quando houver conflito, **o projeto implementado + evidência de runtime + direção explícita do produto prevalecem**, e a documentação deve ser corrigida para refletir a realidade;
3. uma feature, módulo, fluxo ou integração **não pode ser removido simplesmente porque está quebrado, incompleto, pausado ou com teste falhando**;
4. se a feature faz sentido no produto, já possui implementação relevante e continua coerente com a visão do Achegue-se, a ação padrão é **investigar → corrigir causa raiz → consolidar owner/SSOT → testar → certificar**;
5. `launch-paused`, feature flag `false`, fallback ou indisponibilidade temporária são **gates de segurança/release**, não marcações de código descartável;
6. não usar "MVP" como justificativa para amputar capacidades já construídas e coerentes; o MVP deve organizar e estabilizar o que é necessário, não destruir trabalho válido;
7. remoção é permitida para **legado real**, duplicação, compatibility bridge, owner substituído ou implementação comprovadamente sem função no produto — e somente depois de migrar callers/estado necessários e provar que o caminho canônico preserva a capacidade;
8. quando uma implementação antiga e uma nova concorrem, **preservar a capacidade funcional**, escolher/consolidar o owner correto e então retirar apenas a duplicação/legado;
9. nunca "corrigir" o sistema apagando uma feature só para fazer build/test passar;
10. depois de cada decisão relevante, atualizar este arquivo para que a documentação passe a refletir o projeto — nunca o contrário.

### Evidência mínima antes de classificar algo como legado

Antes de remover qualquer feature, módulo, rota, serviço, tabela, RPC ou integração, comprovar no mínimo:

- callers/imports e rotas reais;
- owner canônico atual e possível duplicação;
- uso em serviços/hooks/pages/Edge Functions;
- dependências de schema/migrations/RLS quando houver;
- testes/contratos associados;
- impacto no fluxo de usuário e na visão do produto;
- existência de substituto funcional equivalente quando aplicável.

**Ausência em documentação não é evidência de legado. Falha de runtime não é evidência de legado. `launchScope=false` não é evidência de legado.**

## Checkpoint 2026-09-09 — Mobilidade / Central: SSOT e prova operacional

A retomada do primeiro módulo da ordem de certificação fechou regressões estruturais antes de qualquer tentativa de habilitar o rollout:

- [x] rota legada `/create-driver` removida novamente do roteador ativo;
- [x] teste anti-regressão de onboarding corrigido para inspecionar o owner real `src/app/routes/sections/AppLayoutRoutes.tsx`, em vez do agregador antigo;
- [x] E2Es de launch-scope/Central deixaram de preservar `/create-driver` como comportamento válido;
- [x] `src/core/mobility/routes/mobilityRoutes.ts` ampliado para ser SSOT também das rotas públicas, histórico, emergência e tracking;
- [x] `AppLayoutRoutes.tsx` passou a consumir os paths canônicos de Mobilidade em vez de duplicar strings;
- [x] `useMobilityUrls().home` corrigido de `/mobilidade/passageiro` para a home real `/mobilidade`, evitando navegação de volta para a própria tela;
- [x] tracking do passageiro, retorno da busca, ação SOS e sincronização de contexto de perfil passaram a reutilizar o SSOT de rotas;
- [x] `tests/e2e/mobility-operational.spec.ts` não aceita mais `LaunchPausedPage` como prova operacional; com `mobility: false`, o teste é explicitamente `skip`, e quando habilitado exige estado operacional/onboarding real.

**Estado de certificação:** Mobilidade continua **launch-paused e NÃO certificada**. Este checkpoint melhora a confiabilidade da prova; não autoriza alterar `PUBLIC_LAUNCH_SURFACES.mobility` para `true`.

**Próximo gate obrigatório:** reconciliar schema/migrations do ambiente alvo e comprovar RLS/grants/autorização positiva e negativa para motorista, motoboy, passageiro, corridas, entregas, chat e operações sensíveis. Só depois executar E2E operacional real, smoke responsivo e prova de deploy do mesmo SHA.

## Checkpoint 2026-09-09 — Mobilidade: autoridade de escrita server-owned

A auditoria/correção do primeiro módulo da ordem de certificação avançou do hardening parcial para um contrato de escrita server-owned no agregado `ride_requests`.

### Fechado neste checkpoint

- [x] `ride_state_audit` é append-only/backend-owned; `anon/authenticated` não possuem INSERT direto;
- [x] transições de corrida usam `mobility_transition_ride_state_atomic`, com lock `FOR UPDATE`, matriz de estados, timestamps e audit na mesma transação;
- [x] metadata/transições de entrega usam commands atômicos dedicados; confirmação de coleta, entrega e falha não dependem de UPDATE genérico do browser;
- [x] dispatch/aceite/expiração foram movidos para commands server-side, incluindo expiração de 15 minutos e liberação do motorista;
- [x] redispatch administrativo usa command específico e a Central Motoboy deriva elegibilidade de ação da state machine;
- [x] confirmação de conclusão pelo passageiro passou a usar `passenger_confirmed_at` canônico, command idempotente e ator derivado do JWT;
- [x] `AutoDispatchService` browser duplicado e `RideRepository` legado foram removidos;
- [x] helpers/facades genéricos de `UPDATE ride_requests` e creators diretos legados foram removidos;
- [x] criação de corrida e entrega passou pelo broker `mobility-rpc`; o browser não escolhe `status`, motorista, preço final, timestamps operacionais ou prova de entrega;
- [x] criação de entrega revalida no backend Profile solicitante, rollout efetivo, `motoboy_enabled`, associação de Empresa/Gastronomia/Serviço e entitlement aplicável;
- [x] origem gastronômica é vinculada server-side: `sourceId=orders.id`, `authorizationSourceId=restaurante`; o pedido deve ter `merchant_profile_id` igual ao Profile da empresa autorizada, `source_type=gastronomy`, `source_id=business_data.id`, não estar terminal e não possuir outra entrega ativa;
- [x] probe remoto do vínculo gastronômico: 75 pedidos, 0 sem `business_data`, 0 divergências `merchant_profile_id ↔ business.profile_id` e 0 rides gastronômicas ativas no snapshot validado;
- [x] migrations de criação atômica `20260909140626_add_atomic_mobility_creation_commands_g6.sql` e revogação de INSERT `20260909141356_revoke_browser_ride_request_insert_g6.sql` estão aplicadas no Supabase canônico e versionadas em Git;
- [x] migrations `20260909135451_revoke_browser_ride_request_update_g6.sql` e `20260909131721_revoke_browser_ride_request_delete_g6.sql` mantêm UPDATE/DELETE do browser fechados;
- [x] `MobilityRideRequestWriteAuthority.test.ts` ratcheta ausência de INSERT/UPDATE direto no runtime e exige os commands/migrations server-owned;
- [x] types Supabase foram regenerados a partir do schema remoto após os novos RPCs.

### Prova remota atual

Projeto Supabase canônico: `xhdowzacfujckjelqhtd`.

- `ride_requests`: `anon INSERT/UPDATE/DELETE = false`;
- `ride_requests`: `authenticated INSERT/UPDATE/DELETE = false`;
- `ride_requests`: `service_role INSERT/UPDATE/DELETE = true`;
- policies restantes: `Admins can manage ride requests:ALL` e `Ride participants view:SELECT`;
- `ride_state_audit authenticated INSERT = false`;
- `mobility_create_ride_atomic`: `anon_execute=false`, `authenticated_execute=false`, `service_role_execute=true`;
- `mobility_create_delivery_atomic`: `anon_execute=false`, `authenticated_execute=false`, `service_role_execute=true`;
- `mobility-rpc` remoto: **v16 ACTIVE**, `verify_jwt=true`, SHA do bundle `369b00523065d17e84b6bf6f2a57d588758435b9419be1a324c22cae41526594`;
- baseline técnico da `main` antes desta atualização documental: `9fb40b1368d2832ae0d328c354f050a827e82b92`;
- `PUBLIC_LAUNCH_SURFACES.mobility` permanece **false**.

### O que isto NÃO certifica

Este fechamento prova a autoridade estrutural de escrita de `ride_requests`; ele **não** certifica ainda o módulo Mobilidade para lançamento.

Continuam obrigatórios antes de `mobility:true`:

1. executar casos positivos e negativos reais de autorização para passageiro, motorista, motoboy, Empresa/Gastronomia/Serviço e admin;
2. provar criação → busca → dispatch → aceite → deslocamento → conclusão/cancelamento no runtime real;
3. provar entrega → coleta → rota → PIN/prova → conclusão/falha/redispatch;
4. validar chat/tracking/realtime e ausência de vazamento entre participantes;
5. executar smoke responsivo das superfícies passageiro, motorista, motoboy e Central;
6. executar typecheck/test/build/E2E reais no **mesmo SHA** quando a infraestrutura de execução estiver disponível;
7. provar deploy do mesmo SHA no ambiente alvo;
8. somente depois considerar `PUBLIC_LAUNCH_SURFACES.mobility = true`.

**Próximo gate obrigatório:** autorização positiva/negativa + E2E operacional + smoke responsivo. Não reabrir DML direto de `ride_requests` como atalho para testes.

## Regras de execução

1. trabalhar somente na `main` durante a estabilização atual;
2. não criar branch nova para correções deste programa;
3. revalidar o HEAD antes de cada write e nunca usar force update;
4. **inspecionar primeiro o projeto real; docs são registro auxiliar e devem ser corrigidas quando divergirem do código/runtime**;
5. owner/SSOT deve ser inequívoco e cada migração deve possuir ratchet/gate proporcional ao risco;
6. commit não equivale a runtime, teste ou deploy validado;
7. não reduzir segurança, CI ou cobertura para obter verde;
8. placeholder, `paused`, fallback vazio ou retorno antecipado não contam como módulo funcional, **mas também não autorizam remover a feature**;
9. feature válida quebrada deve entrar em correção de causa raiz; não postergar indefinidamente nem substituir por remoção cosmética;
10. remover somente legado/duplicação/owner obsoleto depois de preservar ou migrar a capacidade funcional válida;
11. mudanças destrutivas de dados/LGPD exigem validação específica do ambiente alvo.


## Relação com `teste-acheguese`

A partir de 2026-09-09:

- `washingtonmsdj/teste-acheguese` funciona como **laboratório pequeno de território/UX/release**;
- `washingtonmsdj/acheguese` continua sendo o **produto principal consolidado**;
- não existe dual-write de features nem sincronização cega entre repositórios;
- contratos maduros do teste podem ser absorvidos aqui somente quando compatíveis com os owners/SSOTs deste repositório;
- código Next.js do teste **não** deve ser copiado mecanicamente para o app Vite/React;
- padrões aproveitáveis incluem: registry único de navegação, rollout fail-closed, território como contexto, estados vazios honestos, source/deploy provenance e visual Território Vivo;
- módulos já existentes aqui (Community, Empresas, Gastronomia, Educação etc.) não são removidos apenas porque ainda não existem no teste;
- a existência real desses módulos deve ser aferida pelo código, rotas, serviços, schema e runtime da `main`, não pela cobertura documental;
- se um módulo existente estiver quebrado ou incompleto, corrigir e certificar; não usar o laboratório ou uma doc antiga como justificativa para apagá-lo;
- ao absorver uma ideia do teste, preferir consolidar owner existente e remover **somente** duplicação/legado no principal, preservando a capacidade já implementada.

Essa política substitui a antiga ideia de escolher um repositório e abandonar o outro.

## Baseline GitHub confirmado

- `main` é a única linha ativa escolhida para esta estabilização.
- Snapshot remoto de 2026-09-18: **40 branches** — `main`, a branch ativa do PR #117 e **38 refs históricas** ainda pendentes de classificação segura (#84). As 85 refs integradas ou ancestrais já foram removidas e conferidas pela API em 2026-09-17. Não excluir as 38 restantes antes da revisão semântica de cada delta.
- `main` recebeu proteção parcial em 2026-09-17: `protected=true`, admins sujeitos às regras, force-push/deleção bloqueados e resolução de conversas exigida; PR/checks/push restrictions continuam pendentes até reconciliar o writer direto `Supabase Types Sync` (#28).
- os workflows SSOT foram alinhados com `push` na `main`; alterações em tooling canônico sob `tools/**` e nos arquivos de configuração relevantes devem disparar os gates correspondentes.
- o root legado `scripts/**` está aposentado; workflows/package scripts não devem depender de wrappers recriados nesse caminho.
- a camada GitHub Actions apresentou nesta estabilização falhas pre-step com `steps=[]`/runner não provisionado; nenhum check desse tipo pode ser tratado como prova verde até executar comandos reais (#17).
- o status Vercel inspecionado nesta estabilização falhou por `upgradeToPro=build-rate-limit`; isso é blocker de certificação/deploy, não prova de erro de compilação.

## P0 — SSOT, CI e proteção

### Documentação / autoridade

- [x] `docs/README.md` como porta de entrada documental;
- [x] taxonomia reconciliada com `src/core/verticals/config.ts` (`gastronomy` + `education`; Events não é vertical empresarial);
- [x] plano operacional `main`-only centralizado neste arquivo;
- [x] regressão automatizada para drift de taxonomia;
- [x] ledger de compatibility bridges sincronizado com **zero bridges vivos**;
- [x] censo de repositório sincronizado após retirada de `src/config`, `scripts` e `e2e`;
- [ ] continuar classificação deliberada de `plans/**` e limpeza de documentos substituídos sem quebrar referências vivas (#51).

### CI confiável (#17)

- [x] SSOT workflows alinhados com `push -> main`;
- [x] enforcement observa tooling/config canônicos em vez de depender do root aposentado `scripts/**`;
- [ ] restaurar execução real dos jobs hosted;
- [ ] provar security/lint/typecheck/test/build executando e verdes no mesmo SHA.

### Proteção da `main` (#28)

- [ ] bloquear force-push e deleção;
- [ ] restringir autoridade de push durante o fluxo temporário `main`-only;
- [ ] não configurar required checks falsos enquanto a infraestrutura de CI não executar de verdade.

## P1 — segurança e privacidade

Owners: #85 e #68 (LGPD).

- [x] fronteira de configuração pública `.env` documentada; nenhum `service_role`/provider secret no baseline rastreado;
- [x] `emergency_delivery_log` reclassificado como tabela ativa, server-owned e usada para rate-limit/auditoria;
- [x] hardening adicional de autoridade RPC/PostGIS/analytics foi incorporado na linha atual sem ser sobrescrito pelas refatorações de módulos;
- [ ] continuar auditoria de RLS, grants e `SECURITY DEFINER` client-executable;
- [ ] manter delete/export LGPD fail-closed até revogação de sessão, purge, scheduler e export completo estarem certificados (#68).

## P1 — estrutura e organização (#51)

### Compatibility roots / bridges

- [x] `src/features` aposentado;
- [x] `src/test`, `src/__tests__` e `src/types` aposentados como roots genéricos;
- [x] `scripts/**` aposentado; tooling operacional canônico em `tools/**`;
- [x] `e2e/**` aposentado; owner canônico em `tests/e2e/**`;
- [x] `src/config/**` aposentado depois de migrar todos os callers para owners específicos em `app`, `core` e `shared`;
- [x] `tests/architecture/repository-reorganization-contract.test.ts` bloqueia recriação de `src/config` e imports legados como `@/config/territory`;
- [x] `docs/03-architecture/COMPATIBILITY_BRIDGES.md` registra zero compatibility bridges vivos.

A remoção física dos compatibility roots está concluída no nível estrutural. Isso **não** certifica G2 por si só: documentação residual, `plans/**` e certificação same-SHA continuam pendentes.

### Education — ownership técnico

**Concluído nesta retomada:**

- [x] remover declaração falsa de “Production Ready” do README do módulo;
- [x] centralizar contratos em `src/core/education/contracts.ts`;
- [x] mover Observability para `src/core/education/services`;
- [x] mover Tracking para `src/core/education/services`;
- [x] mover read model `education.queries.ts` para `src/core/education/services`;
- [x] mover write model `education.mutations.ts` para `src/core/education/services`;
- [x] mover `schoolStageOptions` compartilhado para `src/core/education/constants`;
- [x] aposentar os seis paths de compatibilidade em `src/modules/business/education` após zero callers de runtime;
- [x] levar o baseline de acesso runtime direto a `@/integrations/*` em `src/modules/business/education` de 4 arquivos para **zero**;
- [x] `tools/architecture/validate-education-module-boundaries.ts` bloqueia acesso runtime direto e a recriação dos bridges aposentados;
- [x] `tests/architecture/education-module-boundary-ratchet.test.ts` exige owners canônicos e ausência física dos bridges aposentados.

**Ainda não certificado:**

- [ ] schema/RPC/migrations do ambiente alvo reconciliados;
- [ ] RLS/grants e autorização positiva/negativa comprovados;
- [ ] fluxo público listagem → detalhe com dados reais validado;
- [ ] fluxo operacional mínimo validado;
- [ ] E2E/smoke/deploy do mesmo SHA comprovados;
- [ ] somente depois remover `launch-paused`.

### Events — owner físico consolidado

- [x] classificar Events como bounded context comunitário, não vertical empresarial;
- [x] mover persistência de engagement para `core` e aposentar o bridge module-local após zero callers;
- [x] pré-validar a implementação antiga contra as fronteiras do destino durante a migração;
- [x] mover a implementação física para `src/modules/community-events` preservando a árvore de código;
- [x] atualizar a rota territorial para carregar `@/modules/community-events/pages/EventsListPage`;
- [x] atualizar o deploy validator para inspecionar o owner canônico de Events;
- [x] remover integralmente `src/features/events` e retirar a allowlist de migração;
- [x] aposentar integralmente o namespace histórico `src/core/verticals/events` sem criar segundo owner;
- [x] adicionar ratchets de arquitetura para bloquear recriação dos owners históricos e drift de rota/deploy;
- [x] retirar os owners legados do architecture registry.

**Ainda não certificado:**

- [ ] provar schema/RLS/grants e fluxos reais do módulo no ambiente alvo;
- [ ] provar typecheck/test/build/E2E/deploy do mesmo SHA.

### Higiene de repositório e testes

- [x] zero implementações `*.test.*`/`*.spec.*` diretamente em `tests/`; ratchet arquitetural exige a raiz limpa;
- [x] Mobility integration migrado para `tests/integration/mobility` com imports `@/`;
- [x] `playwright.mapa.config.ts` morto removido e script Maps apontado ao config canônico;
- [x] Security Check Maps deixou de referenciar arquivos sintéticos inexistentes e usa validators canônicos;
- [x] `tsconfig.typecheck.events-checkin.json` órfão removido;
- [x] `bun.lock` removido; `package-lock.json` permanece como lockfile do package manager npm declarado;
- [x] guard de artifacts de raiz impede regressão dessas decisões.

## P1 — certificação funcional dos módulos (#50)

Arquitetura limpa não equivale a módulo certificado.

- Education continua `launch-paused` apesar do ownership técnico ter sido corrigido.
- Gastronomy possui implementação real e dívida direta de integração do módulo zerada, mas ainda depende de prova de banco/RLS/E2E/deploy.
- Events possui owner físico canônico, mas não está certificado funcionalmente.
- Mobilidade territorial permanece pausada.

Ordem de certificação:

1. Mobilidade / Central motorista-motoboy;
2. Central + Empresas/Gastronomia/Educação + Profissionais;
3. Comunidade (incluindo Events);
4. Classificados/jobs + mensagens + perfil/trust;
5. Admin, comunicação territorial, guide, AI e auxiliares.

Para cada módulo exigir: entrypoint canônico, banco/RPC atual, autorização positiva/negativa, fluxo principal real, loading/empty/error/auth corretos, E2E sem placeholder e smoke responsivo.

## P2 — higiene E2E e branches

- [x] provenance explícita das fixtures técnicas permanece separada de dados públicos de Production;
- [x] contrato E2E do release foi reconciliado ao MVP atual: a prova determinística cobre **Empresas + Mapa + Perto de mim + Busca + Busca** e, em conjunto com `launch-scope-public.spec.ts`, comprova que módulos pós-MVP falham fechado;
- [x] `main` é a única linha ativa de desenvolvimento; não há PR aberto concorrente no marco zero;
- [x] auditoria remota de 2026-09-21 classificou 165 refs como removíveis sem perda: 92 heads exatos de PR mergeado, 67 heads SHA-pinados como superseded e 6 refs totalmente contidas na `main`;
- [ ] exclusão física dessas 165 refs continua pendente porque o runner do workflow de higiene encerra com `steps=null` e a integração atual não expõe `DELETE ref`;
- [ ] nove refs com commits exclusivos permanecem somente como preservação histórica até arquivamento/auditoria específica; nenhuma delas é linha ativa de desenvolvimento.

## Definition of Done — MVP

O Achegue-se só pode ser marcado **MVP READY** quando todos os itens abaixo forem comprovados:

- [ ] SSOT documental/arquitetural sem referência canônica quebrada conhecida;
- [x] `main` protegida e definida como única linha operacional ativa; branches históricas remanescentes não recebem desenvolvimento novo;
- [ ] security/lint/typecheck/test/build executando de verdade e verdes no mesmo SHA;
- [ ] migrations/Edge/source reconciliados com o runtime correspondente;
- [ ] LGPD seguro ou explicitamente indisponível/fail-closed até certificação;
- [ ] módulos MVP certificados por fluxo real, nunca por placeholder/paused;
- [ ] autorização sensível coberta por casos negativos;
- [ ] deploy do SHA aprovado comprovado no provider;
- [ ] smoke funcional do ambiente alvo sem erro crítico recorrente;
- [ ] rollback/recuperação documentados para mudanças operacionais relevantes.

## Commits relevantes desta retomada

- `fa57cac` — persistência de engagement de Events para `core`;
- `9de277e` — Gastronomy com dívida direta de integração do módulo zerada e ratchet estruturado;
- `0da8e2e` — implementação de Events movida para `src/modules/community-events`, com rota e deploy guard no owner canônico;
- `3707218` — `src/features` removido e ratchets atualizados;
- `0bf6e2d` — bridge de engagement de Events aposentado;
- `84b1921` — seis bridges locais de Education aposentados após zero callers de runtime;
- `0f08720` / `6ab27e3` — `scripts/**` aposentado e ratcheted;
- `2161167` — root `e2e/**` aposentado;
- `22a94af` — bridge `src/config/launchScope.ts` aposentado;
- `67b70d6` — último bridge (`src/config/territory.ts`) removido e `src/config/**` aposentado;
- `96c9681` — compatibility ledger sincronizado com zero bridges vivos;
- `07bb101` — repository census atualizado após os cortes de G2.

## Trackers canônicos

- #85 — security hardening / RLS / privileged functions;
- #68 — LGPD delete/export;
- #17 — CI security gates;
- #28 — proteção da `main`;
- #51 — estrutura/owners/namespaces;
- #50 — certificação funcional dos módulos;
- #83 — provenance E2E (concluído no nível de código);
- #84 — branches históricas.

### Checkpoint G7 — autoridade de motorista e ofertas fechada no servidor (2026-09-09)

Estado validado no código e no schema canônico antes da correção:
- `driver_data` ainda tinha `INSERT/UPDATE/DELETE` direto para `authenticated` por policies `ALL`; como a tabela mistura cadastro (CNH/veículo) e autoridade operacional, o dono da linha podia tentar alterar verificação, assinatura, rating/estatísticas e capacidades;
- o cadastro de motorista já passava pelo `profile-rpc`, mas flags operacionais de extensão ainda podiam chegar do payload do cliente;
- `ride_offers` ainda mantinha `UPDATE` autenticado legado, apesar de a aceitação de corrida já ser atômica via `mobility-rpc -> accept_ride_atomic`.

Correção aplicada:
- browser não possui mais mutação direta de `driver_data`; mantém somente leitura autorizada por RLS;
- bootstrap comum usa `ensure_owned_driver_data` e nasce sem autoridade operacional;
- bootstrap administrativo foi preservado por `ensure_admin_driver_data`, exigindo admin real no banco e limitado ao próprio perfil driver;
- edição própria usa `update_owned_driver_data`, com whitelist fechada; `is_verified`, assinatura, documentos/background, `can_do_*`, rating e estatísticas ficam fora do payload self-service;
- alteração efetiva de CNH ou veículo invalida automaticamente a verificação e retorna o background para `pending`;
- `profile-rpc` sanitiza cadastro de driver, força documentação não verificada/background pendente e aceita exatamente um modo operacional inicial (motorista ou motoboy);
- `ride_offers` perdeu o `UPDATE` autenticado e a policy antiga de resposta; a tabela e a funcionalidade permanecem, com aceitação pela autoridade atômica existente;
- serviços de frontend/runtime foram apontados aos comandos canônicos, sem tabela paralela e sem camada de compatibilidade.

Prova remota no Supabase canônico:
- migration `harden_mobility_driver_authority_g7` aplicada com sucesso;
- `driver_data`: `SELECT authenticated=true`; `INSERT/UPDATE/DELETE authenticated=false`;
- `ride_offers UPDATE authenticated=false`;
- `ensure_owned_driver_data`, `ensure_admin_driver_data` e `update_owned_driver_data`: `authenticated EXECUTE=true`, `anon EXECUTE=false`;
- funções novas são `SECURITY DEFINER` com `search_path` fixo e `statement_timeout=5s`;
- `profile-rpc` remoto atualizado para v13 `ACTIVE`, `verify_jwt=true`;
- ratchet de fonte: `MobilityDriverAuthority.test.ts`;
- **Mobilidade continua não certificada para lançamento**; não alterar `PUBLIC_LAUNCH_SURFACES.mobility=false`.

Próximo gate obrigatório:
1. fechar autoridade de `driver_availability` e `driver_locations`, preservando presença/GPS legítimos sem permitir que o browser fabrique `active_ride_id`, modo ativo ou estado busy;
2. auditar RPCs `SECURITY DEFINER` autenticadas ligadas a dispatch/trust e provar escopo por participante/território;
3. executar E2E real de motorista + motoboy + passageiro e somente depois considerar rollout público.

### Checkpoint G8 — disponibilidade de motorista server-owned (2026-09-09)

Problemas confirmados:
- `driver_availability` ainda concedia `INSERT/UPDATE/DELETE` a `authenticated` por policy `ALL`, embora contenha `active_ride_id`, `busy_since` e `active_ride_mode`;
- o aceite atômico já marcava o motorista como busy, mas `MobilityOfferService` tentava executar um segundo `setBusy()` no browser e ignorava a falha;
- “pausar disponibilidade” atualizava somente o espelho em `driver_data`, deixando o estado canônico de dispatch potencialmente disponível.

Correção aplicada e provada:
- migration `harden_driver_availability_authority_g8` aplicada no Supabase canônico;
- `driver_availability`: `SELECT authenticated=true`; `INSERT/UPDATE/DELETE authenticated=false`;
- `mobility_update_driver_availability` e `mobility_reconcile_stale_driver_availability` são `SECURITY DEFINER`, com `search_path`/timeout fixos e `EXECUTE` somente para `service_role`;
- browser expressa apenas intenção de presença via `mobility-rpc`; `active_ride_id`, `busy_since` e `active_ride_mode` permanecem propriedade do aceite/release atômico;
- `MobilityOfferService` não chama mais `setBusy()` depois de `acceptRideAtomic`;
- pausa de disponibilidade agora altera primeiro o estado canônico de dispatch;
- reconciliação stale é operação administrativa/server-side e nunca auto-libera motorista busy;
- `mobility-rpc` remoto atualizado para v17 `ACTIVE`, `verify_jwt=true`;
- ratchet: `MobilityAvailabilityAuthority.test.ts`;
- Gate 5 operacional foi atualizado para representar estado busy por fixture administrativa/server-owned, não por API pública `setBusy()`.

### Checkpoint G9 — GPS do motorista brokered e read-only no browser (2026-09-09)

Problemas confirmados:
- `driver_locations` ainda concedia CRUD completo a `authenticated`;
- `TrackingService.updatePosition()` fazia `...metadata` depois de `lat/lng`, permitindo sobrescrever campos do payload genérico;
- tracking/presença aceitavam cliente Supabase injetado, mas o broker estático usava apenas o cliente global, quebrando isolamento de sessão em testes/contextos injetados;
- presença de tracking ainda consultava/escrevia o espelho `driver_data.is_online` em vez do estado canônico `driver_availability`.

Correção aplicada e provada:
- migration `broker_driver_location_writes_g9` aplicada no Supabase canônico;
- `driver_locations`: `SELECT authenticated=true`; `INSERT/UPDATE/DELETE authenticated=false`; `anon SELECT=false`;
- única policy restante é `driver_locations_authorized_read`, preservando leitura do próprio motorista/admin e passageiro em corrida elegível;
- `mobility_update_driver_location` é `SECURITY DEFINER`, `EXECUTE service_role=true`, `authenticated/anon=false`, com validação de ownership e bounds GPS;
- cada atualização de GPS sincroniza também `driver_availability.current_lat/current_lng/last_location_update/last_seen_at`, evitando snapshot de dispatch divergente;
- `TrackingService` envia GPS de motorista por `MobilityRpcService.updateDriverLocation`; o payload de driver não aceita `metadata`;
- `invokeSupabaseBroker` aceita opcionalmente o cliente autenticado da camada chamadora; default global foi preservado para callers existentes;
- `TrackingService.getPresence/updatePresence/heartbeat/reconnect` usam `driver_availability` + broker, não `driver_data.is_online`;
- testes Gate 2/Gate 4 foram ajustados para perfil `driver`, broker autenticado e sem cleanup/upsert browser direto em `driver_locations`;
- `mobility-rpc` remoto atualizado para v18 `ACTIVE`, `verify_jwt=true`;
- ratchet: `MobilityDriverLocationAuthority.test.ts`.

Próximo gate obrigatório:
1. auditar RPCs `SECURITY DEFINER` de Mobilidade/Trust que continuam executáveis por `authenticated` ou `anon`, começando por dados de corrida, safety share, ratings e mutações de lifecycle;
2. provar casos negativos de acesso cruzado entre passageiro/motorista/terceiro;
3. executar typecheck/test/build reais no mesmo SHA quando a infraestrutura hosted estiver disponível;
4. executar E2E real motorista + motoboy + passageiro;
5. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até todos os gates acima passarem.

### Checkpoint G10 — descoberta de ofertas territorial e server-owned (2026-09-09)

Problemas confirmados:
- Open Board/Reservation tentavam ler corridas não atribuídas diretamente de `ride_requests`, mas a RLS canônica da tabela permite somente participantes/admin; o fluxo comum portanto podia retornar vazio apesar de existir oferta elegível;
- `get_ride_offer_trust_decisions` aceitava IDs de corridas não atribuídas com escopo mais amplo do que a superfície real de oferta;
- `get_driver_dispatch_summaries` aceitava IDs arbitrários de motoristas online;
- código de Reservation Board consultava `is_scheduled`/`scheduled_for`, colunas inexistentes no schema remoto; `departure_time` já era o timestamp canônico;
- frontend dizia `requiresSubscription=false`, enquanto a autoridade de aceite/disponibilidade server-side exige assinatura ativa.

Correção aplicada e provada:
- migration `broker_driver_offer_read_model_g10` aplicada no Supabase canônico;
- novo `mobility_list_driver_offers` é `SECURITY DEFINER`, com `search_path`/timeout fixos e `EXECUTE` somente para `service_role`;
- read model exige ownership do perfil driver, perfil ativo/não suspenso, verificação, assinatura ativa, online/disponível, sem corrida ativa e capacidade compatível com `ride_mode`;
- oferta só é retornada quando `pickup_location_id` resolve para o mesmo município operacional do motorista;
- trust do passageiro/cliente é projetado no mesmo read model autorizado;
- `get_ride_offer_trust_decisions(uuid[])` e `get_driver_dispatch_summaries(uuid[])`: `authenticated EXECUTE=false`, preservados apenas para uso interno/server-side;
- Open Board, Reservation Board e Exclusive Offer do `MobilityOfferService` usam `MobilityRpcService.listDriverOffers`;
- caminhos antigos `getOpenBoardOfferRides`, `getReservationOfferRides`, `getExclusiveOfferRideForDriver` e `getAvailableRides` foram aposentados;
- agendamento deriva de `ride_requests.departure_time`; não foram criadas colunas duplicadas `is_scheduled/scheduled_for`;
- configuração de dispatch foi alinhada para `requiresSubscription=true` nas três estratégias;
- `mobility-rpc` remoto atualizado para v19 `ACTIVE`, `verify_jwt=true`;
- ratchet: `MobilityDriverOfferAuthority.test.ts`.

### Checkpoint G11 — descoberta de motoristas vinculada à corrida (2026-09-09)

Problema confirmado:
- `findAvailableDrivers(lat,lng,radius)` aceitava coordenadas arbitrárias sem uma corrida/ator que permitisse comprovar autorização e território;
- o helper dependia da projeção ampla `get_driver_dispatch_summaries`, que foi corretamente fechada em G10;
- fixtures antigas “provavam dispatch” sem autoria de corrida, território do motorista ou coordenadas canônicas da solicitação.

Correção aplicada e provada:
- migration `broker_available_driver_discovery_g11` aplicada no Supabase canônico;
- `mobility_find_available_drivers_for_ride` exige corrida concreta em estado elegível, solicitante dono da corrida ou admin, `pickup_location_id` e coordenadas da origem;
- candidatos são filtrados por mesmo município operacional, `ride_mode`, verificação, assinatura, perfil ativo/não suspenso, online/disponível, sem corrida ativa, GPS presente, heartbeat de no máximo 5 minutos, raio e trust não bloqueado;
- perfis driver pertencentes ao mesmo `user_id` do passageiro são explicitamente excluídos, impedindo auto-dispatch entre perfis do mesmo usuário;
- função é `SECURITY DEFINER`, com `search_path`/timeout fixos; `anon=false`, `authenticated=false`, `service_role=true`;
- `DriverAvailabilityService.findAvailableDrivers(lat,lng,...)` foi substituído por `findAvailableDriversForRide(rideId,...)`;
- `mobility-rpc` remoto atualizado para v20 `ACTIVE`, `verify_jwt=true`;
- Gate 5 foi refeito para usar fixtures técnicas versionadas: passageiro autorizado, motorista elegível no mesmo município, terceiro bloqueado, offline, busy, heartbeat stale e fora do raio;
- probes transacionais `BEGIN/ROLLBACK` no banco real confirmaram: candidato elegível aparece; terceiro sem vínculo recebe bloqueio; motorista do próprio usuário passageiro não aparece; nenhuma mutação de fixture ficou persistida;
- ratchet: `MobilityDriverDiscoveryAuthority.test.ts`;
- advisors de segurança executados após DDL; não surgiu finding novo específico das funções G10/G11.

Próximo gate obrigatório:
1. classificar as funções `SECURITY DEFINER` restantes de Mobilidade/Trust por intenção real: projeção pública por design, comando autenticado com autorização interna ou API ampla indevida;
2. priorizar safety/share, avaliações/trust e comandos administrativos, fechando somente superfícies que realmente ampliem autoridade;
3. executar os testes reais Gate 2/Gate 4/Gate 5 no mesmo SHA quando o runner hosted estiver disponível;
4. executar E2E passageiro + motorista + motoboy;
5. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até certificação funcional completa.

### Checkpoint G12 — compartilhamento público de corrida com token server-owned (2026-09-09)

Auditoria real:
- a policy histórica de `ride_shares` já vinculava `created_by` ao `auth.uid()` e exigia participante da corrida;
- desde 2026-08-19 já existia `private.assign_ride_share_token()` + `trg_assign_ride_share_token`, substituindo qualquer token vindo do cliente por 16 bytes criptográficos codificados em hex;
- portanto o `secureRandomString(32)` Base62 do frontend era redundante, não a autoridade real do token;
- a criação ainda possuía `INSERT authenticated=true`, deixando o browser escolher lifecycle fields embora o token fosse sobrescrito pelo trigger.

Correção aplicada e provada:
- `ride_shares INSERT authenticated=false`; policy `ride_shares_insert_own` removida;
- novo `create_safety_ride_share(ride_id, created_by, expires_in_hours)` é o único comando de criação acessível a `authenticated`;
- comando exige perfil ativo pertencente ao usuário, participante da corrida e corrida em estado ativo; validade fica entre 1 e 168 horas, com padrão existente de 24h;
- o trigger privado pré-existente continua como **único** gerador de bearer token; nenhuma segunda geração foi mantida;
- o trigger `trg_audit_ride_share_insert` continua como **único** produtor de `share_created`; a função não duplica audit;
- `get_shared_ride_safety_data` continua anon por design, mas agora usa contrato exato `^[0-9a-f]{32}$`, `search_path=''` e `statement_timeout=3s`;
- frontend removeu geração/insert direto e usa `create_safety_ride_share`;
- probes transacionais `BEGIN/ROLLBACK` provaram: participante válido cria token e leitura pública resolve; exatamente um audit é produzido; terceiro não cria; corrida terminal não cria;
- ratchet: `tests/security/safety-ride-share-authority.test.ts`;
- advisors de segurança foram executados após o DDL; o warning de `get_shared_ride_safety_data` permanece **intencional e allowlisted**, pois esse endpoint é uma capability pública por bearer token.

Próximo gate obrigatório:
1. auditar `ride_ratings` e feedback/trust por grants/RLS reais, verificando se o browser ainda consegue escrever direto e contornar `submit_ride_rating`/`submit_ride_trust_feedback`;
2. manter projeções públicas de reputação somente quando forem agregadas e intencionalmente públicas;
3. validar chat de corrida e safety mutators por bypass de tabela, não duplicar brokers se a autorização interna já for suficiente;
4. executar same-SHA test/typecheck/build/E2E quando runner hosted estiver disponível;
5. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G20 — lifecycle de Safety Ride Share e provenance reconciliada (2026-09-09)

Auditoria e reconciliação:
- o Supabase já havia aplicado G12 nas versões reais `20260909170152`, `20260909170347` e `20260909170647`, enquanto a `main` guardava o mesmo conteúdo com timestamps posteriores `19:00/19:10/19:20`;
- os três arquivos foram renomeados atomicamente no Git para refletir exatamente o migration history remoto, sem reaplicar SQL;
- o lifecycle terminal de shares já possuía owner canônico: `private.revoke_terminal_ride_shares()` + `trg_revoke_terminal_ride_shares` em `ride_requests`;
- um primeiro corte G20 duplicou temporariamente esse fechamento dentro do transition command; o probe transacional revelou o owner existente porque o resultado terminal foi `revoked`, não `expired`.

Correção final:
- criação de share agora lê a corrida com `FOR SHARE`, serializando criação contra transição terminal;
- `revoke_safety_ride_share` foi endurecida com `search_path=''`, timeout de 3s e semântica idempotente: share inexistente/inativo retorna `false`, não escreve e não duplica audit;
- o trigger privado preexistente permanece como **único owner** da revogação automática no lifecycle terminal;
- migration `20260909192625_restore_canonical_ride_share_terminal_trigger_g20.sql` removeu do transition command a atualização duplicada de `ride_shares`, preservando intactos os owners G19 de offers, dispatch e driver availability;
- probe real `BEGIN/ROLLBACK` comprovou: token server-owned nasce ativo; transição terminal revoga o share; bearer token deixa de resolver imediatamente; primeira revogação explícita retorna `true`, segunda retorna `false`; exatamente um audit `share_revoked`;
- ratchet `tests/security/safety-ride-share-authority.test.ts` protege serialização, idempotência e single-owner;
- warning de `create_safety_ride_share` foi classificado em `SUPABASE_ADVISOR_RESIDUALS.json`; a leitura anônima `get_shared_ride_safety_data` continua allowlisted por design como capability bearer-token.

**Estado:** G12/G20 fechados e reconciliados entre Git e Supabase. Nenhum bypass de INSERT browser em `ride_shares` foi reintroduzido.

Próximo gate obrigatório:
1. auditar chat de corrida por grants/RLS/funções reais: `ensure_ride_chat`, `send_ride_chat_message` e `mark_ride_chat_messages_read`;
2. preservar chat funcional, corrigindo bypass/authority na raiz se existir, sem remover a feature;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até same-SHA tests/build/E2E.

### Checkpoint G21 — chat de corrida server-owned e participante-bound (2026-09-09)

Auditoria real:
- `ride_chats` e `ride_chat_messages` concedem ao browser somente `SELECT`; `INSERT/UPDATE/DELETE` permanecem service-role-only;
- as únicas policies de leitura são participantes da corrida via `private.current_active_profile_id()`;
- `ensure_ride_chat`, `send_ride_chat_message` e `mark_ride_chat_messages_read` são `SECURITY DEFINER` com `search_path=''` e timeout de 3s;
- sender não vem do payload: é sempre derivado do perfil ativo server-side;
- envio é permitido somente a passageiro/motorista da corrida com motorista já atribuído e em estados operacionais não terminais.

Prova transacional `BEGIN/ROLLBACK`:
- passageiro criou o singleton chat e enviou mensagem com sender correto;
- motorista respondeu com sender derivado corretamente e marcou somente a mensagem da contraparte como lida;
- terceiro sem vínculo foi bloqueado;
- após a corrida ficar terminal, nova mensagem foi recusada;
- o browser não possui privilégio direto de INSERT/UPDATE nas tabelas de chat;
- nenhuma fixture permaneceu no banco.

Decisão:
- não criar broker redundante: as RPCs existentes já são comandos autenticados e internamente autorizados;
- warnings dessas três `SECURITY DEFINER` foram classificados em `SUPABASE_ADVISOR_RESIDUALS.json`;
- ratchet `tests/security/mobility-ride-chat-server-authority.test.ts` protege participante, sender server-owned, lifecycle e ausência de DML direto.

**Estado:** G21 fechado sem remover funcionalidade e sem criar camada paralela.

Próximo gate obrigatório:
1. auditar PIN operacional: `verify_operational_pin`, `refresh_operational_pin_for_requester` e `get_operational_verification_status`;
2. provar que passageiro/motorista/terceiro não conseguem contornar ownership, attempts, TTL ou status;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G22 — PIN operacional server-authoritative (2026-09-09)

Auditoria real:
- `operational_verifications` não concede qualquer SELECT/INSERT/UPDATE/DELETE ao browser; tabela permanece service-role-only;
- `refresh_operational_pin_for_requester`, `verify_operational_pin` e `get_operational_verification_status` são `SECURITY DEFINER` com autorização interna;
- requester é o único ator que pode emitir/rotacionar o PIN; assigned driver é o único ator que pode verificá-lo;
- `verified_by` é derivado de `private.current_active_profile_id()`, nunca do payload;
- status RPC não retorna `pin_hash` nem PIN em texto;
- attempts, `last_attempt_at`, expiry e terminal-state guard são server-owned;
- o TTL existente de 24h não abre uso pós-lifecycle: verificação é recusada quando a corrida está terminal.

Prova transacional `BEGIN/ROLLBACK`:
- requester emitiu PIN de 4 dígitos;
- requester foi bloqueado ao tentar se auto-verificar;
- terceiro sem vínculo foi bloqueado ao tentar renovar;
- motorista atribuído errou uma vez e o contador persistiu exatamente 1 tentativa;
- PIN correto verificou com `verified_by` igual ao perfil driver e attempts=2;
- depois de a corrida ficar `completed`, nova verificação foi recusada;
- a projeção de status não revelou material de verificação;
- nenhum dado de fixture permaneceu.

Decisão:
- não reduzir TTL nem criar broker adicional sem requisito funcional: o protocolo atual já é bounded pelo lifecycle da corrida e possui autoridade interna;
- warnings das três RPCs foram classificados em `SUPABASE_ADVISOR_RESIDUALS.json`;
- ratchet `operational-pin-server-authority-security.test.ts` agora protege lifecycle, ownership e attempts.

**Estado:** G22 fechado sem regressão funcional.

Próximo gate obrigatório:
1. auditar mutações Safety de incidente/emergência por ator: `update_safety_incident_status` e `update_safety_emergency_alert_status`;
2. provar que actor_profile_id não permite spoof cross-user/admin;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G23 — criação Safety server-owned e lifecycle fechado (2026-09-09)

Problema real reproduzido:
- `emergency_alerts` e `safety_incidents` ainda concediam `INSERT` direto a `authenticated`;
- as policies validavam ownership/participação, porém o payload podia escolher campos de lifecycle;
- probe reversível confirmou que um usuário autenticado conseguia inserir alerta já `resolved` com `resolved_at` e incidente já `resolved`, contornando os mutators canônicos de status.

Correção de raiz:
- migration `20260909195501_server_own_safety_creation_lifecycle_g23.sql` aplicada e versionada;
- novos commands `create_safety_emergency_alert` e `create_safety_incident` derivam o perfil ativo server-side, validam payload/participação e fixam estado inicial;
- alerta nasce obrigatoriamente `active`, com `resolved_at=NULL`; incidente nasce obrigatoriamente `reported`, com `resolved_at=NULL`;
- timestamps iniciais são server-owned;
- `INSERT authenticated` foi revogado das duas tabelas e as policies antigas de INSERT foram removidas;
- `SafetyService` não executa mais INSERT direto e usa exclusivamente os dois commands;
- triggers existentes de audit e notification permanecem os únicos produtores desses efeitos, sem duplicação;
- os mutators existentes continuam preservados: owner do alerta só pode `false_alarm`; transitions administrativas continuam admin-only; `p_actor_profile_id` precisa pertencer ao usuário autenticado.

Prova pós-correção:
- grants reais: `authenticated INSERT=false` nas duas tabelas e EXECUTE=true apenas nos commands;
- probe correto com `SET LOCAL ROLE authenticated` comprovou que INSERT direto falha;
- criação por command produz exatamente `active/reported`, sem `resolved_at`;
- spoof de outro Profile foi bloqueado tanto na criação quanto no mutator;
- exatamente um audit de criação foi produzido pelos triggers canônicos;
- usuário comum não conseguiu resolver incidente administrativo;
- todas as fixtures foram revertidas com `ROLLBACK`.

Governança:
- ratchet novo: `tests/security/safety-lifecycle-authority.test.ts`;
- warnings dos novos SECURITY DEFINER foram classificados em `SUPABASE_ADVISOR_RESIDUALS.json`.

**Estado:** G23 fechado no banco e no runtime sem remover Safety.

Próximo gate obrigatório:
1. auditar `safety_evidence`, pois a tabela ainda possui INSERT autenticado e representa material sensível;
2. provar vínculo real entre uploader, incidente e objeto de Storage, evitando registro fabricado de URL/path/tamanho/MIME;
3. preservar upload de evidência, corrigindo a autoridade na raiz caso exista bypass;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G24 — evidência Safety vinculada ao Storage real (2026-09-09)

Problema real reproduzido:
- `safety_evidence` ainda concedia `INSERT` direto a `authenticated`;
- a policy validava reporter/incident ownership, mas `file_url`, `file_size`, `mime_type` e metadados eram declarações do cliente;
- probe reversível criou um registro `storage://safety-evidence/<incident>/forged.pdf` quando o bucket possuía **0 objetos**, provando que uma “evidência” podia existir sem arquivo.

Correção de raiz:
- migration `20260909200353_bind_safety_evidence_to_storage_g24.sql` aplicada e versionada;
- novo command `register_safety_evidence` exige Profile ativo igual ao reporter do incidente;
- o command exige objeto real em `storage.objects`, bucket `safety-evidence`, path dentro do incident e `owner_id = auth.uid()`;
- `file_url` é construído server-side; `file_size` e `mime_type` vêm de `storage.objects.metadata`; `uploaded_by` vem do Profile ativo;
- provenance `storage_object_id/storage_created_at` é escrita pelo servidor e sobrescreve tentativa de spoof no metadata do cliente;
- índice único em `file_url` impede registrar o mesmo objeto duas vezes;
- `INSERT authenticated` em `public.safety_evidence` foi revogado e a policy antiga removida;
- policy de DELETE do bucket permite apagar upload órfão para compensação, mas bloqueia objeto já referenciado por `safety_evidence`;
- `SafetyEvidenceService` mantém upload privado pelo `MediaService`, porém o registro passou a usar `register_safety_evidence`.

Prova pós-correção:
- registro de path sem objeto real foi bloqueado;
- INSERT direto foi bloqueado sob `SET LOCAL ROLE authenticated`;
- objeto fixture real gerou referência/tamanho/MIME/uploader a partir do Storage, ignorando spoof de provenance;
- exatamente um audit `evidence_uploaded` foi produzido pelo trigger canônico;
- tentativa de registrar o mesmo objeto duas vezes foi bloqueada pelo índice único;
- catálogo confirmou a cláusula `NOT EXISTS` da policy de DELETE para objetos registrados;
- tentativa de DELETE SQL não foi usada como prova porque o próprio Supabase possui `storage.protect_delete()` e exige Storage API; o teste transacional foi revertido sem deixar fixture.

Governança:
- `tests/security/private-storage-boundaries-security.test.ts` protege o vínculo Storage→DB;
- `validate-upload-ssot.ts` agora exige `register_safety_evidence` e proíbe retorno a INSERT direto;
- warning do novo command foi classificado em `SUPABASE_ADVISOR_RESIDUALS.json`.

**Estado:** G24 fechado sem tornar o bucket público e sem remover upload de evidência.

Próximo gate obrigatório:
1. auditar `emergency_contacts` e seus writers reais;
2. impedir spoof de owner, `is_primary`/lifecycle ou múltiplos primários se o banco ainda aceitar estado inválido;
3. manter Safety funcional e `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G25 — contatos de emergência server-owned (2026-09-09)

Problema real reproduzido:
- `emergency_contacts` ainda concedia `INSERT/UPDATE` direto a `authenticated`;
- RLS protegia ownership, mas o browser podia escrever campos fora do contrato do produto;
- probe reversível confirmou criação com `is_active=false`, `created_at=2001-01-01` e metadata arbitrária;
- a regra de “um contato primário” dependia somente de trigger, sem garantia concorrente por índice.

Correção de raiz:
- migration `20260909200953_server_own_emergency_contacts_g25.sql` aplicada e versionada;
- `create_emergency_contact` aceita somente os campos de criação expostos pelo domínio, exige Profile ativo pertencente ao usuário e deriva lifecycle/metadata/timestamps;
- `patch_emergency_contact` possui allowlist estrita: `name,email,phone,relationship,is_primary,is_active`;
- `profile_id`, `metadata`, `created_at` e demais campos de provenance não podem ser alterados pelo browser;
- desativar um contato força `is_primary=false`;
- índice parcial único `emergency_contacts_one_active_primary_per_profile` garante no banco no máximo um contato `is_primary=true AND is_active=true` por Profile, inclusive sob concorrência;
- `INSERT/UPDATE authenticated` foram revogados e policies antigas removidas;
- `SafetyEmergencyContactsService` passou a usar exclusivamente `create_emergency_contact` e `patch_emergency_contact`.

Prova pós-correção:
- INSERT e UPDATE direto falharam sob `SET LOCAL ROLE authenticated`;
- criação por command nasceu ativa, metadata vazia e timestamps server-owned;
- e-mail foi normalizado server-side;
- criar um segundo contato primário despromoveu o anterior e o banco manteve exatamente um primário ativo;
- patch com `created_at/metadata` foi bloqueado;
- patch legítimo preservou `created_at`;
- desativação removeu corretamente o estado primário;
- fixtures revertidas com `ROLLBACK`.

Governança:
- ratchet `tests/security/emergency-contacts-authority.test.ts`;
- warnings de `create_emergency_contact` e `patch_emergency_contact` classificados em `SUPABASE_ADVISOR_RESIDUALS.json`.

**Estado:** G25 fechado no banco, service e governança sem remover contatos de emergência.

Próximo gate obrigatório:
1. auditar envio a contatos externos e `emergency_delivery_log`: autenticação da Edge Function, ownership do alerta/contato e writes do log;
2. impedir disparo arbitrário para contatos de outros usuários ou fabricação de delivery status/target;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G26 — broker de e-mail de emergência lifecycle-bound (2026-09-09)

Auditoria real:
- `send-emergency-email` remoto v31 estava ACTIVE, `verify_jwt=true`, e o source remoto era byte-equivalente à `main` após normalização de EOL;
- o broker já aceitava somente `alertId/contactId`, autenticava o usuário, carregava Profiles/alert/contact no backend e exigia alerta pertencente ao usuário + contato ligado ao mesmo Profile e ativo;
- `emergency_delivery_log` está completamente fechado ao browser: somente `service_role` possui DML e não existem policies públicas;
- rate-limit persistente usa o próprio delivery log server-owned;
- o gap restante era lifecycle: o broker não selecionava `alert.status`, permitindo reenvio de e-mail para alerta já `resolved`/`false_alarm` em janelas futuras.

Correção aplicada:
- `AlertRecord` e a query canônica passaram a carregar `status`;
- o broker agora bloqueia qualquer alerta diferente de `active`, audita `reason=alert_not_active` e retorna 409 antes de consultar/enviar para o provider;
- nenhuma alteração em recipient derivation, Resend secret, rate limit ou delivery-log ownership;
- função redeployada como `send-emergency-email` **v32 ACTIVE**, mantendo `verify_jwt=true`;
- source remoto v32 confirmado exatamente igual à `main`;
- ratchet `safety-notification-core-security.test.ts` protege seleção do status e o guard `alert.status !== 'active'`.

**Estado:** G26 fechado. Alertas encerrados não podem voltar a disparar e-mail externo.

Próximo gate obrigatório:
1. inventariar writers autenticados restantes em tabelas Safety após G23–G26;
2. corrigir somente DML que ainda permita alterar autoridade/lifecycle/provenance;
3. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G28 — moderação de motorista append-only (2026-09-09)

Reconciliação runtime > docs:
- `driver_moderation_events` é declarado desde a migration original como trilha **imutável**, mas o banco real ainda concedia INSERT/UPDATE/DELETE a `authenticated` via policy admin `FOR ALL`;
- o runtime `DriverModerationEventsService.createEvent` ainda fazia INSERT direto e aceitava `adminProfileId` vindo do browser;
- a referência documental antiga a `20260718163000` como hardening dessa trilha estava incorreta: a migration real desse timestamp é `harden_profile_verification_transitions` e não altera `driver_moderation_events`;
- tabela possuía 0 eventos persistidos no momento da correção, então não houve transformação de histórico existente.

Correção de raiz:
- migration `20260909204327_lock_driver_moderation_history_g28.sql` aplicada e versionada;
- novo command `append_driver_moderation_event` exige role admin/super_admin válida e deriva `admin_profile_id` de um Profile ativo **pertencente** ao usuário autenticado;
- `created_at` é server-owned;
- action, reason e metadata possuem validação bounded;
- `INSERT/UPDATE/DELETE authenticated` foram revogados da tabela;
- policy admin `FOR ALL` foi removida e substituída por SELECT-only;
- motorista mantém SELECT do próprio histórico;
- `DriverModerationEventsService` passou a usar apenas a RPC de append;
- `adminProfileId` foi removido do contrato do service, do runtime admin e do hook do painel;
- adapter tipado estreito evita editar manualmente `types.generated.ts` antes da próxima sincronização canônica.

Prova transacional `BEGIN/ROLLBACK`:
- admin real ativo conseguiu append;
- `admin_profile_id` retornado pertenceu ao usuário admin autenticado e o timestamp foi produzido pelo servidor;
- INSERT, UPDATE e DELETE direto falharam sob role SQL `authenticated`;
- motorista não-admin conseguiu ler o próprio evento;
- motorista não-admin foi bloqueado ao tentar append;
- após ROLLBACK, `driver_moderation_events` voltou ao count original 0.

Governança:
- ratchet `tests/security/driver-moderation-authority.test.ts`;
- warning esperado de `append_driver_moderation_event` classificado em `SUPABASE_ADVISOR_RESIDUALS.json`.

**Estado:** G28 fechado; a trilha de moderação agora corresponde ao contrato imutável declarado pelo próprio projeto.

Próximo gate obrigatório:
1. auditar `driver_routes`, a última exceção com DML `authenticated` no inventário operacional Mobility;
2. manter CRUD somente se ownership, lifecycle, payload e callers reais justificarem escrita browser-side;
3. se estiver correto, não criar broker redundante e avançar para same-SHA/runtime/E2E.

### Checkpoint G29 — agregado de rotas fail-closed sem remover a feature (2026-09-09)

Auditoria do runtime:
- `driver_routes`, `route_reservations` e `route_trips` formam a base histórica da capability de rotas/caronas;
- não existe writer runtime atual em `src` para `driver_routes` ou `route_reservations`; o único consumer explícito localizado fora de migrations/types é leitura server-side no export LGPD;
- as três tabelas estavam vazias no banco real;
- `route_trips` já era read-only para `authenticated`, porém `driver_routes` e `route_reservations` ainda concediam INSERT/UPDATE/DELETE com policies antigas `FOR ALL`.

Bypass reproduzido em `BEGIN/ROLLBACK`:
- motorista autenticado criou uma rota própria já em `status='completed'` e com `created_at=2001-01-01`;
- outro usuário autenticado criou reserva nessa rota diretamente em `status='confirmed'`, também com timestamp fabricado;
- ownership RLS não impedia spoof de lifecycle/provenance;
- transação foi revertida e as tabelas voltaram ao count 0.

Correção de raiz:
- migration `20260909205121_fail_close_dormant_route_writes_g29.sql` aplicada e versionada;
- `INSERT/UPDATE/DELETE authenticated` revogados de `driver_routes` e `route_reservations`;
- policies antigas de gerenciamento `FOR ALL` foram removidas;
- leitura histórica do motorista foi preservada por policy SELECT-only `Drivers view own routes`;
- `Reservation participants view`, `Active routes viewable` e `route_trips_participant_read` permanecem;
- nenhuma tabela, FK, tipo, export LGPD ou capability de domínio foi removida;
- o agregado fica preparado para futura implementação correta via commands de lifecycle, em vez de reabrir DML genérico.

Governança:
- ratchet `tests/security/mobility-route-aggregate-authority.test.ts` preserva schema/leitura e proíbe retorno de DML direto no frontend.

**Estado:** G29 fechado. A capability de rotas foi preservada, mas a superfície de escrita latente ficou fail-closed.

Próximo gate obrigatório:
1. refazer o inventário de DML operacional Mobility e confirmar zero writers genéricos fora dos commands/brokers intencionais;
2. congelar a rodada estrutural se o inventário estiver limpo;
3. avançar para certificação same-SHA: source/runtime, testes estáticos disponíveis, build/E2E e responsividade antes de abrir `PUBLIC_LAUNCH_SURFACES.mobility`.

### Checkpoint G30 — Delivery broker-owned até a tabela (2026-09-09)

Reconciliação:
- o runtime atual já usa `OrderDeliverySSOTService -> DeliveryRpcService -> delivery-rpc`;
- `delivery-rpc` remoto observado ACTIVE v8 com `verify_jwt=true`;
- backing RPCs `delivery_report_occurrence` e `delivery_resolve_occurrence` estão `service_role=true`, `authenticated=false`, `anon=false`;
- a arquitetura e o validador já proíbiam writes diretos em `orders`, `order_items`, `order_timeline_events` e `delivery_occurrences`;
- apesar disso, grants/policies históricos ainda concediam DML a `authenticated`: `orders` INSERT/UPDATE/DELETE, `order_items` INSERT e `delivery_occurrences` INSERT/UPDATE.

Correção de raiz:
- migration `20260909205630_close_delivery_direct_table_writes_g30.sql` aplicada e versionada;
- `INSERT/UPDATE/DELETE authenticated` revogados de `orders`, `order_items` e `delivery_occurrences`;
- policies antigas `orders_insert`, `orders_update`, `order_items_insert`, `delivery_occurrences_insert` e `delivery_occurrences_update` removidas;
- policy admin `FOR ALL` de orders foi substituída por SELECT-only, preservando observabilidade administrativa sem reabrir mutação;
- leitura de participantes em orders/items/timeline/occurrences permanece;
- service_role e backing RPCs continuam owners das mutações;
- nenhuma mudança foi feita em payload/lifecycle do delivery-rpc.

Governança:
- `tests/security/delivery-rpc-security.test.ts` agora ratcheta também os grants/policies de tabela;
- `validate-delivery-architecture-boundaries.ts` continua proibindo retorno de DML direto no runtime.

**Estado:** G30 fechado. O contrato broker-owned agora vale também nos grants reais do banco, não apenas no código e nas funções.

Próximo gate obrigatório:
1. congelar novas refatorações estruturais de autoridade se o inventário core Mobility/Delivery estiver limpo;
2. obter SHA atual da `main` e reconciliar fontes remotas críticas (`mobility-rpc`, `delivery-rpc`, migrations);
3. executar o máximo possível da certificação same-SHA sem depender de GitHub Actions: ratchets, validações, build/deploy e smoke/E2E disponíveis;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até a certificação final.

### Checkpoint G31 — aposentadoria de validadores operacionais obsoletos (2026-09-09)

Inventário de código/callers:
- `tools/supabase/validate-gate3-metadata.mjs`, `validate-reconciliation-final.ts` e `validate-constraints-final.ts` eram validadores históricos com `service_role` e DML bruto sobre agregados hoje server-owned;
- nenhum dos três é rota, package script, workflow, Edge Function ou owner funcional vivo;
- `auto-dispatch-ride` foi preservado: é backend vivo, coberto por policy/testes e usa os commands atômicos canônicos;
- testes operacionais que usam admin para fixture/cleanup permanecem separados do runtime de produto e continuam protegidos pelo boundary de ambiente isolado.

Correção de raiz:
- [x] removidos os três validadores obsoletos em vez de adaptá-los para continuar furando a autoridade nova;
- [x] allowlist de `GUARDED_MUTATING_OPERATIONAL_ENTRYPOINTS` limpa para não legitimar entrypoints aposentados;
- [x] `SERVICE_ROLE_BOUNDARY_POLICY.json` deixou de autorizar os dois operator scripts removidos que ainda constavam na policy;
- [x] `remote-e2e-mutation-safety.test.ts` ganhou ratchet explícito de ausência dos três paths e das allowlists antigas;
- [x] nenhuma tabela, migration, RPC, Edge Function ou fluxo de usuário foi removido/modificado neste corte.

**Estado:** inventário de tooling operacional reconciliado com a autoridade server-owned atual. Não há motivo para manter scripts de diagnóstico que só funcionam violando o contrato que deveriam validar.

Próximo gate obrigatório:
1. reconciliar o SHA atual da `main` com as fontes remotas críticas (`mobility-rpc`, `delivery-rpc` e migrations aplicadas);
2. executar os ratchets/validators estáticos disponíveis no mesmo SHA;
3. executar build + E2E/smoke responsivo quando o runner/provider estiver disponível;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até a certificação same-SHA final.

### Checkpoint G32 — reconciliação same-SHA do dispatch runtime (2026-09-09)

Reconciliação no Supabase canônico `xhdowzacfujckjelqhtd` contra a `main`:
- baseline Git do início da prova: `84ad26a2bfbc3db43b76ded62d58c60bcca8114f`;
- projeto remoto observado `ACTIVE_HEALTHY`;
- `mobility-rpc` **v24 ACTIVE**, `verify_jwt=true`: entrypoint + `_shared/accountOperational.ts` + `_shared/security.ts` byte-a-byte iguais ao Git;
- `delivery-rpc` **v8 ACTIVE**, `verify_jwt=true`: entrypoint + mesmos shared files byte-a-byte iguais ao Git;
- foi encontrado drift real em `auto-dispatch-ride v24`: o runtime remoto ainda executava o desenho antigo com DML direto em `ride_requests`, `ride_state_audit` e `ride_dispatch_audit`, enquanto o Git já usava os commands atômicos;
- a causa raiz foi corrigida no runtime, sem criar fluxo paralelo: `auto-dispatch-ride` foi redeployado a partir do source canônico do Git e passou a **v25 ACTIVE**;
- `auto-dispatch-ride v25`, `_shared/security.ts` e `_shared/validation.ts` foram re-lidos do runtime e estão byte-a-byte iguais ao Git;
- `verify_jwt=false` foi preservado intencionalmente no auto-dispatch porque ele é job backend autenticado por `CRON_SECRET`, não endpoint de usuário;
- migrations remotas estão presentes até `20260909205630_close_delivery_direct_table_writes_g30`; as 12 migrations finais G18→G30 também existem fisicamente na `main`;
- grants reais confirmam `authenticated` sem `INSERT/UPDATE/DELETE` em `ride_requests`, availability/location, offers, routes/reservations, ride chat/share, orders/items/timeline/occurrences; commands críticos de Mobility/Delivery permanecem executáveis diretamente apenas por `service_role`;
- invariantes pós-cutover: **0** offers `pending/sent` em corrida terminal, **0** dispatch `pending` em corrida terminal e **0** `driver_availability.active_ride_id` apontando para corrida terminal;
- ratchet de `mobility-rpc-security.test.ts` reforçado para exigir os commands atômicos e proibir retorno de UPDATE direto de `ride_requests` ou INSERT/UPDATE direto dos audits no auto-dispatch.

**Estado:** source Git, brokers remotos, auto-dispatch e grants principais estão reconciliados neste checkpoint. A regressão real encontrada no runtime foi corrigida na raiz, não mascarada.

**Não certificado ainda:** isto não equivale a build/E2E/smoke/deploy web same-SHA. `PUBLIC_LAUNCH_SURFACES.mobility=false` permanece obrigatório até essas provas.

Próximo gate:
1. executar ratchets/validators estáticos do SHA deste checkpoint;
2. validar build de produção no mesmo SHA;
3. executar E2E operacional positivo/negativo + smoke responsivo;
4. provar deploy web no mesmo SHA;
5. só então discutir abertura da Mobilidade.

### Checkpoint G33 — remover acesso dinâmico de ServiceAreasService (2026-09-09)

Falha real encontrada no último build Vercel que chegou a executar o gate de arquitetura:
- `incremental-baseline: novo acesso nao autorizado: dynamic-table|<dynamic>|read|src/core/service-areas/services/ServiceAreasService.ts`;
- a causa era `findSingleIdByProfile(table, profileId)`, um mini-cliente Supabase genérico que escolhia `business_data`, `professional_data` ou `driver_data` por nome de tabela;
- **não** foi adicionada exceção ao baseline.

Correção de raiz:
- [x] `ServiceAreasService` deixou de importar/usar Supabase diretamente para resolver identidade;
- [x] `profiles` passa pelo `profileService.getProfileById`;
- [x] empresa usa `getBusinessDataIdByProfileId` do owner canônico de Business;
- [x] Professional ganhou `getProfessionalDataIdByProfileId` dentro de `professional.queries.ts`, exposto pela fachada canônica;
- [x] Mobility ganhou `getDriverDataIdByProfileId` dentro de `mobility.queries.ts`, exposto pela fachada canônica;
- [x] removidos `ProfileEntityDbClient`, `QueryBuilder` local e `findSingleIdByProfile` de Service Areas;
- [x] ratchet de coverage agora exige os owners canônicos e proíbe a volta de `.from(table)` no serviço.

Motivo arquitetural:
- Coverage continua sendo o único owner da persistência de `service_areas`;
- Service Areas apenas orquestra identidade → entidade de cobertura;
- cada tabela de identidade permanece lida pelo próprio domínio, sem novo repositório paralelo e sem acesso dinâmico não rastreável.

**Certificação:** a correção fecha a violação estática conhecida por construção. Build/CI completo ainda precisa rodar no mesmo SHA quando runner/Vercel voltarem a executar; não marcar como PASS antes disso.

### Checkpoint G34A — sincronização bulk canônica de Service Areas (2026-09-09)

Preparação para remover a autoridade duplicada de cobertura em `professional_data`:
- [x] `ServiceAreasService.replaceServiceAreas(profileId, locationIds)` resolve Profile → entidade canônica;
- [x] deduplica `Location IDs` e chama uma única vez `coverageRepository.replaceByEntity`;
- [x] bairros/distritos são persistidos como `CoverageType.DISTRICT`, com primeiro item primário e status ACTIVE;
- [x] a operação usa o comando bulk server-owned `replace_entity_coverage`; não existe loop browser de insert/delete;
- [x] ratchet exige o caminho bulk canônico.

Evidência remota antes da migração:
- `professional_data`: 5 linhas;
- `service_areas` legado JSONB não vazio: 0;
- `service_radius_km` legado não nulo: 0;
- `public.service_areas`: 0 linhas.
Logo não há conteúdo a converter; o trabalho é eliminar a autoridade duplicada do código sem perda de dados.

Próximo corte:
1. cadastro/edição devem selecionar e persistir `locations.id` via `replaceServiceAreas`;
2. remover leitura/escrita de `professional_data.service_areas/service_radius_km` do runtime atual;
3. somente após deploy web do código novo, dropar as colunas legadas no banco para não quebrar o frontend production ainda antigo.

### Checkpoint G34B — cadastro profissional escreve apenas Coverage SSOT (2026-09-09)

- [x] formulário de cadastro deixou de guardar nomes como autoridade; seleção agora usa `locations.id` em `serviceAreaLocationIds`;
- [x] UI continua exibindo nomes derivados de `ServiceAreaOption`, sem persistir label textual;
- [x] payload de `ProfessionalService.createProfessional` não envia mais `service_areas` nem deriva `neighborhood` da seleção;
- [x] após criação, `ServiceAreasService.replaceServiceAreas(profile_id, locationIds)` grava o conjunto no comando bulk canônico;
- [x] submit fica bloqueado durante criação + coverage para impedir dupla submissão;
- [x] se a criação já concluiu e coverage falhar, o fluxo não repete a criação silenciosamente: informa cobertura pendente e encerra o wizard;
- [x] ratchet impede regressão de `service_areas: form...` no cadastro.

Ainda pendente neste eixo:
- edição e read-model profissional ainda precisam deixar de usar o JSONB legado;
- colunas físicas só podem ser dropadas após o frontend novo estar efetivamente publicado.

### Checkpoint G34C — edição profissional usa somente Coverage SSOT (2026-09-09)

- [x] edição carrega a cobertura por `useServiceAreas(profile_id)`, que resolve o Profile para a entidade canônica;
- [x] estado do formulário usa somente `serviceAreaLocationIds: string[]`; não inicializa mais por `professional.service_areas`;
- [x] bairros existentes são exibidos por labels derivados do Coverage/Location canônico, inclusive se não estiverem na lista corrente de opções;
- [x] `buildProfessionalUpdateInput` não escreve mais `professional_data.service_areas`;
- [x] após atualizar os dados do profissional, a cobertura é substituída pelo comando bulk canônico `replaceServiceAreas`;
- [x] sucesso só é exibido depois de dados + coverage concluírem;
- [x] se os dados salvarem e coverage falhar, a UI informa **dados salvos; cobertura pendente**, mantém alterações pendentes e evita reupload de mídia ou reprocessamento do slug;
- [x] ratchet proíbe retorno de `professional.service_areas` e `service_areas: form...` no fluxo de edição.

Limite consciente:
- atualização de Professional e Coverage ainda são dois comandos distintos; não foi simulada atomicidade inexistente;
- unir ambos em um aggregate command só deve ser feito se o domínio exigir transação cross-aggregate, não como gambiarra para esconder falha parcial.

Próximo corte:
1. remover os campos legados do read-model, schema e lifecycle de Professional;
2. migrar telas/projeções que ainda exibem `professional.service_areas/service_radius_km`;
3. ajustar export LGPD para exportar Coverage canônico em vez desses campos;
4. manter o DROP físico das colunas bloqueado até o frontend novo estar publicado.

### Checkpoint G34D1 — remover coverage legado do runtime Professional (2026-09-09)

- [x] `ProfessionalDataRecord`, `Professional` e inputs create/update deixaram de expor `service_areas/service_radius_km`;
- [x] mapper e `PROFESSIONAL_READ_SELECT` não leem mais as duas colunas;
- [x] schema e lifecycle não validam, sanitizam nem escrevem esses campos;
- [x] página pública preserva “bairros atendidos”, agora combinando Professional com `useServiceAreas(profile_id)`;
- [x] Central Profissional exibe Coverage canônico e raio somente quando existir coverage `radius`;
- [x] fixture E2E deixou de fabricar JSONB legado e passa a chamar `replace_entity_coverage` com `locations.id`;
- [x] ratchet bloqueia retorno das duas propriedades ao runtime Professional.

As colunas físicas continuam temporariamente no banco por compatibilidade com o frontend production antigo. Elas não são mais autoridade no código novo.

Próximo corte:
1. mover export LGPD para Coverage canônico e retirar as duas colunas do payload Professional;
2. reconciliar/deployar `user-export-data` no Supabase;
3. manter DROP físico bloqueado até deploy web same-SHA do frontend novo.

### Checkpoint G34D2 — export LGPD usa Coverage canônico (2026-09-09)

- [x] `user-export-data` não seleciona mais `professional_data.service_areas/service_radius_km`;
- [x] export coleta os `professional_data.id` pertencentes ao titular e lê `public.service_areas` somente com `entity_type='service_provider'` e `entity_id IN (...)`;
- [x] payload `professional_profiles` agora separa `profiles`, `coverage` e `stats`;
- [x] `service_areas` foi adicionada explicitamente à authority read-only do account export;
- [x] matriz LGPD JSON/MD documenta Coverage como fonte canônica e proíbe os dois campos legados no novo payload;
- [x] testes estáticos ratcheteiam a source table, filtro de ownership e ausência do trecho legado.

Estado de rollout:
- o projeto Supabase canônico não possui `user-export-data` implantada neste momento;
- `LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE=false` permanece intencional;
- portanto **nenhum deploy foi criado** neste checkpoint. Implantar a função agora violaria o preflight/rollout ainda não certificado.

Próximo gate deste eixo:
1. executar a suíte LGPD/security quando houver runner;
2. validar o handler em ambiente não-prod;
3. só depois promover o marker de implementação e considerar deploy;
4. DROP físico das colunas Professional continua dependente do frontend novo publicado.

### Checkpoint G35A — preparar authority broker-owned de Professional (2026-09-09)

Auditoria real do banco e callers:
- `authenticated` ainda possui `INSERT/UPDATE/DELETE` em `professional_data` e a policy `Active professional managers modify professional data` continua `FOR ALL`;
- `professional_stats` também mantém DML browser;
- existem dois writers vivos de produto em `professional_data`: `professional.profile-lifecycle.ts` e o adapter multi-profile;
- `profile-rpc v13 ACTIVE` já é o broker autenticado de mutações privilegiadas de Profile, então **não** foi criado um novo `professional-rpc`;
- foi confirmada dívida maior: `ProfileService` principal ainda cria/atualiza `profiles` por DML direto enquanto a stack multi-profile já usa `ProfileRpcService`. Isso fica como próximo eixo de convergência, não como justificativa para manter writer duplicado de Professional.

Correção preparada:
- [x] `profile-rpc` ganhou ações `createProfessional`, `updateProfessionalData` e `deactivateProfessional`;
- [x] lifecycle principal cria/atualiza/desativa Professional pelo `ProfileRpcService`; não faz mais DML de `professional_data`;
- [x] adapter multi-profile também deixa de fazer UPDATE direto;
- [x] criação Professional será atômica no Postgres: `profiles + professional_data + membership + contato + professional patch` usam o broker existente numa única transação;
- [x] `professional_stats` passa a nascer por trigger idempotente e recebe backfill de linhas faltantes;
- [x] patch Professional no banco é allowlist fechada e não aceita `is_verified`, rating, ownership ou outros campos de autoridade;
- [x] slug recebe enforcement server-side de formato, reserved names, índice único existente e cooldown de 30 dias;
- [x] broker + SQL rejeitam limpar `location_id` e rejeitam nome/categoria obrigatórios vazios;
- [x] testes ratcheteiam ausência de DML direto e presença dos novos targets service-role.

Compatibilidade deliberada:
- **G35A é estágio aditivo.** A migration ainda **não revoga** DML de `authenticated` nas tabelas, porque o deploy web production atual está muito atrás da `main`;
- revogar agora quebraria o frontend publicado antigo. A revogação deve ser um cutover separado após o novo SHA web estar comprovadamente LIVE;
- isso não transforma os grants antigos em arquitetura aprovada: eles são compatibilidade temporária explicitamente bloqueada para remoção no cutover.

Próximos gates:
1. aplicar a migration G35A no Supabase canônico;
2. redeployar `profile-rpc` a partir do source exato do commit;
3. comparar remote/source byte-a-byte e auditar grants dos novos RPCs;
4. provar invariantes de stats e slug;
5. após frontend same-SHA LIVE, executar G35B: revogar DML browser de `professional_data/professional_stats` e remover policy de escrita direta;
6. abrir G36 para convergir a stack antiga de `ProfileService` que ainda usa DML direto em `profiles`.

### Checkpoint G35A3 — Professional broker reconciliado no runtime (2026-09-09)

Provas same-source/runtime:
- migration `server_own_professional_data_mutations_g35` aplicada no Supabase canônico;
- `profile-rpc` redeployado a partir do commit G35A e agora está **v14 ACTIVE**, `verify_jwt=true`;
- entrypoint remoto + `_shared/accountOperational.ts` + `_shared/security.ts` estão **byte-a-byte iguais** ao Git do commit `d3543bc9d29cab8bf358a70c6cb66336b46d1f14`;
- novos targets `profile_rpc_create_professional`, `profile_rpc_update_professional_data` e `profile_rpc_deactivate_professional` são `SECURITY DEFINER`, com EXECUTE `anon=false`, `authenticated=false`, `service_role=true`;
- triggers de slug policy e criação idempotente de `professional_stats` estão ativos.

Achado e correção de integridade:
- a reconciliação revelou 5 linhas de `professional_data` para apenas 4 Profiles;
- a duplicata era um seed explícito ligado ao mesmo Profile de uma extensão antiga canônica;
- o registro canônico correspondia ao nome do Profile e possuía credential; o seed carregava somente um canal de contato;
- migration `enforce_unique_professional_profile_extension_g35` foi escrita sem UUID hardcoded, escolhe canônico por identidade/credential/idade, falha fechado diante de referências operacionais ou conflito de contato, move contato seguro, remove duplicata e cria `UNIQUE(profile_id)`;
- pós-migration: **professional_data=4**, **Profiles distintos=4**, **professional_stats=4**, **missing_stats=0**, **duplicate groups=0**;
- constraint `professional_data_profile_id_key UNIQUE(profile_id)` está ativa;
- contato e credential do Profile reconciliado permaneceram presentes.

Probe transacional real, com rollback:
- owner update: PASS;
- cross-owner update: rejeitado;
- tentativa de limpar `location_id`: rejeitada fail-closed;
- create Professional: PASS;
- criação automática do `professional_data`: PASS;
- criação automática de stats: PASS;
- deactivate Professional: PASS;
- rollback final: nenhuma entidade de probe persistida.

**Estado G35A:** broker/server authority nova está implementada e reconciliada. O único ponto propositalmente ainda aberto é o cutover dos grants antigos de tabela, bloqueado pelo frontend production desatualizado.

Próximo:
1. não revogar grants de `professional_data/professional_stats` até o frontend novo estar LIVE;
2. quando houver deploy web same-SHA comprovado, executar G35B removendo a policy/table DML browser;
3. seguir G36: convergir a stack principal de `ProfileService/profile.mutations.ts`, que ainda faz DML direto em `profiles`, com o `ProfileRpcService` já canônico no multi-profile.

### Checkpoint G36A — Profile self-service broker-owned (2026-09-09)

Auditoria de raiz:
- a stack principal `ProfileService/profile.mutations.ts` ainda atualizava `public.profiles` diretamente no browser;
- a stack multi-profile já usava `profile-rpc` para create/handle/delete, mas ainda fazia UPDATE base via `updateLooseRows('profiles', ...)`;
- `UpdateProfilePayload` misturava dados self-service com suspensão, verificação, ride state e outros campos administrativos;
- o banco mantém `username` e `handle` como identidades distintas; `profile_rpc_update_profile_handle` altera somente `handle`;
- a UI Admin ainda tentava escrever `is_verified_resident`, coluna que **não existe** no schema remoto atual. O estado canônico de verificação do Profile é `verified/verified_at`.

Correção G36A preparada:
- [x] novo `OwnedProfileUpdatePayload` contém apenas campos editáveis pelo owner/manager; suspensão, verificação, ride state, metadata arbitrária e reputação não fazem parte do contrato;
- [x] `ProfileService.updateProfile` e o adapter multi-profile enviam updates por `ProfileRpcService.updateOwnedProfile`;
- [x] username é separado do patch de dados e validado tanto no cliente quanto no servidor; o servidor exige Profile pessoal, formato, reserved names, unicidade e cooldown;
- [x] histórico de username preserva ator real do broker via contexto transacional e continua classificando mudança do owner/manager como `user_requested`;
- [x] `updateProfile/updatePrivacySettings/deleteProfile/switchActiveProfile` do barrel permanecem funcionais, mas update/delete/switch passam pelos brokers canônicos;
- [x] auto-clear de suspensão expirada em Mobilidade usa comando específico `clearExpiredSuspension`, que só pode limpar estado já expirado;
- [x] componentes Admin deixam de usar `ProfileService.updateProfile` para moderação; writes administrativos ficam explicitamente em `AdminUserService` até o G36C;
- [x] Admin deixa de expor a flag fantasma `is_verified_resident` e passa a consumir `verified/verified_at`;
- [x] migration cria `profile_rpc_update_owned_profile` e `profile_rpc_clear_expired_suspension` como targets service-role-only;
- [x] ratchet cobre broker, tipos, separação Admin/Mobility e compatibilidade de grants.

Compatibilidade/cutover:
- G36A **não revoga** ainda INSERT/UPDATE/DELETE de `authenticated` em `public.profiles`, pois o frontend production publicado continua atrasado;
- criação direta de Profile usada pelo create Business permanece para o G36B, que deve converter o agregado Business de forma atômica;
- writes administrativos e resíduos driver/ride em `profile.mutations.ts` ficam para G36C, em seus respectivos owners;
- somente depois de frontend same-SHA LIVE e G36B/G36C concluídos deve existir migration de revogação dos grants browser em `profiles`.

Próximo imediato:
1. aplicar migration G36A no Supabase canônico;
2. redeployar `profile-rpc` com source exato do commit;
3. provar EXECUTE service-role-only, source equality e probes transacionais de owner/cross-owner/server-field/username/expiry;
4. então abrir G36B para criação Business atômica via broker existente.

### Checkpoint G36A2 — Profile self-service reconciliado no runtime (2026-09-09)

Provas executadas no Supabase canônico:
- migration `broker_owned_profile_self_service_g36` aplicada com sucesso;
- `profile-rpc` atualizado para **v15 ACTIVE**, `verify_jwt=true`;
- entrypoint remoto, `_shared/accountOperational.ts` e `_shared/security.ts` estão byte-a-byte iguais ao commit `8c12a2e7bdcda5f46e020a8cea9eb371abd0edeb`;
- `profile_rpc_update_owned_profile` e `profile_rpc_clear_expired_suspension` são `SECURITY DEFINER` e têm EXECUTE direto `anon=false`, `authenticated=false`, `service_role=true`;
- os triggers existentes de campos server-owned, histórico de username e avatar continuam ativos;
- grants de INSERT/UPDATE/DELETE de `authenticated` em `profiles` permanecem **intencionalmente** durante a janela de compatibilidade do frontend production antigo.

Probe transacional real, seguido de `ROLLBACK`:
- owner update de campo permitido: PASS;
- ator sem ownership: rejeitado;
- tentativa de escrever `verified` pelo patch self-service: rejeitada;
- username reservado: rejeitado;
- username válido e único: PASS;
- histórico da troca pelo broker classificou o ator como `user_requested`: PASS;
- suspensão ainda futura: comando de expiry não alterou o estado;
- suspensão já expirada: comando limpou o estado;
- rollback confirmado: username/bio/suspensão originais preservados e zero histórico de probe persistido.

Advisor:
- nenhum dos dois novos RPCs G36 aparece nas categorias de SECURITY DEFINER executável por `anon/authenticated`;
- o Advisor continua reportando dívidas preexistentes do projeto (RLS/policies, extensões em `public`, SECURITY DEFINER antigos e proteção de senha vazada). Não transformar essa lista em remoção em massa: auditar por authority/contrato.

**G36A runtime: PASS.**

Próximo: G36B deve migrar a criação Business fragmentada (`profiles + business_data + membership + stats + hours/contact`) para uma transação broker-owned existente, sem criar novo broker concorrente.

### Checkpoint G36B — Business lifecycle broker-owned (2026-09-09)

Auditoria de raiz:
- `public.business_data`: 97 linhas / 97 Profiles distintos / 0 duplicatas por `profile_id`;
- `public.business_stats`: **0 linhas**, portanto 97 Businesses sem o agregado de stats esperado pelo runtime;
- `public.business_hours`: 0 linhas;
- `business_data` já está fail-closed para DML de `authenticated`, enquanto o `business.mutations.ts` ainda tentava INSERT/UPDATE direto: create/update/delete gerais estavam estruturalmente incompatíveis com o banco atual;
- `business_stats` e `business_hours` ainda mantêm grants de DML autenticado por compatibilidade com callers antigos;
- `addresses` continua sendo agregado separado com RLS `owner_user_id = auth.uid()`; o create Business antigo criava Address sem `owner_user_id`, incompatível com essa policy;
- slugs Business: 90 preenchidos, 7 vazios, 0 uppercase, 0 grupos duplicados normalizados; a unicidade correta é territorial/brand-hub, portanto **não** adicionar UNIQUE global em slug;
- `BusinessIdentityPolicy.cooldownDays=0`; formato/reserved names continuam obrigatórios, mas não inventar cooldown de Business;
- rede/filiais já têm owner especializado `NetworkService -> business-network-rpc`; lifecycle geral não pode editar `business_role/parent_business_id/is_headquarters/unit_name`.

Desenho G36B:
- [x] reutilizar o **`profile-rpc` existente**, sem criar `business-rpc` concorrente;
- [x] novo create geral é uma transação server-owned de Profile + membership + `business_data` + stats + hours + contact;
- [x] Address permanece agregado separado; broker valida ownership/território do `address_id`; Address novo recebe `owner_user_id` e só é compensado se ainda não tiver sido anexado;
- [x] `business_data(profile_id)` ganha unicidade explícita;
- [x] trigger idempotente `business_data_ensure_stats` cria stats também para filiais criadas por outros comandos internos;
- [x] migration faz backfill dos 97 stats faltantes quando aplicada;
- [x] patch Business usa allowlist fechada; verificação/premium/counters/estrutura de rede não são self-service;
- [x] metadata Business deixa de ser escape genérico e aceita somente os campos owner-editable realmente usados pelo mapper/UI;
- [x] horários são substituídos dentro da mesma transação e os JSON shadows permanecem sincronizados por compatibilidade;
- [x] contato é gravado pelo `contact_rpc_patch_owned_channels` canônico dentro da transação;
- [x] `BusinessService.create/update/delete` deixam de executar DML direto em `business_data/business_stats/business_hours`;
- [x] o create genérico de Profile rejeita `profile_type=business`; create geral passa por `BusinessService.createBusiness`, e branches continuam em `NetworkService`.

Provas pré-aplicação, todas com `BEGIN/ROLLBACK`:
- migration completa compilou/executou sem erro;
- create criou Profile + membership + Business + stats + hours + contact juntos;
- cross-owner foi bloqueado;
- escrita self-service de `is_verified` foi bloqueada;
- mudança estrutural `business_role` foi bloqueada;
- Address pertencente a outro ator foi bloqueado;
- update sincronizou nome do Profile, dados Business, hours e contact;
- create com slug reservado `admin` foi rejeitado sem deixar linha parcial;
- soft-delete alterou Profile e Business juntos;
- metadata arbitrário e metadata boolean inválido foram bloqueados.

**Estado:** source e probes G36B estão prontos para commit; nada deste checkpoint foi persistido no Supabase ainda.

Próximo imediato:
1. commit do source/migration/ratchets;
2. aplicar a migration exatamente desse SHA;
3. redeployar `profile-rpc` exatamente desse SHA;
4. provar 97/97 stats, UNIQUE(profile_id), grants service-role-only dos novos RPCs e source equality;
5. repetir probe transacional sobre o runtime persistido;
6. então abrir G36C para admin/driver/ride writers restantes.

### Checkpoint G36B2 — Business reconciliado no runtime (2026-09-09)

Aplicação/reconciliação do commit `bae5977d54b26b2a8fe9e4a1a7b97d89498e2888`:
- migration `broker_owned_business_lifecycle_g36`: aplicada com sucesso no Supabase canônico;
- `profile-rpc`: **v16 ACTIVE**, `verify_jwt=true`;
- entrypoint remoto + `_shared/accountOperational.ts` + `_shared/security.ts`: byte-a-byte iguais ao SHA;
- estado Business após backfill: **97 business_data / 97 business_stats / 0 stats faltantes / 0 business_id incorretos / 0 duplicatas por profile_id**;
- constraint `business_data_profile_id_key UNIQUE(profile_id)`: ativa;
- trigger `business_data_ensure_stats`: ativo;
- `profile_rpc_create_business`, `profile_rpc_update_business` e `profile_rpc_deactivate_business`: EXECUTE direto `anon=false`, `authenticated=false`, `service_role=true`;
- `business_data` permanece sem DML para browser; `business_stats/business_hours` conservam grants autenticados temporariamente por compatibilidade com callers ainda não migrados.

Probe transacional sobre o runtime persistido, seguido de `ROLLBACK`:
- create completo Profile + membership + Business + stats + hours + contact: PASS;
- cross-owner: bloqueado;
- server-owned `is_verified`: bloqueado;
- campo estrutural `business_role`: bloqueado;
- metadata arbitrário e tipo inválido: bloqueados;
- Address de outro owner: bloqueado;
- update de nome/contact/hours sincronizado: PASS;
- create com reserved slug: bloqueado sem resíduo;
- soft-delete Profile + Business: PASS;
- rollback confirmado: 97/97 preservados e 0 linhas Profile/Business/contact do probe persistidas.

Advisor:
- nenhum dos três novos RPCs Business aparece como SECURITY DEFINER executável por `anon/authenticated`;
- findings globais antigos permanecem e devem ser auditados por authority, não corrigidos em massa.

CI/deploy:
- Vercel do SHA falhou por `Deployment rate limited — retry in 24 hours`;
- jobs GitHub marcados como failure não executaram nenhum step (`steps=[]`) e não produziram job logs;
- portanto **não há evidência de falha de teste do código**, mas build/typecheck/Vitest do SHA continuam não certificados por runner real.

**G36B runtime: PASS.**
**G36B build/typecheck: PENDENTE DE RUNNER REAL.**

Próximo: G36C deve retirar os writers restantes de Admin/Driver/Ride da stack genérica de Profile, mantendo cada mutação no owner de domínio e sem revogar grants de compatibilidade antes do frontend same-SHA LIVE.

### Checkpoint G36C1 — Profile deixa de escrever active_ride_id (2026-09-09)

Auditoria:
- os únicos writers de `profiles.active_ride_id` no código vivo estavam em `profile.mutations.ts`;
- `ProfileService.setActiveRideId/clearActiveRideId` não possuíam caller externo vivo;
- o estado operacional canônico de corrida já é `public.driver_availability.active_ride_id`, controlado pelos comandos atômicos de Mobility/Delivery;
- portanto manter write em `profiles.active_ride_id` criava uma segunda autoridade para o mesmo estado.

Correção:
- removidos `setActiveRideId` e `clearActiveRideId` de `profile.mutations.ts`;
- removidos os wrappers correspondentes de `ProfileService`;
- o campo físico em `profiles` não é dropado neste checkpoint por causa da janela de compatibilidade do frontend antigo;
- ratchet em `profile-rpc-security.test.ts` impede o retorno desses writers.

Próximo: G36C2 migrar suspensão/reativação Admin para o broker administrativo já existente, sem criar uma segunda autoridade.

### Checkpoint G36C2 — Admin suspension broker expand (2026-09-09)

Auditoria:
- `AdminUserService.suspendProfile/unsuspendProfile/suspendUser/unsuspendUser` ainda faziam UPDATE direto em `public.profiles`;
- esses fluxos possuem callers vivos no painel Admin e não podem ser removidos;
- o Edge `admin-suspend-profile` já é o owner correto, mas chamava o RPC antigo `suspend_profile`;
- o RPC antigo só alterava `is_active=false` e não implementava o contrato real usado pela UI (`is_suspended/suspended/suspended_at/suspended_until/suspension_reason`);
- `requireAdmin` e `private.is_admin_from_roles` usam o mesmo conjunto efetivo `admin/super_admin`.

Expand G36C2:
- novo `private.admin_set_profile_suspension` revalida Admin no Postgres;
- novo wrapper `public.admin_profile_rpc_set_suspension` é service-role-only;
- um único comando suporta alvo `profile` ou `user`;
- suspensão de usuário atualiza todos os Profiles da conta na mesma transação;
- cada Profile afetado recebe `profile_audit_log`;
- suspensão exige motivo e validade futura quando houver expiração;
- reativação limpa o estado de suspensão sem reativar/desativar arbitrariamente `is_active`;
- Edge `admin-suspend-profile` passa a aceitar `action=suspend|unsuspend`, `target_kind=profile|user`, `target_id`, motivo e expiração;
- `AdminUserService` e adapter multi-profile passam pelo Edge, sem DML direto;
- authorization map aponta para o novo RPC;
- o RPC legado `suspend_profile` permanece apenas durante o expand para permitir cutover sem janela quebrada.

Probe pré-aplicação com `BEGIN/ROLLBACK`:
- suspend de Profile: PASS;
- audit log: PASS;
- unsuspend de Profile: PASS;
- suspend de usuário com 4 Profiles: 4/4 atualizados;
- ator não-admin: bloqueado.

Próximo imediato:
1. commit do expand;
2. aplicar migration;
3. redeployar `admin-suspend-profile` exatamente do SHA;
4. repetir probes no runtime persistido;
5. só então G36C2-contract remover `public.suspend_profile`.

### Checkpoint G36C2B — Admin suspension broker contract (2026-09-09)

Runtime do expand `ee84ad7fb867ec1a06a49d4b7cc0f01a5a4e05f0`:
- `admin-suspend-profile v1 ACTIVE`, `verify_jwt=true`;
- entrypoint + `_shared/adminAuth.ts` + `_shared/security.ts`: byte-a-byte iguais ao SHA;
- `admin_profile_rpc_set_suspension`: `anon=false`, `authenticated=false`, `service_role=true`;
- probe persistente com rollback confirmou suspend/unsuspend de Profile, suspend atômico dos 4 Profiles de um usuário, audit e bloqueio de non-admin.

Contract:
- nenhum caller vivo permanece em `public.suspend_profile(uuid,uuid,text)`;
- migration `retire_legacy_suspend_profile_g36` remove o RPC antigo;
- auditoria remota e status canônico passam a observar somente `admin_profile_rpc_set_suspension`.

Próximo: G36C3 eliminar os inserts diretos restantes de Profile/Driver e convergir bootstrap de Driver para o broker correto.

### Checkpoint G13 — avaliações de corrida e privacidade do agregado público (2026-09-09)

Auditoria real:
- `ride_ratings` já estava corretamente server-owned para mutação: `authenticated SELECT=true`, `INSERT/UPDATE/DELETE=false`;
- única policy de tabela permite leitura ao rater, rated ou admin;
- `trust_events` e `trust_admin_actions` já estavam sem qualquer grant de tabela para `authenticated`/anon;
- `submit_ride_rating` e `submit_ride_trust_feedback` já validam perfil ativo, participantes/contrapartes, estado final da corrida, bounds e rate-limit; nenhuma segunda autoridade de escrita foi criada;
- o ponto residual era `get_ride_rating_summary(uuid)`: RPC anon intencional que retornava agregado para qualquer UUID, inclusive perfil privado.

Correção aplicada e provada:
- migration `scope_ride_rating_public_summary_g13` aplicada no Supabase canônico;
- `get_ride_rating_summary` continua sendo projeção agregada pública, mas agora usa `search_path=''` e `statement_timeout=3s`;
- anônimo só recebe histórico real de perfil ativo e público;
- perfil privado continua visível ao próprio usuário, admin ou contraparte com corrida `completed/delivered`;
- terceiro não relacionado recebe resumo neutro `average_rating=0,total_ratings=0`, sem revelar histórico do perfil privado;
- `anon` e `authenticated` mantêm EXECUTE na projeção porque a reputação pública é intencional;
- probe transacional confirmou quatro casos: anônimo+privado oculto, anônimo+público visível, dono/contraparte visível, terceiro autenticado oculto;
- ratchet: `tests/security/ride-rating-trust-authority.test.ts`;
- nenhuma mudança de DML em `ride_ratings`/Trust foi necessária porque o baseline real já estava correto.

Próximo gate obrigatório:
1. auditar tabelas de chat da corrida e confirmar que mensagens/mark-read não possuem bypass direto de escrita;
2. auditar revogação/expiração de shares e lifecycle de safety sem duplicar comandos já autorizados;
3. continuar same-SHA tests/E2E quando runner hosted estiver disponível;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false`.

### Checkpoint G14 — cobertura territorial canônica de motorista (2026-09-09)

Problemas confirmados no runtime/código:
- `driver_accepted_neighborhoods` ainda era referenciada por mutations antigas, mas a tabela **não existe** no banco canônico;
- o hook `useDriverServiceArea` estava sem consumidores reais;
- `ServiceAreaSettings` já apontava para `ServiceAreasManager`, porém o próprio `ServiceAreasService` ainda usava o schema antigo (`profile_id`, `city`, `neighborhoods`, `is_active`) e tentava `INSERT/UPDATE/DELETE` direto;
- o SSOT real já existia desde `consolidate_coverage_commands`: `public.service_areas` com `entity_type/entity_id/location_id/status` e writes por RPC;
- para `entity_type='mobility_driver'`, o `entity_id` correto é `driver_data.id`, e não `profiles.id`;
- `service_areas` remoto estava vazio, então não havia dados legados a migrar.

Correção aplicada e provada:
- novo comando `upsert_entity_coverage` complementa `replace_entity_coverage`, `remove_entity_coverage` e `update_entity_coverage_status` sem criar nova tabela ou authority paralela;
- point mutation usa `private.require_coverage_entity_write`, advisory lock, bounds de raio/status e single-primary;
- trigger privado `trg_validate_service_area_location_semantics` aplica o invariante cross-table no SSOT: `city` exige Location city; `district` exige district/neighborhood; `radius` aceita city/district/neighborhood; Location precisa estar ativa;
- browser mantém `service_areas SELECT=true` e `INSERT/UPDATE/DELETE=false`; `upsert_entity_coverage`: anon=false, authenticated=true, service_role=true;
- `ServiceAreasService` foi refeito como adapter Profile -> Coverage e resolve business/professional/driver para o `entity_type/entity_id` real;
- `CoverageRepositorySupabase` ganhou `upsertByEntity` e todas as mutations continuam por RPC server-owned;
- formulário de área de atuação deixou de aceitar cidade/bairros em texto livre e passou a usar `TerritorialSelector` + `location_id` oficial, com modos cidade, bairro/distrito e raio;
- `useProfileLocation` passou a ler os labels derivados do Coverage canônico;
- removidos `deleteDriverNeighborhood`, `deleteDriverServiceArea` e o hook morto `useDriverServiceArea`; a feature foi preservada pelo `ServiceAreasManager` canônico;
- `DriverSettingsLayout` agora expõe a seção Áreas de atuação nas rotas de configuração existentes;
- probe transacional real validou create/update, raio, status, troca atômica de primária, rejection de taxonomia inválida e bloqueio de outro usuário; rollback final deixou `service_areas=0`;
- ratchet: `tests/security/mobility-driver-coverage-authority.test.ts`;
- advisors de segurança após DDL não reportaram finding novo referente a `service_areas`.

Próximo gate obrigatório:
1. validar build/typecheck do SHA G14 e corrigir qualquer drift de tipos/UI antes de avançar;
2. auditar preferências exibidas em `DriverSettingsPanel`, pois hoje parte dos switches pode ser somente estado local/toast e não configuração persistente;
3. separar preferência de UI de capability operacional server-owned — especialmente aceitar entregas/corridas, que não pode ser alterado apenas no client;
4. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até os E2E finais.

### Checkpoint MVP — launch scope, rotas e governança (2026-09-20)

- corrigido vazamento do item Admin de Mobilidade em launch-paused;
- removida a segunda autoridade de exports Admin de `lazyImports.ts`;
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` reduzido a ponteiro de compatibilidade sem estado mutável;
- CI do head auditado continua sem execução real: jobs retornam `steps=[]` e Heavy PR permanece queued;
- detalhes e evidências: `checkpoints/2026-09-20-mvp-launch-scope-route-governance.md`.

**Gate permanece aberto:** não marcar release como certificado até lint/typecheck/security/test/build + deploy/smoke same-SHA executarem de verdade.


### Checkpoint MVP — canonical routing sem redirects de compatibilidade (2026-09-22)

Estado consolidado do MVP após os PRs #310–#314:

- `business` permanece o único domínio de produto ativo;
- `map`, `nearby`, `search` e `messaging` permanecem capabilities horizontais ativas;
- Business não depende mais de Educação/Gastronomia pausadas para criação/certificação;
- Mensagens segue `messaging`, não `communityCommunication`;
- Perfil Profissional permanece fora da Central enquanto `services` estiver pausado;
- dashboard Business legado sem rota/caller foi aposentado;
- Search carrega services de módulos pausados somente por `import()` depois do launch gate;
- Neighborhood mixed-domain stream sem caller foi aposentado;
- ratchets arquiteturais dos cortes recentes integram `test:mvp:architecture`.

Política de rotas do corte atual:

- Conta privada usa somente `/conta/*`;
- perfil público pessoal usa somente `/u/:username`;
- `/perfil/*` foi aposentado e não possui redirect;
- edição privada exige `/conta/editar/:profileId`; a rota-resolver `/conta/editar` foi removida;
- Notificações é capability horizontal ativa: Inbox usa `/notificacoes`, preferências usam `/conta/notificacoes` e o owner de logs mantém `/settings/email-logs`; aliases antigos continuam proibidos;
- `/conta/preferencias?tab=...` não funciona como alias/redirect;
- rota desconhecida renderiza 404 e não é enviada silenciosamente para `/`;
- guards de autenticação/autorização podem encaminhar para Login ou superfície obrigatória porque representam controle de acesso, não compatibilidade de URL.

Este corte implementa e ratcheta essa política também em callers, prefetch, service worker, robots, sitemap guard, registries e testes preservados de módulos pausados.

### Certificação exact-SHA atual

Candidato anterior: `ff0c9b8784f70c024661e191713af78e2e87d84c`.

No mesmo SHA:

- Vercel production: **success**;
- Dependency Lock: **success**;
- Auth Concept Regression: **success**;
- Heavy PR Certification: **success**;
- Runtime Tests: **success**;
- E2E público fixture-backed: **success**;
- Phase Core Gate: **success**;
- Regression Check: **success**;
- MVP unit tests / Maps / hardcoded credentials / lint / TypeScript: **success**.

O smoke autenticado real falhou antes de emitir sessão em Conta mobile/tablet/desktop e Mensagens com:

`HTTP 503; Authentication unavailable [auth_upstream_unavailable]`.

Diagnóstico de raiz:

- GitHub OIDC já foi aceito antes da falha;
- broker v3 remoto está ACTIVE e byte-a-byte igual ao source versionado;
- o 503 é classificado somente quando `auth.signInWithPassword()` retorna erro 5xx;
- `select 1` read-only e Supabase Advisors também falharam com `Connection terminated due to connection timeout`;
- não aumentar retry/timeout, não trocar senha do fixture sem evidência, não criar fallback de login e não enfraquecer OIDC.

Blockers atuais do primeiro release:

1. **#305 — Auth upstream/configuração remota do Supabase.**
   - verificar Auth → Sessions → User Sessions → Timebox;
   - se já válido/default, investigar Logs Explorer/Auth/Postgres do projeto;
   - o repositório não versiona Timebox e não deve inventar patch local.
2. **#309 — autoridade do deploy automático Supabase.**
   - `SUPABASE_ACCESS_TOKEN` do GitHub recebe 403 para Edge Functions;
   - substituir por PAT pertencente a identidade Developer/Admin/Owner;
   - não usar `service_role` como PAT.

**Regra de release:** não marcar `MVP READY` enquanto o mesmo SHA não obtiver sessão autenticada real e a autoridade exact-main de deploy não estiver restaurada.


### Checkpoint MVP — gestão Business sob árvore canônica da Central (2026-09-22)

Censo de rotas operacionais encontrou uma inconsistência ainda ativa: o SSOT
`businessManagementRoutes` concentrava quase toda a gestão em
`/central/empresas/*`, mas `edit()` escapava para
`/edit-business/:profileId`. O registry ainda listava também
`/create-business` e `/dashboard/business/:profileId`, apesar de não
existirem como rotas ativas.

Correção estrutural deste corte:

- edição passa a `/central/empresas/:businessId/editar`;
- `EditarEmpresaPage` fica sob o mesmo `BusinessAdminGuard` da empresa;
- o editor sai do `AppLayoutRoutes` e do lazy barrel global e passa a ser
  owned por `CentralRoutes`/`activeCentralLazyImports.ts`;
- `businessManagementRoutes.edit()` é a única fonte para o destino de edição;
- E2Es deixam de montar `/edit-business` manualmente;
- `/create-business`, `/edit-business/:profileId` e
  `/dashboard/business/:profileId` saem do registry em vez de receber
  redirects;
- o ratchet `business-edit-flow-g6.test.ts` passa a integrar
  `test:mvp:architecture`.

Regra: gestão de Business no MVP tem uma única raiz operacional,
`/central/empresas/*`. Não criar aliases paralelos para criação, dashboard ou
edição.

O blocker de release não muda: #305 continua sendo Auth upstream remoto e #309
continua sendo autoridade do PAT para deploy automático Supabase. Nenhum deles
deve ser contornado por rota, fallback ou credencial alternativa.

### Handoff obrigatório para qualquer próxima IA/chat — 2026-09-24

Antes de continuar o MVP, preservar esta regra:

- **Vertical de produto não é capability horizontal.**
- Business/Empresas é a vertical ativa do MVP.
- Map, Nearby/Perto de mim, Search/Busca, Messaging/Mensagens, Notifications/Notificações, Auth, Profiles/Account, Territory, Location e Central são capabilities de plataforma.
- Reduzir o número de verticais ativas **não autoriza** desligar capabilities horizontais do site.
- A ligação entre vertical e horizontal ocorre por **provider/adapter lifecycle-scoped**.
- Pausar uma vertical retira somente seus providers; não transfere ownership nem pausa automaticamente a capability.
- Reativar/adicionar vertical deve exigir mudança localizada: certificar owner, ativar registry e registrar providers. É proibido espalhar condicionais manuais, redirects, aliases ou imports de domínio pela UI.
- PR #353 corrigiu Notifications/Messaging para esse modelo; PR #355 isolou cliques de Notifications de verticais pausadas.
- Nearby passa a seguir o mesmo padrão: capability horizontal dependente de Map + Location; Business é provider do MVP, não dependência estrutural.

Ao iniciar um novo chat, auditar primeiro `productModuleRegistry.ts`, `platformCapabilityRegistry.ts`, os `*ProviderScope.ts`, `PRODUCT_MODULE_LIFECYCLE.md` e este checkpoint. Não reconstruir o escopo apenas a partir das telas visíveis.

Pendência territorial de Nearby resolvida no corte seguinte a #356: `TerritorialLayout` não deve voltar a mapear `nearby -> ModuleKey.BUSINESS`. O app injeta os rollout keys dos providers Nearby ativos e o core agrega `activeMemberIds` por união. Para um segundo provider, registrar lifecycle + provider + rollout owner; não adicionar novo hardcode no layout.

### Checkpoint MVP — Nearby territorial provider boundary (2026-09-24)

Depois de #356 separar Nearby de Business no lifecycle, restava um acoplamento territorial: `TerritorialLayout.tsx` ainda tratava a rota `nearby` como `ModuleKey.BUSINESS` para calcular cobertura de grupos e `activeMemberIds`.

Correção estrutural:

- app/lifecycle resolve os providers Nearby ativos;
- provider -> rollout owner fica no boundary de app, não no core routing;
- `ActiveTerritorialLayout` injeta os rollout keys da surface;
- `TerritorialLayout` consome keys genéricos e não conhece Business como owner de Nearby;
- novo agregador territorial calcula cobertura por OR entre providers e deduplica `activeMemberIds`;
- singleton preserva exatamente a semântica anterior;
- nenhum provider ativo resulta em estado fail-closed;
- testes ratchet impedem reintroduzir `[MODULE_SLUGS.nearby]: ModuleKey.BUSINESS`.

Regra futura: adicionar Services/Tourism/Gastronomy/etc. a Nearby deve ser uma alteração localizada no provider scope/registry, sem refatorar `TerritorialLayout`.
