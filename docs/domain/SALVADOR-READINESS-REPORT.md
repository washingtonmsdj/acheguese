# SALVADOR.READINESS

**Data da auditoria:** 2026-07-24
**Escopo:** experiência pública dos 170 bairros oficiais de Salvador
**Lançamento atual:** Complexo do Nordeste de Amaralina
**Regra de escopo:** esta auditoria não reabre a consolidação arquitetural do domínio Territory. Ela verifica se os bairros podem ser ativados e operados pela experiência já existente.

## Resultado executivo

**Salvador não pode operar inteira hoje com a mesma experiência.** Os 170 bairros oficiais têm registro, slug e caminho territorial canônico, e a resolução de URL é genérica. Porém a experiência completa ainda não é ativável apenas alterando um rollout_status:

- os 170 bairros não têm rollout local registrado;
- o código público usa gates globais e status da cidade em várias rotas, em vez de efetivar rollout por bairro;
- location_boundaries possui somente 4 polígonos reais, todos do Complexo;
- a Territory Home contém cards, feed, pulso e exemplos estáticos, além de links LAUNCH_URLS que apontam para o nível da cidade;
- o cadastro remoto contém dois resíduos ativos fora do conjunto oficial: Pelourinho e um distrito IBGE chamado Salvador;
- o pipeline municipal existente sincroniza bairros e bounding boxes, mas não popula automaticamente location_boundaries com os polígonos.

O Complexo é o território com maior prontidão de dados geográficos, mas ainda não representa uma experiência pública inteiramente live por causa da Territory Home estática e da navegação não contextualizada.

## Inventário SSOT de Salvador

Consulta realizada no Supabase configurado no projeto em 2026-07-24, cruzada com a migration 20260720100000_seed_salvador_neighborhoods_and_top15_communities.sql.

| Item | Resultado | Leitura de readiness |
|---|---:|---|
| Bairros oficiais esperados | 170 | Conjunto de ativação da sprint |
| Bairros oficiais ativos encontrados | 170 | Todos têm geographic_path /br/ba/salvador/:slug, sem slug duplicado |
| Crianças ativas brutas da cidade | 172 | 171 neighborhood + 1 district residual |
| Boundary real em location_boundaries | 4 | Chapada, Nordeste, Santa Cruz e Vale das Pedrinhas |
| Bairros oficiais sem boundary real | 166 | Usam fallback de centro/cidade ou ficam sem anel |
| Comunidade territorial active | 1 | Complexo do Nordeste de Amaralina |
| Comunidade territorial coming_soon | 1 | Pituba |
| Comunidades territoriais para os demais bairros | 0 | Não há perfil explícito para 168 bairros |
| Rollouts locais nos 170 bairros | 0 | Nenhum bairro tem override registrado |
| Rollouts da cidade Salvador | 9 | Herdados pelos descendentes quando o serviço é consultado |

### Resíduos encontrados

1. Pelourinho está active, mas carrega deactivated_at e deactivation_reason: municipal_neighborhood_source_not_found. A camada de seleção atual o filtra, mas o registro ainda está ativo no SSOT remoto.
2. Salvador, tipo district, está active como filho da cidade, com slug Salvador e coordenadas herdadas inválidas próximas de [0, 0]. Esse registro não deve aparecer como bairro selecionável nem ser resolvido como bairro público.
3. A cidade canônica Salvador está active, mas seu metadata ainda informa center_latitude: 0, center_longitude: 0 e coordinate_status: pending_geocode. A aplicação possui fallbacks, mas o SSOT da cidade não está geograficamente completo.

O helper isSelectableTerritoryChild já evita expor esses resíduos na Home, onboarding e carregamento de polígonos. Isso é uma contenção de UI; não substitui a limpeza dos registros remotos.

## Matriz de módulos

Legenda: **Pronto** = pode ser ativado sem ajuste funcional relevante; **Parcialmente pronto** = a estrutura funciona, mas há lacuna de dados, gate ou equivalência; **Não pronto** = não atende ao critério de ativação pública.

