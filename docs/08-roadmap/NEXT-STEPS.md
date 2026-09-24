# Próximos passos — lançamento MVP

Este arquivo é um resumo navegacional. O **SSOT operacional** permanece em [`EXECUCAO_MAIN_ONLY.md`](./EXECUCAO_MAIN_ONLY.md) e o lifecycle de módulos em [`PRODUCT_MODULE_LIFECYCLE.md`](../03-architecture/PRODUCT_MODULE_LIFECYCLE.md).

## Decisão vigente — 2026-09-22

O MVP público possui **um domínio de produto ativo: Empresas (`business`)**.

Capabilities horizontais ativas no lançamento:

1. **Mapa** (`map`);
2. **Perto de mim** (`nearby`);
3. **Busca** (`search`);
4. **Mensagens** (`messaging`, provider MVP = Business);
5. Auth, Perfis/Conta, Território, Localização, Notificações e Central.

`nearby` depende estruturalmente de Map + Location; providers verticais são gated separadamente e Business é o provider MVP atual. `map` possui registry/scope próprio de layers. `search` recebe buckets autorizados de `searchProviderScope.ts` e não decide lifecycle no core. `messaging` depende de Auth + Perfis e registra somente providers de domínios ativos. No MVP, Business é o único provider de domínio ativo em Map/Nearby/Search/Messaging.

Todos os demais módulos de produto permanecem **pausados e fail-closed** até certificação individual. Código preservado para pós-MVP não pode aparecer em navegação, rotas funcionais, prefetch, discovery, providers públicos ou layers do Mapa.

## Objetivo imediato

Entregar um candidato pequeno, verificável e profissional sem reabrir escopo.

Regras:

- não adicionar novos módulos ao MVP;
- corrigir causas raiz, não sintomas;
- não criar redirect, alias, fallback ou feature flag local para esconder arquitetura quebrada; no MVP, redirects de compatibilidade são proibidos; guards de autenticação/autorização não contam como alias;
- manter as autoridades de lifecycle separadas: `productModuleRegistry.ts` para domínios, `platformCapabilityRegistry.ts` para capabilities e `lifecycleRegistry.ts` como avaliador único;
- remover código morto, duplicidades e dependências cruzadas que pertençam apenas ao runtime antigo;
- manter código pós-MVP apenas quando houver owner claro, fronteira limpa e zero interferência no produto ativo;
- nenhuma superfície pausada pode ser consultada apenas para montar UI escondida;
- nenhuma mudança recebe status de release por ter sido apenas mergeada.

## Ordem atual

1. **Concluir o corte modular**
   - manter `business` como domínio ativo;
   - manter `map`, `nearby`, `search` e `messaging` como capabilities ativas;
   - manter `nearby -> map + location`, com Business apenas como provider lifecycle-scoped;
   - manter `map` como capability horizontal e suas layers como providers lifecycle-scoped;
   - manter `search` como capability horizontal; providers são selecionados em `app/config/searchProviderScope.ts` e o core falha fechado sem autorização;
   - provar `messaging -> auth + profiles`, com provider Business-only no MVP;
   - manter o provider Business do Mapa consumindo seu port público bounded, sem schema/tabelas internas no owner horizontal;
   - manter toda gestão de Business sob `/central/empresas/*`, inclusive edição em `/:businessId/editar`;
   - eliminar imports e delegações do núcleo ativo para módulos pausados.

2. **Fechar rotas, navegação e prefetch**
   - navegação pública deve expor somente destinos do MVP e infraestrutura necessária;
   - módulo pausado não pode possuir rota funcional acessível, inclusive em Admin/Central;
   - router, lazy barrel e prefetch/warmup do runtime ativo não podem conectar owner de módulo pausado; URL pausada/antiga sem contrato externo deve cair no 404 canônico;
   - não manter redirects de compatibilidade no corte MVP; URL antiga sem contrato externo comprovado deve ser removida e resultar em 404.

3. **Limpar resíduos do escopo anterior**
   - remover componentes, services, helpers, facades, previews, aliases e imports sem caller real;
   - não manter `concept-mock`, preview DEV ou query-string especial conectado ao router principal; protótipos devem viver fora do runtime de produto;
   - remover implementações paralelas e owners duplicados;
   - remover allowances de SSOT que apontem para tabelas/owners já aposentados; o censo de Gastronomia confirmou que `gastronomy_establishments` e `GastronomyQueryService.ts` eram resíduos do grafo legado, enquanto a persistência atual usa `gastronomy_profiles`/`business_data` pelos owners em `src/core/business`;
   - manter migrations históricas somente quando necessárias à integridade/proveniência;
   - atualizar testes arquiteturais para impedir reintrodução do legado.

