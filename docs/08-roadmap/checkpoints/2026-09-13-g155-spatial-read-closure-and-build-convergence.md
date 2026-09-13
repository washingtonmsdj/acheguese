# G155 — Spatial read closure and build convergence

Data: 2026-09-13
Branch: `main`

Este checkpoint registra somente o estado comprovado no source e nos providers. Nao substitui certificacao same-SHA de release.

## 1. Leituras espaciais publicas fechadas no source

O mapa deixou de usar o padrao `carrega territorio -> filtra viewport no browser` nas quatro camadas principais:

- Business: `MapBusinessLayerRuntimeService` consulta `public_business_search` com bounds, `TerritoryFilter`, ordenacao e `LIMIT` no banco.
- `CidadeLandingPage`: a camada Business tambem usa o mesmo owner bounded; `geographic_path` permanece no read model para preservar URL publica canonica dos pins.
- Services: `MapServicesLayerRuntimeService` consulta `public_professional_search` com bounds, territorio e `LIMIT` no banco.
- Classifieds: a consulta espacial pertence ao dominio em `classifieds.map-queries.ts`; preserva expansao territorial/descendentes e `reach=city` antes de projetar no Maps.
- Gastronomy: candidatos sao selecionados em `public_business_search` com `has_active_gastronomy_profile=true`, bounds, territorio, ordenacao e limite; somente os `business_id` selecionados sao enriquecidos em `gastronomy_profiles`.

Consequencia importante: a camada Gastronomy nao le mais `business_data` no browser e nao voltou ao filtro `isInsideBounds` pos-materializacao.

Ratchets ativos:

- `tests/architecture/map-business-bounded-read.test.ts`
- `tests/architecture/map-runtime-layer-bounds.test.ts`

As migrations/indexes espaciais presentes no repositorio nao sao declaradas aplicadas/certificadas no remoto neste checkpoint, pois o provider Supabase segue indisponivel.

## 2. Compatibilidade generica removida

`generate:service` foi aposentado fisicamente:

- entrada removida de `package.json`;
- `tools/architecture/generate-service-template.ts` removido;
- teste convertido em ratchet de ausencia.

Referencias em `docs/10-archive/**` sao historicas e nao autoridade operacional.

## 3. TerritorialGroup voltou ao owner canonico

O build real do Vercel encontrou imports/reexports que ainda apontavam para Location depois da transferencia de ownership.

Corrigido:

- `src/core/location/index.ts` nao reexporta mais contratos `TerritorialGroup*`;
- `territoryHelpers.ts` e `territoryLabels.ts` importam `TerritorialGroupWithMembers` de `@/core/territorial`;
- `tests/architecture/territorial-group-owner-boundary.test.ts` agora detecta imports relativos/reexports fora do owner, nao apenas o caso absoluto anterior.

## 4. Trust G73 sem editar generated types

A migration canonica `20260911152000_redact_driver_history_and_derive_feedback_targets_g73.sql` define `submit_ride_trust_feedback` por papel semantico (`p_subject_role`).

O arquivo gerado do Supabase ainda descreve o argumento antigo `p_subject_profile_id` porque a regeneracao oficial segue provider-gated.

Foi criado `RideTrustFeedbackRpcGateway.ts` como boundary estreita para o contrato G73. `OperationalTrustCommandService` usa o gateway e nao voltou ao UUID de perfil. O generated type nao foi editado manualmente.

Quando a geracao oficial convergir, remover somente o cast de integracao do gateway; o contrato de dominio permanece inalterado.

## 5. Reparo de regressao em Mobility

Durante a convergencia de build, `mobility.queries.ts` foi acidentalmente substituido a partir de uma leitura parcial, removendo funcoes validas abaixo do trecho carregado. O erro foi identificado como regressao desta execucao, nao como legado do projeto.

Reparo aplicado de forma exata:

- blob completo conhecido `dd9bb7a0e6898503cb25fcac8b0aa257deb5aa5f` restaurado sobre o HEAD corrente via Git tree/commit, sem reverter as demais mudancas;
- `getDriverData`, `getDriverStatsDetailed`, `getDriverDataIdByProfileId` e demais queries abaixo do trecho voltaram exatamente ao estado anterior;
- wrapper sem caller `RideService.getRidesByDriver()` foi removido, mantendo `getRidesByDriverProfile()` como owner consumido diretamente pelo dashboard;
- `tests/architecture/mobility-query-surface-integrity.test.ts` protege as queries ativas e bloqueia a reintroducao do wrapper morto.

## 6. Evidencia de build/provider

O Vercel voltou temporariamente a executar builds reais e revelou em sequencia:

1. imports/reexports `TerritorialGroup*` apontando para owner antigo;
2. tipagem/corte indevido na superficie de Mobility;
3. drift conhecido do RPC Trust entre migration G73 e generated types.

Os itens acima foram tratados no source conforme secoes anteriores.

Apos os commits mais recentes, o status do Vercel voltou a `build-rate-limit`; portanto nao existe prova de build verde no HEAD atual e o rate-limit nao deve ser tratado como falha de source.

Supabase continua retornando timeout de conexao ate para queries minimas. Nao insistir em loop, nao editar tipos gerados a mao e nao declarar migration remota aplicada sem evidencia.

## 7. Estado de release

- `PUBLIC_LAUNCH_SURFACES.mobility=false` permanece obrigatorio.
- Nao ha certificacao same-SHA completa neste checkpoint.
- Nao declarar MVP/release green ate o mesmo SHA passar build, seguranca, testes, E2E/responsivo e deploy/probes exigidos pelo plano ativo.

## 8. Proxima sequencia

1. quando o Vercel liberar novo build, validar o HEAD corrente e corrigir somente blockers reais restantes;
2. quando Supabase responder, regenerar tipos oficiais e retirar o cast temporario do gateway Trust se o contrato G73 aparecer corretamente;
3. validar/aplicar/certificar migrations espaciais reais no remoto antes de declarar performance spatial fechada em producao;
4. continuar census de wrappers de Mobility somente com prova de callers e owner substituto; o proximo candidato conhecido e `MobilityService.getRideById()` -> `RideOperationalContextReadService.getLifecycle()`;
5. manter Mobility launch-paused ate certificacao completa same-SHA.