| Superfície | Status | Evidência e impacto para qualquer bairro |
|---|---|---|
| Territory Home | **Parcialmente pronto** | A identidade do território é resolvida, mas TerritoryHomePage usa dados estáticos como “12 lugares abertos”, “2 eventos hoje”, posts, ofertas e pulsos. Também usa LAUNCH_URLS no lugar do contexto territorial atual. |
| Feed | **Parcialmente pronto** | Comunidade usa useModuleTerritoryFilter, resolved e activeMemberIds, com loading e empty state. A leitura é genérica, mas o acesso comunitário e os dados dependem do rollout/perfil; só 6 localizações possuem posts remotos no recorte consultado. |
| Explorar | **Parcialmente pronto** | TerritoryExplorerPage é apenas alias de PublicCityLandingPage; a implementação real continua espalhada no explorer/landing legado. Funciona como descoberta, mas não é uma implementação canônica específica e uniforme. |
| Empresas | **Parcialmente pronto** | A página consulta dados reais e tem loading, filtros e empty state. Só 7 localizações possuem registros business_data; bairros sem cadastro abrem, mas não entregam descoberta útil sem carga inicial. |
| Busca | **Parcialmente pronto** | Busca aplica filtro territorial, aguarda resolução e tem estados vazio, loading e sem resultados. A rota funciona, mas a superfície é habilitada por PUBLIC_LAUNCH_SURFACES, não por rollout local do bairro. |
| Mapa | **Parcialmente pronto** | Usa MapLibre e BoundaryService, sem quebra para bairro sem geometria. O resultado, entretanto, é círculo/centro/fallback quando não há polygon; não é a demarcação real esperada. |
| Boundary | **Não pronto** | 4/170 bairros oficiais possuem geometria real. 166 não têm boundary em location_boundaries; a equivalência de experiência não existe. |
| Territory Header | **Pronto estruturalmente** | O shell resolve nome, cidade, base URL e contexto a partir da URL. Não há necessidade de código específico por bairro. Continua dependente da correção do registro territorial resolvido. |
| URLs | **Parcialmente pronto** | Os 170 paths oficiais estão presentes, válidos e sem duplicidade. Resíduos ativos criam caminhos territoriais indevidos, e algumas CTAs da Home abandonam o bairro atual e vão para a cidade de lançamento. |
| Navegação | **Parcialmente pronto** | A árvore de rotas é genérica, mas CommunityTerritoryRoutes decide módulos por isLaunchSurfaceEnabled, uma configuração global. TerritoryHomePage também mantém bottom nav próprio e links fixos de lançamento. |
| Empty States | **Pronto estruturalmente** | Empresas, serviços, busca, eventos e comunidade possuem estados vazios ou de implantação. Eles ainda podem ser acionados em contexto incorreto porque o gate de módulo não é uniformemente por bairro. |
| Mock Data | **Não pronto** | A Territory Home pública contém conteúdo editorial hardcoded que se apresenta como atividade atual do bairro. Não é aceitável para ativar qualquer bairro sem rotular explicitamente como demo. |
| Loading | **Parcialmente pronto** | Há loaders de rota, módulos, busca e mapas, inclusive recuperação. O carregamento territorial pode disparar até 170 consultas de boundary na primeira renderização do mapa municipal. |
| CTA | **Parcialmente pronto** | Há CTA de cadastro/empresa/evento/interesse, porém vários destinos são LAUNCH_URLS do nível Salvador/cidade e não o território resolvido. A disponibilidade do CTA não acompanha um rollout por bairro. |
| Performance | **Parcialmente pronto** | Há lazy loading e cache local de polígonos, mas useCityNeighborhoodsPolygons chama getNeighborhoodBounds para todos os filhos em paralelo. Sem cobertura, isso transforma a ausência de dados em muitas consultas e logs de fallback. |
| Fallbacks | **Parcialmente pronto** | O fallback evita crash e mantém centro/círculo navegável. É aceitável como orientação provisória, mas não como substituto de boundary real para declarar o bairro pronto. |

## Auditoria de mapa e boundary

### Bairros com boundary real

Os únicos quatro registros de location_boundaries encontrados são:

