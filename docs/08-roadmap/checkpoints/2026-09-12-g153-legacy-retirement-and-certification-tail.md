# G153 — Legacy retirement e certification tail — 2026-09-12

**Status:** SOURCE-ADVANCED / CERTIFICATION-BLOCKED  
**Branch:** `main`  
**HEAD de source imediatamente anterior a esta atualização do checkpoint:** `0353b2b30ba31f74083672d9d819ddfeaee3dab2`  
**Autoridade operacional:** `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`

## 1. Regra aplicada neste bloco

A limpeza foi executada por evidência, não por idade/nome de arquivo:

1. localizar callers/imports/owners reais;
2. migrar callers ativos para o owner canônico;
3. remover a superfície antiga no mesmo fluxo quando possível;
4. adicionar/fortalecer ratchet contra recriação;
5. arquivar evidência histórica sem mantê-la como autoridade viva;
6. não apagar feature válida apenas porque está quebrada, pausada ou sem certificação.

`launch-paused` continua sendo gate de release, não classificação de legado.

## 2. `.kiro` aposentado de verdade

Fechado:

- `.kiro/**` foi desconectado do Vercel ignore, dos scanners/policies de segurança e da orientação do workflow SSOT;
- a árvore foi removida fisicamente no commit `077ce32e90e8f2916d64be990892ede9993a7371`;
- a `main` avançou por fast-forward e a Contents API confirmou `404` para `.kiro` no HEAD;
- histórico permanece recuperável pelo Git/arquivos canônicos, sem autoridade runtime/tooling.

Não recriar `.kiro/**` como fonte de planejamento, segurança, build ou SSOT.

## 3. Mobilidade/Admin — source consolidado sem `.impl` aposentado

O build Vercel real de `077ce32...` chegou ao TypeScript e revelou blockers daquele SHA. O blocker de coerção estrutural administrativa foi corrigido na origem; o drift gerado do RPC Trust continua externamente bloqueado pela geração oficial de tipos.

Além disso, a limpeza estrutural avançou:

- `DriverService.impl.ts` foi consolidado em `DriverService.ts` e removido;
- `RideService.impl.ts` foi consolidado em `RideService.ts` e removido;
- `ChatService.impl.ts` foi consolidado em `ChatService.ts` e removido;
- `RideService.shareRide()` vazio/no-op, sem caller real, foi removido;
- `MobilityService.ts`, testes de segurança e ratchets antigos deixaram de apontar para os `.impl` aposentados;
- `tools/architecture/check-ssot-compliance.ts` não autoriza mais owners inexistentes;
- `tests/architecture/mobility-impl-retirement.test.ts` impede recriação desses splits.

`DriverService`, `RideService` e `ChatService` continuam capacidades reais; o que foi removido foi a duplicação/split físico obsoleto, não a feature.

O drift de `submit_ride_trust_feedback` permanece **externamente bloqueado**: a migration G73 canônica usa `p_subject_role`, o source de Trust está alinhado, mas a geração oficial `Supabase.generate_typescript_types` continua retornando `Gateway Timeout`. Não editar `types.generated.ts` manualmente.

## 4. Billing — bridge e alias realmente removidos

Fechado neste bloco:

- caller de Menu migrado do root bridge para `BusinessSubscriptionService`;
- `src/core/billing/SubscriptionService.ts` (bridge deprecated Business) removido fisicamente;
- Dashboard Empresa e Education foram migrados para `BusinessSubscriptionService` antes de concluir a aposentadoria;
- o barrel `@/core/billing` deixou de recriar `SubscriptionService` como alias de `BusinessSubscriptionService`;
- `tests/architecture/billing-subscription-authority.test.ts` bloqueia tanto o arquivo antigo quanto import do alias pelo barrel;
- `src/core/billing/services/SubscriptionService.ts` permanece válido: ele é o owner da **assinatura de usuário**;
- README de Billing e `COMPATIBILITY_BRIDGES.md` foram reconciliados.