4. **Certificar o núcleo ativo**
   - Empresas;
   - Mapa;
   - Perto de mim;
   - Busca;
   - Mensagens/Business Direct Messaging;
   - contratos de plataforma utilizados diretamente pelo domínio e capabilities;
   - truthfulness de localização/distância;
   - boundary Map -> Business;
   - rotas e navegação launch-safe.

5. **Executar candidato exact-SHA**
   - security;
   - lint;
   - typecheck;
   - testes arquiteturais/unitários;
   - build;
   - E2E do domínio Business + capabilities públicas do MVP;
   - deploy do mesmo SHA;
   - smoke público do mesmo SHA.

6. **Lançar e observar**
   - corrigir regressões no núcleo antes de ampliar produto;
   - qualquer módulo futuro nasce/retorna `paused`, é certificado isoladamente e só então passa a `active`.

## Estado do CI e do release observado em 2026-09-23

Os hosted runners voltaram a executar steps e logs reais. O incidente histórico de jobs vazios foi encerrado no issue #17; não tratar falhas futuras automaticamente como repetição daquele incidente.

O contrato obrigatório do MVP inclui os ratchets recentes de lifecycle, Business, Search, Messaging, remoção de legado e rotas canônicas. `test:mvp:architecture` deve executar essas provas em todo candidato.

Os PRs #310–#331 consolidaram o corte modular, as rotas canônicas, a gestão Business, a retirada dos bypasses DEV, a limpeza/ratchet SSOT de Gastronomia, o isolamento lifecycle-driven do Admin e a truthfulness das superfícies públicas:

- Business independente de verticais pausados;
- navegação alinhada às capabilities ativas;
- dashboard Business legado sem caller aposentado;
- Search sem imports runtime top-level de domínios pausados;
- Neighborhood mixed-domain stream callerless aposentado;
- ratchets recentes incorporados ao gate obrigatório;
- gestão Business consolidada sob `/central/empresas/*`, sem rota concorrente/redirect legado;
- #318 aposentou o bypass DEV `?concept-mock=1` e os cinco mocks/previews sem caller do runtime.
- #319 aposentou a allowance morta de `gastronomy_establishments`/`GastronomyQueryService.ts` no checker SSOT após censo de owners/callers.
- #320 removeu o lint rule órfão de direct-query, alinhou `SSOT_REGISTRY.md` a `gastronomy_profiles`/`GastronomyProfileService` e tornou essa aposentadoria um ratchet obrigatório.
- #321 registrou a revalidação documental pós-#320 e reafirmou que o merge SHA não herda certificação de release.
- #322 removeu inventários Admin paralelos, passou rota + sidebar para o lifecycle canônico e retirou aliases administrativos sem contrato.
- #323 aposentou `/splash` como superfície pública órfã, sem redirect, e ratcheou sua ausência no ownership de rotas.
- #324 alinhou `/sobre` ao produto realmente ativo e estendeu o ratchet arquitetural para impedir claims de verticais pausadas como disponíveis.
- #327 removeu módulos pausados do grafo público ativo: `AppLayoutRoutes` usa somente `activeLazyImports.ts` e URL pública sem owner ativo cai no 404 canônico.
- #329 tornou a Central privada active-only: `CentralRoutes` usa somente `activeCentralLazyImports.ts`, Business/Empresas + infraestrutura ativa; módulos pausados permanecem fora do grafo.
- #330 aposentou o barrel privado `centralLazyImports.ts`, sem caller runtime, e migrou os ratchets para owners físicos/lifecycle.
- #331 aposentou `CommunityTerritoryRoutes.tsx`, árvore pública desconectada sem caller runtime, preservando builders canônicos e owners Community nos bounded contexts.
- #333 — remoção do grafo público legado: `lazyImports.ts`, `TerritorialModulePages.tsx`, `launchPausedComponent.ts` e `LaunchPausedPage.tsx` saem do runtime; `ActiveTerritorialModulePages.tsx` permanece como boundary territorial ativo.

