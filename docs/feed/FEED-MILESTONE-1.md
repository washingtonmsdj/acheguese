# FEED-MILESTONE-1.md

Sprint: FEED.MILESTONE.1

Status: primeiro marco arquitetural oficial do dominio Feed

Base obrigatoria:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P0.A-REPORT.md`
- `docs/feed/FEED-P0.B-REPORT.md`
- `docs/feed/FEED-P0.C-REPORT.md`
- `docs/feed/FEED-P0.E-REPORT.md`

Regra de escopo: este documento registra o marco consolidado. Nao implementa codigo, nao altera arquitetura, nao altera governanca, nao altera roadmap e nao cria novos contratos.

## 1. Decisao do marco

O primeiro marco arquitetural do Feed consolida o Feed como boundary publico obrigatorio para as superficies criticas ja migradas nas sprints P0.A, P0.B, P0.C e P0.E.

A partir deste marco, o Feed nao pode mais ser tratado como uma colecao de chamadas diretas ao dominio Posts. O dominio Feed passa a ser o ponto oficial de orquestracao para timeline, detalhe, criacao publica de post e leitura publica de `ride_share` em Mobility.

Este marco nao declara Feed Freeze. O congelamento completo ainda depende das sprints restantes do roadmap, principalmente P0.D.1, P0.D.2, P0.D.3 e P1.

## 2. Nucleo consolidado do Feed

O nucleo consolidado neste marco inclui:

| Area | Status no Milestone 1 | Evidencia |
| --- | --- | --- |
| `FeedContext` | Consolidado como contexto obrigatorio das operacoes migradas. | P0.A, P0.C, P0.E. |
| `FeedTarget` | Consolidado como alvo canonico de item/acompanhamento futuro. | P0.A Final. |
| Timeline nominal | Consolidada pelo caminho Feed Hook -> Feed Service -> Feed Repository. | P0.A. |
| Detalhe territorial | Consolidado por `FeedService.getDetail()`. | P0.B. |
| Deep-link `?post=<id>` | Consolidado como leitura territorial validada, ainda sem URL canonica final. | P0.B. |
| Criacao publica de post | Consolidada por `FeedService.createItem()`. | P0.C. |
| Criacao por modulos satelite migrados | Consolidada sem policy permissiva fabricada pelo caller. | P0.C Authority. |
| Mobility `ride_share` read | Consolidada por `FeedService.listRideShareItems()`. | P0.E. |
| Query keys de Feed | Consolidadas com escopo derivado de `TerritoryFilter`. | P0.A, P0.E. |
| Falha fechada | Consolidada para as operacoes migradas quando contexto territorial, rollout ou access policy nao estiverem prontos. | P0.A Final, P0.C, P0.E Hardening. |

## 3. Boundaries oficialmente congelados

Os boundaries abaixo ficam congelados para as superficies ja migradas:

1. Pages e componentes publicos nao podem consultar Supabase diretamente para operacao de Feed.
2. Pages, hooks e componentes publicos nao podem chamar Posts diretamente para timeline, detalhe, criacao ou leitura publica de `ride_share`.
3. Timeline publica migrada deve passar por `useFeedTimeline()` e `FeedService.listTimeline()`.
4. Detalhe publico de post deve passar por `useFeedItemDetail()` ou adapter equivalente que chame `FeedService.getDetail()`.
5. Criacao publica de post deve passar por `useCreateFeedItem()` e `FeedService.createItem()`.
6. Leitura publica de posts `ride_share` em Mobility deve passar por `FeedService.listRideShareItems()`.
7. Repositories podem usar Posts somente como colaborador interno depois de o Feed Service validar contexto e policy.
8. Rollback de qualquer superficie migrada nao pode restaurar leitura global, criacao por fallback de perfil ou exibicao cross-territory.

## 4. Servicos canonicos a partir do marco

Servicos e hooks canonicos do dominio Feed:

| Contrato ou servico | Papel canonico |
| --- | --- |
| `FeedService` | Porta publica de aplicacao para as operacoes de Feed migradas. |
| `FeedRepository` | Camada interna de persistencia usada apenas depois das validacoes do service. |
| `useFeedContext` | Composicao oficial de `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy para React. |
| `useFeedTimeline` | Hook canonico da timeline territorial. |
| `useFeedItemDetail` | Hook canonico de detalhe territorial. |
| `useCreateFeedItem` | Hook canonico de criacao publica de item de Feed. |
| `feedQueryKeys` | Chaves canonicas de cache por escopo territorial. |
| `createFeedContextForLocation` | Adaptador operacional para fluxos nao-React que precisam criar FeedContext a partir de location valida. |