A regra para próximos retirements é explícita: não confiar em uma única busca indexada; após remover uma bridge, executar segundo census por nome de método, import, barrel e compile/ratchet disponível.

## 5. Community drafts — `savedAt` fechado no boundary legado

O timestamp de rascunho agora possui um único contrato runtime:

- `PostDraftSnapshot` expõe somente `updatedAt`;
- `PostDraftPayload` não conhece `savedAt`;
- `CreatePostModal` não lê mais `draft.savedAt` nem `candidate.savedAt`;
- writer novo serializa diretamente o snapshot canônico e nunca emite `savedAt`;
- `savedAt` permanece apenas no tipo privado `PersistedPostDraftSnapshot`, necessário para ler storage local antigo;
- o loader converte `savedAt` antigo para `updatedAt` e regrava o snapshot no formato atual;
- `postDraft.spec.ts` preserva a prova de migração;
- `tests/architecture/post-draft-timestamp-boundary.test.ts` impede o campo legado de voltar ao contrato público/UI.

Isso preserva dados locais de usuários antigos sem perpetuar a compatibilidade no runtime novo.

## 6. Testes — certificados falsos removidos

Foi feito census de `expect(true).toBe(true)` em testes ativos. Foram removidos blocos que apenas imprimiam mensagens como “GATE PRONTO” sem provar comportamento:

- Gate 2 real auth;
- Gate 3 cancellation;
- Gate 3 concurrency;
- Gate 3 realtime;
- placeholders de Posts/Fase 3 foram substituídos por assertions reais do contrato atual;
- integração de Tourism deixou de fabricar assertion de sucesso quando provider/runtime externo está indisponível.

Novo ratchet:

`tests/architecture/no-fake-assertions.test.ts`

Ele falha se `expect(true).toBe(true)` reaparecer em testes ativos de `tests/` ou `src/`.

Indisponibilidade de provider externo pode resultar em skip/retorno governado do teste específico, mas nunca deve ser contabilizada como assertion positiva.

## 7. Territorial ownership — bridge de Location removida

`TerritorialGroup*` deixou de ser reexportado por `src/core/location/types/index.ts`.

Callers ativos foram migrados antes da remoção:

- Community Experience;
- resolução de território em Routing;
- fallbacks territoriais públicos;
- SEO territorial;
- URL builders territoriais.

Owner atual:

`src/core/territorial/contracts.ts`

Ratchet:

`tests/architecture/territorial-group-owner-boundary.test.ts`

O teste impede imports de `TerritorialGroup*` por `@/core/location/types`.

`docs/architecture/SSOT_REGISTRY.md` foi reconciliado para registrar Location e Territorial como responsabilidades separadas.

## 8. G154 — Business/mapa deixou de materializar catálogo para filtrar viewport

### 8.1 Read model pública correta

A investigação do fluxo espacial antigo encontrou um problema de raiz: os RPCs genéricos de abril ainda consultavam a relação `businesses`, enquanto o domínio atual usa `business_data` e a projeção pública sanitizada é:

`public.public_business_search`

A read model pública contém identidade de perfil, nome, slug, categoria, `location_id`, coordenadas, rating, premium e verificação, com SELECT público governado e sem DML do browser.

### 8.2 Boundary de mapa bounded

Criado:

`src/core/maps/services/MapBusinessLayerRuntimeService.ts`

O service:

- lê `public_business_search`;
- exige status ativo;
- aplica bounds de latitude/longitude no banco;
- aplica `TerritoryFilter` no banco **antes** do limit;
- limita 100 por padrão e 200 no máximo;
- usa `profile_id` como `Business.id` público e mantém `business_data_id` separado;
- não executa `BusinessService.getBusinesses()` nem `isInsideBounds` no browser.

`src/core/maps/pages/MapaPageV4.tsx` foi migrado para essa boundary. O mapa principal não carrega mais uma página territorial ampla de Business para depois descartar entidades fora do viewport.