| Bairro | Fonte | source_object_id | Resultado |
|---|---|---:|---|
| Chapada do Rio Vermelho | GeoSalvador bairros_app_dados_2010_e_2022 | 54 | Polígono real |
| Nordeste de Amaralina | GeoSalvador bairros_app_dados_2010_e_2022 | 112 | Polígono real |
| Santa Cruz | GeoSalvador bairros_app_dados_2010_e_2022 | 142 | Polígono real |
| Vale das Pedrinhas | GeoSalvador bairros_app_dados_2010_e_2022 | 163 | Polígono real |

Esses quatro formam exatamente os membros do grupo Complexo do Nordeste de Amaralina.

### Bairros que usam fallback

Os outros 166 bairros oficiais não têm row em location_boundaries. O BoundaryService tenta, nesta ordem, boundary customizado, boundary inline, boundary de bairro legado, fonte oficial declarada no metadata e, por fim, centro canônico. No TerritoryLiveMap, quando não há anel, a UI usa o contexto da cidade e/ou um círculo de raio fixo e sinaliza “demarcação em implantação”.

Esse fallback é **aceitável somente para continuidade da navegação e diagnóstico**. Não é aceitável como critério de lançamento quando a promessa visual é mostrar a área real do bairro.

### Pipeline

Existe uma fonte municipal cadastrada em tools/seeds/municipal-neighborhood-sources.ts e o script tools/seeds/sync-municipal-neighborhoods.ts consulta o ArcGIS, cria/atualiza os 170 bairros e salva metadata, centro e bounding box. Ele **não grava a geometria em location_boundaries**. A importação de polygons continua manual por migration/repair; o roadmap ainda registra um ETL específico de boundaries como pendência.

Conclusão: existe pipeline de catálogo de bairros, mas não existe pipeline operacional completo de importação, validação e upsert dos 170 polygons.

### Algum bairro quebra o mapa?

Não foi identificado um bairro oficial cujo path por si só quebre a resolução. Os 170 paths oficiais têm formato válido e não há slug duplicado. O problema é de qualidade/igualdade visual: 166 podem abrir sem anel real, e o registro residual Salvador pode gerar centro inválido se escapar dos filtros de seleção.

## Rollout e ativação por bairro

O código atual não usa uma coluna locations.rollout_status. O mecanismo implementado é module_rollouts, com resolução local > ancestor ativo > default inativo, em RolloutService.

No ambiente remoto:

- não há rollout local para nenhum dos 170 bairros;
- existem rollouts ativos no registro da cidade Salvador;
- esses rollouts podem ser herdados por bairros pelo RolloutService;
- getActiveModules enumera apenas Community, Business, Services, Mobility, Classifieds e Promotions, embora ModuleKey também tenha Gastronomy, Events e Jobs;
- as rotas públicas usam isLaunchSurfaceEnabled global e CityStatusGate verifica o status da cidade, não a disponibilidade efetiva do módulo no bairro;
- o shell comunitário assume status active quando não encontra perfil explícito, portanto ausência de territory_communities não é uma barreira confiável.

> Portanto, hoje não é seguro afirmar que “alterar apenas o rollout_status” ativa um bairro de forma determinística. É necessário alinhar o gate público de cada módulo ao rollout efetivo da localização e definir explicitamente o comportamento de herança da cidade para o lançamento do Complexo.

## Conteúdo e cobertura observada

No recorte dos 170 bairros oficiais, a base remota tinha:

| Conteúdo | Total de localizações com conteúdo | Observação |
|---|---:|---|
| business_data | 7 | Os demais dependem de empty state/cadastro |
| posts | 6 | Feed ainda não tem cobertura ampla |
| events | 4 | Agenda não é uniforme |
| classifieds | 7 | Classificados não são uniformes |
| community_posts | 0 | Tabela sem conteúdo público no recorte |

Isso não significa que cada bairro precise nascer com conteúdo. Significa que o produto precisa diferenciar claramente “módulo ativo, sem conteúdo” de “módulo ainda não lançado”, e hoje essa decisão não é uniforme por bairro.

## O que diferencia o Complexo

As diferenças explicitamente registradas são:

1. É o único territory_community de Salvador com status active.
2. Possui um territorial_group com quatro membros, permitindo disponibilidade agregada e banner de cobertura do grupo.
3. Os quatro membros têm boundaries reais e fonte GeoSalvador rastreável.
4. O grupo possui identidade, slug e CTAs próprios no cadastro de comunidade.

Não há evidência de código específico de renderização por nome de bairro para Feed, Empresas, Busca ou Header. A diferenciação restante vem de dados, perfil de comunidade, grupo, boundary e configuração de rollout. O problema é que esses sinais ainda não são usados de maneira uniforme em todas as rotas.

## Riscos e prioridades

### P0: impede declarar Salvador pronta

- Substituir o conteúdo estático da Territory Home por queries/SSOT e usar URLs derivadas de resolved.
- Definir e aplicar gate de rollout efetivo por localização em todas as rotas públicas.
- Importar e validar boundaries dos 170 bairros, além do boundary municipal de Salvador.
- Limpar/desativar os resíduos Pelourinho e distrito Salvador no SSOT remoto.

### P1: impede equivalência de experiência

- Corrigir coordenadas canônicas da cidade Salvador.
- Fazer o registro/perfil de comunidade e o empty state distinguirem ausência de comunidade de comunidade ativa sem conteúdo.
- Completar o conjunto de módulos considerado por getActiveModules ou documentar formalmente a separação por serviço.
- Cobrir rotas de cada módulo com matriz E2E para pelo menos um bairro com boundary e um sem boundary, repetida para os 170 paths.

### P2: escala operacional

- Criar ETL de boundaries idempotente, com validação de Polygon/MultiPolygon, fonte, centro, contagem e relatório de falhas por bairro.
- Trocar fan-out de até 170 requests por consulta/batch ou artefato municipal versionado.
- Adicionar monitoramento de bairros ativos sem boundary, sem conteúdo e sem rollout explícito.

## Respostas finais

### 1. Salvador pode operar inteira hoje?

**Não.** Os 170 bairros podem ser encontrados e possuem URLs canônicas, mas não têm a mesma experiência operacional. Apenas os quatro bairros do Complexo possuem boundary real, a Home mostra dados mockados e a ativação por bairro não é controlada de forma uniforme por rollout.

### 2. O que falta para que todos os bairros tenham a mesma experiência?

Faltam: boundary real de cada bairro e da cidade; limpeza dos dois resíduos territoriais; rollout efetivo por bairro aplicado às rotas e CTAs; Home alimentada por SSOT; política clara de comunidade ativa versus empty state; e um pipeline/monitoramento que permita repetir a ativação em lote sem código específico.

### 3. Quais módulos ainda diferenciam o Complexo dos demais bairros?

Principalmente **Mapa/Boundary**, **Community/territory profile**, **grupo territorial**, **CTAs e identidade da comunidade**. Feed, Empresas, Busca, Serviços, Classificados e Eventos têm código genérico, mas não têm cobertura de conteúdo ou gate de rollout uniforme para os demais bairros.

### 4. Existe algum bairro que ainda exigiria desenvolvimento antes de ser ativado?

**Nenhum exige código customizado por nome de bairro** para a rota básica: os 170 paths oficiais são genéricos e resolvem. Porém, **qualquer bairro sem boundary real e sem dados operacionais exigiria trabalho de ativação de dados antes de ser anunciado como pronto**. Além disso, a infraestrutura comum de rollout e a Territory Home precisam ser corrigidas uma vez antes que “alterar apenas o status” seja uma regra verdadeira para todos.

## Validação realizada

- npm run typecheck:app passou.
- npm run build passou.
- Smoke E2E local da Home/onboarding passou para os quatro membros do Complexo, incluindo confirmação de seleção e presença de boundary selecionado.
- git diff --check passou nos arquivos alterados.
- A tentativa de smoke sequencial de seis rotas públicas ficou presa no timeout do navegador por carregamento de runtime/rede; a validação de paths foi complementada por consulta direta dos 170 geographic_path e inspeção da árvore de rotas. Isso permanece como lacuna de teste E2E, não como evidência de que as rotas estejam todas operacionalmente prontas.