Servicos colaboradores canonicos:

| Servico colaborador | Papel |
| --- | --- |
| `CommunityAccessPolicy` | Regra canonica de AccessPolicy social territorial. |
| `CommunityAccessAuthority` | Adaptador operacional fino para consumir CommunityAccessPolicy fora do React, sem criar novo SSOT. |
| `PostService` | Colaborador interno de persistencia via Feed Repository; nao e porta publica para Feed. |
| `RolloutService` ou hooks equivalentes de rollout | Fonte de decisao de rollout consumida pelo FeedContext. |

## 5. Fluxos publicos obrigatorios pelo Feed

Os fluxos abaixo passam a ter caminho obrigatorio pelo Feed:

| Fluxo publico | Entrada obrigatoria | Regra consolidada |
| --- | --- | --- |
| Timeline territorial | `useFeedTimeline()` -> `FeedService.listTimeline()` | Sem contexto valido, retorna Empty State/falha fechada. |
| Detalhe de post | `useFeedItemDetail()` -> `FeedService.getDetail()` | Item fora do Territory, oculto, removido ou indisponivel nao abre como publico. |
| Deep-link por query param | Adapter de detalhe pelo Feed | `?post=<id>` so pode renderizar alvo validado no Territory atual. |
| Criacao em `/novo-post` | `useCreateFeedItem()` -> `FeedService.createItem()` | Territory da rota prevalece; sem Territory oficial, nao publica por fallback de perfil. |
| Criacao via modal/composer | `useCreateFeedItem()` -> `FeedService.createItem()` | Rollout e AccessPolicy sao avaliados antes da mutation. |
| Criacao por Mobility | `createFeedContextForLocation()` -> `FeedService.createItem()` | Modulo satelite nao pode fabricar `canCreateItem: true`. |
| Criacao por Work Opportunities | `createFeedContextForLocation()` -> `FeedService.createItem()` | AccessPolicy vem da autoridade Community. |
| Criacao por Jobs/Vagas | `createFeedContextForLocation()` -> `FeedService.createItem()` | AccessPolicy vem da autoridade Community. |
| Leitura social de Mobility `ride_share` | `useCommunityPosts()` -> `FeedService.listRideShareItems()` | Sem `FeedContext` valido, nao consulta cache nem leitura global. |

## 6. Funcionalidades que pertencem as proximas sprints

As funcionalidades abaixo nao fazem parte do nucleo congelado neste marco e continuam no roadmap:

| Funcionalidade | Sprint prevista | Motivo |
| --- | --- | --- |
| Comentarios e respostas territorializados | P0.D.1 | Ainda precisam operar sobre item pai validado pelo Feed. |
| Reacoes, saves e contadores | P0.D.2 | Ainda precisam passar por alvo validado pelo Feed e invalidacao territorial. |
| Share Action minimo | P0.D.3 | Ainda precisa eliminar fallback global de action, sem assumir URL canonica final. |
| Edicao, exclusao e ocultacao publicas | P1.A / P1.02 | Ainda precisam consolidar mutations publicas restantes pelo Feed Service. |
| URL canonica territorial de Feed | P1.B / P1.04 | Deep-link atual preserva query param; URL final ainda nao esta congelada. |
| Busca de posts com destino canonico | P1.B / P1.07 | Search deve apontar para destino territorial validado. |
| Moderacao territorial de Feed | P1.C / P1.05 | Denuncias e fila precisam receber alvo e Territory validados. |
| Realtime territorial | P1.D / P1.06 | Eventos precisam respeitar query key e escopo territorial. |
| Filtros, ranking e performance | P2.A | Devem ser alinhados ao caminho canonico sem alterar escopo territorial. |
| UI publica consistente e estados oficiais completos | P2.B | Cards, loading, empty, error, offline e retry ainda precisam consolidacao final. |
| Limpeza documental e residuos | P3.A | Docs, rotas antigas, `LAUNCH_URLS` residuais e encoding degradado seguem como limpeza. |