Ratchet:

`tests/architecture/map-business-bounded-read.test.ts`

### 8.3 Índices espaciais

Migration source:

`supabase/migrations/20260920094738_index_public_business_map_bounds_g154.sql`

Adiciona na read model pública:

- índice B-tree de latitude;
- índice B-tree de longitude;
- índice GiST funcional sobre geography para buscas `ST_DWithin` de raio/híbridas.

Essas migrations estão no source; **não há prova neste checkpoint de aplicação remota**.

### 8.4 RPCs espaciais Business retargetados

Migration source:

`supabase/migrations/20260920094744_retarget_business_spatial_search_read_model_g154.sql`

Substitui os contracts públicos:

- `search_entities_by_radius`;
- `search_entities_by_bounds`;
- `search_entities_hybrid`.

No branch `business`, os três passam a usar `public.public_business_search` e retornam `profile_id AS id`, compatível com o `Business.id` canônico. O source não consulta mais `businesses` nesse fluxo.

Os limites são fail-closed:

- `COALESCE` impede `NULL` explícito de transformar `LIMIT` em ilimitado;
- hard cap de 200;
- offset negativo/nulo é normalizado.

Ratchet:

`tests/architecture/business-spatial-read-model.test.ts`

### 8.5 Guia / Nearby

`src/core/guide/tourist-points/hooks/useNearbyBusinesses.ts` agora usa `SpatialSearchService.searchByRadius()` primeiro quando existem coordenadas, hidrata somente o pequeno conjunto selecionado e preserva a distância retornada pelo banco.

O fallback sem coordenadas permanece paginado/bounded. A busca de **guias** ainda usa catálogo limitado porque depende de `subcategoria`/`especialidades`, dados que não pertencem à projeção espacial atual. Essa capacidade não foi removida para “simplificar” código.

### 8.6 Dívida espacial ainda aberta

G154 **não significa que todas as layers de mapa foram migradas**.

Ainda devem ser tratadas em próximo bloco:

- `src/app/pages/CidadeLandingPage.tsx` ainda usa Business territorial e filtragem client-side por bounds;
- `MapGastronomyLayerRuntimeService` ainda precisa census/migração para aplicar viewport no banco;
- `MapServicesLayerRuntimeService` idem;
- `MapClassifiedsLayerRuntimeService` idem.

A próxima execução deve migrar uma layer por vez para uma boundary bounded real, preservando seus contratos/metadata específicos.

## 9. Tooling/geração automática — fonte de dívida neutralizada

`tools/architecture/generate-service-template.ts` deixou de gerar automaticamente:

- nome de tabela inferido por convenção;
- CRUD genérico Supabase;
- `select('*')`;
- cache arbitrário;
- testes `expect(true).toBe(true)`.

O comando agora falha fechado e orienta definir owner, projeção, RLS/RPC e testes reais antes de criar código. Existe ratchet contra retorno do gerador inseguro.

A entrada `generate:service` ainda existe em `package.json` como compatibilidade fail-closed. Remoção física dessa entrada permanece tail de limpeza; não tratar o comando atual como gerador funcional.

## 10. Geocoding/Address/Location — documentação viva reconciliada

O antigo `src/core/geocoding/MIGRATION_GUIDE.md`, datado e com fases/fallbacks já ultrapassados, foi preservado em `docs/10-archive/architecture-legacy/` e removido de `src/`.

Foi confirmado que antigos `CepService.ts` e `src/core/maps/services/GeocodingService.ts` já não existem na `main`. Documentação viva foi atualizada para o desenho real:

- `core/geocoding` = provider/orquestração de geocoding;
- `LocationGeocodingService` = boundary territorial que reconcilia provider com `locations`;
- Address consome o owner atual, sem instruir callers a usar serviço inexistente.

`SSOT_REGISTRY.md` também foi corrigido para o path real de Tourist Points:

`src/core/guide/tourist-points/...`

## 11. Core Platform — baseline apertado