A `main` atual é `42d91ea9454de0fe8c3250cc75d230cb1bceeb9c` (squash merge de #333). O head `e100a823e9f23ebe42f4c1931f2f60ad7c4f424d` de #333 foi certificado antes do merge e a nova `main` foi tratada corretamente como outro candidato exact-SHA. O runtime público agora não contém `lazyImports.ts`, `TerritorialModulePages.tsx`, `launchPausedComponent.ts` nem `LaunchPausedPage.tsx`; `activeLazyImports.ts` + `ActiveTerritorialModulePages.tsx` são os boundaries públicos ativos, enquanto owners pós-MVP permanecem preservados fora do grafo. Na `main@42d91ea...`, Vercel publicou o SHA exato e o release identity confirmou `mode=exact`; SSOT Enforcement e Heavy exact-main fecharam verdes, assim como Phase Core, Runtime, E2E público, Regression, lint/typecheck, Maps Architecture, credenciais e testes unitários. O SSOT Territorial ficou vermelho somente no smoke autenticado remoto: Conta mobile/tablet/desktop e Mensagens Business receberam `HTTP 503 auth_upstream_unavailable` do broker, coerente com #305.

### Blockers atuais do primeiro release

- **#305 — indisponibilidade ampla do data plane Supabase:** o control plane mostra o projeto como `ACTIVE_HEALTHY`, mas a janela do smoke exact-main registrou `/auth/v1/token` com 12 × HTTP 504 (~5 s de origin), além de HTTP 522 (~19–20 s) em superfícies PostgREST independentes como `locations`, `catalog_item`, `user_subscriptions`, `function_audit`, `tourist_points` e `posts`. O broker OIDC v3 recebe corretamente o subject da `main`, porém devolve `503 auth_upstream_unavailable` porque o upstream falha. Uma consulta SQL simples via control plane também encerra por connection timeout. Não mascarar com retry/timeout maior, fallback, troca de fixture, bypass OIDC ou mudança de RLS.
- **#309 — autoridade de deploy Supabase:** o PAT do GitHub Actions recebe 403 para atualizar Edge Functions. Rotacionar para PAT scoped ao projeto/organização com `Edge Functions: Read-write` (`deploy_edge_function`); não usar `service_role` como substituto.

O broker remoto v3 permanece ACTIVE e sem drift de source conhecido; portanto #309 é problema de autoridade automática, não justificativa para alterar frontend/runtime.

**MVP READY continua bloqueado** até o mesmo SHA obter sessão autenticada real e o deploy automatizado exact-main recuperar autoridade. Não reabrir redirects, mocks DEV, aliases ou fallbacks para contornar esses blockers externos.

## Pós-MVP

Ficam fora do produto ativo até trabalho individual e reintegração formal, entre outros:

- Comunidade/Feed;
- Classificados;
- Serviços/Profissionais;
- Gastronomia;
- Eventos;
- Vagas;
- Pontos Turísticos;
- Mobilidade;
- Educação;
- monetização/billing;
- gamificação;
- analytics público;
- demais verticais preservadas no repositório.

Preservar código pós-MVP não significa mantê-lo conectado ao runtime ativo.

## Critério de MVP READY

O release só recebe **MVP READY** quando **Business + Mapa + Perto de mim + Busca + Mensagens (Business provider)** estiverem certificados em um único SHA, com:

- lifecycle modular coerente;
- zero dependência ativa em módulo pausado;
- rotas/navegação/prefetch alinhados;
- security/lint/typecheck/test/build realmente executados;
- E2E/smoke das superfícies ativas e fluxo de Mensagens Business;
- deploy real do mesmo SHA;
- nenhum erro crítico recorrente.

Módulos pausados não precisam ser concluídos para o primeiro release. Precisam permanecer realmente fora do produto ativo.

### Regra de expansão modular para os próximos trabalhos

Não acoplar uma capability horizontal ao único domínio ativo do momento. Para Mobility, Services, Gastronomy, Tourist Points, Classifieds ou qualquer nova vertical:

1. manter o owner horizontal intacto;
2. certificar e ativar a vertical;
3. registrar seu provider/adapter no boundary da capability;
4. deixar o lifecycle decidir se o provider participa;
5. provar por teste que provider pausado não vaza por rota, query, prefetch, mapa, busca, Inbox ou notificação.

Nearby, Map, Search e Messaging são padrões de referência desse modelo. Notifications segue a mesma regra: publicação server-owned por brokers/outbox e destino de ação lifecycle-scoped no app.

Boundaries territoriais de Nearby e Map: providerizados. Antes de habilitar um segundo provider/layer, registrar lifecycle + rollout owner; a cobertura de grupos é agregada por união dos membros cobertos. Não adicionar hardcode de domínio em `TerritorialLayout`.

### Boundary da Inbox de Notificações

- manter histórico de notificações mesmo quando uma vertical for pausada;
- nunca usar a existência de uma notificação antiga como autorização para abrir rota inativa;
- `notificationActionScope.ts` é a policy canônica de destino para ações da Inbox;
- Push/service worker e Inbox devem convergir na mesma semântica fail-closed para verticais pausadas;
- ao reativar uma vertical, não criar exceção no componente: o lifecycle existente deve liberar o destino.