## 7. Regras que nao podem mais ser quebradas

A partir deste marco, as regras abaixo sao obrigatorias para qualquer mudanca no Feed:

1. Nenhuma operacao publica migrada pode contornar o `FeedService`.
2. Nenhuma timeline pode consultar dados sem `ResolvedTerritory` e `TerritoryFilter` validos.
3. Nenhum detalhe publico pode abrir item apenas por `post_id`.
4. Nenhuma criacao publica pode usar bairro do perfil como fallback silencioso quando existir Territory na rota.
5. Nenhuma criacao publica pode aceitar `canCreateItem: true` fabricado pelo caller.
6. Nenhuma leitura publica de `ride_share` pode usar consulta global por tipo.
7. Nenhum rollback pode restaurar leitura global ou policy permissiva.
8. Nenhum modulo satelite pode decidir AccessPolicy social por conta propria.
9. Nenhum cache territorial pode reapresentar conteudo quando o contexto deixar de ser valido.
10. Nenhum Empty State pode parecer dado real.
11. Nenhuma rota territorial pode trocar `ResolvedTerritory` por slug manual como fonte de verdade.
12. Nenhum deep-link pode exibir conteudo de outro Territory.

## 8. Criterios obrigatorios ate o Feed Freeze

O Feed so podera entrar em Freeze quando todos os criterios abaixo estiverem atendidos:

| Criterio | Obrigatoriedade |
| --- | --- |
| P0.D.1 concluida | Comentarios e respostas devem passar pelo Feed. |
| P0.D.2 concluida | Reacoes, saves e contadores devem passar pelo Feed. |
| P0.D.3 concluida | Share action minimo deve falhar fechado sem contexto territorial. |
| P1.A concluida ou quebrada em sprints equivalentes | Callers publicos restantes por ID puro devem ser eliminados. |
| P1 rollout universal concluido | Todo caminho publico deve respeitar rollout efetivo do Territory resolvido. |
| URL canonica definida | Share, search e notification link nao podem depender de fallback global. |
| Moderacao territorial implementada | Denuncias novas de Feed devem carregar alvo e Territory validados. |
| Busca alinhada ao Feed | Resultado de post deve abrir destino territorial validado ou falhar fechado. |
| Auditoria estatica limpa | Imports e chamadas proibidas devem estar ausentes de pages, hooks e componentes publicos. |
| Testes de isolamento territorial completos | Cobrir bairro, cidade, TerritoryGroup, contexto ausente, rollout bloqueado, access negado e alvo cross-territory. |
| Rollbacks seguros documentados | Nenhum rollback pode reabrir vazamento territorial. |
| Falhas fora do escopo resolvidas ou excepcionadas | Suites SSOT/Mobility com falhas legadas devem estar corrigidas ou formalmente excepcionadas. |

## 9. Estado oficial do dominio no Milestone 1

O dominio Feed possui agora um nucleo arquitetural consolidado, mas ainda nao esta congelado.

Consolidado:

- boundary minimo;
- timeline territorial;
- detalhe territorial;
- deep-link por query param com validacao territorial;
- criacao publica via Feed;
- autoridade de AccessPolicy para fluxos nao-React migrados;
- leitura publica de `ride_share` via Feed;
- falha fechada para os fluxos migrados.

Nao consolidado:

- comentarios;
- respostas;
- reacoes;
- saves;
- contadores;
- share action minimo;
- URL canonica final;
- busca de posts;
- moderacao territorial;
- realtime;
- mutations publicas restantes de edicao/exclusao/ocultacao;
- hardening final de UI, estados e performance.

## 10. Declaracao final

O Milestone 1 registra que o Feed deixou de depender de caminhos publicos diretos para Posts nos fluxos criticos ja migrados.

A evolucao futura deve preservar este boundary e continuar a sequencia oficial:

```text
P0.D.1
  ->
P0.D.2
  ->
P0.D.3
  ->
P1
  ->
Feed Freeze
```

Status final: Feed Milestone 1 consolidado.