O último build real havia reportado melhoria de baseline:

`table|emergency_contacts|read|supabase/functions/send-emergency-email/index.ts`

O source já não usa essa leitura. `docs/architecture/core-platform-ownership.json` foi reduzido para remover a permissão `trusted-delivery` obsoleta de `emergency_contacts`; somente `SafetyEmergencyContactsService.ts` continua autorizado como reader.

Não ampliar novamente esse baseline sem mudança arquitetural revisada.

## 12. Documentação ativa vs histórico

Movidos para `docs/10-archive/architecture-checkpoints/`, preservando os blobs originais e removendo os paths ativos:

- `REPOSITORY_CENSUS_2026-08-26.md`;
- `G5_PROVIDER_EXECUTION_CHECKPOINT_2026-08-31.md`;
- `G5_BUSINESS_READ_PERFORMANCE_2026-08-30.md`;
- `G5_HOSTED_SECURITY_REVALIDATION_2026-08-31.md`.

A limpeza documental segue a mesma regra do source: snapshot datado sem backlink vivo pode ser arquivado; documento canônico/SSOT ou evidência ainda referenciada só sai depois de migrar os backlinks.

## 13. Evidência externa atual

### Supabase

Tentativa mais recente de geração oficial de tipos no projeto `xhdowzacfujckjelqhtd`:

- resultado: `Gateway Timeout`;
- consequência: drift do RPC Trust continua aberto como gate externo;
- decisão: nenhuma edição manual do generated type;
- migrations G154 de mapa/spatial estão no source, mas este checkpoint **não afirma aplicação remota**.

### Vercel

O build production real de `077ce32...` avançou pelos gates de segurança/audit/ownership e chegou ao TypeScript. Depois das correções de source, novos SHAs não obtiveram novo build porque o provider passou a registrar explicitamente:

`Deployment rate limited — retry in 24 hours.`

Rate-limit não é PASS nem FAIL de compilação. Não existe neste checkpoint prova de build production verde para o HEAD atual.

### GitHub Actions

O run observado anteriormente de SSOT Enforcement terminou sem provisionar runner:

- `steps=[]`;
- `runner_id=0`;
- `runner_name=""`.

Portanto checkout/npm/typecheck/lint/test não executaram. Isso não prova regressão nem aprovação do source.

## 14. Gates ainda abertos para fechar o urgente

1. Supabase voltar a responder e regenerar `types.generated.ts` a partir do schema/migrations reais;
2. aplicar/validar migrations G154 no provider real e provar contratos espaciais/indexes;
3. obter TypeScript/build de produção verde em HEAD/descendente funcionalmente equivalente;
4. executar de verdade ratchets/security/tests — não usar job sem runner como evidência;
5. concluir dívida espacial de CidadeLanding + Gastronomy/Services/Classifieds;
6. executar E2E operacional real de Mobilidade com autorização positiva e negativa para passageiro/motorista/motoboy, mais smoke responsivo;
7. deployar e comprovar **o mesmo SHA** que passou os gates;
8. somente depois reavaliar `PUBLIC_LAUNCH_SURFACES.mobility`.

## 15. Estado de release

Mobilidade permanece:

`PUBLIC_LAUNCH_SURFACES.mobility=false`

Nenhum trabalho deste checkpoint autoriza habilitar a surface pública antes da certificação same-SHA.

## 16. Próxima execução

Continuar em blocos, não em microtarefas:

1. migrar `CidadeLandingPage` e depois as demais layers de mapa para bounds/território no banco;
2. continuar census/retirement de bridges/hardcodes somente após provar callers/owner;
3. remover a entrada fail-closed `generate:service` do `package.json` quando for possível fazer a alteração sem reescrever configuração concorrente;
4. quando Supabase responder, regenerar tipos e validar/aplicar migrations espaciais reais;
5. quando Vercel/Actions voltarem, executar certificação same-SHA completa;
6. atualizar este checkpoint/roadmap somente com provas executadas.
